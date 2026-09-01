import { BroadcastOfflineError, ProtocolError, RestrictedRoomError } from "./errors.js";
import { getChannelAuthentication, setChannelAuthentication } from "./channel-authentication.js";
import type { RawPacket, SoopEvent } from "./events.js";
import {
  createConnectPacket,
  createJoinPacket,
  createKeepAlivePacket,
  decodePacket,
  isValidRoomPassword,
  messageDataToBytes,
  PacketStreamParser,
} from "./protocol.js";
import type {
  ChannelInfo,
  ChannelAuthentication,
  ChannelResolver,
  ConnectionState,
  ReconnectOptions,
  SoopChatEventMap,
  SoopChatEventType,
  SoopChatListener,
  SoopChatOptions,
  WebSocketFactory,
  WebSocketLike,
} from "./types.js";

const DEFAULT_RECONNECT: Required<ReconnectOptions> = {
  enabled: true,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  factor: 2,
  jitter: 0.2,
};

interface CoreOptions extends SoopChatOptions {
  resolveChannel: ChannelResolver;
  createWebSocket: WebSocketFactory;
  heartbeatIntervalMs?: number;
  random?: () => number;
}

function reconnectOptions(value: SoopChatOptions["reconnect"]): Required<ReconnectOptions> {
  if (value === false) return { ...DEFAULT_RECONNECT, enabled: false };
  if (value === true || value === undefined) return { ...DEFAULT_RECONNECT };
  const merged = { ...DEFAULT_RECONNECT, ...value };
  if (merged.initialDelayMs < 0 || merged.maxDelayMs < merged.initialDelayMs) {
    throw new RangeError(
      "Reconnect delays must be non-negative and maxDelayMs must be >= initialDelayMs.",
    );
  }
  if (merged.factor < 1) throw new RangeError("Reconnect factor must be at least 1.");
  if (merged.jitter < 0 || merged.jitter > 1)
    throw new RangeError("Reconnect jitter must be between 0 and 1.");
  return merged;
}

function roomPassword(value: string | undefined): string {
  if (value === undefined) return "";
  if (!isValidRoomPassword(value)) {
    throw new TypeError("roomPassword must not be empty or contain control characters.");
  }
  return value;
}

function validateChannel(channel: ChannelInfo): ChannelInfo {
  if (!channel.broadcastNo || !channel.chatNo)
    throw new TypeError("Channel info is missing broadcastNo or chatNo.");
  if (!/^[a-z0-9.-]+$/i.test(channel.chatDomain))
    throw new TypeError("Channel info contains an invalid chatDomain.");
  if (!Number.isInteger(channel.chatPort) || channel.chatPort < 1 || channel.chatPort > 65_534) {
    throw new TypeError("Channel info contains an invalid chatPort.");
  }
  if (!Object.hasOwn(channel, "authentication")) return channel;

  const authentication = (channel as ChannelInfo & { authentication?: unknown }).authentication;
  if (authentication === null || typeof authentication !== "object") {
    throw new TypeError("Channel info contains invalid authentication.");
  }
  const { ticket, fanTicket } = authentication as Partial<ChannelAuthentication>;
  if (
    typeof ticket !== "string" ||
    !ticket ||
    ticket.includes("\x0c") ||
    typeof fanTicket !== "string" ||
    !fanTicket ||
    fanTicket.includes("\x0c")
  ) {
    throw new TypeError("Channel info contains invalid authentication.");
  }
  const info: ChannelInfo = {
    broadcastNo: channel.broadcastNo,
    chatNo: channel.chatNo,
    chatDomain: channel.chatDomain,
    chatPort: channel.chatPort,
  };
  setChannelAuthentication(info, { ticket, fanTicket });
  return info;
}

export class SoopChatCore {
  readonly streamerId: string;

  #state: ConnectionState = "idle";
  #listeners = new Map<string, Set<(event: never) => void>>();
  #parser = new PacketStreamParser();
  #resolveChannel: ChannelResolver;
  #createWebSocket: WebSocketFactory;
  #roomPassword: string;
  #reconnect: Required<ReconnectOptions>;
  #heartbeatIntervalMs: number;
  #random: () => number;
  #socket: WebSocketLike | undefined;
  #channel: ChannelInfo | undefined;
  #connectPromise: Promise<void> | undefined;
  #abortController: AbortController | undefined;
  #heartbeat: ReturnType<typeof setInterval> | undefined;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #cancelPendingSession: (() => void) | undefined;
  #messageQueue = Promise.resolve();
  #stopped = true;
  #reconnectAttempt = 0;

  constructor(options: CoreOptions) {
    if (!options.streamerId.trim()) throw new TypeError("streamerId must not be empty.");
    this.streamerId = options.streamerId.trim();
    this.#resolveChannel = options.resolveChannel;
    this.#createWebSocket = options.createWebSocket;
    this.#roomPassword = roomPassword(options.roomPassword);
    this.#reconnect = reconnectOptions(options.reconnect);
    this.#heartbeatIntervalMs = options.heartbeatIntervalMs ?? 60_000;
    this.#random = options.random ?? Math.random;
  }

  get state(): ConnectionState {
    return this.#state;
  }

  on<K extends SoopChatEventType>(type: K, listener: SoopChatListener<K>): () => void {
    let listeners = this.#listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.#listeners.set(type, listeners);
    }
    listeners.add(listener as (event: never) => void);
    return () => {
      listeners?.delete(listener as (event: never) => void);
      if (listeners?.size === 0) this.#listeners.delete(type);
    };
  }

  async connect(): Promise<void> {
    if (this.#state === "connected") return;
    if (this.#connectPromise) return this.#connectPromise;

    this.#stopped = false;
    this.#reconnectAttempt = 0;
    this.#connectPromise = this.#openSession();
    try {
      await this.#connectPromise;
    } catch (cause) {
      if (!this.#stopped) await this.disconnect();
      throw cause;
    } finally {
      this.#connectPromise = undefined;
    }
  }

  async disconnect(): Promise<void> {
    this.#stopped = true;
    this.#abortController?.abort();
    this.#abortController = undefined;
    this.#cancelPendingSession?.();
    this.#cancelPendingSession = undefined;
    this.#clearHeartbeat();
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    this.#parser.reset();

    const socket = this.#socket;
    this.#socket = undefined;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      if (socket.readyState < 2) socket.close(1000, "Client disconnect");
    }
    this.#setState("closed");
  }

  async #openSession(): Promise<void> {
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;
    this.#setState("resolving");
    const channel = validateChannel(
      await this.#resolveChannel(this.streamerId, {
        signal: controller.signal,
        ...(this.#roomPassword ? { roomPassword: this.#roomPassword } : {}),
      }),
    );
    if (this.#stopped) throw new DOMException("Connection was aborted.", "AbortError");
    this.#channel = channel;
    this.#parser.reset();
    this.#setState("connecting");

    const url = `wss://${channel.chatDomain.toLowerCase()}:${channel.chatPort + 1}/Websocket/${encodeURIComponent(this.streamerId)}`;
    const socket = this.#createWebSocket(url, "chat");
    socket.binaryType = "arraybuffer";
    this.#socket = socket;

    await new Promise<void>((resolve, reject) => {
      let joined = false;
      let settled = false;

      const fail = (error: Error): void => {
        if (!settled) {
          settled = true;
          this.#cancelPendingSession = undefined;
          if (this.#socket === socket && socket.readyState < 2)
            socket.close(1002, "Handshake failed");
          reject(error);
        }
      };
      this.#cancelPendingSession = () =>
        fail(new DOMException("Connection was aborted.", "AbortError"));

      socket.onopen = () => {
        try {
          socket.send(createConnectPacket(getChannelAuthentication(channel)?.ticket));
        } catch (cause) {
          fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      };

      socket.onmessage = (message) => {
        this.#messageQueue = this.#messageQueue
          .then(async () => {
            const bytes = await messageDataToBytes(message.data);
            const batch = this.#parser.push(bytes);
            for (const error of batch.errors) this.#emit("protocolError", { error });
            for (const raw of batch.packets) {
              this.#handlePacket(raw, socket);
              if (!joined && raw.opcode === "0002") {
                joined = true;
                settled = true;
                this.#cancelPendingSession = undefined;
                this.#reconnectAttempt = 0;
                this.#setState("connected");
                this.#startHeartbeat(socket);
                resolve();
              }
            }
          })
          .catch((cause) => {
            const error = cause instanceof Error ? cause : new Error(String(cause));
            this.#emit("error", error);
            fail(error);
          });
      };

      socket.onerror = () => {
        this.#emit("error", new Error("SOOP WebSocket reported an error."));
      };

      socket.onclose = (event) => {
        this.#clearHeartbeat();
        if (this.#socket === socket) this.#socket = undefined;
        const error = new Error(
          `SOOP WebSocket closed (${event.code}${event.reason ? `: ${event.reason}` : ""}).`,
        );
        if (!joined) {
          fail(error);
        } else if (!this.#stopped) {
          this.#scheduleReconnect(error);
        }
      };
    });
  }

  #handlePacket(raw: RawPacket, socket: WebSocketLike): void {
    this.#emit("raw", raw);
    if (raw.opcode === "0001" && this.#channel && socket.readyState === 1) {
      socket.send(
        createJoinPacket(
          this.#channel.chatNo,
          getChannelAuthentication(this.#channel)?.fanTicket,
          this.#roomPassword,
        ),
      );
    }

    let event: SoopEvent;
    try {
      event = decodePacket(raw);
    } catch (cause) {
      const error =
        cause instanceof ProtocolError
          ? cause
          : new ProtocolError(`Failed to decode opcode ${raw.opcode}.`, undefined, { cause });
      this.#emit("protocolError", { error, raw });
      return;
    }

    if (event.type === "unknown") this.#emit("unknown", event);
    else this.#emitProtocol(event);
    this.#emit("event", event);
    if (event.type === "closeBroad") this.#finishBroadcast(socket);
  }

  #finishBroadcast(socket: WebSocketLike): void {
    if (this.#stopped) return;
    this.#stopped = true;
    this.#abortController?.abort();
    this.#abortController = undefined;
    this.#clearHeartbeat();
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    if (this.#socket === socket) this.#socket = undefined;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    if (socket.readyState < 2) socket.close(1000, "Broadcast ended");
    this.#setState("closed");
    this.#emit("ended", { reason: "offline" });
  }

  #emitProtocol(event: Exclude<SoopEvent, { type: "unknown" }>): void {
    const listeners = this.#listeners.get(event.type);
    if (!listeners) return;
    for (const listener of Array.from(listeners)) listener(event as never);
  }

  #startHeartbeat(socket: WebSocketLike): void {
    this.#clearHeartbeat();
    this.#heartbeat = setInterval(() => {
      if (socket.readyState === 1) socket.send(createKeepAlivePacket());
    }, this.#heartbeatIntervalMs);
  }

  #clearHeartbeat(): void {
    if (this.#heartbeat) clearInterval(this.#heartbeat);
    this.#heartbeat = undefined;
  }

  #scheduleReconnect(error: Error): void {
    if (!this.#reconnect.enabled) {
      this.#setState("closed");
      return;
    }

    this.#reconnectAttempt += 1;
    const base = Math.min(
      this.#reconnect.maxDelayMs,
      this.#reconnect.initialDelayMs * this.#reconnect.factor ** (this.#reconnectAttempt - 1),
    );
    const multiplier = 1 + (this.#random() * 2 - 1) * this.#reconnect.jitter;
    const delayMs = Math.max(0, Math.round(base * multiplier));
    this.#setState("reconnecting");
    this.#emit("reconnecting", { attempt: this.#reconnectAttempt, delayMs, error });
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined;
      if (this.#stopped) return;
      void this.#openSession().catch((cause: unknown) => {
        const nextError = cause instanceof Error ? cause : new Error(String(cause));
        if (nextError instanceof BroadcastOfflineError) {
          this.#stopped = true;
          this.#setState("closed");
          this.#emit("ended", { reason: "offline" });
          return;
        }
        if (nextError instanceof RestrictedRoomError) {
          this.#stopped = true;
          this.#setState("closed");
          this.#emit("ended", { reason: "restricted", restriction: nextError.reason });
          return;
        }
        if (nextError.name === "AbortError" && this.#stopped) return;
        this.#emit("error", nextError);
        this.#scheduleReconnect(nextError);
      });
    }, delayMs);
  }

  #setState(current: ConnectionState): void {
    if (current === this.#state) return;
    const previous = this.#state;
    this.#state = current;
    this.#emit("stateChange", { previous, current });
  }

  #emit<K extends SoopChatEventType>(type: K, event: SoopChatEventMap[K]): void {
    const listeners = this.#listeners.get(type);
    if (!listeners) return;
    for (const listener of Array.from(listeners)) listener(event as never);
  }
}
