# soop-chat

SOOP 라이브 방송의 채팅을 읽는 TypeScript 라이브러리입니다. Node.js 24 이상과 현대 브라우저를 지원하며 ESM으로만 배포됩니다.

> 비공식 라이브러리입니다. SOOP이 프로토콜이나 플레이어 API를 변경하면 동작이 달라질 수 있습니다.

이 프로젝트는 OpenAI Codex로 만들어졌습니다.

## 설치

```sh
npm install soop-chat
```

## 공개 API

| Export                      | Import              | Runtime  | 용도                                                             |
| --------------------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `SoopChat`                  | `soop-chat`         | Node.js  | 기본 채널 조회와 선택적 계정 인증을 포함한 채팅 클라이언트       |
| `SoopChat`                  | `soop-chat/browser` | 브라우저 | 애플리케이션 서버의 `ChannelResolver`를 사용하는 채팅 클라이언트 |
| `resolveNodeChannel`        | `soop-chat`         | Node.js  | 현재 방송의 채널 정보를 한 번 조회                               |
| `authenticateNode`          | `soop-chat`         | Node.js  | 서버에 보관할 계정 `AuthTicket` 발급                             |
| `createNodeChannelResolver` | `soop-chat`         | Node.js  | 인증 상태를 메모리에 유지하는 resolver 생성                      |
| 오류·이벤트·공통 타입       | 두 entrypoint       | 공통     | typed event, lifecycle, resolver 오류 처리                       |

브라우저 서버 계약과 인증은 [브라우저 리졸버 가이드](docs/browser.md), 이벤트별 필드는 [이벤트 레퍼런스](docs/events.md), wire-level 근거와 미확인 사항은 [프로토콜 조사 노트](docs/protocol.md)를 참고하세요.

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

비밀번호 방은 계정 로그인 없이 `roomPassword`로 읽을 수 있습니다. 비밀번호를 소스 코드, 로그, 셸 이력이나 저장소에 남기지 말고 환경 변수나 별도의 비밀 저장소에서 읽으세요.

```ts
const roomPassword = process.env.SOOP_ROOM_PASSWORD;
if (!roomPassword) throw new Error("SOOP room password is required.");

const chat = new SoopChat({ streamerId: "soopId", roomPassword });
await chat.connect();
```

성인 인증이 완료된 계정으로 19금 방을 읽거나 구독플러스 권한 계정으로 해당 방을 Node에서 읽으려면 `credentials`를 전달합니다. 계정 정보도 소스 코드에 직접 쓰거나 저장소에 커밋하지 마세요. 계정 로그인이 필요한 제한과 비밀번호가 함께 설정된 방은 `credentials`와 `roomPassword`를 동시에 전달할 수 있습니다.

```ts
const { SOOP_USERNAME: username, SOOP_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("SOOP credentials are required.");

const chat = new SoopChat({
  streamerId: "soopId",
  credentials: { username, password },
});

await chat.connect();
```

Node 기본 경로는 credential과 인증 티켓을 프로세스 메모리에만 유지하고 공개 `ChannelInfo`나 이벤트로 노출하지 않습니다. `resolveChannel`을 직접 전달하면 사용자 resolver가 우선하며 `credentials`는 사용하지 않습니다.

Node에서도 별도 API나 캐시를 사용하려면 브라우저와 같은 형태의 `resolveChannel`을 생성자에 전달해 기본 조회를 대체할 수 있습니다.

사용자 정의 `ChannelResolver`는 전달받은 `AbortSignal`을 모든 대기 작업에 전달해야 합니다. `disconnect()`나 새 lifecycle 전환 시 pending resolution을 빠르게 중단하기 위한 계약이며, signal을 무시하면 이전 `connect()` Promise가 resolver 완료까지 남을 수 있습니다. 방송이 바뀔 수 있는 `ChannelInfo`는 방송 간에 캐시하지 않아야 합니다.

## 브라우저

SOOP 라이브 정보 API는 임의 웹사이트의 CORS 요청을 허용하지 않습니다. 따라서 브라우저에서는 애플리케이션 서버가 제공하는 `ChannelResolver`가 필요합니다.

```ts
import { deserializeChannelResolutionError, SoopChat } from "soop-chat/browser";

const chat = new SoopChat({
  streamerId: "soopId",
  resolveChannel: async (streamerId, { signal, roomPassword }) => {
    const response = await fetch("/api/soop-channel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      signal,
      body: JSON.stringify({ streamerId, roomPassword }),
    });
    if (!response.ok) {
      throw deserializeChannelResolutionError(await response.json(), { streamerId });
    }
    return response.json();
  },
});

chat.on("chatMessage", ({ data }) => console.log(data.message));
await chat.connect();
```

서버는 요청을 검증하고 매번 최신 채널 정보를 반환해야 합니다. 19금·구독플러스 방의 로그인, HttpOnly 쿠키, 오류 직렬화와 티켓 보안 계약은 [브라우저 리졸버 가이드](docs/browser.md)에 정리되어 있습니다.

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

모든 프로토콜 이벤트에는 `type`, `opcode`, `receivedAt`, `raw`, `data`가 있습니다. 알려진 opcode는 개별 판별 타입으로, 미래 opcode는 `unknown`으로 손실 없이 제공합니다. 이벤트별 의미, 근거 수준, 구조화된 `data` 필드는 [이벤트 레퍼런스](docs/events.md)에서 확인할 수 있습니다.

의미가 확인되지 않은 payload 필드는 이름을 추측하지 않고 `data.fields`와 `raw.fields`에 보존합니다. `chatUser` 퇴장 이벤트의 `isKicked`로 일반 퇴장과 강퇴를 구분할 수 있습니다.

연결 수명주기 이벤트는 프로토콜 이벤트와 다른 payload를 사용합니다.

| 이벤트          | payload                                                               |
| --------------- | --------------------------------------------------------------------- |
| `stateChange`   | 이전·현재 `ConnectionState`인 `previous`, `current`                   |
| `reconnecting`  | 재시도 횟수 `attempt`, 대기 시간 `delayMs`, 원인 `error`              |
| `error`         | WebSocket 또는 비동기 처리 중 발생한 `Error`                          |
| `ended`         | 종료 사유 `reason: "offline" \| "restricted"`와 제한 시 `restriction` |
| `protocolError` | 프로토콜 `error`와 관련 패킷이 있으면 `raw`                           |

`connect()` 자체의 실패는 Promise에서 예외로 전달됩니다. WebSocket이나 비동기 처리 오류는 `error`, 연결 후 확인된 방송 종료나 접근 제한은 `ended`, 복구 가능한 연결 종료는 `reconnecting`으로 구분할 수 있습니다. 수동 `disconnect()`는 `ended`를 발생시키지 않습니다.

사용자 listener가 던진 예외나 반환한 Promise의 rejection은 내부 연결 상태를 중단시키지 않고 등록된 `error` listener로 전달됩니다. listener Promise는 기다리지 않습니다. 재귀 오류를 막기 위해 `error` listener 자체의 예외와 rejection은 다시 전달하지 않으며, 같은 이벤트의 다른 listener는 계속 실행됩니다.

공개 `EVENT_CATALOG`로 지원하는 opcode의 이벤트 이름, 설명과 근거 수준을 실행 중 조회할 수 있습니다.

```ts
import { EVENT_CATALOG } from "soop-chat";

console.log(EVENT_CATALOG["0005"]);
// { type: "chatMessage", description: "Chat Message", provenance: "observed" }
```

## 자동 재연결

예기치 않은 종료에는 채널 정보를 다시 조회하고 1초부터 최대 30초까지 지수 백오프로 재연결합니다. 채팅 서버가 `0088 closeBroad`를 보내면 `closeBroad`와 `ended: { reason: "offline" }`을 발생시키고 연결을 정상 종료하며 재시도하지 않습니다. 접근 제한도 재시도하지 않습니다.

`chatNo`는 방송 인스턴스마다 달라집니다. `0088` 이후 다음 방송을 읽으려면 `connect()`를 다시 호출하세요. 이때 리졸버가 다시 실행되므로 이전 `ChannelInfo`를 방송 간에 캐시하지 마세요. 관찰 근거는 [프로토콜 문서](docs/protocol.md)에 기록되어 있습니다.

```ts
const chat = new SoopChat({
  streamerId: "soopId",
  handshakeTimeoutMs: 30_000,
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

`handshakeTimeoutMs`는 채널 해석이 끝난 뒤 WebSocket을 만들고 `0002` 입장 응답을 받을 때까지의 제한이며 기본값은 30초입니다. timeout이 자동 재연결 도중 발생하면 다음 retry로 이어집니다. 예약된 retry 중 `connect()`를 직접 호출하면 대기를 취소하고 즉시 연결하며, 이미 retry 연결이 진행 중이면 같은 연결 Promise를 사용합니다.

`reconnect: false` 또는 `reconnect: { enabled: false }`로 자동 재연결을 끌 수 있습니다. timeout과 reconnect의 모든 숫자 옵션은 유한한 숫자여야 합니다.

## 오류와 제한

라이브러리가 정의한 오류 클래스는 `SoopChatError`를 상속하며 안정적인 `code`를 제공합니다.

| 오류                           | `code`                      | 추가 정보                                                                     |
| ------------------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| `BroadcastOfflineError`        | `BROADCAST_OFFLINE`         | 방송 중이 아님                                                                |
| `RestrictedRoomError`          | `RESTRICTED_ROOM`           | `reason`: `password`, `adult`, `subscriptionPlus`, `loginRequired`, `unknown` |
| `AuthenticationError`          | `AUTHENTICATION_FAILED`     | 로그인 API 실패, 잘못된 계정 정보 또는 인증 티켓 누락                         |
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

Node에서는 비밀번호 방, 성인 인증이 완료된 계정의 19금 방과 권한 계정의 구독플러스 방 읽기를 직접 지원합니다. 브라우저에서는 애플리케이션 서버가 검증한 비밀번호와 발급한 인증 채널 정보를 사용해 같은 제한 방을 읽을 수 있습니다. 채팅 전송은 지원하지 않습니다. 조사 내용은 [프로토콜 문서](docs/protocol.md)에 정리되어 있습니다.

`raw` 이벤트에는 사용자 ID·닉네임·메시지 등 개인정보가 포함될 수 있습니다. 명시적인 보관 정책 없이 로그나 파일에 저장하지 마세요.

## 개발

```sh
npm install
npm run format
npm run check
npm run test:browser
npm run pack:check
```

`npm run check`는 typecheck, lint, format check, 단위 테스트와 build를 CI와 같은 순서로 실행합니다. 브라우저 테스트와 패키지 검사는 실행 환경이 달라 별도 명령으로 유지합니다.

실제 공개 방송에 대한 선택 실행형 smoke test:

```sh
SOOP_STREAMER_ID=soopId npm run test:live
```

비밀번호 방은 `SOOP_ROOM_PASSWORD`, 로그인도 함께 검증할 때는 `SOOP_USERNAME`과 `SOOP_PASSWORD`를 비밀 저장소를 통해 추가로 주입할 수 있습니다.
