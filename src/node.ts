import WebSocket from "ws";
import { SoopChatCore } from "./client.js";
import { resolveNodeChannel } from "./node-resolver.js";
import type { SoopChatOptions, WebSocketLike } from "./types.js";

export class SoopChat extends SoopChatCore {
  constructor(options: SoopChatOptions) {
    super({
      ...options,
      resolveChannel: options.resolveChannel ?? resolveNodeChannel,
      createWebSocket: (url, protocols) =>
        new WebSocket(url, protocols) as unknown as WebSocketLike,
    });
  }
}

export { resolveNodeChannel };
export * from "./errors.js";
export * from "./events.js";
export * from "./types.js";
