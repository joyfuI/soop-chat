# 이벤트 레퍼런스

이 문서는 `soop-chat` 사용자가 받는 공개 채팅 프로토콜 이벤트 API를 설명합니다. `stateChange`, `reconnecting`, `error`, `ended` 같은 연결 수명주기 이벤트는 README의 [연결 상태](../README.md#연결-상태)와 [이벤트](../README.md#이벤트) 설명을 참고하세요. WebSocket 프레임, payload 필드 순서, 연결 절차와 관찰 근거는 [프로토콜 조사 노트](protocol.md)를 참고하세요.

## 공통 이벤트 구조

모든 채팅 프로토콜 이벤트는 다음 공통 필드를 가집니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `type` | `string` | `chatMessage`, `sendBalloon`처럼 opcode를 의미 있는 이름으로 바꾼 판별 값 |
| `opcode` | `string` | SOOP 채팅 프로토콜의 네 자리 opcode |
| `receivedAt` | `number` | 이벤트를 디코딩한 Unix epoch 밀리초 시각 |
| `raw` | `RawPacket` | 손실 없이 보존한 원본 패킷 |
| `data` | `object` | 이벤트별로 구조화한 값 |

`raw`에는 다음 값이 있습니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `opcode` | `string` | 원본 opcode |
| `flags` | `string` | 프레임 헤더의 두 자리 원본 플래그 |
| `payload` | `Uint8Array` | 헤더를 제외한 원본 payload 바이트 |
| `text` | `string` | payload를 UTF-8로 디코딩한 문자열 |
| `fields` | `readonly string[]` | `text`를 form feed(`0x0c`)로 나눈 필드 배열 |

의미가 확인된 62개 opcode는 `data`에 이름 있는 필드를 제공합니다. 그 밖의 known opcode와 `unknown` 이벤트는 다음 형태로 원본 필드만 제공합니다.

```ts
interface FieldEventData {
  fields: readonly string[];
}
```

필드 의미를 확인하지 못한 경우에는 이름을 추측하지 않습니다. 문자열 필드는 빈 문자열일 수 있고, 원본 숫자·플래그의 열거 의미가 확인되지 않은 경우 아래 표에 따로 표시합니다. `raw`와 `data.fields`에는 사용자 ID, 닉네임, 메시지 등 개인정보가 포함될 수 있습니다.

서버가 보내는 사용자 ID에는 기본 ID 뒤에 `(2)`처럼 `(<숫자>)` 형태의 접미사가 붙을 수 있습니다. 발생 조건과 동일성 규칙은 확인되지 않았으므로 라이브러리는 접미사를 제거하지 않고 원본 문자열을 제공합니다.

## 사용자 상태

사용자 원본 플래그가 있는 이벤트는 공식 플레이어와 SOOP Chat SDK의 판정을 `UserStatus`로 제공합니다. 각 권한은 동시에 설정될 수 있으므로 하나의 역할로 축약하지 않습니다.

| 필드 | 근거 비트 | 의미 |
|---|---|---|
| `flag1`, `flag2` | 원본 복합 플래그 | 공식 주·보조 플래그 숫자 |
| `isAdmin` | `flag1 & 1` | 운영자 플래그 |
| `isBJ` | `flag1 & 4` | 방송인 플래그 |
| `isGuest` | `flag1 & 16` | 공식 `GUEST` 플래그 |
| `isFan` | `flag1 & 32` | 팬클럽 플래그 |
| `isFixedManager` | `flag1 & 64` | 플레이어 UI의 `fixedManager` 플래그 |
| `isManager` | `flag1 & 256` | 매니저 플래그 |
| `isFemale` | `flag1 & 512` | 여성 플래그 |
| `isMobile` | `flag1 & 16384` | 모바일 접속 플래그 |
| `isTopFan` | `flag1 & 32768` | 열혈팬 플래그 |
| `isWhisperAllowed` | `flag1 & 2^17 === 0` | 공식 `NODIRECT` 비트가 없는 귓속말 허용 상태 |
| `hasAppliedQuickview` | `flag1 & 2^19` | 퀵뷰 적용 여부 |
| `isSupporter` | `flag1 & 2^20` | 서포터 플래그 |
| `isAtagAllow` | `flag2 & 32` | 공식 `ATAG_ALLOW` 플래그 |
| `isEmployee` | `flag2 & 1024` | 공식 `EMPLOYEE` 플래그 |
| `isCleanAti` | `flag2 & 2048` | 공식 `CLEANATI` 플래그 |
| `isEmployeeAdminChat` | `flag2 & 8192` | 공식 `ADMINCHAT` 플래그 |
| `isFollower` | `flag2 & (2^18 \| 2^19 \| 2^20)` | 구독자 여부 |
| `followerTier` | `FOLLOW_TIER1/2/3` | 구독 티어 `1/2/3`. 비구독자는 `0` |
| `isHideSex` | `flag2 & 2^25` | 플레이어 UI의 성별 숨김 플래그 |

`login.userStatus`, `joinChannel.userStatus`, `chatUser`의 사용자별 `userStatus`, `setNickname.userStatus`, `setSubBj.userStatus`, `adminChatUser`의 사용자별 `userStatus`, `setAdminFlag.userStatus`, `nightbotTimeout.userStatus`에서 사용합니다. 발신자 플래그는 `chatMessage.senderStatus`, `directChat.senderStatus`, `managerChat.senderStatus`, `ogqEmoticon.senderStatus`로, 강퇴 명령자는 `kickUserList.users[].commanderStatus`로 제공합니다. `setUserFlag`는 변경 후 `userStatus`와 변경 전 `previousUserStatus`를 모두 제공합니다.

구독플러스 방송의 13시간 5분 캡처에서 일반 채팅 31,715건의 발신자 155명은 모두 `followerTier=2`였습니다. `chatUser` 입장 사용자 1,362건 중 1,358건도 티어 2였고 나머지 4건은 방송인이었습니다. 이는 공식 `FOLLOW_TIER2` 판정과 구독플러스 방의 실제 참여자를 대조한 결과이며, 다른 티어의 일반적인 구독 의미를 방 접근 권한으로 확대 해석하지 않습니다.

플레이어의 `allowWhisper(false)`는 `NODIRECT` 비트를 추가하고 `allowWhisper(true)`는 제거합니다. 실방송 캡처의 `0012` 18건에서 이 비트가 추가되는 변경을 확인했습니다.

## 근거 수준

| 값 | 의미 |
|---|---|
| `observed` | 실방송 네트워크 패킷에서 직접 관찰했으며, 정밀 의미는 가능한 경우 화면과 대조 |
| `player` | 현재 SOOP 플레이어 코드에서 필드 순서나 동작을 확인 |
| `reference` | 참고 라이브러리의 디코더에서만 확인했으며 현재 실방송 표본은 없음 |
| `runtime` | 카탈로그에 없는 opcode를 실행 중 `unknown`으로 보존 |

이벤트 타입은 공식 플레이어의 `SVC_*` 이름을 기준으로 lower camel case로 정규화합니다. 필드명은 `bjID`·`bjId`·`bj_id`를 `streamerId`, `bj_nickname`·`bj_nick`을 `streamerNickname`, `sendNick`을 `senderNickname`으로 바꾸는 것처럼 역할이 분명한 영어 이름을 사용합니다. SOOP 고유 용어가 더 정확한 `fanOrder`, `personalcon` 등은 원래 용어를 유지합니다.

## 전체 이벤트 색인

`구조화`가 `fields`인 이벤트는 현재 `data.fields`만 제공합니다. `object`는 아래의 이벤트별 필드 표를, `JSON`은 파싱한 원본 JSON 객체를 제공합니다.

| Opcode | Event type | 의미 | `data` | 근거 |
|---|---|---|---|---|
| `0000` | `keepAlive` | 연결 유지 | fields | observed |
| `0001` | `login` | 로그인 연결 수립 | object | observed |
| `0002` | `joinChannel` | 채팅 채널 입장 | object | observed |
| `0003` | `quitChannel` | 채팅 채널 퇴장 | object | player |
| `0004` | `chatUser` | 채팅 사용자 입장·퇴장 | object | observed |
| `0005` | `chatMessage` | 일반 채팅 메시지 | object | observed |
| `0006` | `setChannelName` | 채널 이름 설정 | fields | reference |
| `0007` | `setBjStat` | 방송인 상태 설정 | object | observed |
| `0008` | `setDumb` | 채팅 음소거 설정 | object | observed |
| `0009` | `directChat` | 귓속말 | object | player |
| `0010` | `notice` | 공지 | fields | reference |
| `0011` | `kick` | 사용자 강제 퇴장 | fields | reference |
| `0012` | `setUserFlag` | 사용자 플래그 설정 | object | observed |
| `0013` | `setSubBj` | 매니저 상태 설정 | object | player |
| `0014` | `setNickname` | 닉네임 설정 | object | observed |
| `0015` | `serverStat` | 서버 상태 | fields | reference |
| `0016` | `unused16` | 미사용 | fields | reference |
| `0017` | `clubColor` | 클럽 색상 | fields | reference |
| `0018` | `sendBalloon` | 별풍선 후원 | object | observed |
| `0019` | `iceMode` | 아이스 모드 | fields | observed |
| `0020` | `sendFanLetter` | 팬레터 전송 | object | player |
| `0021` | `iceModeEx` | 확장 아이스 모드 | object | observed |
| `0022` | `getIceModeRelay` | 아이스 모드 릴레이 조회 | fields | reference |
| `0023` | `slowMode` | 슬로우 모드 | object | player |
| `0024` | `reloadBurnLevel` | 번 레벨 갱신 | fields | reference |
| `0025` | `blindKick` | 블라인드 강제 퇴장 | fields | reference |
| `0026` | `managerChat` | 매니저 채팅 | object | player |
| `0027` | `appendData` | 추가 데이터 | fields | reference |
| `0028` | `baseballEvent` | 야구 이벤트 | fields | reference |
| `0029` | `paidItem` | 유료 아이템 | fields | reference |
| `0030` | `topFan` | 열혈팬 | fields | reference |
| `0031` | `snsMessage` | SNS 메시지 | fields | reference |
| `0032` | `snsMode` | SNS 모드 | fields | reference |
| `0033` | `sendBalloonSub` | 별풍선 후원(서브 채널) | object | player |
| `0034` | `sendFanLetterSub` | 팬레터 전송(서브 채널) | object | player |
| `0035` | `topFanSub` | 열혈팬(서브 채널) | fields | reference |
| `0036` | `bjStickerItem` | 방송인 스티커 아이템 | fields | reference |
| `0037` | `chocolate` | 초콜릿 | object | player |
| `0038` | `chocolateSub` | 초콜릿(서브 채널) | object | player |
| `0039` | `topClan` | 상위 클랜 | fields | reference |
| `0040` | `topClanSub` | 상위 클랜(서브 채널) | fields | reference |
| `0041` | `superChat` | 슈퍼 채팅 | fields | reference |
| `0042` | `updateTicket` | 티켓 갱신 | fields | reference |
| `0043` | `notiGameRanker` | 게임 랭커 알림 | fields | reference |
| `0044` | `starCoin` | 스타코인 | fields | reference |
| `0045` | `sendQuickView` | 퀵뷰 선물 | object | observed |
| `0046` | `itemStatus` | 아이템 상태 | fields | reference |
| `0047` | `itemUsing` | 아이템 사용 중 | object | player |
| `0048` | `useQuickView` | 퀵뷰 사용 | fields | reference |
| `0050` | `notifyPoll` | 투표 알림 | object | observed |
| `0051` | `chatBlockMode` | 채팅 차단 모드 | fields | reference |
| `0052` | `bdmAddBlackInfo` | 블랙리스트 정보 추가 | fields | reference |
| `0053` | `setBroadInfo` | 방송 정보 설정 | fields | reference |
| `0054` | `banWord` | 금칙어 설정 | object | observed |
| `0058` | `sendAdminNotice` | 운영자 공지 | object | observed |
| `0065` | `freecatOwnerJoin` | Freecat 소유자 입장 | fields | player |
| `0070` | `buyGoods` | 상품 구매 | object | player |
| `0071` | `buyGoodsSub` | 상품 구매(서브 채널) | object | player |
| `0072` | `sendPromotion` | 프로모션 전송 | fields | reference |
| `0074` | `notifyVr` | VR 알림 | object | player |
| `0075` | `notifyMobBroadPause` | 모바일 방송 일시정지 알림 | object | player |
| `0076` | `kickAndCancel` | 강제 퇴장 및 취소 | object | player |
| `0077` | `kickUserList` | 강제 퇴장 사용자 목록 | object | player |
| `0078` | `adminChatUser` | 관리자 채팅 사용자 | object | player |
| `0079` | `cliDobaeInfo` | 도배 정보 | fields | reference |
| `0086` | `vodBalloon` | VOD 별풍선 | object | observed |
| `0087` | `adconEffect` | 애드벌룬 효과 | object | observed |
| `0088` | `closeBroad` | 방송 종료 | fields | observed |
| `0090` | `kickMsgState` | 강제 퇴장 메시지 상태 | object | observed |
| `0091` | `followItem` | 신규 구독 | object | observed |
| `0092` | `itemSellEffect` | 아이템 판매 효과 | object | player |
| `0093` | `followItemEffect` | 연속 구독 효과 | object | observed |
| `0094` | `translationState` | 번역 상태 | fields | observed |
| `0095` | `translation` | 번역 결과 | object | player |
| `0102` | `giftTicket` | 선물 티켓 | object | player |
| `0103` | `vodAdcon` | VOD 애드벌룬 | object | player |
| `0104` | `bjNotice` | 방송인 공지 | object | observed |
| `0105` | `videoBalloon` | 영상풍선 후원 | object | observed |
| `0107` | `stationAdcon` | 스테이션 애드벌룬 | object | observed |
| `0108` | `sendSubscription` | 구독 선물 | object | observed |
| `0109` | `ogqEmoticon` | OGQ 이모티콘 채팅 | object | observed |
| `0110` | `emoticonTicket` | 이모티콘 티켓 | fields | observed |
| `0111` | `itemDrops` | 아이템 드롭 | object | player |
| `0117` | `videoBalloonLink` | 영상풍선 링크 | fields | reference |
| `0118` | `ogqEmoticonGift` | OGQ 이모티콘 선물 | object | observed |
| `0119` | `adInBroadJson` | 방송 중 광고 JSON | JSON | player |
| `0120` | `gemItemSend` | 젬 아이템 전송 | object | player |
| `0121` | `mission` | 도전미션 또는 대결미션 | object | observed |
| `0122` | `liveCaption` | 라이브 자막 | JSON | player |
| `0125` | `missionSettle` | 도전미션 정산 | object | observed |
| `0126` | `setAdminFlag` | 관리자 플래그 설정 | object | player |
| `0127` | `chuserExtend` | 구독자 목록 | object | observed |
| `0128` | `adminChuserExtend` | 관리자용 채팅 사용자 확장 정보 | fields | reference |
| `0130` | `subscriptionCeremonyButton` | 구독 세리머니 버튼 | object | player |
| `0131` | `savvyNotice` | Savvy 알림 | object | player |
| `0136` | `globalSubtitle` | 전역 자막 | object | player |
| `0137` | `userLanguageSet` | 사용자 언어 설정 | fields | player |
| `0138` | `confetti` | 꽃가루 효과 | object | player |
| `0139` | `subtitleV2` | 라이브 자막 v2 | JSON | player |
| `0140` | `cheerTeamChange` | 응원팀 변경 | object | player |
| `0141` | `nightbotTimeout` | Nightbot 타임아웃 | object | player |
| future | `unknown` | 카탈로그에 없는 네 자리 opcode | fields | runtime |

`0088 closeBroad`는 `data.fields`만 제공하지만 동작은 특별합니다. 라이브러리는 이벤트를 먼저 전달하고 `ended: { reason: "offline" }`을 한 번 발생시킨 뒤, 소켓을 정상 종료하며 재연결하지 않습니다.

## 구조화된 이벤트

### 연결 응답 (`0001`, `0002`, `0003`)

| 이벤트 | 공개 필드 |
|---|---|
| `login` (`0001`) | `userId: string`, `userFlag: string`, `userStatus: UserStatus` |
| `joinChannel` (`0002`) | `chatNo: string`, `streamerId: string`, `maxManagerCount: number`, `familyNickname: string`, `familyNicknamePosition: number`, `userFlag: string`, `userStatus: UserStatus` |
| `quitChannel` (`0003`) | `kickType: number`, `actor: "streamer" \| "manager" \| "admin" \| "unknown"`, `adminKickCount: number`, `adminNickname: string`, `bannedRoomStreamerId: string`, `bannedRoomStreamerNickname: string` |

`quitChannel`은 현재 시청자 자신이 채널에서 강제 퇴장될 때 공식 플레이어가 종료 사유를 만드는 패킷입니다. 다른 사용자의 강퇴 알림은 `chatUser`의 `isKicked`로 구분합니다.

### `chatUser` (`0004`)

채팅 사용자 입장과 퇴장을 `action`으로 구분합니다. 입장은 한 패킷에 여러 사용자가 들어올 수 있습니다.

```ts
type ChatUserData =
  | {
      action: "join";
      users: readonly {
        userId: string;
        nickname: string;
        userFlag: string;
        userStatus: UserStatus;
      }[];
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
```

공식 플레이어와 동일하게 `quitFlag === 1`만 정상 퇴장으로 보고, 그 밖의 값은 `isKicked: true`로 제공합니다. 앞선 강퇴 6건과 추가 캡처의 34건은 모두 `quitFlag=2`였습니다. 같은 사용자 ID의 `etcInfo=1 → 2` 두 패킷이 외부 강퇴 기록 1건에 대응한 사례가 있는 반면, 기본 ID와 `(2)` 연결 ID가 함께 퇴장한 두 사용자는 외부 기록도 각각 2건이었습니다. 따라서 `etcInfo`나 ID 접미사만으로 사용자에게 보인 강퇴 횟수를 합성하지 않으며 각 패킷을 그대로 전달합니다. `etcInfo`의 의미는 확정하지 않고 원본으로 유지합니다.

### `chatMessage` (`0005`)

일반 채팅 메시지입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `message` | `string` | 공식 플레이어와 같이 캐리지 리턴을 제거한 채팅 본문 |
| `senderId` | `string` | 발신자 ID |
| `color` | `string` | 원본 BGR 정수를 변환한 CSS `#RRGGBB` 색상. 값이 없으면 빈 문자열 |
| `messageType` | `number` | 플레이어의 원본 메시지 종류 값. 전체 열거 의미는 아직 확정하지 않음 |
| `chatLanguage` | `number` | 플레이어의 원본 채팅 언어 값 |
| `senderNickname` | `string` | 발신자 닉네임 |
| `senderFlag` | `string` | 사용자 상태를 나타내는 원본 복합 플래그 |
| `senderStatus` | `UserStatus` | `senderFlag`를 공식 플레이어 비트로 판정한 발신자 상태 |
| `subscriptionMonth` | `string` | 구독 개월 관련 원본 값 |
| `nicknameColor` | `string` | 밝은 테마용 닉네임 색상. 없으면 빈 문자열 |
| `nicknameColorDark` | `string` | 어두운 테마용 닉네임 색상. 없으면 빈 문자열 |
| `accumulatedSubscriptionMonth` | `string` | 누적 구독 개월 관련 원본 값 |
| `representativePersonalconMonth` | `string` | 대표 퍼스널콘 개월 관련 원본 값 |
| `cheerTeamNumber` | `number` | 응원팀 번호. 필드가 없으면 `-1` |

### `setBjStat` (`0007`)

공식 이름이 `SVC_SETBJSTAT`인 방송인 상태 이벤트입니다. 새 캡처의 263건 중 마지막 종료 패킷과 함께 온 1건을 제외한 262건이 방송인 계정의 `0004` 입장·퇴장과 거의 같은 시각에 발생했습니다. 추가 캡처에서는 `status=0`과 `1`이 방송인 표시 계정과 기본 ID 계정의 교체에 각각 맞물렸고, 사용자 확인상 `status=0` 시점의 실방송 화면에는 아무 변화가 없었습니다. 다른 3시간 47분 캡처의 3,624건 중 3,575건도 100ms 안에 방송인 플래그 사용자의 입장과 퇴장이 모두 발생했습니다. 종료 10초 전의 `status=0`도 실제 종료 신호가 아니었습니다. 실제 방송 중에도 반복되므로 방송 대기, 영상 송출, 화면 또는 종료 상태로 해석하면 안 됩니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `status` | `number` | 방송인 상태 원본 값. `0`과 `1`의 세부 의미는 확정하지 않음 |

방송 대기 진입을 알리는 별도 채팅 패킷은 관찰되지 않았습니다. 명시적인 방송 종료만 `0088 closeBroad`로 판단합니다.

### `setDumb` (`0008`)

채팅 음소거 설정입니다. 관찰한 8건 중 같은 사용자의 1회째 30초, 2회째 60초 사례를 당시 라이브 기억 및 별도 확인 경로와 대조했습니다. `commanderType=1`은 방송인, `2`는 매니저입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `targetId` | `string` | 대상 사용자 ID |
| `targetNickname` | `string` | 대상 사용자 닉네임 |
| `durationSeconds` | `number` | 채팅금지 시간(초) |
| `muteCount` | `number` | 누적 채팅금지 횟수 |
| `commanderId` | `string` | 채팅금지를 적용한 방송인 또는 매니저의 SOOP ID |
| `commanderType` | `number` | 명령 주체 원본 값. `1`은 방송인, `2`는 매니저 |
| `commanderRole` | `"streamer" \| "manager" \| "unknown"` | `commanderType`을 정규화한 역할 |
| `commanderLabel` | `string` | 플레이어가 역할 문구 대신 사용할 수 있는 원본 표시값. 관찰 표본에서는 빈 문자열 |

### `setUserFlag` (`0012`)

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 대상 사용자 ID |
| `nickname` | `string` | 대상 사용자 닉네임 |
| `userFlag` | `string` | 변경 후 원본 복합 플래그 |
| `previousUserFlag` | `string` | 변경 전 원본 복합 플래그 |
| `flag1`, `flag2` | `number` | 변경 후 공식 주·보조 플래그 숫자 |
| `previousFlag1`, `previousFlag2` | `number` | 변경 전 공식 주·보조 플래그 숫자 |
| `isFanClub` | `boolean` | 변경 후 팬클럽 비트 `32` 설정 여부 |
| `wasFanClub` | `boolean` | 변경 전 팬클럽 비트 `32` 설정 여부 |
| `isFollower`, `wasFollower` | `boolean` | 변경 후·전 구독자 여부. 공식 플레이어의 `isFollower` 판정과 같은 값 |
| `followerTier`, `previousFollowerTier` | `0 \| 1 \| 2 \| 3` | 변경 후·전 공식 `FOLLOW_TIER1/2/3` 비트 판정. `0`은 구독 아님 |
| `userStatus`, `previousUserStatus` | `UserStatus` | 변경 후·전 원본 플래그의 전체 공식 상태 판정 |

### `setSubBj` (`0013`)

사용자의 매니저 상태를 설정합니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 대상 사용자 ID |
| `userFlag` | `string` | 대상 사용자의 원본 복합 플래그 |
| `nickname` | `string` | 대상 사용자 닉네임 |
| `hide` | `number` | 플레이어가 전달하는 숨김 상태 원본 숫자 |
| `hidden` | `boolean` | 플레이어가 전달하는 숨김 상태 |
| `flag1` | `number` | 공식 플레이어의 첫 번째 사용자 플래그 숫자 |
| `flag2` | `number` | 공식 플레이어의 두 번째 사용자 플래그 숫자 |
| `isAdmin` | `boolean` | 공식 `admin` 비트 설정 여부 |
| `isManager` | `boolean` | `userFlag`의 매니저 비트 `256` 설정 여부 |
| `isFixedManager` | `boolean` | 공식 `fixedManager` 비트 `64` 설정 여부 |
| `isEmployee` | `boolean` | 공식 `employee` 비트 설정 여부 |
| `isEmployeeAdminChat` | `boolean` | 공식 `employeeAdminChat` 비트 설정 여부 |
| `isCleanAti` | `boolean` | 공식 `cleanati` 비트 설정 여부 |
| `userStatus` | `UserStatus` | 원본 플래그의 전체 공식 상태 판정 |

실방송에서 한 사용자가 입장할 때 `fixedManager` 비트만 포함된 `0004`가 온 직후 `0013`에서 `manager` 비트 `256`이 추가됐고, 퇴장·재입장 뒤에도 같은 순서가 반복됐습니다. 화면상 별도 명칭이나 안내는 확인되지 않았으므로 플래그 이상의 의미를 합성하지 않습니다.

### `setNickname` (`0014`)

닉네임 변경 이벤트입니다. 공식 플레이어 필드와 같은 사용자의 변경 전후 입장 기록을 함께 대조했습니다. `changeType=1` 사례에서는 같은 사용자가 변경 전 닉네임으로 후원한 뒤 새 닉네임으로 후원·채팅금지 대상에 나타났습니다. `changeType=0` 사례도 79초 뒤 새 닉네임으로 후원·채팅했지만 이후 재입장에서는 이전 닉네임과 새 닉네임이 모두 다시 관찰됐습니다. 다시보기 화면에는 별도 시스템 안내가 없었으므로 두 숫자의 열거 의미나 안내 메시지를 합성하지 않습니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 대상 사용자 ID |
| `newNickname` | `string` | 변경 후 닉네임 |
| `oldNickname` | `string` | 변경 전 닉네임 |
| `changeType` | `number` | 닉네임 변경 종류의 원본 값. 빈 필드는 `0` |
| `userFlag` | `string` | 대상 사용자의 원본 복합 플래그 |
| `userStatus` | `UserStatus` | 원본 플래그의 전체 공식 상태 판정 |

### `sendBalloon` (`0018`)

별풍선 후원 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `streamerId` | `string` | 후원을 받은 방송인 ID |
| `senderId` | `string` | 후원자 ID |
| `senderNickname` | `string` | 후원자 닉네임 |
| `count` | `number` | 후원한 별풍선 개수 |
| `fanOrder` | `number` | 신규 팬클럽 가입 순번에 사용하는 값 |
| `becameFanClub` | `boolean` | `fanOrder > 0`이며 팬클럽 가입 문구가 표시되는지 여부 |
| `fileName` | `string` | 효과 리소스의 원본 파일 이름 |
| `isDefault` | `boolean` | 기본 효과 리소스 사용 여부 |
| `topFanLevel` | `number` | 열혈팬 관련 원본 단계 값. 실방송에서 `1`은 열혈팬 가입 문구와 일치 |
| `becameTopFan` | `boolean` | `topFanLevel === 1`이며 열혈팬 가입 문구가 표시되는지 여부 |
| `ttsData` | `string` | TTS 관련 원본 데이터 |
| `senderLanguage` | `string` | 후원자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |
| `relay` | `boolean` | 일반 채널은 `false`, 서브 채널 `sendBalloonSub`은 `true` |

실방송 화면과 공식 플레이어를 대조해 `fanOrder > 0`일 때 신규 팬클럽 문구가 표시되는 것을 확인했습니다. 별풍선 50개와 1개 표본에서는 각각 `fanOrder=17/18`, `topFanLevel=1`이 왔고 화면에 팬클럽 가입 문구와 열혈팬 가입 문구가 차례로 표시됐습니다. 각 패킷 직후 `0012 setUserFlag`도 팬클럽 비트와 열혈팬 비트를 같은 순서로 추가했습니다.

### `iceModeEx` (`0021`)

채팅창 얼음 상태입니다. 실방송에서 방송인의 `!얼음` 일반 채팅 직후 `0021`이 수신되고 화면에 “채팅창을 얼렸습니다.”가 표시되는 것을 대조했습니다. 추가 캡처의 `allowedRoleMask=528`도 “스트리머, 매니저만 채팅에 참여할 수 있습니다.” 문구와 일치했습니다. 화면 문구는 플레이어가 상태로부터 만드는 것이며 별도 메시지 필드가 아닙니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `frozen` | `boolean` | 채팅창 얼음 여부 |
| `allowedRoleMask` | `number` | 얼음 상태에서도 채팅할 수 있는 역할 비트마스크 |
| `allowedRoles` | `readonly IceModeRole[]` | 비트마스크를 해석한 역할 목록 |
| `balloonLimitCount` | `number` | 플레이어가 사용하는 별풍선 제한 수치 |
| `subscriptionLimitCount` | `number` | 플레이어가 사용하는 구독 제한 수치 |

`IceModeRole`은 `"streamer" | "fanClub" | "supporter" | "topFan" | "subscriber" | "manager"`입니다. 각 비트는 차례대로 `16`, `32`, `64`, `128`, `256`, `512`입니다. 플레이어가 읽지 않는 원본 두 번째 필드는 이름을 붙이지 않고 `raw.fields`에만 보존합니다. 구형 `0019 iceMode`는 현재 플레이어에 처리 분기가 없어 계속 `data.fields`만 제공합니다.

방송 대기 없이 채팅창을 얼린 뒤 종료한 실방송에서는 `0021`과 `0019` 수신 후 45.7초 동안 채팅 10건이 모두 방송인에게서 왔고, 별풍선과 구독 선물 이벤트는 계속 수신됐습니다. 이후 `0007 status=0`과 `0088 closeBroad`가 1ms 간격으로 와서 종료됐습니다. 얼음 상태를 방송 종료나 방송 대기로 해석하지 않습니다.

### `managerChat` (`0026`)

| 필드 | 타입 | 의미 |
|---|---|---|
| `message` | `string` | 캐리지 리턴을 제거한 채팅 본문 |
| `senderId` | `string` | 발신자 ID |
| `isAdmin` | `boolean` | 운영자 채팅 여부 |
| `nickname` | `string` | 발신자 닉네임 |
| `userFlag` | `string` | 발신자의 원본 복합 플래그 |
| `senderStatus` | `UserStatus` | 원본 플래그의 전체 공식 발신자 상태 판정 |
| `subscriptionMonth` | `string` | 구독 개월 관련 원본 값 |

### 플레이어에서 직접 확인한 기타 이벤트

다음 이벤트도 공식 플레이어가 실제로 읽는 필드 순서만 구조화했습니다. 의미가 확정되지 않은 열거 값은 숫자나 문자열 원본을 유지합니다.

| 이벤트 | 공개 필드 |
|---|---|
| `directChat` (`0009`) | `message`, `senderId`, `receiverId`, `senderNickname`, `receiverNickname`, `userFlag: string`, `senderStatus: UserStatus`, `messageType`, `chatLanguage: number`, `isAdmin: boolean` |
| `sendFanLetter` (`0020`), `sendFanLetterSub` (`0034`) | `streamerId`, `streamerNickname`, `senderId`, `senderNickname`, `supporterOrder`, `senderLanguage: string`, `itemType`, `count: number`, `relay: boolean` |
| `slowMode` (`0023`) | `automaticSeconds: number`, `manualSeconds: number` |
| `sendBalloonSub` (`0033`) | `sendBalloon`과 같은 필드. 서브 채널 필드 순서를 적용하고 `relay: true` 제공 |
| `chocolate` (`0037`), `chocolateSub` (`0038`) | `streamerId`, `senderId`, `senderNickname: string`, `count: number`, `relay: boolean` |
| `itemUsing` (`0047`) | `remainingSeconds: number`, 플레이어와 같은 `Math.round(seconds / 60)` 결과인 `remainingMinutes: number` |
| `sendQuickView` (`0045`) | `senderId: string`, `senderNickname: string`, `receiverId: string`, `receiverNickname: string`, `itemType: number`, `quickViewProduct: "quickView" \| "quickViewPlus" \| "unknown"`, `durationDays: number \| null` |
| `notifyPoll` (`0050`) | `status`, `show: number`, `pollState: "started" \| "closed" \| "hidden" \| "unknown"`, `visible: boolean`, `streamerId: string`, `pollNo: number` |
| `banWord` (`0054`) | `replacement: string`, `banWordList: string`. 목록 구분자의 의미가 확정되지 않아 원본 문자열을 유지 |
| `buyGoods` (`0070`), `buyGoodsSub` (`0071`) | `goodsType`, `count: number`, `streamerId`, `buyerId`, `buyerNickname`, `goodsName: string`, `relay: boolean` |
| `notifyVr` (`0074`) | `action`, `vrType: number`, `streamerId`, `vrId`, `rtmpUrl`, `hlsUrl: string` |
| `notifyMobBroadPause` (`0075`) | `state: number`, `action: "pause" \| "resume" \| "unknown"` |
| `kickAndCancel` (`0076`) | `state: number`, `cancelled: boolean`, `userId`, `nickname: string` |
| `kickUserList` (`0077`) | `users` 배열에 대상·명령자 ID/닉네임, 시각, 명령자 원본·1차·2차 플래그와 `commanderStatus` 제공 |
| `adminChatUser` (`0078`) | `state: number`, `users` 배열에 ID·닉네임·원본 `userFlag`, 기존 독립 권한 판정과 전체 `userStatus` 제공 |
| `kickMsgState` (`0090`) | `chatNo: number`, `hideKickMessage: boolean` |
| `itemSellEffect` (`0092`) | `chatNo`, `count: number`, 방송인·발신자, 주·보조 메시지, 제목, 이미지·기본 이미지 URL |
| `translation` (`0095`) | `messageIndex: number`, `mode: number`, `message: string`, `originalLanguage: number`, `translatedLanguage: number` |
| `giftTicket` (`0102`) | `senderId: string`, `senderNickname: string`, `receiverId: string`, `receiverNickname: string`, `ticketData: string` |
| `vodAdcon` (`0103`) | `stationAdcon`과 같은 방송인·발신자·개수·이미지·제목·채팅방·언어·URL 보정 필드 |
| `itemDrops` (`0111`) | `streamerId`, `name`, `message`, `imageUrl: string` |
| `ogqEmoticonGift` (`0118`) | `senderId: string`, `senderNickname: string`, `receiverId: string`, `receiverNickname: string`, `title: string`, `imageUrl: string` |

`itemDrops`는 새 실방송 캡처에서 같은 이벤트 이름으로 약 20분 간격으로 6회 수신됐습니다. `name`에는 드롭스 상품명이 있었고 `message`와 `imageUrl`은 비어 있었습니다. 방송에서 드롭스 제공을 안내했고 수신 직후 축하 채팅이 이어졌지만 다시보기 채팅에는 해당 안내가 남지 않아 화면 문구는 확정하지 않습니다.

`ogqEmoticonGift`는 실방송에서 동일한 발신자가 서로 다른 두 사용자에게 같은 이모티콘을 선물한 화면과 대조했습니다. `senderNickname`, `receiverNickname`, `title`은 각각 화면의 `from.`, `To.`, “이모티콘 선물” 앞 상품명과 일치했고 `imageUrl`에는 해당 이모티콘 이미지가 왔습니다.

`notifyPoll`은 같은 투표 번호의 실방송 흐름에서 `status=1, show=1`이 투표 시작, `status=4, show=1`이 투표 마감과 결과 공개, `status=2, show=0`이 투표 UI 제거와 일치했습니다. 원본 숫자를 유지하면서 각각 `started`, `closed`, `hidden`으로 제공하고 `show !== 0`을 `visible`로 제공합니다. 질문·선택지·득표수는 채팅 WebSocket 패킷에 포함되지 않았습니다.
| `gemItemSend` (`0120`) | `receiverId: string`, `receiverNickname: string`, `itemName: string` |
| `setAdminFlag` (`0126`) | `userFlag: string`, `userStatus: UserStatus` |

`adInBroadJson` (`0119`)은 첫 필드를 JSON 객체로 검증해 `{ payload: Readonly<Record<string, unknown>> }`로 제공합니다. 객체의 내부 필드는 안정적인 공개 스키마로 확인되지 않았으므로 더 세분화하지 않습니다.

`sendQuickView`의 공식 상품 매핑은 일반 퀵뷰 `1/2/3`이 각각 `30/90/365`일, 퀵뷰 플러스 `100/101/102/103`이 각각 `7/30/90/365`일입니다. 실방송에서 `itemType=100`은 “퀵뷰 플러스 7일 이용권 선물” 화면과 일치했습니다. 다른 캡처에서 `itemType=1` 20건은 “퀵뷰 30일 이용권 선물”, `itemType=101` 16건은 “퀵뷰 플러스 30일 이용권 선물” 화면과 각각 일치했으며, 대량 선물도 수신자별 독립 패킷으로 전달됐습니다. 같은 발신자·수신자·`itemType=100` 패킷이 약 12초 동안 4건 연속 수신된 사례도 화면에 같은 선물 문구가 4번 표시됐으므로 동일 내용이어도 중복 제거하지 않습니다. 표에 없는 값은 `quickViewProduct="unknown"`, `durationDays=null`로 두며 `itemType`은 보존합니다.

### `chuserExtend` (`0127`)

사용자별 구독·퍼스널콘 메타데이터입니다. 한 패킷에 여러 사용자가 들어올 수 있습니다.

```ts
interface ChatUserExtendData {
  users: readonly {
    userId: string;
    representativePersonalconMonth: number | null;
    subscriptionMonth: number | null;
    accumulatedSubscriptionMonth: number | null;
  }[];
}
```

플레이어의 query-string 키 `p`, `fw`, `afw`를 위 필드로 정규화합니다. 키가 없거나 숫자로 해석할 수 없으면 `null`이며, 서버가 보내는 `-1`은 의미를 추측하지 않고 그대로 유지합니다.

이 이벤트는 입장 시점의 메타데이터입니다. 실방송에서 입장 당시 `fw=-1, afw=-1`이던 사용자가 구독한 뒤 일반 채팅에는 `subscriptionMonth=1, accumulatedSubscriptionMonth=1`이 전달됐지만 기존 `chuserExtend` 값은 갱신되지 않았습니다. 지속적인 최신 상태로 간주하지 마세요. 실제 입장 배치에서 한 패킷에 사용자 17명이 들어온 사례도 있으므로 `users` 배열 전체를 처리해야 합니다.

### `sendAdminNotice` (`0058`)

운영자 공지입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `message` | `string` | 운영자 공지 본문 |

실방송의 실시간 핫이슈 선정 및 별별랭킹 1위 안내와 대조했습니다. 패킷에는 공지 본문, 공식 플레이어가 무시하는 `0`, 빈 종결 필드가 들어 있었으며 화면의 “SOOP 안내” 제목은 패킷이 아니라 플레이어 UI가 붙입니다.

### `vodBalloon` (`0086`)

방송 밖에서 VOD에 받은 별풍선을 다음 라이브 입장 시 합계로 알리는 이벤트입니다. 화면의 VOD 별풍선 2,894개·1개·3,000개 표시와 패킷의 `balloonCount=2894/1/3000`을 각각 대조했습니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `streamerId` | `string` | 후원을 받은 방송인 ID |
| `senderId` | `string` | VOD 별풍선 후원자 ID |
| `senderNickname` | `string` | 후원자 닉네임 |
| `balloonCount` | `number` | 합산된 VOD 별풍선 개수 |
| `fileName` | `string` | 효과 리소스의 원본 파일 이름 |
| `isDefault` | `boolean` | 기본 효과 리소스 사용 여부 |
| `chatNo` | `string` | 채팅방 번호 원본 문자열 |
| `senderLanguage` | `string` | 후원자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |

### `adconEffect` (`0087`)

애드벌룬 효과 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `chatNo` | `number` | 채팅방 번호 |
| `streamerId` | `string` | 방송인 ID |
| `senderId` | `string` | 발신자 ID |
| `senderNickname` | `string` | 발신자 닉네임 |
| `message` | `string` | 주 메시지 |
| `secondaryMessage` | `string` | 보조 메시지 |
| `title` | `string` | 화면에 표시할 애드벌룬 출처·상품 제목. 값이 없을 수 있음 |
| `imageUrl` | `string` | 효과 이미지 URL |
| `defaultImageUrl` | `string` | 기본 효과 이미지 URL |
| `count` | `number` | 전송 개수 |
| `fanOrder` | `number` | 신규 팬클럽 순번. 신규 가입이 아니면 `0` |
| `becameFanClub` | `boolean` | `fanOrder > 0`이며 팬클럽 가입 문구가 표시되는지 여부 |
| `isTopFan` | `boolean` | 이번 애드벌룬으로 열혈팬 가입 문구가 표시되는지 여부 |
| `isFanChief` | `boolean` | 팬클럽 회장 여부 |
| `isSubRoom` | `boolean` | 플레이어의 서브 채널 원본 플래그. 구독플러스 방 여부가 아님 |
| `senderLanguage` | `string` | 발신자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |

실방송에서 애드벌룬 1개와 `fanOrder=10325`가 함께 왔고 화면에 “10,325번째 팬클럽” 문구가 표시됐습니다. 공식 플레이어도 `fanOrder > 0`을 같은 문구의 조건으로 사용합니다. 애드벌룬 10개 표본에서는 `fanOrder=16`, `isTopFan=true`와 화면의 팬클럽 가입·열혈팬 가입 문구가 차례로 일치했고, 직후 `0012 setUserFlag`도 두 상태 비트를 같은 순서로 추가했습니다.

추가 애드벌룬 11개 표본에서 화면의 발신자 닉네임, 애드벌룬 개수, “숲토어” 문구가 각각 `senderNickname`, `count=11`, `title="숲토어"`와 일치했습니다. 같은 캡처의 일반 애드벌룬 두 건은 `title`이 비어 있었으며, 별도의 숲토어 opcode나 플래그는 없었습니다.

구독플러스 방송에서 관찰한 두 이벤트는 모두 `isSubRoom=false`였으므로 이 값을 방의 구독플러스 제한 여부로 사용하지 않습니다.

### 구독 상품 메타데이터

`followItem`, `followItemEffect`, `sendSubscription`의 `subscriptionProduct`는 플레이어 빌드 `202603240400`의 내부 상품표를 연결한 값입니다. 신규·연속 구독은 공식 UI처럼 원본 값이 `itemType` 또는 `vodItemType`과 처음 일치하는 행을 사용하고, 구독 선물은 `itemType`이 일치하는 선물 행만 사용합니다. 표에 없는 상품이면 `null`이며 원본 값은 항상 별도로 보존됩니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `itemType` | `number` | 상품표의 종류 값 |
| `vodItemType` | `number \| null` | VOD에서 사용하는 상품 종류 값. 없는 상품은 `null` |
| `tier` | `1 \| 2` | 베이직 또는 플러스 티어 |
| `subscriptionTier` | `"basic" \| "plus"` | 티어 의미 값 |
| `level` | `1 \| 2 \| 3 \| 4 \| 5` | 플러스 상품 레벨. 베이직은 `1` |
| `month` | `1 \| 3 \| 6 \| 12` | 상품 기간(개월) |
| `isAutoPay` | `boolean` | 플레이어 상품표의 자동 결제 플래그 |
| `isLegacy` | `boolean` | 구형 상품 여부 |
| `isCeremony` | `boolean` | 플레이어 상품표의 세리머니 플래그 |
| `isGift` | `boolean` | 플레이어 상품표의 `isGift` 원본 플래그. 현재 이벤트의 구매·선물 취득 경로를 뜻하지 않음 |
| `isTrial` | `boolean` | 체험권 여부 |

예를 들어 실방송에서 확인된 `sendSubscription`의 `itemType=11`은 다음 메타데이터로 연결됩니다.

```ts
{
  itemType: 11,
  vodItemType: null,
  tier: 1,
  subscriptionTier: "basic",
  level: 1,
  month: 1,
  isAutoPay: false,
  isLegacy: false,
  isCeremony: true,
  isGift: true,
  isTrial: false,
}
```

이 `itemType=11`은 `sendSubscription` 이벤트 문맥과 실방송 화면을 함께 대조해 “베이직 1개월 구독 선물권”으로 확인했습니다. `isCeremony`, `isGift`, `isTrial`은 공식 상품표의 내부 플래그이며 `isGift` 하나만으로 다른 이벤트의 구매·선물 취득 경로를 판단하지 않습니다.

### `followItem` (`0091`)

신규 구독 알림입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `chatNo` | `number` | 채팅방 번호 |
| `receiverId` | `string` | 구독을 받은 사용자 ID |
| `senderId` | `string` | 구독한 사용자 ID |
| `senderNickname` | `string` | 구독한 사용자 닉네임 |
| `itemType` | `number` | 구독 상품의 원본 종류 값 |
| `tier` | `number` | 원본 구독 티어. `1`은 베이직, `2`는 플러스 |
| `subscriptionTier` | `"basic" \| "plus" \| "unknown"` | `tier`를 의미 값으로 정규화한 결과 |
| `subscriptionMonth` | `number \| null` | 공식 상품표의 상품 기간. 알 수 없는 상품은 `null` |
| `subscriptionProduct` | `SubscriptionProduct \| null` | 공식 UI의 첫 일치 규칙으로 연결한 상품 메타데이터 |
| `subscriptionSource` | `"live" \| "vod" \| "unknown"` | VOD 상품 번호이면 `vod`, 일반 상품 번호이면 `live`, 상품표에 없으면 `unknown` |
| `senderLanguage` | `string` | 구독자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |

실방송에서 `itemType=103`, `tier=1`이 “베이직 구독하였습니다”와 “3개월 정기구독권” 이미지에 일치해 상품 기간 3개월을 확인했습니다. `itemType=101`, `tier=1`은 베이직 구독 완료 문구와 “1개월 정기구독권” 이미지에, `itemType=111`, `tier=1`은 베이직 구독 완료 문구와 “선물 받은 1개월 구독권” 이미지에 각각 일치했습니다. 구독플러스 방송의 `itemType=201`, `tier=2` 3건은 모두 플러스 구독 완료 문구와 “1개월 정기구독권” 이미지에, `itemType=200`, `tier=2` 3건은 같은 완료 문구와 “구독 감사합니다” 이미지에 일치했습니다. 이는 공식 상품표의 `201 isAutoPay=false`, `200 isAutoPay=true` 구분과 일관됩니다. 공식 상품표에서 `itemType=101/200/201`의 `isGift`가 `true`여도 화면에는 선물받았다는 표시가 없었으므로, `isGift`는 현재 이벤트의 취득 경로로 일반화하지 않습니다. 화면 이미지 문구는 패킷에 없으므로 라이브러리 데이터로 합성하지 않습니다. `itemType=9200`은 상품표의 `vodItemType=9200`인 플러스 상품과 연결되고 화면의 “VOD에서 플러스 구독하였습니다” 문구와 일치해 `subscriptionSource="vod"`로 제공합니다. `live`는 VOD 상품 번호가 아닌 일반 상품 번호라는 뜻이며 정확한 구매 화면까지 보장하지 않습니다.

### `followItemEffect` (`0093`)

연속 구독 효과입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `streamerId` | `string` | 구독 대상 방송인 ID |
| `senderId` | `string` | 구독자 ID |
| `senderNickname` | `string` | 구독자 닉네임 |
| `month` | `number` | 화면에 표시되는 “N개월째” 값 |
| `chatNo` | `number` | 채팅방 번호 |
| `itemType` | `number` | 구독 상품의 원본 종류 값 |
| `accumulatedMonth` | `number` | `month`와 별도로 전달되는 누적 구독 개월 |
| `tier` | `number` | 원본 구독 티어. `1`은 베이직, `2`는 플러스 |
| `subscriptionTier` | `"basic" \| "plus" \| "unknown"` | `tier`를 의미 값으로 정규화한 결과 |
| `subscriptionProduct` | `SubscriptionProduct \| null` | 공식 상품표의 첫 일치 규칙으로 연결한 상품 메타데이터 |
| `senderLanguage` | `string` | 구독자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |

`itemType=201/203/211/200`의 플러스 표본은 각각 화면의 25/9/11/4개월째 구독 문구와, `itemType=100/101`의 베이직 표본은 9·27/12개월째 구독 문구와 대조됐습니다. 추가 `itemType=201, month=19, accumulatedMonth=23` 표본은 “플러스 19개월째 구독 중”으로 표시돼 화면의 개월이 `accumulatedMonth`가 아니라 `month`임을 재확인했습니다. `itemType=101, month=2, accumulatedMonth=2` 표본도 “베이직 2개월째 구독 중” 문구와 “2개월 구독” 이미지에 일치했습니다. 다른 실방송에서 `itemType=9201, tier=2, month=10, accumulatedMonth=10`도 수신됐으며 공식 상품표의 `vodItemType=9201`인 플러스 상품과 연결됐습니다. 해당 표본은 화면과 대조하지 않았으므로 상품표 이상의 의미는 부여하지 않습니다. 화면의 “N개월째”는 `month`이고 상품표의 1개월권·3개월권은 이번 상품 기간이므로 서로 다른 값입니다. 커스텀 베이직·플러스 구독자 명칭은 이 패킷에 없고 플레이어가 별도 채널 설정에서 가져오므로 합성하지 않습니다. 화면은 티어와 연속 개월을 확인하지만 상품표의 레벨·자동 결제·선물 플래그까지 실방송으로 확정하지는 않습니다.

### `bjNotice` (`0104`)

방송인이 설정한 공지입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `show` | `number` | 공지 표시 상태의 원본 숫자 값 |
| `message` | `string` | 공지 본문 |

### `videoBalloon` (`0105`)

영상풍선 후원 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `chatNo` | `string` | 채팅방 번호 원본 문자열 |
| `streamerId` | `string` | 후원을 받은 방송인 ID |
| `senderId` | `string` | 후원자 ID |
| `senderNickname` | `string` | 후원자 닉네임 |
| `balloonCount` | `number` | 별풍선 개수 |
| `fanOrder` | `number` | 신규 팬클럽 순번. 신규 가입이 아니면 `0` |
| `becameFanClub` | `boolean` | `fanOrder > 0`이며 팬클럽 가입 문구가 표시되는지 여부 |
| `topFanLevel` | `number` | 열혈팬 관련 원본 단계 값 |
| `relay` | `string` | 릴레이 관련 원본 값 |
| `fileName` | `string` | 효과 리소스의 원본 파일 이름 |
| `isDefault` | `boolean` | 기본 효과 리소스 사용 여부 |
| `extraData` | `string` | 플레이어가 전달하는 추가 원본 데이터 |

실방송에서 `balloonCount=50`, `isDefault=true` 표본을 화면의 영상풍선 50개 표시와 대조했습니다. 다른 표본의 `balloonCount=5`, `fanOrder=9725`는 영상풍선 5개와 9,725번째 팬클럽 가입 문구가 함께 표시된 화면과 일치했습니다. 같은 패킷의 32자리 `extraData`는 공식 플레이어도 의미 있게 해석하지 않아 원문 문자열로 보존합니다.

### `stationAdcon` (`0107`)

스테이션 애드벌룬 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `streamerId` | `string` | 방송인 ID |
| `senderId` | `string` | 발신자 ID |
| `senderNickname` | `string` | 발신자 닉네임 |
| `count` | `number` | 전송 개수 |
| `imageUrl` | `string` | 이미지 URL |
| `title` | `string` | 제목 |
| `chatNo` | `string` | 공식 플레이어가 전달하는 채팅방 번호 원본 문자열 |
| `senderLanguage` | `string` | 발신자 언어 관련 원본 값 |
| `urlModify` | `string` | 플레이어의 URL 보정용 원본 값 |

실방송에서 `count=1/2/4`가 화면의 “[닉네임] 방송국 애드벌룬 1개/2개/4개”와 각각 일치했습니다. 공식 플레이어도 애드벌룬 공통 UI에서 채널 출처에 “방송국”을 붙입니다. 패킷의 `title`에는 더 긴 문장이 오므로 화면 문구를 새 필드로 합성하지 않고 원문 그대로 제공합니다.

### `sendSubscription` (`0108`)

구독 선물 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `senderId` | `string` | 선물한 사용자 ID |
| `senderNickname` | `string` | 선물한 사용자 닉네임 |
| `receiverId` | `string` | 선물받은 사용자 ID |
| `receiverNickname` | `string` | 선물받은 사용자 닉네임 |
| `subscriptionId` | `string` | 공식 플레이어의 원본 속성명. 관찰 표본에서는 구독 대상 방송인 ID |
| `subscriptionNickname` | `string` | 공식 플레이어의 원본 속성명. 관찰 표본에서는 구독 대상 방송인 닉네임 |
| `streamerId` | `string` | `subscriptionId`를 역할 중심 이름으로 제공한 값 |
| `streamerNickname` | `string` | `subscriptionNickname`을 역할 중심 이름으로 제공한 값 |
| `itemType` | `number` | 구독 상품의 원본 종류 값. 관찰된 `11`은 베이직 1개월 선물권 |
| `subscriptionTier` | `"basic" \| "plus" \| "unknown"` | 공식 상품표의 티어. 알 수 없는 상품은 `unknown` |
| `subscriptionMonth` | `number \| null` | 공식 상품표의 상품 기간. 알 수 없는 상품은 `null` |
| `subscriptionProduct` | `SubscriptionProduct \| null` | 선물 문맥으로 연결한 공식 상품 메타데이터 |
| `itemCode` | `string` | 구독 상품 코드 |
| `isSubscription` | `number` | 구독 여부의 원본 숫자 플래그 |
| `subscriptionType` | `string` | 구독 유형 원본 값 |
| `subscriptionPeriod` | `string` | 구독 기간 원본 값 |
| `subscriptionRemain` | `number` | 구독 잔여 관련 원본 값 |
| `subscriptionPayCount` | `number` | 구독 결제 횟수 관련 원본 값 |

실방송에서 한 사용자가 베이직 1개월 구독 선물권을 30명에게 보낼 때 `0108`이 수신자별로 한 건씩 왔습니다. 그 뒤 선물권을 사용한 11명에게 `0091 itemType=111, tier=1`이 수신됐고 화면의 “선물 받은 1개월 구독권” 및 베이직 구독 완료 문구와 일치했습니다. 추가 캡처의 선물 46건은 45명에게 각각 화면 메시지로 표시됐고, 같은 수신자에게 약 68초 간격으로 온 2건도 실제 별도 선물이었습니다. 이어진 `itemType=111` 32건은 모두 앞선 선물 수신자와 일치했습니다. 패킷 하나에는 전체 선물 개수가 없으므로 수신자별 이벤트를 묶거나 동일 내용이라는 이유로 제거하지 않습니다.

### `ogqEmoticon` (`0109`)

OGQ 이미지가 포함된 채팅입니다. 이미지 전용이면 `message`가 빈 문자열이고, 이미지와 텍스트가 함께 표시되면 `message`에 해당 텍스트가 들어갑니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `chatNo` | `string` | 채팅방 번호 원본 문자열 |
| `message` | `string` | 함께 표시할 텍스트. 이미지 전용이면 빈 문자열 |
| `groupId` | `string` | OGQ 이모티콘 그룹 식별자 |
| `subId` | `string` | 그룹 내 이모티콘 식별자 |
| `version` | `string` | 이모티콘 버전 |
| `senderId` | `string` | 발신자 ID |
| `senderNickname` | `string` | 발신자 닉네임 |
| `senderFlag` | `string` | 사용자 상태를 나타내는 원본 복합 플래그 |
| `senderStatus` | `UserStatus` | `senderFlag`를 공식 플레이어 비트로 판정한 발신자 상태 |
| `color` | `string` | 원본 BGR 정수를 변환한 CSS `#RRGGBB` 색상. 값이 없으면 빈 문자열 |
| `chatLanguage` | `number` | 플레이어의 원본 채팅 언어 값 |
| `emoticonType` | `number` | 이모티콘 원본 종류 값 |
| `extension` | `string` | 이미지 확장자. 실관찰 표본은 `png` |
| `subscriptionMonth` | `string` | 구독 개월 관련 원본 값 |
| `nicknameColor` | `string` | 밝은 테마용 닉네임 색상 |
| `nicknameColorDark` | `string` | 어두운 테마용 닉네임 색상 |
| `accumulatedSubscriptionMonth` | `string` | 누적 구독 개월 관련 원본 값 |
| `representativePersonalconMonth` | `string` | 대표 퍼스널콘 개월 관련 원본 값 |
| `animation` | `string` | 애니메이션 관련 원본 값 |
| `cheerTeamNumber` | `number` | 응원팀 번호. 필드가 없으면 `-1` |

### `mission` (`0121`)

도전미션 또는 대결미션 JSON입니다. `missionKind`와 `action`을 먼저 확인한 뒤 해당 변형의 필드를 사용하세요. 모든 변형의 `payload`에는 파싱한 원본 JSON 객체가 보존됩니다.

공식 type과 공개 판별 값의 대응은 다음과 같습니다.

| 원본 `type` | `missionKind` | `action` |
|---|---|---|
| `CHALLENGE_GIFT` | `challenge` | `gift` |
| `CHALLENGE_NOTICE` | `challenge` | `notice` |
| `CHALLENGE_SETTLE` | `challenge` | `settle` |
| `GIFT` | `battle` | `gift` |
| `NOTICE` | `battle` | `notice` |
| `SETTLE` | `battle` | `settle` |
| 그 밖의 값 | `unknown` | `unknown` |

도전미션 공통 필드:

| 필드 | 타입 | 의미 |
|---|---|---|
| `missionKind` | `"challenge"` | 도전미션 판별 값 |
| `action` | `"gift" \| "notice" \| "settle"` | 후원, 결과 알림, 정산 판별 값 |
| `missionKey` | `number` | 같은 미션의 후원·결과·정산을 묶는 키 |
| `uuid` | `string` | 개별 알림 식별자. `settle`에서는 대응하는 `missionSettle`과 같음 |
| `payload` | `Readonly<Record<string, unknown>>` | 파싱한 원본 JSON 객체 |

`action: "gift"` 추가 필드:

| 필드 | 타입 | 의미 |
|---|---|---|
| `title` | `string` | 미션 제목 |
| `giftCount` | `number` | 이번 후원 개수 |
| `chatNo` | `number` | 채팅방 번호 |
| `isRelay` | `boolean` | 릴레이 여부 |
| `image` | `string` | 미션 이미지 값 |
| `senderId` | `string` | 후원자 ID |
| `senderNickname` | `string` | 후원자 닉네임 |
| `streamerId` | `string` | 방송인 ID |
| `streamerNickname` | `string` | 방송인 닉네임 |

`action: "notice"` 추가 필드:

| 필드 | 타입 | 의미 |
|---|---|---|
| `title` | `string` | 미션 제목 |
| `status` | `"success" \| "fail" \| "unknown"` | 원본 `mission_status`를 정규화한 미션 결과 |

`action: "settle"` 추가 필드:

| 필드 | 타입 | 의미 |
|---|---|---|
| `title` | `string` | 미션 제목 |
| `settleCount` | `number` | 정산할 별풍선 개수 |
| `isRelay` | `boolean` | 릴레이 여부 |
| `image` | `string` | 미션 이미지 값 |
| `streamerId` | `string` | 방송인 ID |
| `streamerNickname` | `string` | 방송인 닉네임 |

대결미션도 공식 플레이어 분기에 맞춰 구조화합니다.

| `action` | 추가 필드 |
|---|---|
| `gift` | `title`, `image`, `senderId`, `senderNickname: string`, `giftCount`, `fanOrder`, `topFanLevel: number`, `isRelay: boolean` |
| `notice` | `draw: boolean`, `winner`, `myTeamName: string`, `rank: number` |
| `settle` | `title`, `image: string`, `settleCount: number` |

도전미션 후원 뒤 결과 패킷이 없다는 사실만으로 대기와 거절을 구별할 수 없으므로 별도의 추측 상태를 만들지 않습니다.

### `liveCaption` (`0122`), `subtitleV2` (`0139`)

두 이벤트 모두 payload를 JSON 객체로 검증해 다음 형태로 제공합니다. 내부 필드는 아직 안정된 공개 타입으로 모델링하지 않습니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `payload` | `Readonly<Record<string, unknown>>` | 파싱한 원본 JSON 객체 |

### `missionSettle` (`0125`)

도전미션 성공 후 참여자별 정산 상태를 전달합니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `missionKind` | `"challenge"` | 도전미션 정산 판별 값 |
| `chatNo` | `number` | 채팅방 번호 |
| `uuid` | `string` | 대응하는 `mission`의 `action: "settle"` 이벤트와 같은 식별자 |
| `fanOrder` | `number` | 이번 정산에서 신규 팬클럽이 된 참여자의 가입 순번 |
| `participants` | `readonly ChallengeMissionSettlementParticipant[]` | 참여자별 정산 결과 |
| `payload` | `Readonly<Record<string, unknown>>` | 파싱한 원본 JSON 객체 |

참여자 필드:

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 참여자 ID |
| `nickname` | `string` | 참여자 닉네임 |
| `contributionCount` | `number` | 해당 참여자의 후원 합계 |
| `becameFanClub` | `boolean` | 이번 정산으로 팬클럽에 새로 가입했는지 여부 |
| `becameTopFan` | `boolean` | 이번 정산으로 열혈팬이 되었는지 여부 |

`fanOrder`는 `becameFanClub`이 참인 참여자에게만 화면의 가입 순번으로 사용됩니다. 같은 캡처에서 각각 100개로 정산된 두 미션 중 기존 팬은 순번 문구가 없었고, 신규 팬은 `becameFanClub=true`, `fanOrder=7447`과 화면의 7,447번째 팬클럽 문구가 일치했습니다. 추가 500개 정산의 `becameFanClub=true`, `fanOrder=7495`도 화면의 7,495번째 팬클럽 문구와 일치했습니다. 반대로 `fanOrder=3722`인 6,850개 정산, `fanOrder=5098`인 500개 정산, `fanOrder=7489`인 100개 정산과 `fanOrder=3738`인 200개·1,000개 정산은 모든 참여자의 `becameFanClub`이 거짓이었고 화면에 팬클럽 문구가 없었습니다.

### `subscriptionCeremonyButton` (`0130`)

구독 세리머니 버튼 상태입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `subscriptionMonth` | `string` | 구독 개월 관련 원본 값 |

### `savvyNotice` (`0131`)

Savvy 알림입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `streamerId` | `string` | 방송인 ID |
| `userId` | `string` | 사용자 ID |
| `videoNumber` | `string` | 영상 번호 원본 값 |

### `globalSubtitle` (`0136`)

전역 자막 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `chatNo` | `string` | 채팅방 번호 원본 문자열 |
| `streamerId` | `string` | 방송인 ID |
| `language` | `string` | 자막 언어 원본 값 |
| `subtitle` | `string` | 자막 본문 |
| `timestamp` | `string` | 플레이어가 전달하는 원본 시각 값 |

### `confetti` (`0138`)

꽃가루 효과 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `confettiType` | `number` | 원본 효과 종류 값 |
| `senderId` | `string` | 효과를 발생시킨 사용자 ID |

### `cheerTeamChange` (`0140`)

사용자의 응원팀 변경 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 대상 사용자 ID |
| `teamNumber` | `string` | 응원팀 번호 원본 값 |

### `nightbotTimeout` (`0141`)

Nightbot 사용자 타임아웃 이벤트입니다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `userId` | `string` | 대상 사용자 ID |
| `nickname` | `string` | 대상 사용자 닉네임 |
| `reasonCode` | `number` | 타임아웃 사유의 원본 코드 |
| `reason` | `"blacklist" \| "excessCaps" \| "excessEmotes" \| "links" \| "excessSymbols" \| "repetitions" \| "unknown"` | 공식 플레이어의 코드별 사유를 언어 중립 값으로 정규화한 결과 |
| `channelNumber` | `string` | 채널 번호 원본 값 |
| `message` | `string` | 관련 메시지 |
| `time` | `number` | 타임아웃 시간의 원본 숫자 값. 단위는 공개 API에서 정규화하지 않음 |
| `userFlag` | `string` | 대상 사용자의 원본 복합 플래그 |
| `userStatus` | `UserStatus` | 원본 플래그의 전체 공식 상태 판정 |
