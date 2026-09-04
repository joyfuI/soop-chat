import {
  AuthenticationError,
  BroadcastOfflineError,
  ChannelResolutionError,
  RestrictedRoomError,
  type RestrictedRoomReason,
} from "./errors.js";
import { setChannelAuthentication } from "./channel-authentication.js";
import type {
  AuthenticatedChannelInfo,
  ChannelAuthentication,
  ChannelInfo,
  ChannelResolver,
  ChannelResolverContext,
} from "./types.js";

const LIVE_API = "https://live.sooplive.com/afreeca/player_live_api.php";
const LOGIN_API = "https://login.sooplive.com/app/LoginAction.php";

/** Node 전용 SOOP 계정 정보입니다. 메모리에만 두고 로그나 영구 저장소에 남기지 마세요. */
export interface SoopCredentials {
  /** SOOP 계정 ID입니다. */
  username: string;
  /** SOOP 계정 비밀번호입니다. */
  password: string;
}

/**
 * {@link authenticateNode}가 반환하는 Node 전용 계정 인증 정보입니다.
 * `AuthTicket`은 서버에만 보관하고 브라우저로 보내지 마세요.
 */
export interface SoopAuthentication {
  /** 계정 session 티켓입니다. 서버 메모리에만 두고 로그나 영구 저장소에 남기지 마세요. */
  authTicket: string;
}

interface AuthenticatedChannelResolverContext extends ChannelResolverContext {
  /** {@link authenticateNode}가 만든 서버 측 계정 인증 정보입니다. */
  authentication: SoopAuthentication;
}

interface ChannelResolution {
  channel: ChannelInfo;
  authentication?: ChannelAuthentication;
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

function normalizedCredentials(credentials: SoopCredentials): SoopCredentials {
  const username = credentials.username.trim();
  const password = credentials.password;
  if (!username || !password) throw new TypeError("SOOP username and password must not be empty.");
  return { username, password };
}

function isValidAuthTicket(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || character === ";") return false;
  }
  return true;
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
  if (!isValidAuthTicket(authTicket))
    throw new AuthenticationError("SOOP login API omitted a valid AuthTicket.");
  return authTicket;
}

async function resolveChannel(
  streamerId: string,
  { signal, roomPassword = "" }: ChannelResolverContext,
  authTicket?: string,
): Promise<ChannelResolution> {
  const request = async (type: "live" | "aid", broadcastNo = "") => {
    const body = new URLSearchParams({
      bid: streamerId,
      bno: broadcastNo,
      type,
      pwd: roomPassword,
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

    try {
      const root = record(await response.json()) ?? {};
      return { root, channel: record(root.CHANNEL) ?? root };
    } catch (cause) {
      throw new ChannelResolutionError("SOOP live-info API returned invalid JSON.", { cause });
    }
  };

  const { root, channel } = await request("live");
  const result = Number(channel.RESULT ?? root.RESULT ?? 0);
  const reason = text(channel.REASON ?? root.REASON);
  if (result !== 1) {
    if (result === 0 || /offline|not.?stream/i.test(reason))
      throw new BroadcastOfflineError(streamerId);
    if (result === -1988) {
      throw new RestrictedRoomError(
        "password",
        roomPassword ? "SOOP rejected the room password." : undefined,
      );
    }
    if (result === -6) throw new RestrictedRoomError("adult");
    if (result === -14) throw new RestrictedRoomError("subscriptionPlus");
    const restriction = restrictionFromReason(reason);
    if (restriction !== "unknown") throw new RestrictedRoomError(restriction, reason || undefined);
    throw new ChannelResolutionError(reason || `SOOP live-info API returned RESULT=${result}.`);
  }
  const info: ChannelInfo = {
    broadcastNo: text(channel.BNO),
    chatNo: text(channel.CHATNO),
    chatDomain: text(channel.CHDOMAIN),
    chatPort: Number(channel.CHPT),
  };
  if (!info.broadcastNo || !info.chatNo || !info.chatDomain || !Number.isInteger(info.chatPort)) {
    throw new ChannelResolutionError("SOOP live-info API omitted required channel fields.");
  }
  if (text(channel.BPWD).toUpperCase() === "Y") {
    if (!roomPassword) throw new RestrictedRoomError("password");
    const passwordCheck = await request("aid", info.broadcastNo);
    if (Number(passwordCheck.channel.RESULT ?? passwordCheck.root.RESULT ?? 0) !== 1) {
      throw new RestrictedRoomError("password", "SOOP rejected the room password.");
    }
  }
  if (authTicket) {
    const ticket = text(channel.TK);
    const fanTicket = text(channel.FTK);
    if (!ticket || !fanTicket || ticket.includes("\x0c") || fanTicket.includes("\x0c")) {
      throw new ChannelResolutionError("SOOP live-info API omitted authenticated chat fields.");
    }
    return { channel: info, authentication: { ticket, fanTicket } };
  }
  return { channel: info };
}

/**
 * ID 저장이나 로그인 유지를 요청하지 않고 Node.js에서 SOOP에 로그인합니다.
 * `signal`이 중단되면 요청은 `AbortError`로 거부됩니다.
 *
 * @throws {TypeError} 계정 ID나 비밀번호가 비어 있을 때 발생합니다.
 * @throws {AuthenticationError} 로그인 요청이나 응답에 실패할 때 발생합니다.
 */
export async function authenticateNode(
  credentials: SoopCredentials,
  { signal }: ChannelResolverContext,
): Promise<SoopAuthentication> {
  return { authTicket: await authenticate(normalizedCredentials(credentials), signal) };
}

/**
 * Node.js에서 SOOP 라이브 정보 API를 통해 최신 채팅 접속 정보를 조회합니다.
 *
 * `authentication`은 신뢰할 수 있는 서버에서만 전달하세요. 인증 호출은 브라우저 클라이언트용
 * 단기 `TK`와 `FTK`를 반환하지만 계정 수준의 `AuthTicket`은 반환하지 않습니다.
 * `context.signal`이 중단되면 요청은 `AbortError`로 거부됩니다.
 *
 * @throws {BroadcastOfflineError} 방송 중이 아닐 때 발생합니다.
 * @throws {RestrictedRoomError} 비밀번호나 계정 권한이 필요한 방일 때 발생합니다.
 * @throws {AuthenticationError} 전달된 인증 티켓이 유효하지 않을 때 발생합니다.
 * @throws {ChannelResolutionError} SOOP이 유효한 채널 정보를 제공하지 못할 때 발생합니다.
 */
export function resolveNodeChannel(
  streamerId: string,
  context: AuthenticatedChannelResolverContext,
): Promise<AuthenticatedChannelInfo>;
export function resolveNodeChannel(
  streamerId: string,
  context: ChannelResolverContext,
): Promise<ChannelInfo>;
export async function resolveNodeChannel(
  streamerId: string,
  context: ChannelResolverContext | AuthenticatedChannelResolverContext,
): Promise<ChannelInfo | AuthenticatedChannelInfo> {
  const authentication = "authentication" in context ? context.authentication : undefined;
  if (
    authentication !== undefined &&
    (authentication === null ||
      typeof authentication !== "object" ||
      !isValidAuthTicket(authentication.authTicket))
  ) {
    throw new AuthenticationError("SOOP authentication ticket is invalid.");
  }
  const resolution = await resolveChannel(streamerId, context, authentication?.authTicket);
  if (!resolution.authentication) return resolution.channel;
  return { ...resolution.channel, authentication: resolution.authentication };
}

/**
 * 인증이 필요한 방을 위한 Node.js resolver를 만듭니다.
 *
 * resolver는 처음 필요할 때 로그인하고 계정 정보와 `AuthTicket`을 closure에 보관해 재연결에
 * 재사용합니다. 티켓 만료를 추측하거나 실패한 인증을 자동 갱신하지 않습니다.
 *
 * @throws {TypeError} 계정 ID나 비밀번호가 비어 있을 때 발생합니다.
 */
export function createNodeChannelResolver(credentials: SoopCredentials): ChannelResolver {
  const normalized = normalizedCredentials(credentials);

  let authentication: SoopAuthentication | undefined;
  return async (streamerId: string, context: ChannelResolverContext) => {
    authentication ??= await authenticateNode(normalized, context);
    const resolution = await resolveChannel(streamerId, context, authentication.authTicket);
    if (!resolution.authentication) {
      throw new ChannelResolutionError("SOOP live-info API omitted authenticated chat fields.");
    }
    setChannelAuthentication(resolution.channel, resolution.authentication);
    return resolution.channel;
  };
}
