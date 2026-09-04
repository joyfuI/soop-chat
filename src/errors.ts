/** {@link SoopChatError}가 제공하는 안정적인 기계 판독용 코드입니다. */
export type SoopChatErrorCode =
  | "BROADCAST_OFFLINE"
  | "RESTRICTED_ROOM"
  | "AUTHENTICATION_FAILED"
  | "BROWSER_RESOLVER_REQUIRED"
  | "CHANNEL_RESOLUTION_FAILED"
  | "PROTOCOL_ERROR";

/** `soop-chat`이 정의한 오류의 기본 클래스입니다. */
export class SoopChatError extends Error {
  readonly code: SoopChatErrorCode;

  constructor(code: SoopChatErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
  }
}

/** 요청한 방송인이 현재 방송 중이 아닐 때 발생합니다. */
export class BroadcastOfflineError extends SoopChatError {
  constructor(streamerId: string, options?: ErrorOptions) {
    super("BROADCAST_OFFLINE", `SOOP broadcaster "${streamerId}" is not live.`, options);
  }
}

/** SOOP이 채팅방 접근을 거부한 것으로 확인된 사유입니다. */
export type RestrictedRoomReason =
  | "password"
  | "adult"
  | "subscriptionPlus"
  | "loginRequired"
  | "unknown";

/** 채팅방에 비밀번호, 로그인, 성인 인증 또는 구독 권한이 필요할 때 발생합니다. */
export class RestrictedRoomError extends SoopChatError {
  readonly reason: RestrictedRoomReason;

  constructor(reason: RestrictedRoomReason, message?: string, options?: ErrorOptions) {
    super("RESTRICTED_ROOM", message ?? `Access to this room is restricted (${reason}).`, options);
    this.reason = reason;
  }
}

/** Node 전용 SOOP 계정 로그인 또는 인증 티켓 처리에 실패할 때 발생합니다. */
export class AuthenticationError extends SoopChatError {
  constructor(message = "SOOP login failed.", options?: ErrorOptions) {
    super("AUTHENTICATION_FAILED", message, options);
  }
}

/** 브라우저 클라이언트에 필수 애플리케이션 서버 resolver가 없을 때 발생합니다. */
export class BrowserResolverRequiredError extends SoopChatError {
  constructor() {
    super(
      "BROWSER_RESOLVER_REQUIRED",
      "Browser clients require resolveChannel because SOOP blocks the live-info API with CORS.",
    );
  }
}

/** 채널 resolver나 SOOP 라이브 정보 응답에서 유효한 채널 정보를 얻지 못할 때 발생합니다. */
export class ChannelResolutionError extends SoopChatError {
  constructor(message: string, options?: ErrorOptions) {
    super("CHANNEL_RESOLUTION_FAILED", message, options);
  }
}

/** WebSocket 패킷을 framing하거나 decoding하지 못할 때 발생합니다. */
export class ProtocolError extends SoopChatError {
  /** framing을 복구하면서 버린 원본 바이트입니다. */
  readonly discarded: Uint8Array | undefined;

  constructor(message: string, discarded?: Uint8Array, options?: ErrorOptions) {
    super("PROTOCOL_ERROR", message, options);
    this.discarded = discarded;
  }
}

/** 최종 채널 조회 오류를 안전하게 전달하기 위한 wire 표현입니다. */
export type SerializedChannelResolutionError =
  | {
      code: "BROADCAST_OFFLINE";
      message: string;
    }
  | {
      code: "RESTRICTED_ROOM";
      message: string;
      reason: RestrictedRoomReason;
    }
  | {
      code: "CHANNEL_RESOLUTION_FAILED";
      message: string;
    };

const INVALID_SERIALIZED_ERROR_MESSAGE = "Invalid serialized channel resolution error.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRestrictedRoomReason(value: unknown): value is RestrictedRoomReason {
  return (
    value === "password" ||
    value === "adult" ||
    value === "subscriptionPlus" ||
    value === "loginRequired" ||
    value === "unknown"
  );
}

/**
 * resolver 오류를 애플리케이션 서버 응답용으로 직렬화합니다.
 * 알 수 없는 오류와 인증 오류는 민감한 세부 정보 없이 의도적으로 일반화합니다.
 */
export function serializeChannelResolutionError(error: unknown): SerializedChannelResolutionError {
  if (error instanceof BroadcastOfflineError) {
    return { code: "BROADCAST_OFFLINE", message: error.message };
  }
  if (error instanceof RestrictedRoomError) {
    return { code: "RESTRICTED_ROOM", message: error.message, reason: error.reason };
  }
  if (error instanceof ChannelResolutionError) {
    return { code: "CHANNEL_RESOLUTION_FAILED", message: error.message };
  }
  return { code: "CHANNEL_RESOLUTION_FAILED", message: "Channel resolution failed." };
}

/**
 * 신뢰할 수 없는 애플리케이션 서버 JSON에서 resolver 오류를 복원합니다.
 * 유효하지 않은 입력은 일반 {@link ChannelResolutionError}로 변환합니다.
 */
export function deserializeChannelResolutionError(
  input: unknown,
  context?: { streamerId?: string },
): BroadcastOfflineError | RestrictedRoomError | ChannelResolutionError {
  if (!isRecord(input) || typeof input.message !== "string" || !input.message) {
    return new ChannelResolutionError(INVALID_SERIALIZED_ERROR_MESSAGE);
  }

  switch (input.code) {
    case "BROADCAST_OFFLINE": {
      const streamerId =
        typeof context?.streamerId === "string" && context.streamerId
          ? context.streamerId
          : "unknown";
      const error = new BroadcastOfflineError(streamerId);
      error.message = input.message;
      return error;
    }
    case "RESTRICTED_ROOM":
      return isRestrictedRoomReason(input.reason)
        ? new RestrictedRoomError(input.reason, input.message)
        : new ChannelResolutionError(INVALID_SERIALIZED_ERROR_MESSAGE);
    case "CHANNEL_RESOLUTION_FAILED":
      return new ChannelResolutionError(input.message);
    default:
      return new ChannelResolutionError(INVALID_SERIALIZED_ERROR_MESSAGE);
  }
}
