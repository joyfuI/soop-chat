# soop-chat

SOOP 라이브 방송의 채팅을 읽는 TypeScript 라이브러리입니다. Node.js 24 이상과 현대 브라우저를 지원하며 ESM으로만 배포됩니다.

> 비공식 라이브러리입니다. SOOP이 프로토콜이나 플레이어 API를 변경하면 동작이 달라질 수 있습니다.

이 프로젝트는 OpenAI Codex로 만들어졌습니다.

## 설치

```sh
npm install soop-chat
```

## Node.js

Node에서는 SOOP 아이디만으로 방송 정보를 조회하고 채팅에 연결합니다.

```ts
import { SoopChat } from "soop-chat";

const chat = new SoopChat({ streamerId: "soopId" });

chat.on("chatMessage", (event) => {
  console.log(event.data.senderNickname, event.data.message);
});

chat.on("sendSubscription", (event) => {
  console.log(event.data.senderNickname, event.data.receiverNickname);
});

chat.on("mission", (event) => {
  console.log(event.data.missionKind, event.data.action, event.data.payload);
});

await chat.connect();
```

`connect()`은 채팅방 입장 응답까지 받은 후 완료됩니다. 종료할 때는 다음처럼 호출합니다.

```ts
await chat.disconnect();
```

Node에서도 별도 API나 캐시를 사용하려면 브라우저와 같은 형태의 `resolveChannel`을 생성자에 전달해 기본 조회를 대체할 수 있습니다.

## 브라우저

SOOP 라이브 정보 API는 임의 웹사이트의 CORS 요청을 허용하지 않습니다. 따라서 브라우저에서는 애플리케이션 서버가 제공하는 `ChannelResolver`가 필요합니다.

서버에서는 기본 진입점이 공개하는 `resolveNodeChannel`로 `ChannelInfo`를 조회해 그대로 응답합니다.

```ts
import { resolveNodeChannel } from "soop-chat";

const channel = await resolveNodeChannel(streamerId, { signal: request.signal });
return Response.json(channel);
```

브라우저 리졸버는 서버가 반환한 JSON을 그대로 반환하면 됩니다.

```ts
import { SoopChat } from "soop-chat/browser";

const chat = new SoopChat({
  streamerId: "soopId",
  resolveChannel: async (streamerId, { signal }) => {
    const response = await fetch(`/api/soop-channel/${encodeURIComponent(streamerId)}`, { signal });
    if (!response.ok) throw new Error("채널 정보를 가져오지 못했습니다.");
    return response.json();
  },
});

chat.on("chatMessage", ({ data }) => console.log(data.message));
await chat.connect();
```

리졸버는 아래 값만 반환하면 됩니다. 인증 티켓이나 쿠키를 브라우저에 전달하지 마세요.

```ts
interface ChannelInfo {
  broadcastNo: string;
  chatNo: string;
  chatDomain: string;
  chatPort: number;
}
```

## 연결 상태

`streamerId`는 생성할 때 정한 방송인 ID를 읽기 전용으로 제공하고, `state`는 현재 연결 단계를 나타냅니다. 채팅방 입장 여부만 필요하면 `connected`인지 확인하면 됩니다.

```ts
console.log(chat.streamerId);

const isJoined = chat.state === "connected";

chat.on("stateChange", ({ previous, current }) => {
  console.log(`${previous} -> ${current}`);
});
```

`ConnectionState`의 값은 다음과 같습니다.

| 상태           | 의미                                              |
| -------------- | ------------------------------------------------- |
| `idle`         | 객체 생성 후 아직 연결을 시작하지 않음            |
| `resolving`    | 방송과 채팅 서버 정보 조회 중                     |
| `connecting`   | WebSocket 연결 및 채팅방 입장 응답 대기 중        |
| `connected`    | 채팅방 입장 완료                                  |
| `reconnecting` | 예기치 않은 종료 후 자동 재연결 대기 중           |
| `closed`       | 수동 종료, 방송 종료 또는 연결 실패로 연결이 끝남 |

`idle`과 `closed`에서는 `connect()`로 새 연결을 시작할 수 있습니다. `resolving`, `connecting`, `reconnecting`은 모두 아직 입장하지 않은 상태지만, `reconnecting`은 자동 복구 중이므로 별도로 `connect()`를 호출할 필요가 없습니다.

## 이벤트

`on()`은 구독 해제 함수를 반환합니다. 특정 프로토콜 이벤트 외에도 다음 공통 스트림을 사용할 수 있습니다.

```ts
const off = chat.on("event", (event) => console.log(event.type, event.data));
chat.on("raw", (packet) => console.log(packet.opcode, packet.fields));
chat.on("unknown", (event) => console.log("새 opcode", event.opcode));
chat.on("protocolError", ({ error, raw }) => console.error(error, raw));

off();
```

모든 프로토콜 이벤트에는 `type`, `opcode`, `receivedAt`, `raw`, `data`가 있습니다. 현재 알려진 네트워크 opcode 101개와 미래 opcode용 `unknown`을 합쳐 102개 판별 타입을 제공합니다. 이벤트별 의미, 근거 수준, 구조화된 `data` 필드는 [이벤트 레퍼런스](docs/events.md)에서 확인할 수 있습니다.

의미가 확인되지 않은 payload 필드는 이름을 추측하지 않고 `data.fields`와 `raw.fields`에 보존합니다. 현재 62개 opcode가 구조화되어 있으며, 공식 플레이어가 실제로 읽는 로그인·입장 응답, 귓속말, 슬로우모드, 강퇴 목록, 모바일 방송 일시정지, 별풍선·팬레터·상품·애드벌룬·드롭스와 미션 필드를 제공합니다. `chatUser` 퇴장 이벤트의 `isKicked`로 일반 퇴장과 강퇴도 구분할 수 있습니다.

연결 수명주기 이벤트는 프로토콜 이벤트와 다른 payload를 사용합니다.

| 이벤트          | payload                                                               |
| --------------- | --------------------------------------------------------------------- |
| `stateChange`   | 이전·현재 `ConnectionState`인 `previous`, `current`                   |
| `reconnecting`  | 재시도 횟수 `attempt`, 대기 시간 `delayMs`, 원인 `error`              |
| `error`         | WebSocket 또는 비동기 처리 중 발생한 `Error`                          |
| `ended`         | 종료 사유 `reason: "offline" \| "restricted"`와 제한 시 `restriction` |
| `protocolError` | 프로토콜 `error`와 관련 패킷이 있으면 `raw`                           |

`connect()` 자체의 실패는 Promise에서 예외로 전달됩니다. WebSocket이나 비동기 처리 오류는 `error`, 연결 후 확인된 방송 종료나 접근 제한은 `ended`, 복구 가능한 연결 종료는 `reconnecting`으로 구분할 수 있습니다. 수동 `disconnect()`는 `ended`를 발생시키지 않습니다.

공개 `EVENT_CATALOG`로 지원하는 opcode의 이벤트 이름, 설명과 근거 수준을 실행 중 조회할 수 있습니다.

```ts
import { EVENT_CATALOG } from "soop-chat";

console.log(EVENT_CATALOG["0005"]);
// { type: "chatMessage", description: "Chat Message", provenance: "observed" }
```

## 자동 재연결

예기치 않은 종료에는 채널 정보를 다시 조회하고 1초부터 최대 30초까지 지수 백오프로 재연결합니다. 채팅 서버가 `0088 closeBroad`를 보내면 `closeBroad`와 `ended: { reason: "offline" }`을 발생시키고 연결을 정상 종료하며 재시도하지 않습니다. 접근 제한도 재시도하지 않습니다.

`chatNo`는 방송 인스턴스마다 새로 발급됩니다. 실방송에서 같은 방송인이 약 5분 사이 세 번 방송을 켰다 끈 사례도 `1694`, `2347`, `4253`으로 매번 바뀌었습니다. `0088` 이후 다음 방송을 읽으려면 `connect()`를 다시 호출하세요. 이때 리졸버가 다시 실행되므로 이전 `ChannelInfo`를 방송 간에 캐시하지 마세요.

```ts
const chat = new SoopChat({
  streamerId: "soopId",
  reconnect: {
    enabled: true,
    initialDelayMs: 1_000,
    maxDelayMs: 30_000,
    factor: 2,
    jitter: 0.2,
  },
});

chat.on("reconnecting", ({ attempt, delayMs }) => {
  console.log(`${attempt}번째 재연결: ${delayMs}ms 후`);
});
```

`reconnect: false` 또는 `reconnect: { enabled: false }`로 자동 재연결을 끌 수 있습니다.

## 오류와 제한

라이브러리가 정의한 오류 클래스는 `SoopChatError`를 상속하며 안정적인 `code`를 제공합니다.

| 오류                           | `code`                      | 추가 정보                                                                     |
| ------------------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| `BroadcastOfflineError`        | `BROADCAST_OFFLINE`         | 방송 중이 아님                                                                |
| `RestrictedRoomError`          | `RESTRICTED_ROOM`           | `reason`: `password`, `adult`, `subscriptionPlus`, `loginRequired`, `unknown` |
| `BrowserResolverRequiredError` | `BROWSER_RESOLVER_REQUIRED` | 브라우저 리졸버 누락                                                          |
| `ChannelResolutionError`       | `CHANNEL_RESOLUTION_FAILED` | 라이브 정보 API 또는 리졸버 실패                                              |
| `ProtocolError`                | `PROTOCOL_ERROR`            | 프레임 또는 이벤트 payload 해석 실패, 버린 바이트가 있으면 `discarded`        |

```ts
import { RestrictedRoomError, SoopChatError } from "soop-chat";

try {
  await chat.connect();
} catch (error) {
  if (error instanceof RestrictedRoomError) console.error(error.reason);
  else if (error instanceof SoopChatError) console.error(error.code);
  else throw error;
}
```

로그인, 비밀번호 방, 구독플러스 방, 19금 방, 채팅 전송은 v0.1.0에서 지원하지 않습니다. 조사 내용은 [프로토콜 문서](docs/protocol.md)에 정리되어 있습니다.

`raw` 이벤트에는 사용자 ID·닉네임·메시지 등 개인정보가 포함될 수 있습니다. 명시적인 보관 정책 없이 로그나 파일에 저장하지 마세요.

## 개발

```sh
npm install
npm test
npm run test:browser
npm run typecheck
npm run pack:check
```

실제 공개 방송에 대한 선택 실행형 smoke test:

```sh
SOOP_STREAMER_ID=soopId npm run test:live
```
