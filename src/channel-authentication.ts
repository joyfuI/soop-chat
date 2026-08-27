import type { ChannelAuthentication, ChannelInfo } from "./types.js";

const authentications = new WeakMap<ChannelInfo, ChannelAuthentication>();

export const setChannelAuthentication = (
  channel: ChannelInfo,
  authentication: ChannelAuthentication,
): void => {
  authentications.set(channel, authentication);
};

export const getChannelAuthentication = (channel: ChannelInfo): ChannelAuthentication | undefined =>
  authentications.get(channel);
