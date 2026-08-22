export type EventProvenance = "observed" | "player" | "reference";

interface EventDefinition {
  type: string;
  description: string;
  provenance: EventProvenance;
}

export const EVENT_CATALOG = {
  "0000": { type: "keepAlive", description: "Keep Alive", provenance: "observed" },
  "0001": { type: "login", description: "Login Handshake", provenance: "observed" },
  "0002": { type: "joinChannel", description: "Channel Join Handshake", provenance: "observed" },
  "0003": { type: "quitChannel", description: "Channel Leave", provenance: "player" },
  "0004": { type: "chatUser", description: "Chat User Join/Leave", provenance: "observed" },
  "0005": { type: "chatMessage", description: "Chat Message", provenance: "observed" },
  "0006": { type: "setChannelName", description: "Set Channel Name", provenance: "reference" },
  "0007": { type: "setBjStat", description: "Set Broadcaster Status", provenance: "observed" },
  "0008": { type: "setDumb", description: "Chat Mute", provenance: "observed" },
  "0009": { type: "directChat", description: "Direct Chat", provenance: "player" },
  "0010": { type: "notice", description: "Notice", provenance: "reference" },
  "0011": { type: "kick", description: "Kick", provenance: "reference" },
  "0012": { type: "setUserFlag", description: "Set User Flag", provenance: "observed" },
  "0013": { type: "setSubBj", description: "Set Sub BJ", provenance: "player" },
  "0014": { type: "setNickname", description: "Set Nickname", provenance: "observed" },
  "0015": { type: "serverStat", description: "Server Status", provenance: "reference" },
  "0016": { type: "unused16", description: "Unused", provenance: "reference" },
  "0017": { type: "clubColor", description: "Club Color", provenance: "reference" },
  "0018": { type: "sendBalloon", description: "Send Star Balloon", provenance: "observed" },
  "0019": { type: "iceMode", description: "Ice Mode", provenance: "observed" },
  "0020": { type: "sendFanLetter", description: "Send Fan Letter", provenance: "player" },
  "0021": { type: "iceModeEx", description: "Extended Ice Mode", provenance: "observed" },
  "0022": { type: "getIceModeRelay", description: "Get Ice Mode Relay", provenance: "reference" },
  "0023": { type: "slowMode", description: "Slow Mode", provenance: "player" },
  "0024": { type: "reloadBurnLevel", description: "Reload Burn Level", provenance: "reference" },
  "0025": { type: "blindKick", description: "Blind Kick", provenance: "reference" },
  "0026": { type: "managerChat", description: "Manager Chat", provenance: "player" },
  "0027": { type: "appendData", description: "Append Data", provenance: "reference" },
  "0028": { type: "baseballEvent", description: "Baseball Event", provenance: "reference" },
  "0029": { type: "paidItem", description: "Paid Item", provenance: "reference" },
  "0030": { type: "topFan", description: "Top Fan", provenance: "reference" },
  "0031": { type: "snsMessage", description: "SNS Message", provenance: "reference" },
  "0032": { type: "snsMode", description: "SNS Mode", provenance: "reference" },
  "0033": { type: "sendBalloonSub", description: "Send Star Balloon (Sub)", provenance: "player" },
  "0034": { type: "sendFanLetterSub", description: "Send Fan Letter (Sub)", provenance: "player" },
  "0035": { type: "topFanSub", description: "Top Fan (Sub)", provenance: "reference" },
  "0036": { type: "bjStickerItem", description: "BJ Sticker Item", provenance: "reference" },
  "0037": { type: "chocolate", description: "Chocolate", provenance: "player" },
  "0038": { type: "chocolateSub", description: "Chocolate (Sub)", provenance: "player" },
  "0039": { type: "topClan", description: "Top Clan", provenance: "reference" },
  "0040": { type: "topClanSub", description: "Top Clan (Sub)", provenance: "reference" },
  "0041": { type: "superChat", description: "Super Chat", provenance: "reference" },
  "0042": { type: "updateTicket", description: "Update Ticket", provenance: "reference" },
  "0043": {
    type: "notiGameRanker",
    description: "Game Ranker Notification",
    provenance: "reference",
  },
  "0044": { type: "starCoin", description: "Star Coin", provenance: "reference" },
  "0045": { type: "sendQuickView", description: "Send Quick View Gift", provenance: "observed" },
  "0046": { type: "itemStatus", description: "Item Status", provenance: "reference" },
  "0047": { type: "itemUsing", description: "Item In Use", provenance: "player" },
  "0048": { type: "useQuickView", description: "Use Quick View", provenance: "reference" },
  "0050": { type: "notifyPoll", description: "Poll Notification", provenance: "observed" },
  "0051": { type: "chatBlockMode", description: "Chat Block Mode", provenance: "reference" },
  "0052": { type: "bdmAddBlackInfo", description: "Add Blacklist Info", provenance: "reference" },
  "0053": { type: "setBroadInfo", description: "Set Broadcast Info", provenance: "reference" },
  "0054": { type: "banWord", description: "Ban Word Setting", provenance: "observed" },
  "0058": { type: "sendAdminNotice", description: "Send Admin Notice", provenance: "observed" },
  "0065": { type: "freecatOwnerJoin", description: "Freecat Owner Join", provenance: "player" },
  "0070": { type: "buyGoods", description: "Buy Goods", provenance: "player" },
  "0071": { type: "buyGoodsSub", description: "Buy Goods (Sub)", provenance: "player" },
  "0072": { type: "sendPromotion", description: "Send Promotion", provenance: "reference" },
  "0074": { type: "notifyVr", description: "VR Notification", provenance: "player" },
  "0075": {
    type: "notifyMobBroadPause",
    description: "Mobile Broadcast Pause Notification",
    provenance: "player",
  },
  "0076": { type: "kickAndCancel", description: "Kick and Cancel", provenance: "player" },
  "0077": { type: "kickUserList", description: "Kick User List", provenance: "player" },
  "0078": { type: "adminChatUser", description: "Admin Chat User", provenance: "player" },
  "0079": { type: "cliDobaeInfo", description: "Spam Info", provenance: "reference" },
  "0086": { type: "vodBalloon", description: "VOD Balloon", provenance: "observed" },
  "0087": { type: "adconEffect", description: "Adcon Effect", provenance: "observed" },
  "0088": { type: "closeBroad", description: "Close Broadcast", provenance: "observed" },
  "0090": { type: "kickMsgState", description: "Kick Message State", provenance: "observed" },
  "0091": { type: "followItem", description: "New Subscription", provenance: "observed" },
  "0092": { type: "itemSellEffect", description: "Item Sell Effect", provenance: "player" },
  "0093": {
    type: "followItemEffect",
    description: "Continuous Subscription",
    provenance: "observed",
  },
  "0094": { type: "translationState", description: "Translation State", provenance: "observed" },
  "0095": { type: "translation", description: "Translation", provenance: "player" },
  "0102": { type: "giftTicket", description: "Gift Ticket", provenance: "player" },
  "0103": { type: "vodAdcon", description: "VOD Adcon", provenance: "player" },
  "0104": { type: "bjNotice", description: "BJ Notice", provenance: "observed" },
  "0105": { type: "videoBalloon", description: "Video Donation", provenance: "observed" },
  "0107": { type: "stationAdcon", description: "Station Adcon", provenance: "observed" },
  "0108": { type: "sendSubscription", description: "Gift Subscription", provenance: "observed" },
  "0109": { type: "ogqEmoticon", description: "OGQ Emoticon", provenance: "observed" },
  "0110": { type: "emoticonTicket", description: "Emoticon Ticket", provenance: "observed" },
  "0111": { type: "itemDrops", description: "Item Drops", provenance: "player" },
  "0117": { type: "videoBalloonLink", description: "Video Balloon Link", provenance: "reference" },
  "0118": { type: "ogqEmoticonGift", description: "OGQ Emoticon Gift", provenance: "player" },
  "0119": { type: "adInBroadJson", description: "In-Broadcast Ad JSON", provenance: "player" },
  "0120": { type: "gemItemSend", description: "Gem Item Send", provenance: "player" },
  "0121": { type: "mission", description: "Challenge or Battle Mission", provenance: "observed" },
  "0122": { type: "liveCaption", description: "Live Caption", provenance: "player" },
  "0125": { type: "missionSettle", description: "Mission Settlement", provenance: "observed" },
  "0126": { type: "setAdminFlag", description: "Set Admin Flag", provenance: "player" },
  "0127": { type: "chuserExtend", description: "Subscriber List", provenance: "observed" },
  "0128": {
    type: "adminChuserExtend",
    description: "Admin Chat User Extended",
    provenance: "reference",
  },
  "0130": {
    type: "subscriptionCeremonyButton",
    description: "Subscription Ceremony Button",
    provenance: "player",
  },
  "0131": { type: "savvyNotice", description: "Savvy Notice", provenance: "player" },
  "0136": { type: "globalSubtitle", description: "Global Subtitle", provenance: "player" },
  "0137": { type: "userLanguageSet", description: "User Language Set", provenance: "player" },
  "0138": { type: "confetti", description: "Confetti Effect", provenance: "player" },
  "0139": { type: "subtitleV2", description: "Live Subtitle v2", provenance: "player" },
  "0140": { type: "cheerTeamChange", description: "Cheer Team Change", provenance: "player" },
  "0141": { type: "nightbotTimeout", description: "Nightbot Timeout", provenance: "player" },
} as const satisfies Record<string, EventDefinition>;

export type KnownSoopOpcode = keyof typeof EVENT_CATALOG;
export type KnownSoopEventType = (typeof EVENT_CATALOG)[KnownSoopOpcode]["type"];

export interface RawPacket {
  opcode: string;
  flags: string;
  payload: Uint8Array;
  text: string;
  fields: readonly string[];
}

export interface FieldEventData {
  fields: readonly string[];
}

export interface LoginData {
  userId: string;
  userFlag: string;
}

export interface JoinChannelData {
  chatNo: string;
  broadcasterId: string;
  maxManagerCount: number;
  familyNickname: string;
  familyNicknamePosition: number;
  userFlag: string;
}

export type QuitChannelActor = "streamer" | "manager" | "admin" | "unknown";

export interface QuitChannelData {
  kickType: number;
  actor: QuitChannelActor;
  adminKickCount: number;
  adminNickname: string;
  bannedRoomBroadcasterId: string;
  bannedRoomBroadcasterNickname: string;
}

export interface ChatUserInfo {
  userId: string;
  nickname: string;
  userFlag: string;
}

export type ChatUserData =
  | {
      action: "join";
      users: readonly ChatUserInfo[];
    }
  | {
      action: "leave";
      userId: string;
      nickname: string;
      quitFlag: number;
      etcInfo: string;
      userFlag: string;
      isKicked: boolean;
    };

export interface BroadcasterStatusData {
  status: number;
}

export interface DirectChatData {
  message: string;
  senderId: string;
  receiverId: string;
  messageType: number;
  chatLanguage: number;
  senderNickname: string;
  receiverNickname: string;
  userFlag: string;
  isAdmin: boolean;
}

export interface SetDumbData {
  targetId: string;
  targetNickname: string;
  durationSeconds: number;
  muteCount: number;
  commanderId: string;
  commanderType: number;
  commanderRole: "streamer" | "manager" | "unknown";
  commanderLabel: string;
}

export interface SetUserFlagData {
  userId: string;
  nickname: string;
  userFlag: string;
  previousUserFlag: string;
}

export interface NicknameChangeData {
  userId: string;
  newNickname: string;
  oldNickname: string;
  changeType: number;
  userFlag: string;
}

export type IceModeRole =
  | "streamer"
  | "fanClub"
  | "supporter"
  | "topFan"
  | "subscriber"
  | "manager";

export interface IceModeExData {
  frozen: boolean;
  allowedRoleMask: number;
  allowedRoles: readonly IceModeRole[];
  balloonLimitCount: number;
  subscriptionLimitCount: number;
}

export interface ManagerChatData {
  message: string;
  senderId: string;
  isAdmin: boolean;
  nickname: string;
  userFlag: string;
  subscriptionMonth: string;
}

export type QuickViewProduct = "quickView" | "quickViewPlus" | "unknown";

export interface QuickViewGiftData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  itemType: number;
  quickViewProduct: QuickViewProduct;
  durationDays: number | null;
}

export type PollState = "started" | "closed" | "hidden" | "unknown";

export interface PollNotificationData {
  status: number;
  pollState: PollState;
  broadcasterId: string;
  pollNo: number;
  show: number;
  visible: boolean;
}

export interface BanWordData {
  replacement: string;
  banWordList: string;
}

export interface KickMessageStateData {
  chatNo: number;
  hideKickMessage: boolean;
}

export interface TranslationData {
  messageIndex: number;
  mode: number;
  message: string;
  originalLanguage: number;
  translatedLanguage: number;
}

export interface GiftTicketData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  ticketData: string;
}

export interface OgqEmoticonGiftData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  title: string;
  imageUrl: string;
}

export interface GemItemSendData {
  receiverId: string;
  receiverNickname: string;
  itemName: string;
}

export interface ChatUserExtendInfo {
  userId: string;
  representativePersonalconMonth: number | null;
  subscriptionMonth: number | null;
  accumulatedSubscriptionMonth: number | null;
}

export interface ChatUserExtendData {
  users: readonly ChatUserExtendInfo[];
}

export interface ChatMessageData {
  message: string;
  senderId: string;
  color: string;
  messageType: number;
  chatLanguage: number;
  senderNickname: string;
  senderFlag: string;
  subscriptionMonth: string;
  nicknameColor: string;
  nicknameColorDark: string;
  accumulatedSubscriptionMonth: string;
  representativePersonalconMonth: string;
  cheerTeamNumber: number;
}

export interface BalloonData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  fanOrder: number;
  becameFanClub: boolean;
  fileName: string;
  isDefault: boolean;
  topFanLevel: number;
  ttsData: string;
  senderLanguage: string;
  urlModify: string;
  relay: boolean;
}

export interface FanLetterData {
  broadcasterId: string;
  broadcasterNickname: string;
  senderId: string;
  senderNickname: string;
  itemType: number;
  count: number;
  supporterOrder: string;
  senderLanguage: string;
  relay: boolean;
}

export interface SlowModeData {
  automaticSeconds: number;
  manualSeconds: number;
}

export interface ChocolateData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  relay: boolean;
}

export interface ItemUsingData {
  remainingSeconds: number;
  remainingMinutes: number;
}

export interface FollowItemData {
  chatNo: number;
  receiverId: string;
  senderId: string;
  senderNickname: string;
  itemType: number;
  tier: number;
  subscriptionTier: SubscriptionTier;
  subscriptionMonth: number | null;
  subscriptionProduct: SubscriptionProduct | null;
  subscriptionSource: "live" | "vod" | "unknown";
  senderLanguage: string;
  urlModify: string;
}

export type SubscriptionTier = "basic" | "plus" | "unknown";

export interface SubscriptionProduct {
  itemType: number;
  vodItemType: number | null;
  tier: 1 | 2;
  subscriptionTier: Exclude<SubscriptionTier, "unknown">;
  level: 1 | 2 | 3 | 4 | 5;
  month: 1 | 3 | 6 | 12;
  isAutoPay: boolean;
  isLegacy: boolean;
  isCeremony: boolean;
  isGift: boolean;
  isTrial: boolean;
}

export interface FollowItemEffectData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  month: number;
  chatNo: number;
  itemType: number;
  accumulatedMonth: number;
  tier: number;
  subscriptionTier: SubscriptionTier;
  subscriptionProduct: SubscriptionProduct | null;
  senderLanguage: string;
  urlModify: string;
}

export interface SetSubBjData {
  userId: string;
  userFlag: string;
  nickname: string;
  hide: number;
  hidden: boolean;
  flag1: number;
  flag2: number;
  isAdmin: boolean;
  isManager: boolean;
  isFixedManager: boolean;
  isEmployee: boolean;
  isEmployeeAdminChat: boolean;
  isCleanAti: boolean;
}

export interface AdminNoticeData {
  message: string;
}

export interface VodBalloonData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  balloonCount: number;
  fileName: string;
  isDefault: boolean;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

export interface AdconEffectData {
  chatNo: number;
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  message: string;
  secondaryMessage: string;
  title: string;
  imageUrl: string;
  defaultImageUrl: string;
  count: number;
  fanOrder: number;
  becameFanClub: boolean;
  isTopFan: boolean;
  isFanChief: boolean;
  isSubRoom: boolean;
  senderLanguage: string;
  urlModify: string;
}

export interface StationAdconData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  imageUrl: string;
  title: string;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

export interface GoodsPurchaseData {
  goodsType: number;
  broadcasterId: string;
  buyerId: string;
  buyerNickname: string;
  goodsName: string;
  count: number;
  relay: boolean;
}

export interface VrNotificationData {
  action: number;
  broadcasterId: string;
  vrId: string;
  rtmpUrl: string;
  hlsUrl: string;
  vrType: number;
}

export type MobileBroadcastPauseAction = "pause" | "resume" | "unknown";

export interface MobileBroadcastPauseData {
  state: number;
  action: MobileBroadcastPauseAction;
}

export interface KickAndCancelData {
  state: number;
  cancelled: boolean;
  userId: string;
  nickname: string;
}

export interface KickUserListEntry {
  userId: string;
  nickname: string;
  time: string;
  commanderId: string;
  commanderNickname: string;
  commanderFlag: string;
  commanderPrimaryFlag: number;
  commanderSecondaryFlag: number;
}

export interface KickUserListData {
  users: readonly KickUserListEntry[];
}

export interface AdminChatUserInfo {
  userId: string;
  nickname: string;
  userFlag: string;
  flag1: number;
  flag2: number;
  isAdmin: boolean;
  isManager: boolean;
  isFixedManager: boolean;
  isEmployee: boolean;
  isEmployeeAdminChat: boolean;
  isCleanAti: boolean;
}

export interface AdminChatUserData {
  state: number;
  users: readonly AdminChatUserInfo[];
}

export interface ItemSellEffectData {
  chatNo: number;
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  message: string;
  secondaryMessage: string;
  title: string;
  imageUrl: string;
  defaultImageUrl: string;
  count: number;
}

export interface VodAdconData {
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  imageUrl: string;
  title: string;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

export interface ItemDropsData {
  broadcasterId: string;
  name: string;
  message: string;
  imageUrl: string;
}

export interface AdminFlagData {
  userFlag: string;
}

export interface GiftSubscriptionData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  subscriptionId: string;
  subscriptionNickname: string;
  broadcasterId: string;
  broadcasterNickname: string;
  itemType: number;
  subscriptionTier: SubscriptionTier;
  subscriptionMonth: number | null;
  subscriptionProduct: SubscriptionProduct | null;
  itemCode: string;
  isSubscription: number;
  subscriptionType: string;
  subscriptionPeriod: string;
  subscriptionRemain: number;
  subscriptionPayCount: number;
}

export interface VideoBalloonData {
  chatNo: string;
  broadcasterId: string;
  senderId: string;
  senderNickname: string;
  balloonCount: number;
  fanOrder: number;
  becameFanClub: boolean;
  topFanLevel: number;
  relay: string;
  fileName: string;
  isDefault: boolean;
  extraData: string;
}

export interface OgqEmoticonData {
  chatNo: string;
  message: string;
  groupId: string;
  subId: string;
  version: string;
  senderId: string;
  senderNickname: string;
  senderFlag: string;
  color: string;
  chatLanguage: number;
  emoticonType: number;
  extension: string;
  subscriptionMonth: string;
  nicknameColor: string;
  nicknameColorDark: string;
  accumulatedSubscriptionMonth: string;
  representativePersonalconMonth: string;
  animation: string;
  cheerTeamNumber: number;
}

export interface BjNoticeData {
  show: number;
  message: string;
}

export type MissionAction = "gift" | "notice" | "settle";
export type ChallengeMissionStatus = "success" | "fail" | "unknown";

interface MissionBaseData {
  payload: Readonly<Record<string, unknown>>;
}

interface ChallengeMissionBaseData extends MissionBaseData {
  missionKind: "challenge";
  missionKey: number;
  uuid: string;
}

export interface ChallengeMissionGiftData extends ChallengeMissionBaseData {
  action: "gift";
  title: string;
  giftCount: number;
  chatNo: number;
  isRelay: boolean;
  image: string;
  senderId: string;
  senderNickname: string;
  broadcasterId: string;
  broadcasterNickname: string;
}

export interface ChallengeMissionNoticeData extends ChallengeMissionBaseData {
  action: "notice";
  title: string;
  status: ChallengeMissionStatus;
}

export interface ChallengeMissionSettleData extends ChallengeMissionBaseData {
  action: "settle";
  title: string;
  settleCount: number;
  isRelay: boolean;
  image: string;
  broadcasterId: string;
  broadcasterNickname: string;
}

interface BattleMissionBaseData extends MissionBaseData {
  missionKind: "battle";
}

export interface BattleMissionGiftData extends BattleMissionBaseData {
  action: "gift";
  title: string;
  giftCount: number;
  isRelay: boolean;
  image: string;
  senderId: string;
  senderNickname: string;
  fanOrder: number;
  topFanLevel: number;
}

export interface BattleMissionNoticeData extends BattleMissionBaseData {
  action: "notice";
  draw: boolean;
  winner: string;
  rank: number;
  myTeamName: string;
}

export interface BattleMissionSettleData extends BattleMissionBaseData {
  action: "settle";
  title: string;
  settleCount: number;
  image: string;
}

export type BattleMissionData =
  | BattleMissionGiftData
  | BattleMissionNoticeData
  | BattleMissionSettleData;

export interface UnknownMissionData extends MissionBaseData {
  missionKind: "unknown";
  action: "unknown";
}

export type MissionData =
  | ChallengeMissionGiftData
  | ChallengeMissionNoticeData
  | ChallengeMissionSettleData
  | BattleMissionData
  | UnknownMissionData;

export interface ChallengeMissionSettlementParticipant {
  userId: string;
  nickname: string;
  contributionCount: number;
  becameFanClub: boolean;
  becameTopFan: boolean;
}

export interface ChallengeMissionSettlementData {
  missionKind: "challenge";
  chatNo: number;
  uuid: string;
  fanOrder: number;
  participants: readonly ChallengeMissionSettlementParticipant[];
  payload: Readonly<Record<string, unknown>>;
}

export interface JsonObjectData {
  payload: Readonly<Record<string, unknown>>;
}

export interface SubscriptionCeremonyButtonData {
  subscriptionMonth: string;
}

export interface SavvyNoticeData {
  streamerId: string;
  userId: string;
  videoNumber: string;
}

export interface GlobalSubtitleData {
  chatNo: string;
  broadcasterId: string;
  language: string;
  subtitle: string;
  timestamp: string;
}

export interface ConfettiData {
  confettiType: number;
  senderId: string;
}

export interface CheerTeamChangeData {
  userId: string;
  teamNumber: string;
}

export interface NightbotTimeoutData {
  userId: string;
  nickname: string;
  reasonCode: number;
  reason: NightbotTimeoutReason;
  channelNumber: string;
  message: string;
  time: number;
  userFlag: string;
}

export type NightbotTimeoutReason =
  | "blacklist"
  | "excessCaps"
  | "excessEmotes"
  | "links"
  | "excessSymbols"
  | "repetitions"
  | "unknown";

interface DecodedDataByOpcode {
  "0001": LoginData;
  "0002": JoinChannelData;
  "0003": QuitChannelData;
  "0004": ChatUserData;
  "0005": ChatMessageData;
  "0007": BroadcasterStatusData;
  "0008": SetDumbData;
  "0009": DirectChatData;
  "0012": SetUserFlagData;
  "0013": SetSubBjData;
  "0014": NicknameChangeData;
  "0018": BalloonData;
  "0020": FanLetterData;
  "0021": IceModeExData;
  "0023": SlowModeData;
  "0026": ManagerChatData;
  "0033": BalloonData;
  "0034": FanLetterData;
  "0037": ChocolateData;
  "0038": ChocolateData;
  "0045": QuickViewGiftData;
  "0047": ItemUsingData;
  "0050": PollNotificationData;
  "0054": BanWordData;
  "0058": AdminNoticeData;
  "0070": GoodsPurchaseData;
  "0071": GoodsPurchaseData;
  "0074": VrNotificationData;
  "0075": MobileBroadcastPauseData;
  "0076": KickAndCancelData;
  "0077": KickUserListData;
  "0078": AdminChatUserData;
  "0086": VodBalloonData;
  "0087": AdconEffectData;
  "0090": KickMessageStateData;
  "0091": FollowItemData;
  "0092": ItemSellEffectData;
  "0093": FollowItemEffectData;
  "0095": TranslationData;
  "0102": GiftTicketData;
  "0103": VodAdconData;
  "0104": BjNoticeData;
  "0105": VideoBalloonData;
  "0107": StationAdconData;
  "0108": GiftSubscriptionData;
  "0109": OgqEmoticonData;
  "0111": ItemDropsData;
  "0118": OgqEmoticonGiftData;
  "0119": JsonObjectData;
  "0120": GemItemSendData;
  "0121": MissionData;
  "0122": JsonObjectData;
  "0125": ChallengeMissionSettlementData;
  "0126": AdminFlagData;
  "0127": ChatUserExtendData;
  "0130": SubscriptionCeremonyButtonData;
  "0131": SavvyNoticeData;
  "0136": GlobalSubtitleData;
  "0138": ConfettiData;
  "0139": JsonObjectData;
  "0140": CheerTeamChangeData;
  "0141": NightbotTimeoutData;
}

type DecodedData<O extends KnownSoopOpcode> = O extends keyof DecodedDataByOpcode
  ? DecodedDataByOpcode[O]
  : FieldEventData;

export type KnownSoopEvent<O extends KnownSoopOpcode = KnownSoopOpcode> = O extends KnownSoopOpcode
  ? {
      type: (typeof EVENT_CATALOG)[O]["type"];
      opcode: O;
      receivedAt: number;
      raw: RawPacket;
      data: DecodedData<O>;
    }
  : never;

export interface UnknownSoopEvent {
  type: "unknown";
  opcode: string;
  receivedAt: number;
  raw: RawPacket;
  data: FieldEventData;
}

export type SoopEvent = KnownSoopEvent | UnknownSoopEvent;

export type SoopProtocolEventMap = {
  [O in KnownSoopOpcode as (typeof EVENT_CATALOG)[O]["type"]]: KnownSoopEvent<O>;
};
