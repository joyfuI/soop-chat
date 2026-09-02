import type { ProtocolError, RestrictedRoomReason } from "./errors.js";
import type {
  KnownSoopEvent,
  RawPacket,
  SoopEvent,
  SoopProtocolEventMap,
  UnknownSoopEvent,
} from "./events.js";

export interface ChannelInfo {
  broadcastNo: string;
  chatNo: string;
  chatDomain: string;
  chatPort: number;
}

export interface ChannelAuthentication {
  ticket: string;
  fanTicket: string;
}

export interface AuthenticatedChannelInfo extends ChannelInfo {
  authentication: ChannelAuthentication;
}

export interface ChannelResolverContext {
  signal: AbortSignal;
  roomPassword?: string;
}

export type ChannelResolver = (
  streamerId: string,
  context: ChannelResolverContext,
) => Promise<ChannelInfo>;

export interface ReconnectOptions {
  enabled?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: number;
}

export interface SoopChatOptions {
  streamerId: string;
  roomPassword?: string;
  handshakeTimeoutMs?: number;
  reconnect?: boolean | ReconnectOptions;
  resolveChannel?: ChannelResolver;
}

export interface BrowserSoopChatOptions extends Omit<SoopChatOptions, "resolveChannel"> {
  resolveChannel: ChannelResolver;
}

export type ConnectionState =
  | "idle"
  | "resolving"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface StateChangeEvent {
  previous: ConnectionState;
  current: ConnectionState;
}

export interface ReconnectingEvent {
  attempt: number;
  delayMs: number;
  error: Error;
}

export interface ProtocolErrorEvent {
  error: ProtocolError;
  raw?: RawPacket;
}

export interface EndedEvent {
  reason: "offline" | "restricted";
  restriction?: RestrictedRoomReason;
}

export type SoopChatEventMap = SoopProtocolEventMap & {
  event: SoopEvent;
  raw: RawPacket;
  unknown: UnknownSoopEvent;
  protocolError: ProtocolErrorEvent;
  stateChange: StateChangeEvent;
  reconnecting: ReconnectingEvent;
  error: Error;
  ended: EndedEvent;
};

export type SoopChatEventType = keyof SoopChatEventMap;
export type SoopChatListener<K extends SoopChatEventType> = (event: SoopChatEventMap[K]) => void;

export type WebSocketMessageData = string | ArrayBuffer | ArrayBufferView | Blob;

export interface WebSocketLike {
  readonly readyState: number;
  binaryType: BinaryType;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<WebSocketMessageData>) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string | ArrayBuffer | ArrayBufferView<ArrayBuffer>): void;
  close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string, protocols: string | string[]) => WebSocketLike;

export type { KnownSoopEvent, RawPacket, SoopEvent, UnknownSoopEvent };
