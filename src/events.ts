/** 알려진 opcode 정의를 뒷받침하는 근거 수준입니다. */
export type EventProvenance = "observed" | "player" | "reference";

interface EventDefinition {
  type: string;
  description: string;
  provenance: EventProvenance;
}

/** 알려진 채팅 opcode, 공개 이벤트 이름, 설명과 근거 수준입니다. */
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
  "0020": { type: "sendFanLetter", description: "Send Sticker", provenance: "observed" },
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
  "0034": { type: "sendFanLetterSub", description: "Send Sticker (Sub)", provenance: "player" },
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
  "0118": { type: "ogqEmoticonGift", description: "OGQ Emoticon Gift", provenance: "observed" },
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

/** {@link EVENT_CATALOG}에 등록된 네 자리 opcode입니다. */
export type KnownSoopOpcode = keyof typeof EVENT_CATALOG;
/** 알려진 opcode에 대응하는 공개 이벤트 이름입니다. */
export type KnownSoopEventType = (typeof EVENT_CATALOG)[KnownSoopOpcode]["type"];

/** stream framing 뒤 손실 없이 보존한 패킷입니다. */
export interface RawPacket {
  opcode: string;
  flags: string;
  payload: Uint8Array;
  text: string;
  fields: readonly string[];
}

/** 필드 의미가 이름을 붙일 만큼 확실하지 않을 때 제공하는 payload입니다. */
export interface FieldEventData {
  fields: readonly string[];
}

/** SOOP의 숫자 플래그 두 그룹에서 독립적으로 판정한 사용자 상태입니다. */
export interface UserStatus {
  flag1: number;
  flag2: number;
  isAdmin: boolean;
  isBJ: boolean;
  isManager: boolean;
  isFixedManager: boolean;
  isTopFan: boolean;
  isFan: boolean;
  isSupporter: boolean;
  isWhisperAllowed: boolean;
  isFollower: boolean;
  followerTier: 0 | 1 | 2 | 3;
  isGuest: boolean;
  hasAppliedQuickview: boolean;
  isMobile: boolean;
  isFemale: boolean;
  isHideSex: boolean;
  isAtagAllow: boolean;
  isEmployee: boolean;
  isEmployeeAdminChat: boolean;
  isCleanAti: boolean;
}

/** decoding한 `0001` 로그인 handshake payload입니다. */
export interface LoginData {
  userId: string;
  userFlag: string;
  userStatus: UserStatus;
}

/** decoding한 `0002` 채널 입장 payload입니다. */
export interface JoinChannelData {
  chatNo: string;
  streamerId: string;
  maxManagerCount: number;
  familyNickname: string;
  familyNicknamePosition: number;
  userFlag: string;
  userStatus: UserStatus;
}

/** 현재 사용자 강퇴 응답에서 판정한 명령 주체입니다. */
export type QuitChannelActor = "streamer" | "manager" | "admin" | "unknown";

/** 현재 시청자가 강제 퇴장될 때 받는 `0003` payload입니다. */
export interface QuitChannelData {
  kickType: number;
  actor: QuitChannelActor;
  adminKickCount: number;
  adminNickname: string;
  bannedRoomStreamerId: string;
  bannedRoomStreamerNickname: string;
}

/** 채널 입장 batch에 포함된 사용자 정보입니다. */
export interface ChatUserInfo {
  userId: string;
  nickname: string;
  userFlag: string;
  userStatus: UserStatus;
}

/** 사용자 입장 또는 퇴장 payload입니다. 입장 패킷에는 여러 사용자가 포함될 수 있습니다. */
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
      userStatus: UserStatus;
      isKicked: boolean;
    };

/** 숫자의 세부 의미를 확정하지 않고 원본으로 제공하는 방송인 상태 payload입니다. */
export interface BroadcasterStatusData {
  status: number;
}

/** decoding한 귓속말 payload입니다. */
export interface DirectChatData {
  message: string;
  senderId: string;
  receiverId: string;
  messageType: number;
  chatLanguage: number;
  senderNickname: string;
  receiverNickname: string;
  userFlag: string;
  senderStatus: UserStatus;
  isAdmin: boolean;
}

/** 채팅금지 대상, 시간, 누적 횟수와 명령 주체입니다. */
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

/** 변경 전후의 사용자 상태 플래그입니다. */
export interface SetUserFlagData {
  userId: string;
  nickname: string;
  userFlag: string;
  previousUserFlag: string;
  userStatus: UserStatus;
  previousUserStatus: UserStatus;
}

/** 원본 숫자 변경 종류를 포함한 닉네임 변경 payload입니다. */
export interface NicknameChangeData {
  userId: string;
  newNickname: string;
  oldNickname: string;
  changeType: number;
  userFlag: string;
  userStatus: UserStatus;
}

/** 확장 얼음 상태에서도 채팅할 수 있는 역할입니다. */
export type IceModeRole =
  | "streamer"
  | "fanClub"
  | "supporter"
  | "topFan"
  | "subscriber"
  | "manager";

/** 확장 채팅 얼음 상태와 허용 역할 bitmask입니다. */
export interface IceModeExData {
  frozen: boolean;
  allowedRoleMask: number;
  allowedRoles: readonly IceModeRole[];
  balloonLimitCount: number;
  subscriptionLimitCount: number;
}

/** 매니저 또는 운영자 채팅 메시지 payload입니다. */
export interface ManagerChatData {
  message: string;
  senderId: string;
  isAdmin: boolean;
  nickname: string;
  userFlag: string;
  senderStatus: UserStatus;
  subscriptionMonth: string;
}

/** 정규화한 퀵뷰 상품 종류입니다. */
export type QuickViewProduct = "quickView" | "quickViewPlus" | "unknown";

/** 퀵뷰 선물의 발신자, 수신자, 상품과 기간입니다. */
export interface QuickViewGiftData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  itemType: number;
  quickViewProduct: QuickViewProduct;
  durationDays: number | null;
}

/** 정규화한 투표 표시 상태입니다. */
export type PollState = "started" | "closed" | "hidden" | "unknown";

/** 투표 상태 알림입니다. 질문과 결과는 이 패킷에 포함되지 않습니다. */
export interface PollNotificationData {
  status: number;
  pollState: PollState;
  streamerId: string;
  pollNo: number;
  show: number;
  visible: boolean;
}

/** 대체 문구와 서버가 제공한 금칙어 목록입니다. */
export interface BanWordData {
  replacement: string;
  banWordList: readonly string[];
}

/** 채팅 채널에서 강퇴 메시지를 숨기는지 나타냅니다. */
export interface KickMessageStateData {
  chatNo: number;
  hideKickMessage: boolean;
}

/** 번역 메시지와 원본 숫자 언어 식별자입니다. */
export interface TranslationData {
  messageIndex: number;
  mode: number;
  message: string;
  originalLanguage: number;
  translatedLanguage: number;
}

/** 발신자와 수신자 정보가 있는 불투명한 선물 티켓 payload입니다. */
export interface GiftTicketData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  ticketData: string;
}

/** OGQ 이모티콘 선물의 발신자, 수신자, 제목과 이미지입니다. */
export interface OgqEmoticonGiftData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  title: string;
  imageUrl: string;
}

/** 젬 아이템 수신자와 아이템 이름입니다. */
export interface GemItemSendData {
  receiverId: string;
  receiverNickname: string;
  itemName: string;
}

/** 사용자 입장 시점의 구독과 퍼스널콘 메타데이터입니다. */
export interface ChatUserExtendInfo {
  userId: string;
  representativePersonalconMonth: number | null;
  subscriptionMonth: number | null;
  accumulatedSubscriptionMonth: number | null;
}

/** 입장 시점의 확장 사용자 메타데이터 batch입니다. */
export interface ChatUserExtendData {
  users: readonly ChatUserExtendInfo[];
}

/** 일반 채팅 메시지, 발신자 상태, 색상과 구독 메타데이터입니다. */
export interface ChatMessageData {
  message: string;
  senderId: string;
  color: string;
  messageType: number;
  chatLanguage: number;
  senderNickname: string;
  senderFlag: string;
  senderStatus: UserStatus;
  subscriptionMonth: string;
  nicknameColor: string;
  nicknameColorDark: string;
  accumulatedSubscriptionMonth: string;
  representativePersonalconMonth: string;
  cheerTeamNumber: number;
}

/** 일반 채널과 relay 채널에서 사용하는 별풍선 후원 payload입니다. */
export interface BalloonData {
  streamerId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  fanOrder: number;
  becameFanClub: boolean;
  fileName: string;
  isDefault: boolean;
  topFanLevel: number;
  becameTopFan: boolean;
  ttsData: string;
  senderLanguage: string;
  urlModify: string;
  relay: boolean;
}

/** 스티커 후원 payload입니다. 공개 이름은 공식 fan-letter opcode를 유지합니다. */
export interface FanLetterData {
  streamerId: string;
  streamerNickname: string;
  senderId: string;
  senderNickname: string;
  itemType: number;
  count: number;
  supporterOrder: number;
  senderLanguage: string;
  relay: boolean;
}

/** 자동·수동 슬로우 모드의 초 단위 시간입니다. */
export interface SlowModeData {
  automaticSeconds: number;
  manualSeconds: number;
}

/** 일반 채널과 relay 채널에서 사용하는 초콜릿 후원 payload입니다. */
export interface ChocolateData {
  streamerId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  relay: boolean;
}

/** 사용 중인 아이템의 남은 시간입니다. */
export interface ItemUsingData {
  remainingSeconds: number;
  remainingMinutes: number;
}

/** 확인된 경우 정규화한 상품 메타데이터를 포함하는 신규 구독 payload입니다. */
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

/** 정규화한 구독 티어입니다. */
export type SubscriptionTier = "basic" | "plus" | "unknown";

/** 공식 플레이어의 구독 상품표에서 가져온 상품 메타데이터입니다. */
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

/** 현재 개월과 누적 개월을 포함한 연속 구독 효과입니다. */
export interface FollowItemEffectData {
  streamerId: string;
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

/** 매니저 상태 변경과 판정된 사용자 상태입니다. */
export interface SetSubBjData {
  userId: string;
  userFlag: string;
  nickname: string;
  hide: number;
  hidden: boolean;
  userStatus: UserStatus;
}

/** 독립적으로 전달되는 운영자 공지 본문입니다. */
export interface AdminNoticeData {
  message: string;
}

/** VOD에서 후원되고 다음 라이브 방송에서 전달되는 별풍선 정보입니다. */
export interface VodBalloonData {
  streamerId: string;
  senderId: string;
  senderNickname: string;
  balloonCount: number;
  fileName: string;
  isDefault: boolean;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

/** 애드벌룬 효과, 발신자, 팬 상태와 표시 리소스입니다. */
export interface AdconEffectData {
  chatNo: number;
  streamerId: string;
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

/** 방송국 애드벌룬의 발신자와 표시 리소스입니다. */
export interface StationAdconData {
  streamerId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  imageUrl: string;
  title: string;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

/** 일반 채널과 relay 채널에서 사용하는 상품 구매 payload입니다. */
export interface GoodsPurchaseData {
  goodsType: number;
  streamerId: string;
  buyerId: string;
  buyerNickname: string;
  goodsName: string;
  count: number;
  relay: boolean;
}

/** 원본 동작 값과 stream URL이 있는 VR 방송 알림입니다. */
export interface VrNotificationData {
  action: number;
  streamerId: string;
  vrId: string;
  rtmpUrl: string;
  hlsUrl: string;
  vrType: number;
}

/** 정규화한 모바일 방송 일시정지 동작입니다. */
export type MobileBroadcastPauseAction = "pause" | "resume" | "unknown";

/** 모바일 방송 일시정지 상태와 정규화한 동작입니다. */
export interface MobileBroadcastPauseData {
  state: number;
  action: MobileBroadcastPauseAction;
}

/** 강퇴 취소 상태와 대상 사용자 정보입니다. */
export interface KickAndCancelData {
  state: number;
  cancelled: boolean;
  userId: string;
  nickname: string;
}

/** 강퇴된 사용자와 명령을 실행한 주체입니다. */
export interface KickUserListEntry {
  userId: string;
  nickname: string;
  time: string;
  commanderId: string;
  commanderNickname: string;
  commanderFlag: string;
  commanderStatus: UserStatus;
}

/** 강퇴된 사용자 batch입니다. */
export interface KickUserListData {
  users: readonly KickUserListEntry[];
}

/** 관리자 채팅 사용자 목록의 개별 사용자입니다. */
export interface AdminChatUserInfo {
  userId: string;
  nickname: string;
  userFlag: string;
  userStatus: UserStatus;
}

/** 정규화하지 않은 상태값을 포함한 관리자 채팅 사용자 목록입니다. */
export interface AdminChatUserData {
  state: number;
  users: readonly AdminChatUserInfo[];
}

/** 아이템 판매 효과의 발신자, 메시지와 표시 리소스입니다. */
export interface ItemSellEffectData {
  chatNo: number;
  streamerId: string;
  senderId: string;
  senderNickname: string;
  message: string;
  secondaryMessage: string;
  title: string;
  imageUrl: string;
  defaultImageUrl: string;
  count: number;
}

/** VOD 애드벌룬의 발신자와 표시 리소스입니다. */
export interface VodAdconData {
  streamerId: string;
  senderId: string;
  senderNickname: string;
  count: number;
  imageUrl: string;
  title: string;
  chatNo: string;
  senderLanguage: string;
  urlModify: string;
}

/** 아이템 드롭의 이름, 메시지와 표시 이미지입니다. */
export interface ItemDropsData {
  streamerId: string;
  name: string;
  message: string;
  imageUrl: string;
}

/** 운영자 상태 플래그 변경입니다. */
export interface AdminFlagData {
  userFlag: string;
  userStatus: UserStatus;
}

/** 발신자, 수신자와 정규화한 상품 메타데이터가 있는 구독 선물입니다. */
export interface GiftSubscriptionData {
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  streamerId: string;
  streamerNickname: string;
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

/** 영상풍선 후원과 표시 리소스 메타데이터입니다. */
export interface VideoBalloonData {
  chatNo: string;
  streamerId: string;
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

/** 발신자와 구독 메타데이터가 있는 OGQ 이미지 채팅 메시지입니다. */
export interface OgqEmoticonData {
  chatNo: string;
  message: string;
  groupId: string;
  subId: string;
  version: string;
  senderId: string;
  senderNickname: string;
  senderFlag: string;
  senderStatus: UserStatus;
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

/** 방송인 공지의 표시 상태와 본문입니다. */
export interface BjNoticeData {
  show: number;
  message: string;
}

/** 알려진 미션 payload가 나타내는 동작입니다. */
export type MissionAction = "gift" | "notice" | "settle";
/** 정규화한 도전미션 결과입니다. */
export type ChallengeMissionStatus = "success" | "fail" | "unknown";

interface MissionBaseData {
  payload: Readonly<Record<string, unknown>>;
}

interface ChallengeMissionBaseData extends MissionBaseData {
  missionKind: "challenge";
  missionKey: number;
  uuid: string;
}

/** 도전미션 후원 payload입니다. */
export interface ChallengeMissionGiftData extends ChallengeMissionBaseData {
  action: "gift";
  title: string;
  giftCount: number;
  chatNo: number;
  isRelay: boolean;
  image: string;
  senderId: string;
  senderNickname: string;
  streamerId: string;
  streamerNickname: string;
}

/** 도전미션 결과 알림입니다. */
export interface ChallengeMissionNoticeData extends ChallengeMissionBaseData {
  action: "notice";
  title: string;
  status: ChallengeMissionStatus;
}

/** 도전미션 정산 알림입니다. */
export interface ChallengeMissionSettleData extends ChallengeMissionBaseData {
  action: "settle";
  title: string;
  settleCount: number;
  isRelay: boolean;
  image: string;
  streamerId: string;
  streamerNickname: string;
}

interface BattleMissionBaseData extends MissionBaseData {
  missionKind: "battle";
}

/** 대결미션 후원 payload입니다. */
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

/** 대결미션 결과 알림입니다. */
export interface BattleMissionNoticeData extends BattleMissionBaseData {
  action: "notice";
  draw: boolean;
  winner: string;
  rank: number;
  myTeamName: string;
}

/** 대결미션 정산 알림입니다. */
export interface BattleMissionSettleData extends BattleMissionBaseData {
  action: "settle";
  title: string;
  settleCount: number;
  image: string;
}

/** 알려진 대결미션 동작의 union입니다. */
export type BattleMissionData =
  | BattleMissionGiftData
  | BattleMissionNoticeData
  | BattleMissionSettleData;

/** 현재 버전이 해석하지 못하는 미션 JSON `type`의 fallback입니다. */
export interface UnknownMissionData extends MissionBaseData {
  missionKind: "unknown";
  action: "unknown";
}

/** 도전, 대결과 미확인 미션 payload의 판별 union입니다. */
export type MissionData =
  | ChallengeMissionGiftData
  | ChallengeMissionNoticeData
  | ChallengeMissionSettleData
  | BattleMissionData
  | UnknownMissionData;

/** 도전미션 정산에 포함된 참여자 결과입니다. */
export interface ChallengeMissionSettlementParticipant {
  userId: string;
  nickname: string;
  contributionCount: number;
  becameFanClub: boolean;
  becameTopFan: boolean;
}

/** 도전미션 정산 참여자와 보존한 JSON payload입니다. */
export interface ChallengeMissionSettlementData {
  missionKind: "challenge";
  chatNo: number;
  uuid: string;
  fanOrder: number;
  participants: readonly ChallengeMissionSettlementParticipant[];
  payload: Readonly<Record<string, unknown>>;
}

/** 내부 schema를 모델링할 만큼 안정적이지 않아 객체로만 검증한 JSON입니다. */
export interface JsonObjectData {
  payload: Readonly<Record<string, unknown>>;
}

/** 구독 세리머니 버튼 상태입니다. */
export interface SubscriptionCeremonyButtonData {
  subscriptionMonth: string;
}

/** Savvy 영상 알림입니다. */
export interface SavvyNoticeData {
  streamerId: string;
  userId: string;
  videoNumber: string;
}

/** 전역 자막 본문과 원본 timestamp입니다. */
export interface GlobalSubtitleData {
  chatNo: string;
  streamerId: string;
  language: string;
  subtitle: string;
  timestamp: string;
}

/** 꽃가루 효과 종류와 효과를 발생시킨 사용자입니다. */
export interface ConfettiData {
  confettiType: number;
  senderId: string;
}

/** 사용자의 응원팀 변경입니다. */
export interface CheerTeamChangeData {
  userId: string;
  teamNumber: string;
}

/** Nightbot timeout 대상, 정규화한 사유와 원본 메타데이터입니다. */
export interface NightbotTimeoutData {
  userId: string;
  nickname: string;
  reasonCode: number;
  reason: NightbotTimeoutReason;
  channelNumber: string;
  message: string;
  time: number;
  userFlag: string;
  userStatus: UserStatus;
}

/** 정규화한 Nightbot timeout 사유입니다. */
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

/** 알려진 opcode 하나의 typed event이며 `O`를 생략하면 전체 union입니다. */
export type KnownSoopEvent<O extends KnownSoopOpcode = KnownSoopOpcode> = O extends KnownSoopOpcode
  ? {
      type: (typeof EVENT_CATALOG)[O]["type"];
      opcode: O;
      receivedAt: number;
      raw: RawPacket;
      data: DecodedData<O>;
    }
  : never;

/** {@link EVENT_CATALOG}에 없는 opcode를 손실 없이 제공하는 fallback입니다. */
export interface UnknownSoopEvent {
  type: "unknown";
  opcode: string;
  receivedAt: number;
  raw: RawPacket;
  data: FieldEventData;
}

/** 모든 알려진 이벤트와 미래 호환용 unknown 이벤트의 union입니다. */
export type SoopEvent = KnownSoopEvent | UnknownSoopEvent;

/** 알려진 공개 이벤트 이름을 각 이벤트 payload에 연결합니다. */
export type SoopProtocolEventMap = {
  [O in KnownSoopOpcode as (typeof EVENT_CATALOG)[O]["type"]]: KnownSoopEvent<O>;
};
