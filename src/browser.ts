import { SoopChatCore } from "./client.js";
import { BrowserResolverRequiredError } from "./errors.js";
import type { BrowserSoopChatOptions } from "./types.js";

export class SoopChat extends SoopChatCore {
  constructor(options: BrowserSoopChatOptions) {
    if (typeof options.resolveChannel !== "function") throw new BrowserResolverRequiredError();
    super({
      ...options,
      createWebSocket: (url, protocols) => new WebSocket(url, protocols),
    });
  }
}

export * from "./errors.js";
export * from "./events.js";
export * from "./types.js";
