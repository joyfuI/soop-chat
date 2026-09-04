import { ProtocolError } from "./errors.js";
import {
  EVENT_CATALOG,
  type AdconEffectData,
  type AdminChatUserData,
  type AdminFlagData,
  type AdminNoticeData,
  type BjNoticeData,
  type BalloonData,
  type BanWordData,
  type BroadcasterStatusData,
  type ChatMessageData,
  type ChatUserData,
  type ChatUserExtendData,
  type ChallengeMissionSettlementData,
  type ChallengeMissionSettlementParticipant,
  type CheerTeamChangeData,
  type ChocolateData,
  type ConfettiData,
  type DirectChatData,
  type FanLetterData,
  type FollowItemData,
  type FollowItemEffectData,
  type GemItemSendData,
  type GoodsPurchaseData,
  type GiftTicketData,
  type GiftSubscriptionData,
  type GlobalSubtitleData,
  type IceModeExData,
  type ItemDropsData,
  type ItemSellEffectData,
  type ItemUsingData,
  type JsonObjectData,
  type JoinChannelData,
  type KickAndCancelData,
  type KickMessageStateData,
  type KickUserListData,
  type KnownSoopEvent,
  type KnownSoopOpcode,
  type LoginData,
  type ManagerChatData,
  type MissionData,
  type MobileBroadcastPauseData,
  type NicknameChangeData,
  type NightbotTimeoutData,
  type OgqEmoticonGiftData,
  type OgqEmoticonData,
  type PollNotificationData,
  type QuickViewGiftData,
  type QuickViewProduct,
  type RawPacket,
  type QuitChannelData,
  type SavvyNoticeData,
  type SetDumbData,
  type SetSubBjData,
  type SetUserFlagData,
  type SoopEvent,
  type SlowModeData,
  type StationAdconData,
  type SubscriptionCeremonyButtonData,
  type SubscriptionProduct,
  type TranslationData,
  type UnknownSoopEvent,
  type UserStatus,
  type VideoBalloonData,
  type VodAdconData,
  type VodBalloonData,
  type VrNotificationData,
} from "./events.js";
import type { WebSocketMessageData } from "./types.js";

const HEADER_SIZE = 14;
const ESC = 0x1b;
const TAB = 0x09;
const FIELD_SEPARATOR = "\x0c";
const ADD_INFO_SEPARATOR = "\x11";
const ADD_INFO_END = "\x12";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const QUICK_VIEW_PRODUCTS: Partial<Record<number, readonly [QuickViewProduct, number]>> = {
  1: ["quickView", 30],
  2: ["quickView", 90],
  3: ["quickView", 365],
  100: ["quickViewPlus", 7],
  101: ["quickViewPlus", 30],
  102: ["quickViewPlus", 90],
  103: ["quickViewPlus", 365],
};
const ICE_MODE_ROLES = [
  ["streamer", 16],
  ["fanClub", 32],
  ["supporter", 64],
  ["topFan", 128],
  ["subscriber", 256],
  ["manager", 512],
] as const;
const NIGHTBOT_TIMEOUT_REASONS = [
  "unknown",
  "blacklist",
  "excessCaps",
  "excessEmotes",
  "links",
  "excessSymbols",
  "repetitions",
] as const;

export function isValidRoomPassword(value: string): boolean {
  if (!value) return false;
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return true;
}

export interface ParseBatch {
  packets: RawPacket[];
  errors: ProtocolError[];
}

function concatenate(first: Uint8Array, second: Uint8Array): Uint8Array<ArrayBuffer> {
  if (first.length === 0) return new Uint8Array(second);
  if (second.length === 0) return new Uint8Array(first);
  const result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}

function findPrefix(bytes: Uint8Array, from = 0): number {
  for (let index = from; index < bytes.length - 1; index += 1) {
    if (bytes[index] === ESC && bytes[index + 1] === TAB) return index;
  }
  return -1;
}

function ascii(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return value;
}

function packetFields(text: string): readonly string[] {
  const firstSeparator = text.indexOf(FIELD_SEPARATOR);
  return (firstSeparator >= 0 ? text.slice(firstSeparator + 1) : text).split(FIELD_SEPARATOR);
}

export class PacketStreamParser {
  #buffer: Uint8Array<ArrayBufferLike> = new Uint8Array();

  reset(): void {
    this.#buffer = new Uint8Array();
  }

  push(chunk: Uint8Array): ParseBatch {
    this.#buffer = concatenate(this.#buffer, chunk);
    const packets: RawPacket[] = [];
    const errors: ProtocolError[] = [];

    while (this.#buffer.length >= 2) {
      if (this.#buffer[0] !== ESC || this.#buffer[1] !== TAB) {
        const prefix = findPrefix(this.#buffer, 1);
        const keepFrom =
          prefix >= 0
            ? prefix
            : this.#buffer.at(-1) === ESC
              ? this.#buffer.length - 1
              : this.#buffer.length;
        const discarded = this.#buffer.slice(0, keepFrom);
        this.#buffer = this.#buffer.slice(keepFrom);
        errors.push(new ProtocolError("Discarded bytes before the SOOP packet prefix.", discarded));
        continue;
      }

      if (this.#buffer.length < HEADER_SIZE) break;
      const opcode = ascii(this.#buffer.slice(2, 6));
      const lengthText = ascii(this.#buffer.slice(6, 12));
      const flags = ascii(this.#buffer.slice(12, 14));

      if (!/^\d{4}$/.test(opcode) || !/^\d{6}$/.test(lengthText) || !/^\d{2}$/.test(flags)) {
        const discarded = this.#buffer.slice(0, 2);
        this.#buffer = this.#buffer.slice(2);
        errors.push(new ProtocolError("Invalid SOOP packet header.", discarded));
        continue;
      }

      const payloadLength = Number(lengthText);
      const packetLength = HEADER_SIZE + payloadLength;
      if (this.#buffer.length < packetLength) break;

      const payload = this.#buffer.slice(HEADER_SIZE, packetLength);
      const text = decoder.decode(payload);
      packets.push({ opcode, flags, payload, text, fields: packetFields(text) });
      this.#buffer = this.#buffer.slice(packetLength);
    }

    return { packets, errors };
  }
}

export async function messageDataToBytes(data: WebSocketMessageData): Promise<Uint8Array> {
  if (typeof data === "string") return encoder.encode(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data.slice(0));
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }
  throw new ProtocolError("Unsupported WebSocket message data type.");
}

export function encodePacket(
  opcode: string,
  payload = FIELD_SEPARATOR,
  flags = "00",
): Uint8Array<ArrayBuffer> {
  if (!/^\d{4}$/.test(opcode)) throw new ProtocolError(`Invalid opcode: ${opcode}`);
  if (!/^\d{2}$/.test(flags)) throw new ProtocolError(`Invalid flags: ${flags}`);

  const payloadBytes = encoder.encode(payload);
  if (payloadBytes.length > 999_999) throw new ProtocolError("SOOP packet payload is too large.");
  const header = encoder.encode(
    `\x1b\x09${opcode}${String(payloadBytes.length).padStart(6, "0")}${flags}`,
  );
  return concatenate(header, payloadBytes);
}

export const createConnectPacket = (ticket = ""): Uint8Array<ArrayBuffer> =>
  encodePacket(
    "0001",
    `${FIELD_SEPARATOR}${ticket}${FIELD_SEPARATOR.repeat(2)}16${FIELD_SEPARATOR}`,
  );
export const createJoinPacket = (
  chatNo: string,
  fanTicket = "",
  roomPassword = "",
): Uint8Array<ArrayBuffer> => {
  if (roomPassword && !isValidRoomPassword(roomPassword)) {
    throw new ProtocolError("Room password contains invalid control characters.");
  }
  const addInfo = roomPassword
    ? `log${ADD_INFO_SEPARATOR}${ADD_INFO_END}pwd${ADD_INFO_SEPARATOR}${roomPassword}${ADD_INFO_END}auth_info${ADD_INFO_SEPARATOR}${ADD_INFO_END}pver${ADD_INFO_SEPARATOR}2${ADD_INFO_END}access_system${ADD_INFO_SEPARATOR}html5${ADD_INFO_END}`
    : "";
  return encodePacket(
    "0002",
    fanTicket || roomPassword
      ? `${FIELD_SEPARATOR}${chatNo}${FIELD_SEPARATOR}${fanTicket}${FIELD_SEPARATOR}0${FIELD_SEPARATOR.repeat(2)}${addInfo}${FIELD_SEPARATOR}`
      : `${FIELD_SEPARATOR}${chatNo}${FIELD_SEPARATOR.repeat(5)}`,
  );
};
export const createKeepAlivePacket = (): Uint8Array<ArrayBuffer> =>
  encodePacket("0000", FIELD_SEPARATOR);

function requireFields(raw: RawPacket, count: number): readonly string[] {
  if (raw.fields.length < count) {
    throw new ProtocolError(
      `Opcode ${raw.opcode} requires at least ${count} fields; received ${raw.fields.length}.`,
    );
  }
  return raw.fields;
}

function integer(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function userFlags(value: string | undefined): { primary: number; secondary: number } {
  const [primary, secondary] = (value ?? "").split("|");
  return { primary: integer(primary), secondary: integer(secondary) };
}

function followerTier(flag2: number): 0 | 1 | 2 | 3 {
  return (flag2 & (1 << 18)) !== 0
    ? 1
    : (flag2 & (1 << 19)) !== 0
      ? 2
      : (flag2 & (1 << 20)) !== 0
        ? 3
        : 0;
}

function decodeUserStatus(userFlag: string): UserStatus {
  const { primary: flag1, secondary: flag2 } = userFlags(userFlag);
  const tier = followerTier(flag2);
  return {
    flag1,
    flag2,
    isAdmin: (flag1 & 1) !== 0,
    isBJ: (flag1 & 4) !== 0,
    isManager: (flag1 & 256) !== 0,
    isFixedManager: (flag1 & 64) !== 0,
    isTopFan: (flag1 & 32768) !== 0,
    isFan: (flag1 & 32) !== 0,
    isSupporter: (flag1 & (1 << 20)) !== 0,
    isWhisperAllowed: (flag1 & (1 << 17)) === 0,
    isFollower: tier !== 0,
    followerTier: tier,
    isGuest: (flag1 & 16) !== 0,
    hasAppliedQuickview: (flag1 & (1 << 19)) !== 0,
    isMobile: (flag1 & 16384) !== 0,
    isFemale: (flag1 & 512) !== 0,
    isHideSex: (flag2 & (1 << 25)) !== 0,
    isAtagAllow: (flag2 & 32) !== 0,
    isEmployee: (flag2 & 1024) !== 0,
    isEmployeeAdminChat: (flag2 & 8192) !== 0,
    isCleanAti: (flag2 & 2048) !== 0,
  };
}

function subscriptionTier(tier: number): "basic" | "plus" | "unknown" {
  return tier === 1 ? "basic" : tier === 2 ? "plus" : "unknown";
}

type SubscriptionProductRow = readonly [
  itemType: number,
  vodItemType: number | null,
  tier: 1 | 2,
  level: 1 | 2 | 3 | 4 | 5,
  month: 1 | 3 | 6 | 12,
  isAutoPay: boolean,
  isLegacy: boolean,
  isCeremony: boolean,
  isGift: boolean,
  isTrial: boolean,
];

const SUBSCRIPTION_PRODUCTS = [
  [101, 9101, 1, 1, 1, false, false, false, true, false],
  [103, 9103, 1, 1, 3, false, false, false, true, false],
  [106, 9106, 1, 1, 6, false, false, false, true, false],
  [11, null, 1, 1, 1, false, false, true, true, false],
  [12, null, 1, 1, 1, false, false, true, true, true],
  [111, 9111, 1, 1, 1, false, false, false, false, false],
  [100, 9100, 1, 1, 1, true, false, false, true, false],
  [210, 9210, 2, 1, 1, false, false, false, true, false],
  [213, 9213, 2, 1, 3, false, false, false, true, false],
  [216, 9216, 2, 1, 6, false, false, false, true, false],
  [20, null, 2, 1, 1, false, false, true, true, false],
  [30, null, 2, 1, 1, false, false, true, true, true],
  [1111, 91111, 2, 1, 1, false, false, false, false, false],
  [2013, 92013, 2, 1, 1, false, false, false, false, false],
  [310, 9310, 2, 1, 1, true, false, false, true, false],
  [201, 9201, 2, 2, 1, false, false, false, true, false],
  [203, 9203, 2, 2, 3, false, false, false, true, false],
  [206, 9206, 2, 2, 6, false, false, false, true, false],
  [21, null, 2, 2, 1, false, false, true, true, false],
  [31, null, 2, 2, 1, false, false, true, true, true],
  [211, 9211, 2, 2, 1, false, false, false, false, false],
  [200, 9200, 2, 2, 1, true, false, false, true, false],
  [231, 9231, 2, 3, 1, false, false, false, true, false],
  [233, 9233, 2, 3, 3, false, false, false, true, false],
  [236, 9236, 2, 3, 6, false, false, false, true, false],
  [23, null, 2, 3, 1, false, false, true, true, false],
  [32, null, 2, 3, 1, false, false, true, true, true],
  [311, 9311, 2, 3, 1, false, false, false, false, false],
  [2313, 92313, 2, 3, 1, false, false, false, false, false],
  [320, 9320, 2, 3, 1, true, false, false, true, false],
  [241, 9241, 2, 4, 1, false, false, false, true, false],
  [243, 9243, 2, 4, 3, false, false, false, true, false],
  [246, 9246, 2, 4, 6, false, false, false, true, false],
  [24, null, 2, 4, 1, false, false, true, true, false],
  [33, null, 2, 4, 1, false, false, true, true, true],
  [411, 9411, 2, 4, 1, false, false, false, false, false],
  [2413, 92413, 2, 4, 1, false, false, false, false, false],
  [500, 9500, 2, 4, 1, true, false, false, true, false],
  [251, 9251, 2, 5, 1, false, false, false, true, false],
  [253, 9253, 2, 5, 3, false, false, false, true, false],
  [256, 9256, 2, 5, 6, false, false, false, true, false],
  [25, null, 2, 5, 1, false, false, true, true, false],
  [34, null, 2, 5, 1, false, false, true, true, true],
  [511, 9511, 2, 5, 1, false, false, false, false, false],
  [2513, 92513, 2, 5, 1, false, false, false, false, false],
  [600, 9600, 2, 5, 1, true, false, false, true, false],
  [-1, 0, 1, 1, 1, true, true, false, true, false],
  [13, 16, 1, 1, 1, false, true, false, true, false],
  [1, 4, 1, 1, 3, false, true, false, true, false],
  [2, 5, 1, 1, 6, false, true, false, true, false],
  [3, 6, 1, 1, 12, false, true, false, true, false],
  [7, 10, 1, 1, 1, false, true, false, false, false],
  [8, 11, 1, 1, 3, false, true, false, false, false],
  [9, 12, 1, 1, 6, false, true, false, false, false],
  [1, 10, 1, 1, 1, false, true, true, false, false],
  [2, 11, 1, 1, 3, false, true, true, false, false],
  [3, 12, 1, 1, 6, false, true, true, false, false],
] as const satisfies readonly SubscriptionProductRow[];

function subscriptionProduct(itemType: number, giftOnly = false): SubscriptionProduct | null {
  const product = SUBSCRIPTION_PRODUCTS.find(
    (candidate) =>
      (candidate[0] === itemType || (!giftOnly && candidate[1] === itemType)) &&
      (!giftOnly || candidate[8]),
  );
  if (!product) return null;
  const [type, vodItemType, tier, level, month, isAutoPay, isLegacy, isCeremony, isGift, isTrial] =
    product;
  return {
    itemType: type,
    vodItemType,
    tier,
    subscriptionTier: tier === 1 ? "basic" : "plus",
    level,
    month,
    isAutoPay,
    isLegacy,
    isCeremony,
    isGift,
    isTrial,
  };
}

function jsonString(record: Readonly<Record<string, unknown>>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function jsonNumber(record: Readonly<Record<string, unknown>>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return typeof value === "string" ? integer(value) : 0;
}

function jsonBoolean(record: Readonly<Record<string, unknown>>, key: string): boolean {
  const value = record[key];
  return value === true || value === 1 || value === "1";
}

function bgrColor(value: string | undefined): string {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return "";
  const hex = number.toString(16).padStart(6, "0").toUpperCase();
  return `#${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}`;
}

function login(raw: RawPacket): LoginData {
  const fields = requireFields(raw, 2);
  const userFlag = fields[1] ?? "";
  return { userId: fields[0] ?? "", userFlag, userStatus: decodeUserStatus(userFlag) };
}

function joinChannel(raw: RawPacket): JoinChannelData {
  const fields = requireFields(raw, 7);
  const [position, familyNickname = ""] = (fields[4] ?? "").split("]");
  const userFlag = fields[6] ?? "";
  return {
    chatNo: fields[0] ?? "",
    streamerId: fields[1] ?? "",
    maxManagerCount: integer(fields[3]),
    familyNickname,
    familyNicknamePosition: integer(position),
    userFlag,
    userStatus: decodeUserStatus(userFlag),
  };
}

function quitChannel(raw: RawPacket): QuitChannelData {
  const fields = requireFields(raw, 7);
  const kickType = integer(fields[2]);
  return {
    kickType,
    actor:
      kickType === 1
        ? "streamer"
        : kickType === 2
          ? "manager"
          : kickType >= 3 && kickType <= 5
            ? "admin"
            : "unknown",
    adminKickCount: integer(fields[3]),
    adminNickname: fields[4] ?? "",
    bannedRoomStreamerId: fields[5] ?? "",
    bannedRoomStreamerNickname: fields[6] ?? "",
  };
}

function chatMessage(raw: RawPacket): ChatMessageData {
  const fields = requireFields(raw, 8);
  const senderFlag = fields[6] ?? "";
  return {
    message: (fields[0] ?? "").replace(/\r/g, ""),
    senderId: fields[1] ?? "",
    color: bgrColor(fields[2]),
    messageType: integer(fields[3]),
    chatLanguage: integer(fields[4]),
    senderNickname: fields[5] ?? "",
    senderFlag,
    senderStatus: decodeUserStatus(senderFlag),
    subscriptionMonth: fields[7] ?? "",
    nicknameColor: fields[8] ?? "",
    nicknameColorDark: fields[9] ?? "",
    accumulatedSubscriptionMonth: fields[10] ?? "",
    representativePersonalconMonth: fields[11] ?? "",
    cheerTeamNumber: fields[13] === undefined ? -1 : integer(fields[13]),
  };
}

function chatUser(raw: RawPacket): ChatUserData {
  const fields = requireFields(raw, 4);
  if (integer(fields[0]) === 1) {
    const users = [];
    for (let index = 1; index + 2 < fields.length && fields[index] !== ""; index += 3) {
      const userFlag = fields[index + 2] ?? "";
      users.push({
        userId: fields[index] ?? "",
        nickname: fields[index + 1] ?? "",
        userFlag,
        userStatus: decodeUserStatus(userFlag),
      });
    }
    return { action: "join", users };
  }

  requireFields(raw, 6);
  const userFlag = fields[5] ?? "";
  return {
    action: "leave",
    userId: fields[1] ?? "",
    nickname: fields[2] ?? "",
    quitFlag: integer(fields[3]),
    etcInfo: fields[4] ?? "",
    userFlag,
    userStatus: decodeUserStatus(userFlag),
    isKicked: integer(fields[3]) !== 1,
  };
}

function broadcasterStatus(raw: RawPacket): BroadcasterStatusData {
  const fields = requireFields(raw, 1);
  return { status: integer(fields[0]) };
}

function directChat(raw: RawPacket): DirectChatData {
  const fields = requireFields(raw, 8);
  const messageType = integer(fields[3]);
  const userFlag = fields[7] ?? "";
  return {
    message: (fields[0] ?? "").replace(/\r/g, ""),
    senderId: fields[1] ?? "",
    receiverId: fields[2] ?? "",
    messageType,
    chatLanguage: integer(fields[4]),
    senderNickname: fields[5] ?? "",
    receiverNickname: fields[6] ?? "",
    userFlag,
    senderStatus: decodeUserStatus(userFlag),
    isAdmin: messageType === 3 || messageType === 4 || messageType === 6,
  };
}

function setDumb(raw: RawPacket): SetDumbData {
  const fields = requireFields(raw, 8);
  const commanderType = integer(fields[5]);
  return {
    targetId: fields[0] ?? "",
    targetNickname: fields[7] ?? "",
    durationSeconds: integer(fields[2]),
    muteCount: integer(fields[3]),
    commanderId: fields[4] ?? "",
    commanderType,
    commanderRole: commanderType === 1 ? "streamer" : commanderType === 2 ? "manager" : "unknown",
    commanderLabel: fields[6] ?? "",
  };
}

function setUserFlag(raw: RawPacket): SetUserFlagData {
  const fields = requireFields(raw, 6);
  const userFlag = fields[0] ?? "";
  const previousUserFlag = fields[5] ?? "";
  const userStatus = decodeUserStatus(userFlag);
  const previousUserStatus = decodeUserStatus(previousUserFlag);
  return {
    userId: fields[1] ?? "",
    nickname: fields[2] ?? "",
    userFlag,
    previousUserFlag,
    userStatus,
    previousUserStatus,
  };
}

function nicknameChange(raw: RawPacket): NicknameChangeData {
  const fields = requireFields(raw, 5);
  const userFlag = fields[3] ?? "";
  return {
    userId: fields[0] ?? "",
    newNickname: fields[1] ?? "",
    oldNickname: fields[4] ?? "",
    changeType: integer(fields[2]),
    userFlag,
    userStatus: decodeUserStatus(userFlag),
  };
}

function balloon(raw: RawPacket, relay = false): BalloonData {
  const fields = requireFields(raw, relay ? 11 : 10);
  const fanOrder = integer(fields[relay ? 6 : 4]);
  const topFanLevel = integer(fields[relay ? 10 : 9]);
  return {
    streamerId: fields[relay ? 1 : 0] ?? "",
    senderId: fields[relay ? 3 : 1] ?? "",
    senderNickname: fields[relay ? 4 : 2] ?? "",
    count: integer(fields[relay ? 5 : 3]),
    fanOrder,
    becameFanClub: fanOrder > 0,
    fileName: fields[relay ? 8 : 7] ?? "",
    isDefault: fields[relay ? 9 : 8] === "1",
    topFanLevel,
    becameTopFan: topFanLevel === 1,
    ttsData: fields[relay ? 11 : 10] ?? "",
    senderLanguage: fields[relay ? 13 : 12] ?? "",
    urlModify: fields[relay ? 14 : 13] ?? "",
    relay,
  };
}

function fanLetter(raw: RawPacket, relay = false): FanLetterData {
  const fields = requireFields(raw, relay ? 10 : 9);
  return {
    streamerId: fields[relay ? 1 : 0] ?? "",
    streamerNickname: fields[relay ? 2 : 1] ?? "",
    senderId: fields[relay ? 3 : 2] ?? "",
    senderNickname: fields[relay ? 4 : 3] ?? "",
    itemType: integer(fields[relay ? 6 : 5]),
    count: integer(fields[relay ? 8 : 7]),
    supporterOrder: integer(fields[relay ? 9 : 8]),
    senderLanguage: fields[11] ?? "",
    relay,
  };
}

function slowMode(raw: RawPacket): SlowModeData {
  const fields = requireFields(raw, 2);
  return { automaticSeconds: integer(fields[0]), manualSeconds: integer(fields[1]) };
}

function chocolate(raw: RawPacket, relay = false): ChocolateData {
  const fields = requireFields(raw, 5);
  return {
    streamerId: fields[1] ?? "",
    senderId: fields[2] ?? "",
    senderNickname: fields[3] ?? "",
    count: integer(fields[4]),
    relay,
  };
}

function itemUsing(raw: RawPacket): ItemUsingData {
  const fields = requireFields(raw, 4);
  const remainingSeconds = integer(fields[3]);
  return { remainingSeconds, remainingMinutes: Math.round(remainingSeconds / 60) };
}

function followItem(raw: RawPacket): FollowItemData {
  const fields = requireFields(raw, 8);
  const itemType = integer(fields[4]);
  const tier = integer(fields[7]);
  const product = subscriptionProduct(itemType);
  return {
    chatNo: integer(fields[0]),
    receiverId: fields[1] ?? "",
    senderId: fields[2] ?? "",
    senderNickname: fields[3] ?? "",
    itemType,
    tier,
    subscriptionTier: subscriptionTier(tier),
    subscriptionMonth: product?.month ?? null,
    subscriptionProduct: product,
    subscriptionSource: product ? (itemType === product.vodItemType ? "vod" : "live") : "unknown",
    senderLanguage: fields[9] ?? "",
    urlModify: fields[10] ?? "",
  };
}

function setSubBj(raw: RawPacket): SetSubBjData {
  const fields = requireFields(raw, 4);
  const userFlag = fields[1] ?? "";
  const userStatus = decodeUserStatus(userFlag);
  const hide = integer(fields[2]);
  return {
    userId: fields[0] ?? "",
    userFlag,
    nickname: fields[3] ?? "",
    hide,
    hidden: hide !== 0,
    userStatus,
  };
}

function iceModeEx(raw: RawPacket): IceModeExData {
  const fields = requireFields(raw, 5);
  const allowedRoleMask = integer(fields[2]);
  return {
    frozen: integer(fields[0]) !== 0,
    allowedRoleMask,
    allowedRoles: ICE_MODE_ROLES.filter(([, bit]) => (allowedRoleMask & bit) !== 0).map(
      ([role]) => role,
    ),
    balloonLimitCount: integer(fields[3]),
    subscriptionLimitCount: integer(fields[4]),
  };
}

function managerChat(raw: RawPacket): ManagerChatData {
  const fields = requireFields(raw, 7);
  const userFlag = fields[5] ?? "";
  return {
    message: (fields[0] ?? "").replace(/\r/g, ""),
    senderId: fields[1] ?? "",
    isAdmin: integer(fields[2]) === 1,
    nickname: fields[4] ?? "",
    userFlag,
    senderStatus: decodeUserStatus(userFlag),
    subscriptionMonth: fields[6] ?? "",
  };
}

function quickViewGift(raw: RawPacket): QuickViewGiftData {
  const fields = requireFields(raw, 6);
  const itemType = integer(fields[5]);
  const product = QUICK_VIEW_PRODUCTS[itemType];
  return {
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    receiverId: fields[3] ?? "",
    receiverNickname: fields[4] ?? "",
    itemType,
    quickViewProduct: product?.[0] ?? "unknown",
    durationDays: product?.[1] ?? null,
  };
}

function pollNotification(raw: RawPacket): PollNotificationData {
  const fields = requireFields(raw, 4);
  const status = integer(fields[0]);
  const show = integer(fields[3]);
  return {
    status,
    pollState:
      status === 1 && show === 1
        ? "started"
        : status === 4 && show === 1
          ? "closed"
          : status === 2 && show === 0
            ? "hidden"
            : "unknown",
    streamerId: fields[1] ?? "",
    pollNo: integer(fields[2]),
    show,
    visible: show !== 0,
  };
}

function banWord(raw: RawPacket): BanWordData {
  const fields = requireFields(raw, 2);
  const banWordList = fields[1] ?? "";
  return {
    replacement: fields[0] ?? "",
    banWordList: banWordList ? banWordList.split("\x06") : [],
  };
}

function adminNotice(raw: RawPacket): AdminNoticeData {
  const fields = requireFields(raw, 1);
  return { message: fields[0] ?? "" };
}

function vodBalloon(raw: RawPacket): VodBalloonData {
  const fields = requireFields(raw, 9);
  return {
    streamerId: fields[0] ?? "",
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    balloonCount: integer(fields[3]),
    fileName: fields[4] ?? "",
    isDefault: integer(fields[5]) !== 0,
    chatNo: fields[6] ?? "",
    senderLanguage: fields[7] ?? "",
    urlModify: fields[8] ?? "",
  };
}

function adconEffect(raw: RawPacket): AdconEffectData {
  const fields = requireFields(raw, 18);
  const fanOrder = integer(fields[10]);
  return {
    chatNo: integer(fields[0]),
    streamerId: fields[1] ?? "",
    senderId: fields[2] ?? "",
    senderNickname: fields[3] ?? "",
    message: fields[4] ?? "",
    secondaryMessage: fields[5] ?? "",
    title: fields[6] ?? "",
    imageUrl: fields[7] ?? "",
    defaultImageUrl: fields[8] ?? "",
    count: integer(fields[9]),
    fanOrder,
    becameFanClub: fanOrder > 0,
    isTopFan: integer(fields[11]) !== 0,
    isFanChief: integer(fields[12]) !== 0,
    isSubRoom: integer(fields[13]) !== 0,
    senderLanguage: fields[16] ?? "",
    urlModify: fields[17] ?? "",
  };
}

function stationAdcon(raw: RawPacket): StationAdconData {
  const fields = requireFields(raw, 9);
  return {
    streamerId: fields[0] ?? "",
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    count: integer(fields[3]),
    imageUrl: fields[4] ?? "",
    title: fields[5] ?? "",
    chatNo: fields[6] ?? "",
    senderLanguage: fields[7] ?? "",
    urlModify: fields[8] ?? "",
  };
}

function goodsPurchase(raw: RawPacket, relay = false): GoodsPurchaseData {
  const fields = requireFields(raw, 8);
  return {
    goodsType: integer(fields[1]),
    streamerId: fields[2] ?? "",
    buyerId: fields[4] ?? "",
    buyerNickname: fields[5] ?? "",
    goodsName: fields[6] ?? "",
    count: integer(fields[7]),
    relay,
  };
}

function vrNotification(raw: RawPacket): VrNotificationData {
  const fields = requireFields(raw, 6);
  return {
    action: integer(fields[0]),
    streamerId: fields[1] ?? "",
    vrId: fields[2] ?? "",
    rtmpUrl: fields[3] ?? "",
    hlsUrl: fields[4] ?? "",
    vrType: integer(fields[5]),
  };
}

function mobileBroadcastPause(raw: RawPacket): MobileBroadcastPauseData {
  const fields = requireFields(raw, 1);
  const state = integer(fields[0]);
  return { state, action: state === 0 ? "pause" : state === 1 ? "resume" : "unknown" };
}

function kickAndCancel(raw: RawPacket): KickAndCancelData {
  const fields = requireFields(raw, 3);
  const state = integer(fields[0]);
  return {
    state,
    cancelled: state === 1,
    userId: fields[1] ?? "",
    nickname: fields[2] ?? "",
  };
}

function kickUserList(raw: RawPacket): KickUserListData {
  const fields = requireFields(raw, 6);
  const users = [];
  for (let index = 0; index + 5 < fields.length && fields[index] !== ""; index += 6) {
    const commanderFlag = fields[index + 5] ?? "";
    const commanderStatus = decodeUserStatus(commanderFlag);
    users.push({
      userId: fields[index] ?? "",
      nickname: fields[index + 1] ?? "",
      time: fields[index + 2] ?? "",
      commanderId: fields[index + 3] ?? "",
      commanderNickname: fields[index + 4] ?? "",
      commanderFlag,
      commanderStatus,
    });
  }
  return { users };
}

function adminChatUser(raw: RawPacket): AdminChatUserData {
  const fields = requireFields(raw, 1);
  const state = integer(fields[0]);
  const users = [];
  if (state === 1) {
    for (let index = 1; index + 2 < fields.length && fields[index] !== ""; index += 3) {
      const userFlag = fields[index + 2] ?? "";
      const userStatus = decodeUserStatus(userFlag);
      users.push({
        userId: fields[index] ?? "",
        nickname: fields[index + 1] ?? "",
        userFlag,
        userStatus,
      });
    }
  }
  return { state, users };
}

function itemSellEffect(raw: RawPacket): ItemSellEffectData {
  const fields = requireFields(raw, 10);
  return {
    chatNo: integer(fields[0]),
    streamerId: fields[1] ?? "",
    senderId: fields[2] ?? "",
    senderNickname: fields[3] ?? "",
    message: fields[4] ?? "",
    secondaryMessage: fields[5] ?? "",
    title: fields[6] ?? "",
    imageUrl: fields[7] ?? "",
    defaultImageUrl: fields[8] ?? "",
    count: integer(fields[9]),
  };
}

function vodAdcon(raw: RawPacket): VodAdconData {
  const fields = requireFields(raw, 9);
  return {
    streamerId: fields[0] ?? "",
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    count: integer(fields[3]),
    imageUrl: fields[4] ?? "",
    title: fields[5] ?? "",
    chatNo: fields[6] ?? "",
    senderLanguage: fields[7] ?? "",
    urlModify: fields[8] ?? "",
  };
}

function itemDrops(raw: RawPacket): ItemDropsData {
  const fields = requireFields(raw, 5);
  return {
    streamerId: fields[1] ?? "",
    name: fields[2] ?? "",
    message: fields[3] ?? "",
    imageUrl: fields[4] ?? "",
  };
}

function adminFlag(raw: RawPacket): AdminFlagData {
  const fields = requireFields(raw, 1);
  const userFlag = fields[0] ?? "";
  return { userFlag, userStatus: decodeUserStatus(userFlag) };
}

function followItemEffect(raw: RawPacket): FollowItemEffectData {
  const fields = requireFields(raw, 8);
  const itemType = integer(fields[5]);
  const tier = integer(fields[7]);
  return {
    streamerId: fields[0] ?? "",
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    month: integer(fields[3]),
    chatNo: integer(fields[4]),
    itemType,
    accumulatedMonth: integer(fields[6]),
    tier,
    subscriptionTier: subscriptionTier(tier),
    subscriptionProduct: subscriptionProduct(itemType),
    senderLanguage: fields[9] ?? "",
    urlModify: fields[10] ?? "",
  };
}

function kickMessageState(raw: RawPacket): KickMessageStateData {
  const fields = requireFields(raw, 2);
  return {
    chatNo: integer(fields[0]),
    hideKickMessage: integer(fields[1]) !== 0,
  };
}

function translation(raw: RawPacket): TranslationData {
  const fields = requireFields(raw, 5);
  return {
    messageIndex: integer(fields[0]),
    mode: integer(fields[1]),
    message: fields[2] ?? "",
    originalLanguage: integer(fields[3]),
    translatedLanguage: integer(fields[4]),
  };
}

function giftTicket(raw: RawPacket): GiftTicketData {
  const fields = requireFields(raw, 6);
  return {
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    receiverId: fields[3] ?? "",
    receiverNickname: fields[4] ?? "",
    ticketData: fields[5] ?? "",
  };
}

function giftSubscription(raw: RawPacket): GiftSubscriptionData {
  const fields = requireFields(raw, 14);
  const itemType = integer(fields[7]);
  const product = subscriptionProduct(itemType, true);
  return {
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    receiverId: fields[3] ?? "",
    receiverNickname: fields[4] ?? "",
    streamerId: fields[5] ?? "",
    streamerNickname: fields[6] ?? "",
    itemType,
    subscriptionTier: product?.subscriptionTier ?? "unknown",
    subscriptionMonth: product?.month ?? null,
    subscriptionProduct: product,
    itemCode: fields[8] ?? "",
    isSubscription: integer(fields[9]),
    subscriptionType: fields[10] ?? "",
    subscriptionPeriod: fields[11] ?? "",
    subscriptionRemain: integer(fields[12]),
    subscriptionPayCount: integer(fields[13]),
  };
}

function videoBalloon(raw: RawPacket): VideoBalloonData {
  const fields = requireFields(raw, 14);
  const fanOrder = integer(fields[5]);
  return {
    chatNo: fields[0] ?? "",
    streamerId: fields[1] ?? "",
    senderId: fields[2] ?? "",
    senderNickname: fields[3] ?? "",
    balloonCount: integer(fields[4]),
    fanOrder,
    becameFanClub: fanOrder > 0,
    topFanLevel: integer(fields[7]),
    relay: fields[8] ?? "",
    fileName: fields[12] ?? "",
    isDefault: fields[13] === "1",
    extraData: fields[14] ?? "",
  };
}

function ogqEmoticon(raw: RawPacket): OgqEmoticonData {
  const fields = requireFields(raw, 12);
  const senderFlag = fields[7] ?? "";
  return {
    chatNo: fields[0] ?? "",
    message: fields[1] ?? "",
    groupId: fields[2] ?? "",
    subId: fields[3] ?? "",
    version: fields[4] ?? "",
    senderId: fields[5] ?? "",
    senderNickname: fields[6] ?? "",
    senderFlag,
    senderStatus: decodeUserStatus(senderFlag),
    color: bgrColor(fields[8]),
    chatLanguage: integer(fields[9]),
    emoticonType: integer(fields[10]),
    extension: fields[11] ?? "",
    subscriptionMonth: fields[12] ?? "",
    nicknameColor: fields[13] ?? "",
    nicknameColorDark: fields[14] ?? "",
    accumulatedSubscriptionMonth: fields[15] ?? "",
    representativePersonalconMonth: fields[16] ?? "",
    animation: fields[17] ?? "",
    cheerTeamNumber: fields[18] === undefined ? -1 : integer(fields[18]),
  };
}

function ogqEmoticonGift(raw: RawPacket): OgqEmoticonGiftData {
  const fields = requireFields(raw, 7);
  return {
    senderId: fields[1] ?? "",
    senderNickname: fields[2] ?? "",
    receiverId: fields[3] ?? "",
    receiverNickname: fields[4] ?? "",
    title: fields[5] ?? "",
    imageUrl: fields[6] ?? "",
  };
}

function gemItemSend(raw: RawPacket): GemItemSendData {
  const fields = requireFields(raw, 4);
  return {
    receiverId: fields[1] ?? "",
    receiverNickname: fields[2] ?? "",
    itemName: fields[3] ?? "",
  };
}

function queryNumber(params: URLSearchParams, key: string): number | null {
  const value = params.get(key);
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function chatUserExtend(raw: RawPacket): ChatUserExtendData {
  const fields = requireFields(raw, 2);
  const users = [];
  for (let index = 0; index + 1 < fields.length && fields[index] !== ""; index += 2) {
    const params = new URLSearchParams(fields[index + 1] ?? "");
    users.push({
      userId: fields[index] ?? "",
      representativePersonalconMonth: queryNumber(params, "p"),
      subscriptionMonth: queryNumber(params, "fw"),
      accumulatedSubscriptionMonth: queryNumber(params, "afw"),
    });
  }
  return { users };
}

function bjNotice(raw: RawPacket): BjNoticeData {
  const fields = requireFields(raw, 4);
  return { show: integer(fields[1]), message: fields[3] ?? "" };
}

function jsonObject(raw: RawPacket): Readonly<Record<string, unknown>> {
  const fields = requireFields(raw, 1);
  let payload: unknown;
  try {
    payload = JSON.parse(fields[0] ?? "");
  } catch (cause) {
    throw new ProtocolError(`Opcode ${raw.opcode} contains invalid JSON.`, undefined, { cause });
  }
  if (payload === null || Array.isArray(payload) || typeof payload !== "object") {
    throw new ProtocolError(`Opcode ${raw.opcode} payload must be a JSON object.`);
  }
  return payload as Record<string, unknown>;
}

function mission(raw: RawPacket): MissionData {
  const record = jsonObject(raw);
  const type = jsonString(record, "type").toUpperCase();

  if (type === "CHALLENGE_GIFT") {
    return {
      missionKind: "challenge",
      action: "gift",
      missionKey: jsonNumber(record, "key"),
      uuid: jsonString(record, "uuid"),
      title: jsonString(record, "title"),
      giftCount: jsonNumber(record, "gift_count"),
      chatNo: jsonNumber(record, "chno"),
      isRelay: jsonBoolean(record, "is_relay"),
      image: jsonString(record, "image"),
      senderId: jsonString(record, "user_id"),
      senderNickname: jsonString(record, "user_nick"),
      streamerId: jsonString(record, "bj_id"),
      streamerNickname: jsonString(record, "bj_nick"),
      payload: record,
    };
  }
  if (type === "CHALLENGE_NOTICE") {
    const status = jsonString(record, "mission_status").toUpperCase();
    return {
      missionKind: "challenge",
      action: "notice",
      missionKey: jsonNumber(record, "key"),
      uuid: jsonString(record, "uuid"),
      title: jsonString(record, "title"),
      status: status === "SUCCESS" ? "success" : status === "FAIL" ? "fail" : "unknown",
      payload: record,
    };
  }
  if (type === "CHALLENGE_SETTLE") {
    return {
      missionKind: "challenge",
      action: "settle",
      missionKey: jsonNumber(record, "key"),
      uuid: jsonString(record, "uuid"),
      title: jsonString(record, "title"),
      settleCount: jsonNumber(record, "settle_count"),
      isRelay: jsonBoolean(record, "is_relay"),
      image: jsonString(record, "image"),
      streamerId: jsonString(record, "bj_id"),
      streamerNickname: jsonString(record, "bj_nick"),
      payload: record,
    };
  }

  if (type === "GIFT") {
    return {
      missionKind: "battle",
      action: "gift",
      title: jsonString(record, "title"),
      giftCount: jsonNumber(record, "gift_count"),
      isRelay: jsonBoolean(record, "is_relay"),
      image: jsonString(record, "image"),
      senderId: jsonString(record, "user_id"),
      senderNickname: jsonString(record, "user_nick"),
      fanOrder: jsonNumber(record, "fan_order"),
      topFanLevel: jsonNumber(record, "top_fan"),
      payload: record,
    };
  }
  if (type === "NOTICE") {
    return {
      missionKind: "battle",
      action: "notice",
      draw: jsonBoolean(record, "draw"),
      winner: jsonString(record, "winner"),
      rank: jsonNumber(record, "rank"),
      myTeamName: jsonString(record, "my_team_name"),
      payload: record,
    };
  }
  if (type === "SETTLE") {
    return {
      missionKind: "battle",
      action: "settle",
      title: jsonString(record, "title"),
      settleCount: jsonNumber(record, "settle_count"),
      image: jsonString(record, "image"),
      payload: record,
    };
  }

  return { missionKind: "unknown", action: "unknown", payload: record };
}

function missionSettlementParticipant(
  value: unknown,
  index: number,
): ChallengeMissionSettlementParticipant {
  if (!Array.isArray(value) || value.length < 5) {
    throw new ProtocolError(`Opcode 0125 participant ${index} must contain five fields.`);
  }

  return {
    userId: typeof value[0] === "string" ? value[0] : "",
    nickname: typeof value[1] === "string" ? value[1] : "",
    contributionCount:
      typeof value[2] === "number" && Number.isFinite(value[2])
        ? value[2]
        : typeof value[2] === "string"
          ? integer(value[2])
          : 0,
    becameFanClub: value[3] === 1 || value[3] === "1",
    becameTopFan: value[4] === 1 || value[4] === "1",
  };
}

function challengeMissionSettlement(raw: RawPacket): ChallengeMissionSettlementData {
  const record = jsonObject(raw);
  if (!Array.isArray(record.list)) {
    throw new ProtocolError("Opcode 0125 payload list must be an array.");
  }

  return {
    missionKind: "challenge",
    chatNo: jsonNumber(record, "chno"),
    uuid: jsonString(record, "uuid"),
    fanOrder: jsonNumber(record, "fanOrder"),
    participants: record.list.map(missionSettlementParticipant),
    payload: record,
  };
}

function jsonData(raw: RawPacket): JsonObjectData {
  return { payload: jsonObject(raw) };
}

function subscriptionCeremonyButton(raw: RawPacket): SubscriptionCeremonyButtonData {
  const fields = requireFields(raw, 5);
  return { subscriptionMonth: fields[4] ?? "" };
}

function savvyNotice(raw: RawPacket): SavvyNoticeData {
  const fields = requireFields(raw, 4);
  return {
    streamerId: fields[1] ?? "",
    userId: fields[2] ?? "",
    videoNumber: fields[3] ?? "",
  };
}

function globalSubtitle(raw: RawPacket): GlobalSubtitleData {
  const fields = requireFields(raw, 5);
  return {
    chatNo: fields[0] ?? "",
    streamerId: fields[1] ?? "",
    language: fields[2] ?? "",
    subtitle: fields[3] ?? "",
    timestamp: fields[4] ?? "",
  };
}

function confetti(raw: RawPacket): ConfettiData {
  const fields = requireFields(raw, 1);
  return { confettiType: integer(fields[0]), senderId: fields[1] ?? "" };
}

function cheerTeamChange(raw: RawPacket): CheerTeamChangeData {
  const fields = requireFields(raw, 2);
  return { userId: fields[0] ?? "", teamNumber: fields[1] ?? "" };
}

function nightbotTimeout(raw: RawPacket): NightbotTimeoutData {
  const fields = requireFields(raw, 7);
  const reasonCode = integer(fields[2]);
  const userFlag = fields[6] ?? "";
  return {
    userId: fields[0] ?? "",
    nickname: fields[1] ?? "",
    reasonCode,
    reason: NIGHTBOT_TIMEOUT_REASONS[reasonCode] ?? "unknown",
    channelNumber: fields[3] ?? "",
    message: fields[4] ?? "",
    time: integer(fields[5]),
    userFlag,
    userStatus: decodeUserStatus(userFlag),
  };
}

function decodedData(raw: RawPacket): object {
  switch (raw.opcode) {
    case "0001":
      return login(raw);
    case "0002":
      return joinChannel(raw);
    case "0003":
      return quitChannel(raw);
    case "0004":
      return chatUser(raw);
    case "0005":
      return chatMessage(raw);
    case "0007":
      return broadcasterStatus(raw);
    case "0008":
      return setDumb(raw);
    case "0009":
      return directChat(raw);
    case "0012":
      return setUserFlag(raw);
    case "0013":
      return setSubBj(raw);
    case "0014":
      return nicknameChange(raw);
    case "0018":
      return balloon(raw);
    case "0020":
      return fanLetter(raw);
    case "0021":
      return iceModeEx(raw);
    case "0023":
      return slowMode(raw);
    case "0026":
      return managerChat(raw);
    case "0033":
      return balloon(raw, true);
    case "0034":
      return fanLetter(raw, true);
    case "0037":
      return chocolate(raw);
    case "0038":
      return chocolate(raw, true);
    case "0045":
      return quickViewGift(raw);
    case "0047":
      return itemUsing(raw);
    case "0050":
      return pollNotification(raw);
    case "0054":
      return banWord(raw);
    case "0058":
      return adminNotice(raw);
    case "0070":
      return goodsPurchase(raw);
    case "0071":
      return goodsPurchase(raw, true);
    case "0074":
      return vrNotification(raw);
    case "0075":
      return mobileBroadcastPause(raw);
    case "0076":
      return kickAndCancel(raw);
    case "0077":
      return kickUserList(raw);
    case "0078":
      return adminChatUser(raw);
    case "0086":
      return vodBalloon(raw);
    case "0087":
      return adconEffect(raw);
    case "0090":
      return kickMessageState(raw);
    case "0091":
      return followItem(raw);
    case "0092":
      return itemSellEffect(raw);
    case "0093":
      return followItemEffect(raw);
    case "0095":
      return translation(raw);
    case "0102":
      return giftTicket(raw);
    case "0103":
      return vodAdcon(raw);
    case "0104":
      return bjNotice(raw);
    case "0105":
      return videoBalloon(raw);
    case "0107":
      return stationAdcon(raw);
    case "0108":
      return giftSubscription(raw);
    case "0109":
      return ogqEmoticon(raw);
    case "0111":
      return itemDrops(raw);
    case "0118":
      return ogqEmoticonGift(raw);
    case "0119":
      return jsonData(raw);
    case "0120":
      return gemItemSend(raw);
    case "0121":
      return mission(raw);
    case "0122":
      return jsonData(raw);
    case "0125":
      return challengeMissionSettlement(raw);
    case "0126":
      return adminFlag(raw);
    case "0127":
      return chatUserExtend(raw);
    case "0130":
      return subscriptionCeremonyButton(raw);
    case "0131":
      return savvyNotice(raw);
    case "0136":
      return globalSubtitle(raw);
    case "0138":
      return confetti(raw);
    case "0139":
      return jsonData(raw);
    case "0140":
      return cheerTeamChange(raw);
    case "0141":
      return nightbotTimeout(raw);
    default:
      return { fields: raw.fields };
  }
}

export function decodePacket(raw: RawPacket, receivedAt = Date.now()): SoopEvent {
  const opcode = raw.opcode as KnownSoopOpcode;
  const definition = EVENT_CATALOG[opcode];
  if (!definition) {
    return {
      type: "unknown",
      opcode: raw.opcode,
      receivedAt,
      raw,
      data: { fields: raw.fields },
    } satisfies UnknownSoopEvent;
  }

  return {
    type: definition.type,
    opcode,
    receivedAt,
    raw,
    data: decodedData(raw),
  } as KnownSoopEvent;
}
