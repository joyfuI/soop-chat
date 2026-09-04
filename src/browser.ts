import { SoopChatCore } from "./client.js";
import { BrowserResolverRequiredError } from "./errors.js";
import type { BrowserSoopChatOptions } from "./types.js";

/**
 * 브라우저용 읽기 전용 SOOP 라이브 채팅 클라이언트입니다.
 *
 * SOOP 라이브 정보 API는 일반 웹사이트의 CORS 요청을 허용하지 않으므로 `resolveChannel`은
 * 신뢰할 수 있는 애플리케이션 서버를 호출해야 합니다. `soop-chat/browser`에서 가져오세요.
 */
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
