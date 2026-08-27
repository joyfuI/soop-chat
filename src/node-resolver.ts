import {
  AuthenticationError,
  BroadcastOfflineError,
  ChannelResolutionError,
  RestrictedRoomError,
  type RestrictedRoomReason,
} from "./errors.js";
import { setChannelAuthentication } from "./channel-authentication.js";
import type { ChannelInfo, ChannelResolver, ChannelResolverContext } from "./types.js";

const LIVE_API = "https://live.sooplive.com/afreeca/player_live_api.php";
const LOGIN_API = "https://login.sooplive.com/app/LoginAction.php";

export interface SoopCredentials {
  username: string;
  password: string;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function restrictionFromReason(reason: string): RestrictedRoomReason {
  const normalized = reason.toLowerCase();
  if (normalized.includes("password") || normalized.includes("pwd")) return "password";
  if (normalized.includes("adult") || normalized.includes("19")) return "adult";
  if (normalized.includes("subscription") || normalized.includes("subscribe"))
    return "subscriptionPlus";
  if (normalized.includes("login") || normalized.includes("auth")) return "loginRequired";
  return "unknown";
}

async function authenticate(credentials: SoopCredentials, signal: AbortSignal): Promise<string> {
  const body = new URLSearchParams({
    szWork: "login",
    szType: "json",
    szUid: credentials.username,
    szPassword: credentials.password,
    isSaveId: "false",
    szScriptVar: "oLoginRet",
    szAction: "",
    isLoginRetain: "N",
    isRetainIgnore: "",
    nLoginOpt: "",
  });

  let response: Response;
  try {
    response = await fetch(LOGIN_API, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        referer: "https://play.sooplive.com/",
      },
      body,
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new AuthenticationError("Failed to call the SOOP login API.", { cause });
  }
  if (!response.ok)
    throw new AuthenticationError(`SOOP login API returned HTTP ${response.status}.`);

  let root: Record<string, unknown>;
  try {
    root = record(await response.json()) ?? {};
  } catch (cause) {
    throw new AuthenticationError("SOOP login API returned invalid JSON.", { cause });
  }
  if (Number(root.RESULT) !== 1)
    throw new AuthenticationError("SOOP rejected the supplied credentials.");

  const authTicket = response.headers
    .getSetCookie()
    .map((cookie) => /^AuthTicket=([^;]+)/.exec(cookie)?.[1])
    .find((ticket): ticket is string => Boolean(ticket));
  if (!authTicket) throw new AuthenticationError("SOOP login API omitted AuthTicket.");
  return authTicket;
}

async function resolveChannel(
  streamerId: string,
  { signal }: ChannelResolverContext,
  authTicket?: string,
): Promise<ChannelInfo> {
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
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(authTicket ? { cookie: `AuthTicket=${authTicket}` } : {}),
      },
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
    if (result === 0 || /offline|not.?stream/i.test(reason))
      throw new BroadcastOfflineError(streamerId);
    if (result === -6) throw new RestrictedRoomError("adult");
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
  if (authTicket) {
    const ticket = text(channel.TK) || authTicket;
    const fanTicket = text(channel.FTK);
    if (!fanTicket) {
      throw new ChannelResolutionError("SOOP live-info API omitted authenticated chat fields.");
    }
    setChannelAuthentication(info, { ticket, fanTicket });
  }
  return info;
}

export const resolveNodeChannel: ChannelResolver = (streamerId, context) =>
  resolveChannel(streamerId, context);

export function createNodeChannelResolver(credentials: SoopCredentials): ChannelResolver {
  const username = credentials.username.trim();
  const password = credentials.password;
  if (!username || !password) throw new TypeError("SOOP username and password must not be empty.");

  let authTicket: string | undefined;
  return async (streamerId: string, context: ChannelResolverContext) => {
    authTicket ??= await authenticate({ username, password }, context.signal);
    return resolveChannel(streamerId, context, authTicket);
  };
}
