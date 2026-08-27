import type { ChannelInfo } from "./types.js";

export interface ChannelAuthentication {
  ticket: string;
  fanTicket: string;
}

const authentications = new WeakMap<ChannelInfo, ChannelAuthentication>();

export const setChannelAuthentication = (
  channel: ChannelInfo,
  authentication: ChannelAuthentication,
): void => {
  authentications.set(channel, authentication);
};

export const getChannelAuthentication = (channel: ChannelInfo): ChannelAuthentication | undefined =>
  authentications.get(channel);
