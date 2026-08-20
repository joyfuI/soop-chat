export type SoopChatErrorCode =
  | "BROADCAST_OFFLINE"
  | "RESTRICTED_ROOM"
  | "BROWSER_RESOLVER_REQUIRED"
  | "CHANNEL_RESOLUTION_FAILED"
  | "CONNECTION_FAILED"
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
    super(
      "RESTRICTED_ROOM",
      message ?? `This room is not available anonymously (${reason}).`,
      options,
    );
    this.reason = reason;
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

export class ConnectionError extends SoopChatError {
  constructor(message: string, options?: ErrorOptions) {
    super("CONNECTION_FAILED", message, options);
  }
}

export class ProtocolError extends SoopChatError {
  readonly discarded: Uint8Array | undefined;

  constructor(message: string, discarded?: Uint8Array, options?: ErrorOptions) {
    super("PROTOCOL_ERROR", message, options);
    this.discarded = discarded;
  }
}
