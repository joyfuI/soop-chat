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
  "0013": { type: "setSubBj", description: "Set Sub BJ", provenance: "observed" },
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
  "0091": { type: "followItem", description: "Subscription Ceremony", provenance: "observed" },
  "0092": { type: "itemSellEffect", description: "Item Sell Effect", provenance: "player" },
  "0093": {
    type: "followItemEffect",
    description: "Continuous Subscription Ceremony",
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
  "0127": { type: "chuserExtend", description: "Chat User Metadata", provenance: "observed" },
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
  "0142": {
    type: "subRandomCeremony",
    description: "Random Subscription Gift",
    provenance: "observed",
  },
  "0143": {
    type: "quickRandomCeremony",
    description: "Random Quick View Gift",
    provenance: "player",
  },
  "0144": { type: "copySendSub", description: "Subscription Gift Receipt", provenance: "player" },
  "0145": { type: "copySendQuick", description: "Copy Send Quick", provenance: "player" },
} as const satisfies Record<string, EventDefinition>;

/** {@link EVENT_CATALOG}에 등록된 네 자리 opcode입니다. */
export type KnownSoopOpcode = keyof typeof EVENT_CATALOG;
/** 알려진 opcode에 대응하는 공개 이벤트 이름입니다. */
export type KnownSoopEventType = (typeof EVENT_CATALOG)[KnownSoopOpcode]["type"];

/** stream framing 뒤 손실 없이 보존한 패킷입니다. */
export interface RawPacket {
  /** packet header의 원본 opcode입니다. */
  opcode: string;
  /** packet header의 두 자리 원본 flag입니다. */
  flags: string;
  /** header를 제외한 원본 payload byte입니다. */
  payload: Uint8Array;
  /** payload를 UTF-8로 decoding한 문자열입니다. */
  text: string;
  /** 첫 form feed까지의 prefix를 제외하고 분리한 field입니다. 구분자가 없으면 `text` 전체가 한 field입니다. */
  fields: readonly string[];
}

/** 필드 의미가 이름을 붙일 만큼 확실하지 않을 때 제공하는 payload입니다. */
export interface FieldEventData {
  /** 의미를 확정하지 않고 보존한 {@link RawPacket.fields}입니다. */
  fields: readonly string[];
}

/** SOOP의 숫자 플래그 두 그룹에서 독립적으로 판정한 사용자 상태입니다. */
export interface UserStatus {
  /** 첫 번째 원본 복합 flag 숫자입니다. */
  flag1: number;
  /** 두 번째 원본 복합 flag 숫자입니다. */
  flag2: number;
  /** `flag1 & 1`인 운영자 flag입니다. */
  isAdmin: boolean;
  /** `flag1 & 4`인 방송인 flag입니다. */
  isBJ: boolean;
  /** `flag1 & 256`인 매니저 flag입니다. */
  isManager: boolean;
  /** `flag1 & 64`인 고정 매니저 flag입니다. */
  isFixedManager: boolean;
  /** `flag1 & 32768`인 열혈팬 flag입니다. */
  isTopFan: boolean;
  /** `flag1 & 32`인 팬클럽 flag입니다. */
  isFan: boolean;
  /** `flag1 & (1 << 20)`인 서포터 flag입니다. */
  isSupporter: boolean;
  /** `flag1`에 `NODIRECT(1 << 17)` bit가 없는 귓속말 허용 상태입니다. */
  isWhisperAllowed: boolean;
  /** `followerTier`가 `0`이 아닌 상태입니다. */
  isFollower: boolean;
  /** `flag2`의 `1 << 18`, `1 << 19`, `1 << 20`을 tier `1`, `2`, `3`으로 판정합니다. 비구독자는 `0`이며 일반 방송의 접근 권한 판정값이 아닙니다. */
  followerTier: 0 | 1 | 2 | 3;
  /** `flag1 & 16`인 공식 `GUEST` flag입니다. */
  isGuest: boolean;
  /** `flag1 & (1 << 19)`인 퀵뷰 적용 상태입니다. */
  hasAppliedQuickview: boolean;
  /** `flag1 & 16384`인 모바일 접속 flag입니다. */
  isMobile: boolean;
  /** `flag1 & 512`인 여성 flag입니다. */
  isFemale: boolean;
  /** `flag2 & (1 << 25)`인 플레이어 UI의 성별 숨김 flag입니다. */
  isHideSex: boolean;
  /** `flag2 & 32`인 공식 `ATAG_ALLOW` flag입니다. */
  isAtagAllow: boolean;
  /** `flag2 & 1024`인 공식 `EMPLOYEE` flag입니다. */
  isEmployee: boolean;
  /** `flag2 & 8192`인 공식 `ADMINCHAT` flag입니다. */
  isEmployeeAdminChat: boolean;
  /** `flag2 & 2048`인 공식 `CLEANATI` flag입니다. */
  isCleanAti: boolean;
}

/** decoding한 `0001` 로그인 handshake payload입니다. */
export interface LoginData {
  /** 로그인한 사용자 ID입니다. */
  userId: string;
  /** 사용자 상태를 나타내는 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 상태입니다. */
  userStatus: UserStatus;
}

/** decoding한 `0002` 채널 입장 payload입니다. */
export interface JoinChannelData {
  /** 입장한 채팅방 번호입니다. */
  chatNo: string;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 서버가 전달한 최대 매니저 수입니다. */
  maxManagerCount: number;
  /** 서버가 전달한 가족 닉네임입니다. */
  familyNickname: string;
  /** 가족 닉네임 위치의 원본 숫자입니다. */
  familyNicknamePosition: number;
  /** 현재 사용자의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 상태입니다. */
  userStatus: UserStatus;
}

/** 현재 사용자 강퇴 응답에서 판정한 명령 주체입니다. */
export type QuitChannelActor = "streamer" | "manager" | "admin" | "unknown";

/** 현재 시청자가 강제 퇴장될 때 받는 `0003` payload입니다. */
export interface QuitChannelData {
  /** 현재 사용자의 강퇴 종류를 나타내는 원본 숫자입니다. */
  kickType: number;
  /** `kickType`에서 판정한 명령 주체입니다. */
  actor: QuitChannelActor;
  /** 운영자 강퇴 누적 횟수입니다. */
  adminKickCount: number;
  /** 강퇴를 적용한 운영자 닉네임입니다. */
  adminNickname: string;
  /** 강퇴된 방송의 방송인 ID입니다. */
  bannedRoomStreamerId: string;
  /** 강퇴된 방송의 방송인 닉네임입니다. */
  bannedRoomStreamerNickname: string;
}

/** 채널 입장 batch에 포함된 사용자 정보입니다. */
export interface ChatUserInfo {
  /** 입장한 사용자 ID입니다. */
  userId: string;
  /** 입장한 사용자 닉네임입니다. */
  nickname: string;
  /** 사용자 상태를 나타내는 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 상태입니다. */
  userStatus: UserStatus;
}

/** 사용자 입장 또는 퇴장 payload입니다. 입장 패킷에는 여러 사용자가 포함될 수 있습니다. */
export type ChatUserData =
  | {
      /** 사용자 입장 이벤트 판별값입니다. */
      action: "join";
      /** 한 패킷에 포함된 입장 사용자 목록입니다. */
      users: readonly ChatUserInfo[];
    }
  | {
      /** 사용자 퇴장 이벤트 판별값입니다. */
      action: "leave";
      /** 퇴장한 사용자 ID입니다. */
      userId: string;
      /** 퇴장한 사용자 닉네임입니다. */
      nickname: string;
      /** `1`은 일반 퇴장이며 그 밖의 값은 강퇴로 판정하는 원본 숫자입니다. */
      quitFlag: number;
      /** 의미를 확정하지 않고 보존한 추가 정보입니다. */
      etcInfo: string;
      /** 퇴장 패킷의 원본 플래그이며 최신 사용자 상태 비트가 생략될 수 있습니다. */
      userFlag: string;
      /** 퇴장 패킷의 플래그 판정이며 최신 사용자 상태 스냅샷이 아닙니다. */
      userStatus: UserStatus;
      /** `quitFlag`가 `1`이 아닌지 나타냅니다. */
      isKicked: boolean;
    };

/** 숫자의 세부 의미를 확정하지 않고 원본으로 제공하는 방송인 상태 payload입니다. */
export interface BroadcasterStatusData {
  /** 세부 의미를 확정하지 않은 방송인 상태 원본 숫자입니다. */
  status: number;
}

/** decoding한 귓속말 payload입니다. */
export interface DirectChatData {
  /** carriage return을 제거한 귓속말 본문입니다. */
  message: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 수신자 ID입니다. */
  receiverId: string;
  /** 세부 의미를 확정하지 않은 원본 메시지 종류입니다. */
  messageType: number;
  /** 플레이어의 원본 채팅 언어 값입니다. */
  chatLanguage: number;
  /** 발신자 닉네임입니다. */
  senderNickname: string;
  /** 수신자 닉네임입니다. */
  receiverNickname: string;
  /** 발신자 상태의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 발신자 상태입니다. */
  senderStatus: UserStatus;
  /** 발신자가 운영자인지 나타냅니다. */
  isAdmin: boolean;
}

/** 채팅금지 대상, 시간, 누적 횟수와 명령 주체입니다. */
export interface SetDumbData {
  /** 채팅금지 대상 사용자 ID입니다. */
  targetId: string;
  /** 채팅금지 대상 사용자 닉네임입니다. */
  targetNickname: string;
  /** 채팅금지 시간(초)입니다. */
  durationSeconds: number;
  /** 대상 사용자의 누적 채팅금지 횟수입니다. */
  muteCount: number;
  /** 채팅금지를 적용한 명령 주체의 사용자 ID입니다. */
  commanderId: string;
  /** 명령 주체의 원본 값입니다. `1`은 방송인, `2`는 매니저입니다. */
  commanderType: number;
  /** `commanderType`을 정규화한 역할입니다. */
  commanderRole: "streamer" | "manager" | "unknown";
  /** 플레이어가 역할 문구 대신 사용할 수 있는 원본 표시값입니다. */
  commanderLabel: string;
}

/** 변경 전후의 사용자 상태 플래그입니다. */
export interface SetUserFlagData {
  /** 상태가 변경된 사용자 ID입니다. */
  userId: string;
  /** 상태가 변경된 사용자 닉네임입니다. */
  nickname: string;
  /** 변경 후 원본 복합 flag입니다. */
  userFlag: string;
  /** 변경 전 원본 복합 flag입니다. */
  previousUserFlag: string;
  /** `userFlag`를 판정한 변경 후 상태입니다. */
  userStatus: UserStatus;
  /** `previousUserFlag`를 판정한 변경 전 상태입니다. */
  previousUserStatus: UserStatus;
}

/** 원본 숫자 변경 종류를 포함한 닉네임 변경 payload입니다. */
export interface NicknameChangeData {
  /** 닉네임이 변경된 사용자 ID입니다. */
  userId: string;
  /** 변경 후 닉네임입니다. */
  newNickname: string;
  /** 변경 전 닉네임입니다. */
  oldNickname: string;
  /** 닉네임 변경 종류의 원본 값입니다. 빈 field는 `0`입니다. */
  changeType: number;
  /** 사용자의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 사용자 상태입니다. */
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
  /** 채팅창이 얼음 상태인지 나타냅니다. */
  frozen: boolean;
  /** 얼음 상태에서도 채팅할 수 있는 역할의 원본 bitmask입니다. */
  allowedRoleMask: number;
  /** `allowedRoleMask`를 해석한 역할 목록입니다. */
  allowedRoles: readonly IceModeRole[];
  /** 팬클럽 채팅 참여 조건에 표시되는 별풍선 하한입니다. */
  balloonLimitCount: number;
  /** 플레이어가 사용하는 구독 제한 수치입니다. */
  subscriptionLimitCount: number;
}

/** 매니저 또는 운영자 채팅 메시지 payload입니다. */
export interface ManagerChatData {
  /** carriage return을 제거한 채팅 본문입니다. */
  message: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 발신자가 운영자인지 나타냅니다. */
  isAdmin: boolean;
  /** 발신자 닉네임입니다. */
  nickname: string;
  /** 발신자 상태의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 발신자 상태입니다. */
  senderStatus: UserStatus;
  /** SOOP이 계산한 연속 구독 개월 원본 값입니다. */
  subscriptionMonth: string;
}

/** 정규화한 퀵뷰 상품 종류입니다. */
export type QuickViewProduct = "quickView" | "quickViewPlus" | "unknown";

/** 수신자 한 명에 대한 퀵뷰 선물입니다. 같은 발신자·수신자의 반복 알림도 각각 별도 선물입니다. */
export interface QuickViewGiftData {
  /** 퀵뷰를 선물한 사용자 ID입니다. */
  senderId: string;
  /** 퀵뷰를 선물한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 퀵뷰를 받은 사용자 ID입니다. */
  receiverId: string;
  /** 퀵뷰를 받은 사용자 닉네임입니다. */
  receiverNickname: string;
  /** 퀵뷰 상품의 원본 종류 값입니다. */
  itemType: number;
  /** `itemType`을 공식 상품표로 정규화한 종류입니다. */
  quickViewProduct: QuickViewProduct;
  /** 상품 기간(일)이며 알 수 없는 상품이면 `null`입니다. */
  durationDays: number | null;
}

/** 정규화한 투표 표시 상태입니다. */
export type PollState = "started" | "closed" | "hidden" | "unknown";

/** 투표 상태 알림입니다. 질문과 결과는 이 패킷에 포함되지 않습니다. */
export interface PollNotificationData {
  /** 투표 상태의 원본 숫자입니다. */
  status: number;
  /** `status`와 `show`를 정규화한 표시 상태입니다. */
  pollState: PollState;
  /** 투표를 진행한 방송인 ID입니다. */
  streamerId: string;
  /** 투표 번호입니다. */
  pollNo: number;
  /** 투표 표시 여부의 원본 숫자입니다. */
  show: number;
  /** `show`가 `0`이 아닌지 나타냅니다. */
  visible: boolean;
}

/** 대체 문구와 서버가 제공한 금칙어 목록입니다. */
export interface BanWordData {
  /** 금칙어 대신 표시할 문자열입니다. */
  replacement: string;
  /** 서버의 `0x06` 구분자로 분리한 목록입니다. 빈 설정은 빈 배열입니다. */
  banWordList: readonly string[];
}

/** 채팅 채널에서 강퇴 메시지를 숨기는지 나타냅니다. */
export interface KickMessageStateData {
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 서버의 원본 값이 `0`이 아닌지 나타냅니다. */
  hideKickMessage: boolean;
}

/** 번역 메시지와 원본 숫자 언어 식별자입니다. */
export interface TranslationData {
  /** 원문 메시지의 순번입니다. */
  messageIndex: number;
  /** 번역 모드의 원본 숫자입니다. */
  mode: number;
  /** 번역된 메시지 본문입니다. */
  message: string;
  /** 원문 언어의 원본 숫자 식별자입니다. */
  originalLanguage: number;
  /** 번역 언어의 원본 숫자 식별자입니다. */
  translatedLanguage: number;
}

/** 발신자와 수신자 정보가 있는 불투명한 선물 티켓 payload입니다. */
export interface GiftTicketData {
  /** 선물 티켓을 보낸 사용자 ID입니다. */
  senderId: string;
  /** 선물 티켓을 보낸 사용자 닉네임입니다. */
  senderNickname: string;
  /** 선물 티켓을 받은 사용자 ID입니다. */
  receiverId: string;
  /** 선물 티켓을 받은 사용자 닉네임입니다. */
  receiverNickname: string;
  /** 내부 의미를 확정하지 않고 보존한 티켓 원본 값입니다. */
  ticketData: string;
}

/** OGQ 이모티콘 선물의 발신자, 수신자, 제목과 이미지입니다. */
export interface OgqEmoticonGiftData {
  /** 이모티콘을 선물한 사용자 ID입니다. */
  senderId: string;
  /** 이모티콘을 선물한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 이모티콘을 받은 사용자 ID입니다. */
  receiverId: string;
  /** 이모티콘을 받은 사용자 닉네임입니다. */
  receiverNickname: string;
  /** 선물 제목입니다. */
  title: string;
  /** 선물 이미지 URL입니다. */
  imageUrl: string;
}

/** 젬 아이템 수신자와 아이템 이름입니다. */
export interface GemItemSendData {
  /** 젬 아이템을 받은 사용자 ID입니다. */
  receiverId: string;
  /** 젬 아이템을 받은 사용자 닉네임입니다. */
  receiverNickname: string;
  /** 젬 아이템 이름입니다. */
  itemName: string;
}

/** 사용자 입장 시점의 구독과 퍼스널콘 메타데이터입니다. */
export interface ChatUserExtendInfo {
  /** 확장 메타데이터 대상 사용자 ID입니다. */
  userId: string;
  /** 대표 구독 퍼스널콘 선택에 쓰이는 개월 값입니다. */
  representativePersonalconMonth: number | null;
  /** SOOP이 계산한 연속 구독 개월입니다. */
  subscriptionMonth: number | null;
  /** 누적 구독 개월입니다. */
  accumulatedSubscriptionMonth: number | null;
}

/** 입장 시점의 확장 사용자 메타데이터 batch입니다. */
export interface ChatUserExtendData {
  /** 한 패킷에 포함된 사용자별 확장 메타데이터입니다. */
  users: readonly ChatUserExtendInfo[];
}

/** 일반 채팅 메시지, 발신자 상태, 색상과 구독 메타데이터입니다. */
export interface ChatMessageData {
  /** carriage return을 제거한 채팅 본문입니다. */
  message: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 원본 BGR 값을 변환한 CSS `#RRGGBB` 색상입니다. 값이 없으면 빈 문자열입니다. */
  color: string;
  /** 세부 의미를 확정하지 않은 원본 메시지 종류입니다. */
  messageType: number;
  /** 플레이어의 원본 채팅 언어 값입니다. */
  chatLanguage: number;
  /** 발신자 닉네임입니다. */
  senderNickname: string;
  /** 발신자 상태의 원본 복합 flag입니다. */
  senderFlag: string;
  /** `senderFlag`를 판정한 발신자 상태입니다. */
  senderStatus: UserStatus;
  /** SOOP이 계산한 연속 구독 개월 원본 값입니다. */
  subscriptionMonth: string;
  /** 밝은 theme용 닉네임 색상입니다. 값이 없으면 빈 문자열입니다. */
  nicknameColor: string;
  /** 어두운 theme용 닉네임 색상입니다. 값이 없으면 빈 문자열입니다. */
  nicknameColorDark: string;
  /** 누적 구독 개월 원본 값입니다. */
  accumulatedSubscriptionMonth: string;
  /** 대표 구독 퍼스널콘 선택에 쓰이는 원본 개월 값입니다. */
  representativePersonalconMonth: string;
  /** 응원팀 번호입니다. field가 없으면 `-1`입니다. */
  cheerTeamNumber: number;
}

/** 일반 채널과 relay 채널에서 사용하는 별풍선 후원 payload입니다. */
export interface BalloonData {
  /** 후원을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 후원자 ID입니다. */
  senderId: string;
  /** 후원자 닉네임입니다. */
  senderNickname: string;
  /** 후원한 별풍선 개수입니다. */
  count: number;
  /** 서버의 팬클럽 가입 순번. 중복·건너뜀·수신 순서 역전이 있을 수 있습니다. */
  fanOrder: number;
  /** `fanOrder`가 양수여서 팬클럽 가입 안내 대상인지 나타냅니다. */
  becameFanClub: boolean;
  /** 효과 resource의 원본 파일 이름입니다. */
  fileName: string;
  /** 원본 기본 효과 플래그. false여도 SOOP 제공 스타즈 별풍선일 수 있습니다. */
  isDefault: boolean;
  /** 공식 플레이어의 파일명 규칙으로 판정한 스트리머 시그니처 별풍선입니다. */
  isSignatureBalloon: boolean;
  /** 열혈팬 관련 원본 단계 값입니다. `1`은 열혈팬 가입 안내와 일치합니다. */
  topFanLevel: number;
  /** `topFanLevel`이 `1`인지 나타냅니다. */
  becameTopFan: boolean;
  /** TTS 관련 원본 값. 유무·차이·일치만으로 목소리 종류, 메시지 또는 실제 재생 여부를 판정하지 않습니다. */
  ttsData: string;
  /** 후원자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
  /** 일반 채널은 `false`, 서브 채널 이벤트는 `true`입니다. */
  relay: boolean;
}

/** 스티커 후원 payload입니다. 공개 이름은 공식 fan-letter opcode를 유지합니다. */
export interface FanLetterData {
  /** 후원을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 후원을 받은 방송인 닉네임입니다. */
  streamerNickname: string;
  /** 스티커를 보낸 사용자 ID입니다. */
  senderId: string;
  /** 스티커를 보낸 사용자 닉네임입니다. */
  senderNickname: string;
  /** 스티커 상품의 원본 종류 값입니다. */
  itemType: number;
  /** 보낸 스티커 개수입니다. */
  count: number;
  /** 서포터 가입 순번입니다. `0`이면 신규 가입 안내가 없습니다. */
  supporterOrder: number;
  /** 발신자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 일반 채널은 `false`, 서브 채널 이벤트는 `true`입니다. */
  relay: boolean;
}

/** 자동·수동 슬로우 모드의 초 단위 시간입니다. */
export interface SlowModeData {
  /** 자동 슬로우 모드의 대기 시간(초)입니다. */
  automaticSeconds: number;
  /** 수동 슬로우 모드의 대기 시간(초)입니다. */
  manualSeconds: number;
}

/** 일반 채널과 relay 채널에서 사용하는 초콜릿 후원 payload입니다. */
export interface ChocolateData {
  /** 초콜릿을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 초콜릿을 보낸 사용자 ID입니다. */
  senderId: string;
  /** 초콜릿을 보낸 사용자 닉네임입니다. */
  senderNickname: string;
  /** 보낸 초콜릿 개수입니다. */
  count: number;
  /** 일반 채널은 `false`, 서브 채널 이벤트는 `true`입니다. */
  relay: boolean;
}

/** 사용 중인 아이템의 남은 시간입니다. */
export interface ItemUsingData {
  /** 아이템의 남은 시간(초)입니다. */
  remainingSeconds: number;
  /** `Math.round(remainingSeconds / 60)`으로 계산한 분 단위 값입니다. */
  remainingMinutes: number;
}

/** 확인된 경우 정규화한 상품 메타데이터를 포함하는 구독 세리머니 payload입니다. */
export interface FollowItemData {
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 구독 대상 사용자 ID입니다. */
  receiverId: string;
  /** 구독한 사용자 ID입니다. */
  senderId: string;
  /** 구독한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 구독 상품의 원본 종류 값입니다. */
  itemType: number;
  /** 원본 구독 tier입니다. `1`은 베이직, `2`는 플러스입니다. */
  tier: number;
  /** `tier`를 정규화한 구독 tier입니다. */
  subscriptionTier: SubscriptionTier;
  /** 상품 기간은 `subscriptionProduct.month`에 있습니다. 알 수 없는 상품은 `null`입니다. */
  subscriptionProduct: SubscriptionProduct | null;
  /** 상품 번호가 VOD용인지 일반 방송용인지 나타냅니다. 상품표에 없으면 `unknown`입니다. */
  subscriptionSource: "live" | "vod" | "unknown";
  /** 구독자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
}

/** 정규화한 구독 티어입니다. */
export type SubscriptionTier = "basic" | "plus" | "unknown";

/** 공식 플레이어의 구독 상품표에서 가져온 상품 메타데이터입니다. */
export interface SubscriptionProduct {
  /** 상품표의 원본 종류 값입니다. */
  itemType: number;
  /** VOD용 상품 종류 값이며 없는 상품은 `null`입니다. */
  vodItemType: number | null;
  /** `1`은 베이직, `2`는 플러스입니다. */
  tier: 1 | 2;
  /** `tier`를 정규화한 구독 tier입니다. */
  subscriptionTier: Exclude<SubscriptionTier, "unknown">;
  /** 해당 이벤트의 상품 번호로 조회한 레벨이며, 선물권 사용 전후에 다를 수 있습니다. */
  level: 1 | 2 | 3 | 4 | 5;
  /** 상품 기간(개월). 연속 구독 세리머니의 화면 표시 개월과 별개입니다. */
  month: 1 | 3 | 6 | 12;
  /** 공식 상품표의 자동 결제 flag입니다. */
  isAutoPay: boolean;
  /** 구형 상품인지 나타냅니다. */
  isLegacy: boolean;
  /** 공식 상품표의 세리머니 플래그. 개별 이벤트의 화면 표시 여부를 보장하지 않습니다. */
  isCeremony: boolean;
  /** 공식 상품표의 선물 문맥 조회 플래그. 다른 이벤트의 취득 경로를 단독으로 판정하지 않습니다. */
  isGift: boolean;
  /** 공식 상품표의 체험권 flag입니다. */
  isTrial: boolean;
}

/** 연속 구독 개월과 누적 구독 개월을 포함한 구독 세리머니입니다. */
export interface FollowItemEffectData {
  /** 구독 대상 방송인 ID입니다. */
  streamerId: string;
  /** 구독자 ID입니다. */
  senderId: string;
  /** 구독자 닉네임입니다. */
  senderNickname: string;
  /** 화면 문구와 개월별 이미지에 표시되는 연속 구독 개월입니다. */
  month: number;
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 구독 상품의 원본 종류 값입니다. */
  itemType: number;
  /** `month`와 별도로 전달되는 누적 구독 개월입니다. */
  accumulatedMonth: number;
  /** 원본 구독 tier입니다. `1`은 베이직, `2`는 플러스입니다. */
  tier: number;
  /** `tier`를 정규화한 구독 tier입니다. */
  subscriptionTier: SubscriptionTier;
  /** 공식 상품표에서 찾은 메타데이터이며 알 수 없는 상품은 `null`입니다. */
  subscriptionProduct: SubscriptionProduct | null;
  /** 구독자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
}

/** 매니저 상태 변경과 판정된 사용자 상태입니다. */
export interface SetSubBjData {
  /** 상태가 변경된 사용자 ID입니다. */
  userId: string;
  /** 사용자의 원본 복합 flag입니다. */
  userFlag: string;
  /** 상태가 변경된 사용자 닉네임입니다. */
  nickname: string;
  /** 매니저 지정·해임 안내의 숨김 원본 값. 사용자나 매니저 배지의 숨김 여부가 아닙니다. */
  hide: number;
  /** 공식 플레이어는 `hide === 1`일 때만 안내를 숨깁니다. false여도 채팅창이 닫혀 있으면 표시하지 않습니다. */
  hidden: boolean;
  /** `userFlag`를 판정한 사용자 상태입니다. */
  userStatus: UserStatus;
}

/** 독립적으로 전달되는 운영자 공지 본문입니다. */
export interface AdminNoticeData {
  /** 운영자 공지 본문입니다. */
  message: string;
}

/** VOD에서 후원되고 다음 라이브 방송에서 전달되는 별풍선 정보입니다. */
export interface VodBalloonData {
  /** 후원을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 후원자 ID입니다. */
  senderId: string;
  /** 후원자 닉네임입니다. */
  senderNickname: string;
  /** 다음 라이브에서 합산해 전달된 VOD 별풍선 개수입니다. */
  balloonCount: number;
  /** 효과 resource의 원본 파일 이름입니다. */
  fileName: string;
  /** 원본 기본 효과 flag입니다. `false`만으로 시그니처 풍선을 판정하지 않습니다. */
  isDefault: boolean;
  /** 공식 플레이어의 파일명 규칙으로 판정한 스트리머 시그니처 별풍선입니다. */
  isSignatureBalloon: boolean;
  /** 채팅방 번호의 원본 문자열입니다. */
  chatNo: string;
  /** 후원자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
}

/** 애드벌룬 효과, 발신자, 팬 상태와 표시 리소스입니다. */
export interface AdconEffectData {
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 후원을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 발신자 닉네임입니다. */
  senderNickname: string;
  /** 플레이어가 전달한 기본 메시지입니다. */
  message: string;
  /** 플레이어가 전달한 보조 메시지입니다. */
  secondaryMessage: string;
  /** 화면에 표시할 출처·상품 제목이며 값이 없을 수 있습니다. */
  title: string;
  /** 표시할 이미지 URL입니다. */
  imageUrl: string;
  /** 기본 표시 이미지 URL입니다. */
  defaultImageUrl: string;
  /** 전송 개수입니다. */
  count: number;
  /** 서버의 팬클럽 가입 순번. 다른 후원 이벤트와 수신 순서가 역전될 수 있습니다. */
  fanOrder: number;
  /** `fanOrder`가 양수여서 팬클럽 가입 안내 대상인지 나타냅니다. */
  becameFanClub: boolean;
  /** 이번 이벤트가 열혈팬 가입 안내 대상인지 나타냅니다. */
  isTopFan: boolean;
  /** 팬클럽 회장 여부입니다. */
  isFanChief: boolean;
  /** 플레이어의 서브 채널 flag입니다. 구독플러스 방 여부가 아닙니다. */
  isSubRoom: boolean;
  /** 발신자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
}

/** 방송국·VOD 애드벌룬의 발신자와 표시 리소스입니다. */
export interface StationAdconData {
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 발신자 ID입니다. 서버가 빈 문자열을 보낼 수 있습니다. */
  senderId: string;
  /** 발신자 닉네임입니다. 빈 값이어도 제목으로 대체하지 않습니다. */
  senderNickname: string;
  /** 전송 개수입니다. */
  count: number;
  /** 표시할 이미지 URL입니다. */
  imageUrl: string;
  /** 서버가 전달한 원본 제목이며 화면 문구보다 길 수 있습니다. 발신자 닉네임의 대체값이 아닙니다. */
  title: string;
  /** 채팅방 번호의 원본 문자열입니다. */
  chatNo: string;
  /** 발신자 언어 관련 원본 값입니다. */
  senderLanguage: string;
  /** 플레이어의 URL 보정용 원본 값입니다. */
  urlModify: string;
}

/** 일반 채널과 relay 채널에서 사용하는 상품 구매 payload입니다. */
export interface GoodsPurchaseData {
  /** 상품 종류의 원본 숫자입니다. */
  goodsType: number;
  /** 상품을 판매한 방송인 ID입니다. */
  streamerId: string;
  /** 구매자 ID입니다. */
  buyerId: string;
  /** 구매자 닉네임입니다. */
  buyerNickname: string;
  /** 상품 이름입니다. */
  goodsName: string;
  /** 구매한 상품 개수입니다. */
  count: number;
  /** 일반 채널은 `false`, 서브 채널 이벤트는 `true`입니다. */
  relay: boolean;
}

/** 원본 동작 값과 stream URL이 있는 VR 방송 알림입니다. */
export interface VrNotificationData {
  /** VR 동작의 원본 숫자입니다. */
  action: number;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** VR 방송 식별자입니다. */
  vrId: string;
  /** RTMP stream URL입니다. */
  rtmpUrl: string;
  /** HLS stream URL입니다. */
  hlsUrl: string;
  /** VR 종류의 원본 숫자입니다. */
  vrType: number;
}

/** 정규화한 모바일 방송 일시정지 동작입니다. */
export type MobileBroadcastPauseAction = "pause" | "resume" | "unknown";

/** 모바일 방송 일시정지 상태와 정규화한 동작입니다. */
export interface MobileBroadcastPauseData {
  /** 원본 상태입니다. `0`은 일시정지, `1`은 재개입니다. */
  state: number;
  /** `state`를 정규화한 동작입니다. */
  action: MobileBroadcastPauseAction;
}

/** 강퇴 취소 상태와 대상 사용자 정보입니다. */
export interface KickAndCancelData {
  /** 강퇴 취소 상태의 원본 숫자입니다. */
  state: number;
  /** `state`가 `1`인지 나타냅니다. */
  cancelled: boolean;
  /** 대상 사용자 ID입니다. */
  userId: string;
  /** 대상 사용자 닉네임입니다. */
  nickname: string;
}

/** 강퇴된 사용자와 명령을 실행한 주체입니다. */
export interface KickUserListEntry {
  /** 강퇴된 사용자 ID입니다. */
  userId: string;
  /** 강퇴된 사용자 닉네임입니다. */
  nickname: string;
  /** 서버가 전달한 시각의 원본 문자열입니다. */
  time: string;
  /** 강퇴 명령 주체의 사용자 ID입니다. */
  commanderId: string;
  /** 강퇴 명령 주체의 닉네임입니다. */
  commanderNickname: string;
  /** 강퇴 명령 주체의 원본 복합 flag입니다. */
  commanderFlag: string;
  /** `commanderFlag`를 판정한 명령 주체 상태입니다. */
  commanderStatus: UserStatus;
}

/** 강퇴된 사용자 batch입니다. */
export interface KickUserListData {
  /** 강퇴된 사용자 목록입니다. */
  users: readonly KickUserListEntry[];
}

/** 관리자 채팅 사용자 목록의 개별 사용자입니다. */
export interface AdminChatUserInfo {
  /** 관리자 채팅 사용자 ID입니다. */
  userId: string;
  /** 관리자 채팅 사용자 닉네임입니다. */
  nickname: string;
  /** 사용자의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 사용자 상태입니다. */
  userStatus: UserStatus;
}

/** 정규화하지 않은 상태값을 포함한 관리자 채팅 사용자 목록입니다. */
export interface AdminChatUserData {
  /** 목록 상태의 원본 값입니다. `1`일 때만 `users`를 구조화합니다. */
  state: number;
  /** 관리자 채팅 사용자 목록입니다. */
  users: readonly AdminChatUserInfo[];
}

/** 아이템 판매 효과의 발신자, 메시지와 표시 리소스입니다. */
export interface ItemSellEffectData {
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 발신자 닉네임입니다. */
  senderNickname: string;
  /** 플레이어가 전달한 기본 메시지입니다. */
  message: string;
  /** 플레이어가 전달한 보조 메시지입니다. */
  secondaryMessage: string;
  /** 표시할 제목입니다. */
  title: string;
  /** 표시할 이미지 URL입니다. */
  imageUrl: string;
  /** 기본 표시 이미지 URL입니다. */
  defaultImageUrl: string;
  /** 판매 효과의 원본 개수입니다. */
  count: number;
}

/** 아이템 드롭의 이름, 메시지와 표시 이미지입니다. */
export interface ItemDropsData {
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 아이템 드롭 이름입니다. */
  name: string;
  /** 아이템 드롭 메시지입니다. */
  message: string;
  /** 표시할 이미지 URL입니다. */
  imageUrl: string;
}

/** 운영자 상태 플래그 변경입니다. */
export interface AdminFlagData {
  /** 운영자 상태의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 운영자 상태입니다. */
  userStatus: UserStatus;
}

/** 발신자, 수신자와 정규화한 상품 메타데이터가 있는 구독 선물입니다. */
export interface GiftSubscriptionData {
  /** 구독을 선물한 사용자 ID입니다. */
  senderId: string;
  /** 구독을 선물한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 구독을 받은 사용자 ID입니다. */
  receiverId: string;
  /** 구독을 받은 사용자 닉네임입니다. */
  receiverNickname: string;
  /** 구독 대상 방송인 ID입니다. */
  streamerId: string;
  /** 구독 대상 방송인 닉네임입니다. */
  streamerNickname: string;
  /** 구독 상품의 원본 종류 값입니다. */
  itemType: number;
  /** 상품 티어와 기간은 이 메타데이터에서 읽습니다. 알 수 없는 상품은 `null`입니다. */
  subscriptionProduct: SubscriptionProduct | null;
  /** 구독 상품 코드의 원본 값입니다. */
  itemCode: string;
  /** 구독 여부의 원본 숫자 flag입니다. */
  isSubscription: number;
  /** 구독 유형의 원본 값입니다. */
  subscriptionType: string;
  /** 구독 기간의 원본 값입니다. */
  subscriptionPeriod: string;
  /** 구독 잔여 기간 관련 원본 값입니다. */
  subscriptionRemain: number;
  /** 구독 결제 횟수 관련 원본 값입니다. */
  subscriptionPayCount: number;
}

/** 랜덤 구독 선물 알림입니다. 수신자 목록이나 개별 선물과 연결하는 키는 포함되지 않습니다. */
export interface SubRandomCeremonyData {
  /** 구독을 선물한 사용자 ID입니다. */
  senderId: string;
  /** 구독을 선물한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 공식 플레이어가 전달한 채널 번호입니다. */
  channelNumber: number;
  /** 이번 알림의 선물 개수입니다. */
  count: number;
  /** 구독 상품의 원본 종류 값입니다. */
  itemType: number;
  /** 선물 문맥으로 조회한 상품 메타데이터. 일치하는 상품이 없으면 `null`입니다. */
  subscriptionProduct: SubscriptionProduct | null;
  /** 구독 선물 랭킹 원본 값. 공식 UI는 양수일 때만 랭킹 안내를 표시하며 관찰된 `-1`도 보존합니다. */
  rank: number;
}

/** 랜덤 퀵뷰 선물 알림입니다. 수신자 목록이나 개별 선물과 연결하는 키는 포함되지 않습니다. */
export interface QuickRandomCeremonyData {
  /** 퀵뷰를 선물한 사용자 ID입니다. */
  senderId: string;
  /** 퀵뷰를 선물한 사용자 닉네임입니다. */
  senderNickname: string;
  /** 공식 플레이어가 전달한 채널 번호입니다. */
  channelNumber: number;
  /** 이번 알림의 선물 개수입니다. */
  count: number;
  /** 퀵뷰 상품의 원본 종류 값입니다. */
  itemType: number;
  /** `itemType`을 공식 상품표로 정규화한 종류입니다. */
  quickViewProduct: QuickViewProduct;
  /** 상품 기간(일)이며 알 수 없는 상품이면 `null`입니다. */
  durationDays: number | null;
}

/** 영상풍선 후원과 표시 리소스 메타데이터입니다. */
export interface VideoBalloonData {
  /** 채팅방 번호의 원본 문자열입니다. */
  chatNo: string;
  /** 후원을 받은 방송인 ID입니다. */
  streamerId: string;
  /** 후원자 ID입니다. */
  senderId: string;
  /** 후원자 닉네임입니다. */
  senderNickname: string;
  /** 후원한 별풍선 개수입니다. */
  balloonCount: number;
  /** 서버의 팬클럽 가입 순번입니다. 신규 가입이 아니면 `0`입니다. */
  fanOrder: number;
  /** `fanOrder`가 양수여서 팬클럽 가입 안내 대상인지 나타냅니다. */
  becameFanClub: boolean;
  /** 열혈팬 관련 원본 단계 값입니다. */
  topFanLevel: number;
  /** relay 관련 원본 값입니다. */
  relay: string;
  /** 효과 resource의 원본 파일 이름입니다. */
  fileName: string;
  /** 원본 기본 효과 flag입니다. */
  isDefault: boolean;
  /** 플레이어가 해석하지 않는 추가 원본 값. 영상의 수동·자동 재생 여부를 나타내지 않습니다. */
  extraData: string;
}

/** 발신자와 구독 메타데이터가 있는 OGQ 이미지 채팅 메시지입니다. */
export interface OgqEmoticonData {
  /** 채팅방 번호의 원본 문자열입니다. */
  chatNo: string;
  /** OGQ 이미지와 함께 렌더링할 원본입니다. 일반 text 또는 이미지로 변환되는 이모티콘 토큰일 수 있습니다. */
  message: string;
  /** OGQ 이모티콘 그룹 식별자입니다. */
  groupId: string;
  /** 그룹 내 이모티콘 식별자입니다. */
  subId: string;
  /** 이모티콘 버전의 원본 값입니다. */
  version: string;
  /** 발신자 ID입니다. */
  senderId: string;
  /** 발신자 닉네임입니다. */
  senderNickname: string;
  /** 발신자 상태의 원본 복합 flag입니다. */
  senderFlag: string;
  /** `senderFlag`를 판정한 발신자 상태입니다. */
  senderStatus: UserStatus;
  /** 원본 BGR 값을 변환한 CSS `#RRGGBB` 색상입니다. 값이 없으면 빈 문자열입니다. */
  color: string;
  /** 플레이어의 원본 채팅 언어 값입니다. */
  chatLanguage: number;
  /** 이모티콘 종류의 원본 숫자입니다. */
  emoticonType: number;
  /** 이미지 확장자. `png`인 움직이는 이미지도 관찰됐습니다. */
  extension: string;
  /** SOOP이 계산한 연속 구독 개월 원본 값입니다. */
  subscriptionMonth: string;
  /** 밝은 theme용 닉네임 색상입니다. */
  nicknameColor: string;
  /** 어두운 theme용 닉네임 색상입니다. */
  nicknameColorDark: string;
  /** 누적 구독 개월 원본 값입니다. */
  accumulatedSubscriptionMonth: string;
  /** 대표 구독 퍼스널콘 선택에 쓰이는 원본 개월 값입니다. */
  representativePersonalconMonth: string;
  /** 애니메이션 관련 원본 값. `"0"` 표본은 정지 이미지, `"1"` 표본은 움직이는 이미지와 대조됐습니다. */
  animation: string;
  /** 응원팀 번호입니다. field가 없으면 `-1`입니다. */
  cheerTeamNumber: number;
}

/** 방송인 공지의 표시 상태와 본문입니다. */
export interface BjNoticeData {
  /** 공지 표시 상태의 원본 숫자입니다. */
  show: number;
  /** 공지 본문입니다. */
  message: string;
}

/** 알려진 미션 payload가 나타내는 동작입니다. */
export type MissionAction = "gift" | "notice" | "settle";
/** 정규화한 도전미션 결과입니다. */
export type ChallengeMissionStatus = "success" | "fail" | "unknown";

interface MissionBaseData {
  /** decoding한 원본 JSON 객체입니다. */
  payload: Readonly<Record<string, unknown>>;
}

interface ChallengeMissionBaseData extends MissionBaseData {
  /** 도전미션 판별값입니다. */
  missionKind: "challenge";
  /** 같은 미션의 후원·결과·정산을 연결하는 key입니다. */
  missionKey: number;
  /** 개별 알림 식별자입니다. settle에서는 대응하는 `missionSettle`과 같습니다. */
  uuid: string;
}

/** 도전미션 후원 payload입니다. */
export interface ChallengeMissionGiftData extends ChallengeMissionBaseData {
  /** 도전미션 후원 판별값입니다. */
  action: "gift";
  /** 미션 제목입니다. */
  title: string;
  /** 이번 후원의 별풍선 개수입니다. */
  giftCount: number;
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** relay 여부입니다. */
  isRelay: boolean;
  /** 미션 이미지의 원본 값입니다. */
  image: string;
  /** 후원자 ID입니다. */
  senderId: string;
  /** 후원자 닉네임입니다. */
  senderNickname: string;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 방송인 닉네임입니다. */
  streamerNickname: string;
}

/** 도전미션 결과 알림입니다. */
export interface ChallengeMissionNoticeData extends ChallengeMissionBaseData {
  /** 도전미션 결과 알림 판별값입니다. */
  action: "notice";
  /** 미션 제목입니다. */
  title: string;
  /** 원본 `mission_status`를 정규화한 결과입니다. */
  status: ChallengeMissionStatus;
}

/** 도전미션 정산 알림입니다. */
export interface ChallengeMissionSettleData extends ChallengeMissionBaseData {
  /** 도전미션 정산 판별값입니다. */
  action: "settle";
  /** 미션 제목입니다. */
  title: string;
  /** 정산할 별풍선 개수입니다. */
  settleCount: number;
  /** relay 여부입니다. */
  isRelay: boolean;
  /** 미션 이미지의 원본 값입니다. */
  image: string;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 방송인 닉네임입니다. */
  streamerNickname: string;
}

interface BattleMissionBaseData extends MissionBaseData {
  /** 대결미션 판별값입니다. */
  missionKind: "battle";
  /** 같은 대결의 후원·결과·정산을 연결하는 key입니다. */
  missionKey: number;
}

/** 대결미션 후원 payload입니다. */
export interface BattleMissionGiftData extends BattleMissionBaseData {
  /** 대결미션 후원 판별값입니다. */
  action: "gift";
  /** 미션 제목입니다. */
  title: string;
  /** 이번 후원의 별풍선 개수입니다. */
  giftCount: number;
  /** relay 여부입니다. */
  isRelay: boolean;
  /** 미션 이미지의 원본 값입니다. */
  image: string;
  /** 후원자 ID입니다. */
  senderId: string;
  /** 후원자 닉네임입니다. */
  senderNickname: string;
  /** 이번 후원으로 성립한 팬클럽 가입 순번입니다. 신규 가입이 아니면 `0`입니다. */
  fanOrder: number;
  /** 열혈팬 관련 원본 단계 값입니다. */
  topFanLevel: number;
}

/** 대결미션 결과 알림입니다. */
export interface BattleMissionNoticeData extends BattleMissionBaseData {
  /** 대결미션 결과 알림 판별값입니다. */
  action: "notice";
  /** 무승부 여부입니다. true이면 승자·순위보다 우선합니다. */
  draw: boolean;
  /** 승리 팀의 원본 값입니다. */
  winner: string;
  /** 순위의 원본 숫자입니다. */
  rank: number;
  /** 플레이어가 전달한 현재 팀 이름입니다. */
  myTeamName: string;
}

/** 대결미션 정산 알림입니다. */
export interface BattleMissionSettleData extends BattleMissionBaseData {
  /** 대결미션 정산 판별값입니다. */
  action: "settle";
  /** 미션 제목입니다. */
  title: string;
  /** 해당 방송인이 정산으로 획득한 별풍선 개수입니다. 수신한 후원 합계와 다를 수 있습니다. */
  settleCount: number;
  /** 미션 이미지의 원본 값입니다. */
  image: string;
}

/** 알려진 대결미션 동작의 union입니다. */
export type BattleMissionData =
  | BattleMissionGiftData
  | BattleMissionNoticeData
  | BattleMissionSettleData;

/** 현재 버전이 해석하지 못하는 미션 JSON `type`의 fallback입니다. */
export interface UnknownMissionData extends MissionBaseData {
  /** 해석하지 못한 미션 종류 판별값입니다. */
  missionKind: "unknown";
  /** 해석하지 못한 미션 동작 판별값입니다. */
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
  /** 참여자 ID입니다. */
  userId: string;
  /** 참여자 닉네임입니다. */
  nickname: string;
  /** 해당 참여자의 후원 합계입니다. */
  contributionCount: number;
  /** 이번 정산으로 팬클럽에 새로 가입했는지 나타냅니다. */
  becameFanClub: boolean;
  /** 이번 정산으로 열혈팬이 되었는지 나타냅니다. */
  becameTopFan: boolean;
}

/** 도전미션 정산 참여자와 보존한 JSON payload입니다. */
export interface ChallengeMissionSettlementData {
  /** 도전미션 정산 판별값입니다. */
  missionKind: "challenge";
  /** 채팅방 번호입니다. */
  chatNo: number;
  /** 대응하는 `mission` settle 이벤트와 같은 식별자입니다. */
  uuid: string;
  /** `participants`에서 `becameFanClub`인 사용자가 있을 때만 가입 순번으로 사용합니다. */
  fanOrder: number;
  /** 참여자별 정산 결과입니다. */
  participants: readonly ChallengeMissionSettlementParticipant[];
  /** decoding한 원본 JSON 객체입니다. */
  payload: Readonly<Record<string, unknown>>;
}

/** 내부 schema를 모델링할 만큼 안정적이지 않아 객체로만 검증한 JSON입니다. */
export interface JsonObjectData {
  /** 내부 field를 추측하지 않고 보존한 원본 JSON 객체입니다. */
  payload: Readonly<Record<string, unknown>>;
}

/** 구독 세리머니 버튼 상태입니다. */
export interface SubscriptionCeremonyButtonData {
  /** 버튼에 표시할 연속 구독 개월 원본 값입니다. */
  subscriptionMonth: string;
}

/** Savvy 영상 알림입니다. */
export interface SavvyNoticeData {
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 사용자 ID입니다. */
  userId: string;
  /** 영상 번호의 원본 문자열입니다. */
  videoNumber: string;
}

/** 전역 자막 본문과 원본 timestamp입니다. */
export interface GlobalSubtitleData {
  /** 채팅방 번호의 원본 문자열입니다. */
  chatNo: string;
  /** 방송인 ID입니다. */
  streamerId: string;
  /** 자막 언어의 원본 값입니다. */
  language: string;
  /** 자막 본문입니다. */
  subtitle: string;
  /** 플레이어가 전달한 원본 시각 값입니다. */
  timestamp: string;
}

/** 꽃가루 효과 종류와 효과를 발생시킨 사용자입니다. */
export interface ConfettiData {
  /** 효과 종류의 원본 숫자입니다. */
  confettiType: number;
  /** 효과를 발생시킨 사용자 ID입니다. */
  senderId: string;
}

/** 사용자의 응원팀 변경입니다. */
export interface CheerTeamChangeData {
  /** 대상 사용자 ID입니다. */
  userId: string;
  /** 응원팀 번호의 원본 문자열입니다. */
  teamNumber: string;
}

/** Nightbot timeout 대상, 정규화한 사유와 원본 메타데이터입니다. */
export interface NightbotTimeoutData {
  /** timeout 대상 사용자 ID입니다. */
  userId: string;
  /** timeout 대상 사용자 닉네임입니다. */
  nickname: string;
  /** timeout 사유의 원본 숫자 code입니다. */
  reasonCode: number;
  /** `reasonCode`를 언어 중립 값으로 정규화한 사유입니다. */
  reason: NightbotTimeoutReason;
  /** 채널 번호의 원본 문자열입니다. */
  channelNumber: string;
  /** timeout과 관련된 원본 메시지입니다. */
  message: string;
  /** timeout 시간의 원본 숫자이며 단위는 정규화하지 않습니다. */
  time: number;
  /** 대상 사용자의 원본 복합 flag입니다. */
  userFlag: string;
  /** `userFlag`를 판정한 대상 사용자 상태입니다. */
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
  "0103": StationAdconData;
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
  "0142": SubRandomCeremonyData;
  "0143": QuickRandomCeremonyData;
  "0144": GiftSubscriptionData;
}

type DecodedData<O extends KnownSoopOpcode> = O extends keyof DecodedDataByOpcode
  ? DecodedDataByOpcode[O]
  : FieldEventData;

/** 알려진 opcode 하나의 typed event이며 `O`를 생략하면 전체 union입니다. */
export type KnownSoopEvent<O extends KnownSoopOpcode = KnownSoopOpcode> = O extends KnownSoopOpcode
  ? {
      /** 이벤트 이름으로 사용하는 판별 값입니다. */
      type: (typeof EVENT_CATALOG)[O]["type"];
      /** SOOP 채팅 프로토콜의 네 자리 opcode입니다. */
      opcode: O;
      /** 이벤트를 decoding한 Unix epoch millisecond 시각입니다. */
      receivedAt: number;
      /** 손실 없이 보존한 원본 packet입니다. */
      raw: RawPacket;
      /** opcode별로 decoding한 payload입니다. */
      data: DecodedData<O>;
    }
  : never;

/** {@link EVENT_CATALOG}에 없는 opcode를 손실 없이 제공하는 fallback입니다. */
export interface UnknownSoopEvent {
  /** 카탈로그에 없는 opcode의 판별값입니다. */
  type: "unknown";
  /** 카탈로그에 없는 원본 opcode입니다. */
  opcode: string;
  /** 이벤트를 decoding한 Unix epoch millisecond 시각입니다. */
  receivedAt: number;
  /** 손실 없이 보존한 원본 packet입니다. */
  raw: RawPacket;
  /** 의미를 확정하지 않고 보존한 field입니다. */
  data: FieldEventData;
}

/** 모든 알려진 이벤트와 미래 호환용 unknown 이벤트의 union입니다. */
export type SoopEvent = KnownSoopEvent | UnknownSoopEvent;

/** 알려진 공개 이벤트 이름을 각 이벤트 payload에 연결합니다. */
export type SoopProtocolEventMap = {
  [O in KnownSoopOpcode as (typeof EVENT_CATALOG)[O]["type"]]: KnownSoopEvent<O>;
};
