import type { ProtocolError, RestrictedRoomReason } from "./errors.js";
import type {
  KnownSoopEvent,
  RawPacket,
  SoopEvent,
  SoopProtocolEventMap,
  UnknownSoopEvent,
} from "./events.js";

/** 현재 SOOP 채팅 채널에 접속하는 데 필요한 직렬화 가능한 정보입니다. */
export interface ChannelInfo {
  /** 방송 인스턴스 번호입니다. */
  broadcastNo: string;
  /** 채팅방 번호입니다. 방송이 바뀌면 달라질 수 있습니다. */
  chatNo: string;
  /** 라이브 정보 API가 반환한 WebSocket 호스트입니다. */
  chatDomain: string;
  /** 채팅 기준 포트입니다. 클라이언트는 `chatPort + 1`에 접속합니다. */
  chatPort: number;
}

/**
 * 인증 채널에 접속할 때 사용하는 단기 WebSocket 티켓입니다.
 *
 * 이 값은 메모리에만 두고 로그나 영구 저장소에 남기지 마세요.
 */
export interface ChannelAuthentication {
  /** 로그인 handshake에서 보내는 `TK`입니다. */
  ticket: string;
  /** 채팅 채널 입장 시 보내는 `FTK`입니다. */
  fanTicket: string;
}

/**
 * 신뢰할 수 있는 애플리케이션 서버가 브라우저 클라이언트에 제공하는 채널 정보입니다.
 * 계정 수준의 `AuthTicket`은 절대 포함하면 안 됩니다.
 */
export interface AuthenticatedChannelInfo extends ChannelInfo {
  authentication: ChannelAuthentication;
}

/** {@link ChannelResolver}를 호출할 때 전달하는 값입니다. */
export interface ChannelResolverContext {
  /** 연결 시도가 취소되면 resolver도 즉시 중단하기 위한 signal입니다. */
  signal: AbortSignal;
  /** 호출자가 입력한 비밀번호 방의 비밀번호입니다. */
  roomPassword?: string;
}

/**
 * 방송인 ID로 최신 채널 정보를 조회합니다.
 *
 * 클라이언트는 재연결과 다음 방송에서 resolver를 다시 호출합니다. 구현은
 * `context.signal`을 따라야 하며 `ChannelInfo`를 방송 간에 캐시하면 안 됩니다.
 */
export type ChannelResolver = (
  streamerId: string,
  context: ChannelResolverContext,
) => Promise<ChannelInfo>;

/** 예기치 않은 transport 오류 뒤에 적용하는 지수 backoff 설정입니다. */
export interface ReconnectOptions {
  /** 자동 재연결 여부입니다. 기본값은 `true`입니다. */
  enabled?: boolean;
  /** 0 이상인 첫 재시도 대기 시간(ms)입니다. 기본값은 `1_000`입니다. */
  initialDelayMs?: number;
  /** `initialDelayMs` 이상인 최대 대기 시간(ms)입니다. 기본값은 `30_000`입니다. */
  maxDelayMs?: number;
  /** 1 이상인 재시도별 대기 시간 배수입니다. 기본값은 `2`입니다. */
  factor?: number;
  /** 0부터 1까지의 무작위 비례 변동 폭입니다. 기본값은 `0.2`입니다. */
  jitter?: number;
}

/** Node.js와 브라우저 클라이언트가 공유하는 옵션입니다. */
export interface SoopChatOptions {
  /** 비어 있지 않은 SOOP 방송인 ID입니다. 앞뒤 공백은 제거됩니다. */
  streamerId: string;
  /** 제어 문자가 없는 비밀번호 방의 비밀번호입니다. 재연결을 위해 메모리에 유지됩니다. */
  roomPassword?: string;
  /** WebSocket 생성부터 `0002` 입장 응답까지의 제한 시간(ms)입니다. 기본값은 30초입니다. */
  handshakeTimeoutMs?: number;
  /** 자동 재연결 설정입니다. 기본적으로 지수 backoff 재연결을 사용합니다. */
  reconnect?: boolean | ReconnectOptions;
  /**
   * 사용자 정의 채널 resolver입니다. 기본 resolver가 있는 Node.js에서는 선택 사항이고,
   * 브라우저 entrypoint에서는 필수입니다.
   */
  resolveChannel?: ChannelResolver;
}

/** 브라우저 클라이언트 옵션입니다. 애플리케이션 서버의 resolver가 반드시 필요합니다. */
export interface BrowserSoopChatOptions extends Omit<SoopChatOptions, "resolveChannel"> {
  resolveChannel: ChannelResolver;
}

/** 현재 클라이언트 lifecycle 상태입니다. */
export type ConnectionState =
  | "idle"
  | "resolving"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

/** 클라이언트 lifecycle 상태가 바뀔 때 발생합니다. */
export interface StateChangeEvent {
  previous: ConnectionState;
  current: ConnectionState;
}

/** 자동 재연결 대기를 시작하기 전에 발생합니다. */
export interface ReconnectingEvent {
  /** 1부터 시작하는 재시도 횟수입니다. 입장에 성공하면 초기화됩니다. */
  attempt: number;
  /** jitter가 적용된 재시도 전 대기 시간(ms)입니다. */
  delayMs: number;
  /** 재시도를 일으킨 transport 또는 채널 조회 오류입니다. */
  error: Error;
}

/** 클라이언트를 중단시키지 않은 패킷 framing 또는 decoding 오류입니다. */
export interface ProtocolErrorEvent {
  error: ProtocolError;
  /** framing 뒤 decoding에 실패한 경우의 관련 패킷입니다. */
  raw?: RawPacket;
}

/** 클라이언트가 재연결하지 않는 방송 종료 또는 접근 제한 상태입니다. */
export interface EndedEvent {
  reason: "offline" | "restricted";
  /** `reason`이 `restricted`일 때 제공됩니다. */
  restriction?: RestrictedRoomReason;
}

/** `SoopChat.on()`이 받는 모든 이벤트의 payload 타입입니다. */
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

/** `SoopChat.on()`이 받는 이벤트 이름입니다. */
export type SoopChatEventType = keyof SoopChatEventMap;
/** 특정 `SoopChat` 이벤트의 listener 타입입니다. */
export type SoopChatListener<K extends SoopChatEventType> = (event: SoopChatEventMap[K]) => void;

/** 브라우저와 `ws` WebSocket 구현에서 받을 수 있는 메시지 데이터입니다. */
export type WebSocketMessageData = string | ArrayBuffer | ArrayBufferView | Blob;

/** 공통 클라이언트 코어가 내부에서 사용하는 WebSocket 구조의 일부입니다. */
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

/** 공통 클라이언트 코어가 사용하는 factory 타입입니다. 일반 사용자는 제공할 필요가 없습니다. */
export type WebSocketFactory = (url: string, protocols: string | string[]) => WebSocketLike;

export type { KnownSoopEvent, RawPacket, SoopEvent, UnknownSoopEvent };
