import WebSocket from "ws";
import { SoopChatCore } from "./client.js";
import {
  authenticateNode,
  createNodeChannelResolver,
  resolveNodeChannel,
  type SoopAuthentication,
  type SoopCredentials,
} from "./node-resolver.js";
import type { SoopChatOptions, WebSocketLike } from "./types.js";

/** Node.js 클라이언트 옵션입니다. */
export interface NodeSoopChatOptions extends SoopChatOptions {
  /**
   * 19금 또는 구독플러스 방에 사용할 선택적 SOOP 계정 정보입니다.
   *
   * 프로세스 메모리에만 유지되며 `resolveChannel`을 전달하면 사용하지 않습니다.
   */
  credentials?: SoopCredentials;
}

/**
 * Node.js용 읽기 전용 SOOP 라이브 채팅 클라이언트입니다.
 *
 * `resolveChannel`을 전달하지 않으면 내장 Node 채널 resolver를 사용합니다.
 * {@link SoopChat.connect}로 입장하고 사용을 마치면 {@link SoopChat.disconnect}를 호출하세요.
 */
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

export { authenticateNode, createNodeChannelResolver, resolveNodeChannel };
export type { SoopAuthentication, SoopCredentials };
export * from "./errors.js";
export * from "./events.js";
export * from "./types.js";
