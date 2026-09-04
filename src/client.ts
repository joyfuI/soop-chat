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
const DEFAULT_HANDSHAKE_TIMEOUT_MS = 30_000;

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
  if (
    ![merged.initialDelayMs, merged.maxDelayMs, merged.factor, merged.jitter].every(Number.isFinite)
  ) {
    throw new RangeError("Reconnect numeric options must be finite.");
  }
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

/** 공개 Node.js·브라우저 클라이언트가 상속하는 공통 lifecycle 구현입니다. */
export class SoopChatCore {
  /** 생성 시 전달되어 정규화된 방송인 ID입니다. */
  readonly streamerId: string;

  #state: ConnectionState = "idle";
  #listeners = new Map<string, Set<(event: never) => unknown>>();
  #parser = new PacketStreamParser();
  #resolveChannel: ChannelResolver;
  #createWebSocket: WebSocketFactory;
  #roomPassword: string;
  #reconnect: Required<ReconnectOptions>;
  #handshakeTimeoutMs: number;
  #heartbeatIntervalMs: number;
  #random: () => number;
  #socket: WebSocketLike | undefined;
  #channel: ChannelInfo | undefined;
  #connectPromise: Promise<void> | undefined;
  #abortController: AbortController | undefined;
  #heartbeat: ReturnType<typeof setInterval> | undefined;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #cancelPendingSession: (() => void) | undefined;
  #stopped = true;
  #reconnectAttempt = 0;

  constructor(options: CoreOptions) {
    if (!options.streamerId.trim()) throw new TypeError("streamerId must not be empty.");
    this.streamerId = options.streamerId.trim();
    this.#resolveChannel = options.resolveChannel;
    this.#createWebSocket = options.createWebSocket;
    this.#roomPassword = roomPassword(options.roomPassword);
    this.#reconnect = reconnectOptions(options.reconnect);
    this.#handshakeTimeoutMs = options.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;
    if (!Number.isFinite(this.#handshakeTimeoutMs) || this.#handshakeTimeoutMs <= 0) {
      throw new RangeError("handshakeTimeoutMs must be a positive finite number.");
    }
    this.#heartbeatIntervalMs = options.heartbeatIntervalMs ?? 60_000;
    this.#random = options.random ?? Math.random;
  }

  /** 현재 연결 lifecycle 상태입니다. */
  get state(): ConnectionState {
    return this.#state;
  }

  /**
   * 타입이 지정된 프로토콜 또는 lifecycle 이벤트를 구독합니다.
   *
   * 반환된 함수를 호출하면 listener를 제거합니다. listener가 던진 예외와 반환한 Promise의
   * rejection은 연결을 중단하지 않고 `error` listener로 전달되며 Promise 완료를 기다리지 않습니다.
   */
  on<K extends SoopChatEventType>(type: K, listener: SoopChatListener<K>): () => void {
    let listeners = this.#listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.#listeners.set(type, listeners);
    }
    listeners.add(listener as (event: never) => unknown);
    return () => {
      listeners?.delete(listener as (event: never) => unknown);
      if (listeners?.size === 0) this.#listeners.delete(type);
    };
  }

  /**
   * 현재 채널 정보를 조회하고 서버가 채팅 입장을 확인하면 완료됩니다.
   *
   * 동시에 호출하면 하나의 연결 시도를 공유합니다. 재시도 대기 중 호출하면 즉시 시작합니다.
   * resolver, 검증, 접근 제한, transport와 handshake timeout 오류는 Promise rejection으로
   * 전달됩니다. 연결 도중 `disconnect()`를 호출하면 `AbortError`로 거부됩니다.
   */
  async connect(): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    if (this.#state === "connected") return;
    if (this.#connectPromise) return this.#connectPromise;

    this.#stopped = false;
    this.#reconnectAttempt = 0;
    try {
      await this.#startSession();
    } catch (cause) {
      if (!this.#stopped) await this.disconnect();
      throw cause;
    }
  }

  #startSession(): Promise<void> {
    if (this.#connectPromise) return this.#connectPromise;
    const promise = Promise.resolve().then(() => this.#openSession());
    this.#connectPromise = promise;
    const clear = () => {
      if (this.#connectPromise === promise) this.#connectPromise = undefined;
    };
    void promise.then(clear, clear);
    return promise;
  }

  /**
   * 재연결을 중단하고 진행 중인 채널 조회를 취소한 뒤 socket을 닫고 `closed` 상태가 됩니다.
   * 여러 번 호출해도 안전하며 수동 종료는 `ended` 이벤트를 발생시키지 않습니다.
   */
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
    if (this.#stopped) throw new DOMException("Connection was aborted.", "AbortError");
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;
    this.#setState("resolving");
    if (this.#stopped || this.#abortController !== controller) {
      throw new DOMException("Connection was aborted.", "AbortError");
    }
    const channel = validateChannel(
      await this.#resolveChannel(this.streamerId, {
        signal: controller.signal,
        ...(this.#roomPassword ? { roomPassword: this.#roomPassword } : {}),
      }),
    );
    if (this.#stopped || this.#abortController !== controller) {
      throw new DOMException("Connection was aborted.", "AbortError");
    }
    this.#channel = channel;
    this.#parser.reset();
    this.#setState("connecting");
    if (this.#stopped || this.#abortController !== controller) {
      throw new DOMException("Connection was aborted.", "AbortError");
    }

    const url = `wss://${channel.chatDomain.toLowerCase()}:${channel.chatPort + 1}/Websocket/${encodeURIComponent(this.streamerId)}`;
    const socket = this.#createWebSocket(url, "chat");
    socket.binaryType = "arraybuffer";
    this.#socket = socket;

    await new Promise<void>((resolve, reject) => {
      let joined = false;
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let messageQueue = Promise.resolve();

      const fail = (error: Error): void => {
        if (!settled) {
          settled = true;
          if (timeout !== undefined) clearTimeout(timeout);
          this.#cancelPendingSession = undefined;
          if (this.#socket === socket) this.#socket = undefined;
          socket.onopen = null;
          socket.onmessage = null;
          socket.onclose = null;
          socket.onerror = null;
          if (socket.readyState < 2) {
            try {
              socket.close(1002, "Handshake failed");
            } catch {
              // Preserve the original handshake error.
            }
          }
          reject(error);
        }
      };
      this.#cancelPendingSession = () =>
        fail(new DOMException("Connection was aborted.", "AbortError"));
      timeout = setTimeout(
        () =>
          fail(
            new Error(`SOOP WebSocket handshake timed out after ${this.#handshakeTimeoutMs}ms.`),
          ),
        this.#handshakeTimeoutMs,
      );

      socket.onopen = () => {
        try {
          socket.send(createConnectPacket(getChannelAuthentication(channel)?.ticket));
        } catch (cause) {
          fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      };

      socket.onmessage = (message) => {
        messageQueue = messageQueue
          .then(async () => {
            const bytes = await messageDataToBytes(message.data);
            if (this.#socket !== socket || (settled && !joined)) return;
            const batch = this.#parser.push(bytes);
            for (const error of batch.errors) {
              this.#emit("protocolError", { error });
              if (this.#socket !== socket || this.#stopped) return;
            }
            for (const raw of batch.packets) {
              this.#handlePacket(raw, socket);
              if (this.#socket !== socket || this.#stopped) return;
              if (!joined && raw.opcode === "0002") {
                joined = true;
                this.#reconnectAttempt = 0;
                this.#setState("connected");
                if (this.#socket !== socket || this.#stopped) {
                  fail(new DOMException("Connection was aborted.", "AbortError"));
                  return;
                }
                settled = true;
                if (timeout !== undefined) clearTimeout(timeout);
                this.#cancelPendingSession = undefined;
                this.#startHeartbeat(socket);
                resolve();
              }
            }
          })
          .catch((cause) => {
            if (this.#socket !== socket || (settled && !joined)) return;
            const error = cause instanceof Error ? cause : new Error(String(cause));
            this.#emit("error", error);
            fail(error);
          });
      };

      socket.onerror = () => {
        this.#emit("error", new Error("SOOP WebSocket reported an error."));
      };

      socket.onclose = (event) => {
        const error = new Error(
          `SOOP WebSocket closed (${event.code}${event.reason ? `: ${event.reason}` : ""}).`,
        );
        if (!joined) {
          fail(error);
        } else if (!this.#stopped) {
          this.#recoverTransport(socket, error);
        }
      };
    });
  }

  #handlePacket(raw: RawPacket, socket: WebSocketLike): void {
    this.#emit("raw", raw);
    if (this.#socket !== socket || this.#stopped) return;
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
    if (this.#socket !== socket || this.#stopped) return;
    this.#emit("event", event);
    if (this.#socket !== socket || this.#stopped) return;
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
    this.#emitListeners(event.type, event);
  }

  #emitListeners(type: string, event: unknown): void {
    const listeners = this.#listeners.get(type);
    if (!listeners) return;
    const report = (cause: unknown): void => {
      if (type !== "error") {
        this.#emit(
          "error",
          cause instanceof Error
            ? cause
            : new Error("SOOP event listener failed with a non-Error value.", { cause }),
        );
      }
    };
    for (const listener of Array.from(listeners)) {
      try {
        const result = listener(event as never);
        if (result && typeof (result as PromiseLike<unknown>).then === "function") {
          void Promise.resolve(result).catch(report);
        }
      } catch (cause) {
        report(cause);
      }
    }
  }

  #startHeartbeat(socket: WebSocketLike): void {
    this.#clearHeartbeat();
    this.#heartbeat = setInterval(() => {
      try {
        if (socket.readyState === 1) socket.send(createKeepAlivePacket());
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        this.#emit("error", error);
        this.#recoverTransport(socket, error);
      }
    }, this.#heartbeatIntervalMs);
  }

  #clearHeartbeat(): void {
    if (this.#heartbeat) clearInterval(this.#heartbeat);
    this.#heartbeat = undefined;
  }

  #recoverTransport(socket: WebSocketLike, error: Error): void {
    if (this.#socket !== socket || this.#stopped) return;
    this.#clearHeartbeat();
    this.#socket = undefined;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    if (socket.readyState < 2) {
      try {
        socket.close(1011, "Transport failed");
      } catch {
        // Reconnect even if the failed transport cannot be closed cleanly.
      }
    }
    this.#scheduleReconnect(error);
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
    if (this.#stopped || this.#state !== "reconnecting" || this.#connectPromise) return;
    this.#emit("reconnecting", { attempt: this.#reconnectAttempt, delayMs, error });
    if (this.#stopped || this.#state !== "reconnecting" || this.#connectPromise) return;
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined;
      if (this.#stopped) return;
      void this.#startSession().catch((cause: unknown) => {
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
    this.#emitListeners(type, event);
  }
}
