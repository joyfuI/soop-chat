import WebSocket from "ws";
import { SoopChatCore } from "./client.js";
import {
  createNodeChannelResolver,
  resolveNodeChannel,
  type SoopCredentials,
} from "./node-resolver.js";
import type { SoopChatOptions, WebSocketLike } from "./types.js";

export interface NodeSoopChatOptions extends SoopChatOptions {
  credentials?: SoopCredentials;
}

export class SoopChat extends SoopChatCore {
  constructor(options: NodeSoopChatOptions) {
    const { credentials, ...chatOptions } = options;
    super({
      ...chatOptions,
      resolveChannel:
        chatOptions.resolveChannel ??
        (credentials ? createNodeChannelResolver(credentials) : resolveNodeChannel),
      createWebSocket: (url, protocols) =>
        new WebSocket(url, protocols) as unknown as WebSocketLike,
    });
  }
}

export { createNodeChannelResolver, resolveNodeChannel };
export type { SoopCredentials };
export * from "./errors.js";
export * from "./events.js";
export * from "./types.js";
