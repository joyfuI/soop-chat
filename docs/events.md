# 이벤트 가이드

이 문서는 `soop-chat` 사용자가 어떤 이벤트를 선택하고 어떻게 해석해야 하는지 설명합니다. 이벤트명·opcode·provenance는 [`EVENT_CATALOG`](../src/events.ts), 정확한 필드·타입·판별 union은 같은 파일의 TypeScript 타입과 JSDoc이 Source of Truth입니다.

Markdown에 필드 사전을 복제하지 않습니다. 아래에는 발생 상황, 중요한 caveat와 아직 확정되지 않은 의미만 둡니다. 표본 수·플레이어 빌드·반례와 조사 과정은 저장소의 [research 문서](./research/protocol-evidence.md)에 보존합니다.

## 자주 사용하는 이벤트

| 이벤트 | 데이터 타입 | 사용할 때 | 중요한 주의사항 |
|---|---|---|---|
| `chatMessage` | `ChatMessageData` | 일반 채팅 메시지 | `senderStatus`의 권한은 서로 독립적 |
| `chatUser` | `ChatUserData` | 사용자 입장·퇴장 | 입장은 여러 사용자의 batch일 수 있음 |
| `sendBalloon` | `BalloonData` | 별풍선 후원 | `fanOrder`는 고유 ID나 정렬 키가 아님 |
| `followItem` | `FollowItemData` | 구독 세리머니 | 결제나 신규 구독 발생 이벤트가 아님 |
| `sendSubscription` | `GiftSubscriptionData` | 수신자별 구독 선물 | 전체 선물 개수를 뜻하지 않음 |
| `mission` | `MissionData` | 도전·대결미션 | `missionKind`와 `action`으로 먼저 분기 |
| `closeBroad` | `FieldEventData` | 명시적 방송 종료 | 이어서 `ended`가 발생하고 재연결하지 않음 |

```ts
chat.on("chatMessage", ({ data }) => {
  console.log(data.senderNickname, data.message);
});

chat.on("sendBalloon", ({ data }) => {
  console.log(data.senderNickname, data.count);
});
```

연결 상태, 재연결과 오류 이벤트는 README의 [연결과 오류 처리](../README.md#연결과-오류-처리)를 참고하세요.

## 공통 이벤트 계약

알려진 프로토콜 이벤트는 `KnownSoopEvent`, 미래 opcode는 `UnknownSoopEvent`입니다. 모든 이벤트는 `type`, `opcode`, `receivedAt`, 원본 `raw`와 이벤트별 `data`를 제공합니다.

- `raw: RawPacket`은 header 정보, 원본 payload byte, UTF-8 text와 분리된 field를 보존합니다.
- 의미를 확정하지 못한 known opcode는 `data: FieldEventData`로 원본 field만 제공합니다.
- 내부 schema가 안정되지 않은 JSON은 `JsonObjectData`의 원본 객체로 제공합니다.
- 카탈로그에 없는 opcode는 `unknown` 이벤트로 손실 없이 전달합니다.

`raw`와 미해석 field에는 사용자 ID·닉네임·메시지 등 개인정보가 있을 수 있습니다. 명시적인 보관 정책 없이 로그나 파일에 저장하지 마세요.

## 사용자 상태

원본 사용자 flag가 있는 이벤트는 `UserStatus`를 함께 제공합니다. 정확한 비트와 필드 목록은 타입 정의가 기준입니다.

- 권한 bit는 동시에 설정될 수 있으므로 사용자를 하나의 역할로 축약하지 않습니다.
- `followerTier`는 사용자 구독 상태이지 일반 방송의 접근 권한 판정값이 아닙니다.
- 퇴장 `chatUser.userStatus`에는 최신 상태 bit가 생략될 수 있으므로 상태 변경이나 최신 snapshot으로 사용하지 않습니다.
- 서버 사용자 ID의 숫자 접미사는 발생 조건과 동일성 규칙이 미확인입니다. 접미사를 제거하거나 같은 사용자로 합치지 마세요.

## 근거 수준

- `observed`: 실방송 packet에서 직접 확인
- `player`: 조사 당시 공식 플레이어 코드에서 확인
- `reference`: 참고 구현에서만 확인
- `runtime`: 카탈로그에 없는 opcode의 문서상 fallback 표시

`EventProvenance` 타입에는 카탈로그 값인 `observed`, `player`, `reference`만 포함됩니다. provenance는 필드 정확성의 등급이 아니라 이벤트 정의를 뒷받침하는 근거 출처입니다.

## 이벤트별 의미와 주의사항

### 채팅과 사용자

`chatMessage`는 일반 채팅이며 타입은 `ChatMessageData`입니다. `messageType`과 `chatLanguage`는 열거 의미를 확정하지 않은 원본 숫자입니다.

`chatUser`는 `action`으로 입장과 퇴장을 구분합니다. 입장일 때는 `users` 배열 전체를 처리하세요. 퇴장의 `quitFlag === 1`만 일반 퇴장이며 그 밖의 값은 `isKicked=true`입니다. 다른 사용자의 강퇴는 이 이벤트, 현재 클라이언트 자신의 강퇴는 `quitChannel`에서 확인합니다. `etcInfo`의 의미는 확정하지 않았습니다.

`managerChat`, `directChat`, `ogqEmoticon`은 일반 채팅과 별도 이벤트입니다. 모든 채팅을 받으려면 필요한 종류를 각각 구독하거나 공통 `event` 스트림에서 분기하세요.

### 후원

`sendBalloon`은 별풍선 후원이며 타입은 `BalloonData`입니다.

- `fanOrder`는 중복·건너뜀·수신 순서 역전이 있을 수 있습니다. 고유 ID, 정렬 또는 중복 제거에 사용하지 마세요.
- `isDefault=false`만으로 시그니처 풍선이라고 판단하지 마세요. 라이브러리가 제공하는 `isSignatureBalloon`을 사용하세요.
- `isSignatureBalloon=false`도 특정 풍선 종류를 단정하는 값이 아닙니다.
- `ttsData`는 메시지 존재나 실제 음성 재생 여부를 뜻하지 않습니다.

`sendFanLetter`와 `sendFanLetterSub`는 공식 opcode 이름을 유지하지만 현재 제품에서는 스티커 후원으로 표시됩니다. `supporterOrder > 0`은 신규 서포터 가입과 함께 올 수 있지만 순번을 이벤트 ID로 사용하지 마세요.

`adconEffect`의 `isSubRoom`은 플레이어의 서브 채널 flag이며 구독플러스 방 여부가 아닙니다. `videoBalloon`은 후원 사실을 나타낼 뿐 영상의 재생 여부나 시점을 뜻하지 않습니다. `vodBalloon`은 방송 밖에서 VOD에 받은 별풍선을 다음 라이브 입장 시 합계로 알립니다.

후원 이벤트에서 플레이어가 생성하는 지역화 문구나 화면 상태를 별도 데이터로 추론하지 마세요.

### 구독과 선물

`followItem`과 `followItemEffect`는 구독자가 방송 입장 뒤 보내는 세리머니입니다. 결제 시각, 신규·재구독 여부 또는 구독 상태 변경을 판정하지 마세요. `followItemEffect.month`는 화면의 연속 구독 개월이고 `subscriptionProduct.month`는 상품 기간이므로 서로 바꾸어 쓰지 않습니다.

`subscriptionProduct`는 공식 상품표에 연결한 메타데이터이며 일치하지 않으면 `null`입니다. 내부 `isGift`, `isCeremony`, `isTrial` flag 하나만으로 현재 이벤트의 취득 경로나 상태 변경을 판정하지 마세요. 원본 `itemType`은 항상 보존됩니다.

`sendSubscription`과 `copySendSub`는 수신자별 이벤트입니다. 같은 내용도 별도 선물일 수 있으므로 묶거나 중복 제거하지 않습니다. `copySendSub`는 선물 수령 알림이고, `copySendQuick`은 field 의미가 확인되지 않아 원본만 제공합니다.

`subRandomCeremony`와 `quickRandomCeremony`는 랜덤 선물의 발신자와 전체 개수를 알립니다. 수신자 목록이나 개별 지급 이벤트를 연결하는 key가 없으므로 `sendSubscription`, `sendQuickView`, `copySendSub`와 합산하거나 같은 선물로 묶지 마세요.

### 미션

`mission`은 `MissionData` 판별 union입니다. 먼저 `missionKind`가 `challenge`, `battle`, `unknown` 중 무엇인지 확인하고, 이어서 `action`이 `gift`, `notice`, `settle` 중 무엇인지 분기하세요. 미확인 원본 JSON은 `payload`에 보존됩니다.

| 원본 `type` | `missionKind` | `action` |
|---|---|---|
| `CHALLENGE_GIFT` | `challenge` | `gift` |
| `CHALLENGE_NOTICE` | `challenge` | `notice` |
| `CHALLENGE_SETTLE` | `challenge` | `settle` |
| `GIFT` | `battle` | `gift` |
| `NOTICE` | `battle` | `notice` |
| `SETTLE` | `battle` | `settle` |
| 그 밖의 값 | `unknown` | `unknown` |

`missionKey`는 같은 미션의 후원·결과·정산을 연결하지만, 개별 알림의 `uuid`는 서로 다를 수 있습니다. 앞선 후원 이벤트를 받지 못한 채 결과나 정산만 받을 수도 있습니다.

- `gift`는 후원 알림이지 수락·시작 완료를 뜻하지 않습니다.
- 결과가 오지 않았다고 거절이나 timeout을 합성하지 마세요.
- 대결미션 `draw=true`이면 무승부입니다.
- `settleCount`는 이 채널에서 본 `giftCount` 합계와 다를 수 있습니다.
- `missionSettle.fanOrder`는 참여자의 `becameFanClub`이 참일 때만 가입 순번으로 사용합니다.

### 상태와 moderation

`closeBroad`는 명시적 방송 종료입니다. 라이브러리는 이를 전달한 뒤 `ended: { reason: "offline" }`을 발생시키고 자동 재연결하지 않습니다. `setBjStat.status`는 방송 중에도 올 수 있는 미확인 원본 숫자이므로 종료·대기·화면 상태로 해석하지 마세요.

`setDumb`는 채팅금지 대상, 초 단위 지속 시간, 누적 횟수와 명령 주체를 제공합니다. 화면 문구는 플레이어가 생성하므로 이벤트 데이터로 합성하지 않습니다.

`setSubBj.hidden`은 매니저 지정·해임 안내를 숨기는 값이지 사용자, badge 또는 권한을 숨기는 값이 아닙니다. `isManager`와 `isFixedManager`도 독립적으로 다룹니다.

`iceModeEx`는 채팅창 얼음 여부와 허용 역할·제한 수치를 제공합니다. 제한 수치만 바뀔 수 있으므로 얼음 여부와 조건 변경을 구분하고, 방송 종료나 대기 상태로 해석하지 마세요. 구형 `iceMode`는 원본 field만 제공합니다.

`notifyPoll`에는 표시 상태만 있으며 질문, 선택지와 득표수는 없습니다. `banWord`는 목록과 대체 문자열을 제공하지만 공백·대소문자·정확 일치 규칙은 확정하지 않았습니다.

### 사용자 메타데이터와 미디어

`chuserExtend`는 입장 시점의 구독·퍼스널콘 메타데이터 batch입니다. `users` 배열 전체를 처리하고, 구독 변경 뒤 자동 갱신되는 최신 상태로 간주하지 마세요. 누락되거나 잘못된 숫자는 `null`, 서버의 `-1`은 원본 의미를 확정하지 않고 유지합니다.

`ogqEmoticon`은 이미지 단독 또는 이미지와 text가 함께 있는 채팅입니다. `extension="png"`만으로 정지 이미지라고 판단하지 말고 `animation` 원본 값도 확인하세요. 알려지지 않은 animation 값이나 실제 파일 형식은 추측하지 않습니다.

`adInBroadJson`, `liveCaption`, `subtitleV2`는 내부 schema를 안정된 공개 타입으로 만들지 않고 검증한 JSON 객체를 보존합니다. 앱에서 사용할 때도 존재 여부와 타입을 직접 확인하세요.

정확한 데이터 shape는 [`src/events.ts`](../src/events.ts)의 해당 타입을 참고하세요.

## 전체 이벤트 색인

이 색인은 `EVENT_CATALOG`와 decoder 결과를 테스트에서 자동 대조합니다. `fields`는 미해석 원본 field, `object`는 typed data, `JSON`은 검증한 원본 JSON 객체를 뜻합니다.

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
| `0013` | `setSubBj` | 매니저 상태 설정 | object | observed |
| `0014` | `setNickname` | 닉네임 설정 | object | observed |
| `0015` | `serverStat` | 서버 상태 | fields | reference |
| `0016` | `unused16` | 미사용 | fields | reference |
| `0017` | `clubColor` | 클럽 색상 | fields | reference |
| `0018` | `sendBalloon` | 별풍선 후원 | object | observed |
| `0019` | `iceMode` | 아이스 모드 | fields | observed |
| `0020` | `sendFanLetter` | 스티커 전송 | object | observed |
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
| `0034` | `sendFanLetterSub` | 스티커 전송(서브 채널) | object | player |
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
| `0091` | `followItem` | 구독 세리머니 | object | observed |
| `0092` | `itemSellEffect` | 아이템 판매 효과 | object | player |
| `0093` | `followItemEffect` | 연속 구독 세리머니 | object | observed |
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
| `0127` | `chuserExtend` | 사용자 확장 메타데이터 | object | observed |
| `0128` | `adminChuserExtend` | 관리자용 채팅 사용자 확장 정보 | fields | reference |
| `0130` | `subscriptionCeremonyButton` | 구독 세리머니 버튼 | object | player |
| `0131` | `savvyNotice` | Savvy 알림 | object | player |
| `0136` | `globalSubtitle` | 전역 자막 | object | player |
| `0137` | `userLanguageSet` | 사용자 언어 설정 | fields | player |
| `0138` | `confetti` | 꽃가루 효과 | object | player |
| `0139` | `subtitleV2` | 라이브 자막 v2 | JSON | player |
| `0140` | `cheerTeamChange` | 응원팀 변경 | object | player |
| `0141` | `nightbotTimeout` | Nightbot 타임아웃 | object | player |
| `0142` | `subRandomCeremony` | 랜덤 구독 선물 알림 | object | observed |
| `0143` | `quickRandomCeremony` | 랜덤 퀵뷰 선물 알림 | object | player |
| `0144` | `copySendSub` | 구독 선물 수령 알림 | object | player |
| `0145` | `copySendQuick` | 퀵뷰 복사 알림 원본 | fields | player |
| future | `unknown` | 카탈로그에 없는 네 자리 opcode | fields | runtime |
