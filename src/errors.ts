export type SoopChatErrorCode =
  | "BROADCAST_OFFLINE"
  | "RESTRICTED_ROOM"
  | "AUTHENTICATION_FAILED"
  | "BROWSER_RESOLVER_REQUIRED"
  | "CHANNEL_RESOLUTION_FAILED"
  | "PROTOCOL_ERROR";

export class SoopChatError extends Error {
  readonly code: SoopChatErrorCode;

  constructor(code: SoopChatErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
  }
}

export class BroadcastOfflineError extends SoopChatError {
  constructor(streamerId: string, options?: ErrorOptions) {
    super("BROADCAST_OFFLINE", `SOOP broadcaster "${streamerId}" is not live.`, options);
  }
}

export type RestrictedRoomReason =
  | "password"
  | "adult"
  | "subscriptionPlus"
  | "loginRequired"
  | "unknown";

export class RestrictedRoomError extends SoopChatError {
  readonly reason: RestrictedRoomReason;

  constructor(reason: RestrictedRoomReason, message?: string, options?: ErrorOptions) {
    super("RESTRICTED_ROOM", message ?? `Access to this room is restricted (${reason}).`, options);
    this.reason = reason;
  }
}

export class AuthenticationError extends SoopChatError {
  constructor(message = "SOOP login failed.", options?: ErrorOptions) {
    super("AUTHENTICATION_FAILED", message, options);
  }
}

export class BrowserResolverRequiredError extends SoopChatError {
  constructor() {
    super(
      "BROWSER_RESOLVER_REQUIRED",
      "Browser clients require resolveChannel because SOOP blocks the live-info API with CORS.",
    );
  }
}

export class ChannelResolutionError extends SoopChatError {
  constructor(message: string, options?: ErrorOptions) {
    super("CHANNEL_RESOLUTION_FAILED", message, options);
  }
}

export class ProtocolError extends SoopChatError {
  readonly discarded: Uint8Array | undefined;

  constructor(message: string, discarded?: Uint8Array, options?: ErrorOptions) {
    super("PROTOCOL_ERROR", message, options);
    this.discarded = discarded;
  }
}

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
