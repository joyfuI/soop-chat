import {
  BroadcastOfflineError,
  ChannelResolutionError,
  RestrictedRoomError,
  type RestrictedRoomReason,
} from "./errors.js";
import type { ChannelInfo, ChannelResolver } from "./types.js";

const LIVE_API = "https://live.sooplive.com/afreeca/player_live_api.php";

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function restrictionFromReason(reason: string): RestrictedRoomReason {
  const normalized = reason.toLowerCase();
  if (normalized.includes("password") || normalized.includes("pwd")) return "password";
  if (normalized.includes("adult") || normalized.includes("19")) return "adult";
  if (normalized.includes("subscription") || normalized.includes("subscribe")) return "subscriptionPlus";
  if (normalized.includes("login") || normalized.includes("auth")) return "loginRequired";
  return "unknown";
}

export const resolveNodeChannel: ChannelResolver = async (streamerId, { signal }): Promise<ChannelInfo> => {
  const body = new URLSearchParams({
    bid: streamerId,
    type: "live",
    pwd: "",
    player_type: "html5",
    stream_type: "common",
    quality: "HD",
    mode: "landing",
    from_api: "0",
    is_revive: "false",
  });

  let response: Response;
  try {
    response = await fetch(`${LIVE_API}?bjid=${encodeURIComponent(streamerId)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ChannelResolutionError("Failed to call the SOOP live-info API.", { cause });
  }
  if (!response.ok) {
    throw new ChannelResolutionError(`SOOP live-info API returned HTTP ${response.status}.`);
  }

  let root: Record<string, unknown>;
  try {
    root = record(await response.json()) ?? {};
  } catch (cause) {
    throw new ChannelResolutionError("SOOP live-info API returned invalid JSON.", { cause });
  }
  const channel = record(root.CHANNEL) ?? root;
  const result = Number(channel.RESULT ?? root.RESULT ?? 0);
  const reason = text(channel.REASON ?? root.REASON);
  if (result !== 1) {
    if (result === 0 || /offline|not.?stream/i.test(reason)) throw new BroadcastOfflineError(streamerId);
    const restriction = restrictionFromReason(reason);
    if (restriction !== "unknown") throw new RestrictedRoomError(restriction, reason || undefined);
    throw new ChannelResolutionError(reason || `SOOP live-info API returned RESULT=${result}.`);
  }
  if (text(channel.BPWD).toUpperCase() === "Y") throw new RestrictedRoomError("password");

  const info: ChannelInfo = {
    broadcastNo: text(channel.BNO),
    chatNo: text(channel.CHATNO),
    chatDomain: text(channel.CHDOMAIN),
    chatPort: Number(channel.CHPT),
  };
  if (!info.broadcastNo || !info.chatNo || !info.chatDomain || !Number.isInteger(info.chatPort)) {
    throw new ChannelResolutionError("SOOP live-info API omitted required channel fields.");
  }
  return info;
};
