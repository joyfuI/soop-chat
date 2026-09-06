import type { ChannelAuthentication, ChannelInfo } from "./types.js";
import { isValidProtocolField } from "./protocol.js";

const authentications = new WeakMap<ChannelInfo, ChannelAuthentication>();

/** resolver 응답을 WebSocket 주소와 handshake 필드로 사용하기 전에 검증합니다. */
export function validateChannelInfo(channel: ChannelInfo): void {
  if (!channel || ![channel.broadcastNo, channel.chatNo].every(isValidProtocolField))
    throw new TypeError("Channel info contains an invalid broadcastNo or chatNo.");
  if (typeof channel.chatDomain !== "string" || !/^[a-z0-9.-]+$/i.test(channel.chatDomain))
    throw new TypeError("Channel info contains an invalid chatDomain.");
  if (!Number.isInteger(channel.chatPort) || channel.chatPort < 1 || channel.chatPort > 65_534)
    throw new TypeError("Channel info contains an invalid chatPort.");
}

export const setChannelAuthentication = (
  channel: ChannelInfo,
  authentication: ChannelAuthentication,
): void => {
  authentications.set(channel, authentication);
};

export const getChannelAuthentication = (channel: ChannelInfo): ChannelAuthentication | undefined =>
  authentications.get(channel);
