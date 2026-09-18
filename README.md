# soop-chat

SOOP 라이브 방송의 채팅을 읽는 비공식 TypeScript 라이브러리입니다. Node.js 24 이상과 현대 브라우저를 지원하며 ESM으로만 배포됩니다.

> SOOP이 프로토콜이나 플레이어 API를 변경하면 동작이 달라질 수 있습니다. 채팅 전송은 지원하지 않습니다.

이 프로젝트는 OpenAI Codex로 만들어졌습니다.

## 설치

```sh
npm install soop-chat
```

## Node.js Quick Start

```ts
import { SoopChat } from "soop-chat";

const chat = new SoopChat({ streamerId: "soopId" });

chat.on("chatMessage", ({ data }) => {
  console.log(data.senderNickname, data.message);
});

await chat.connect();
```

`connect()`은 채팅방 입장이 끝난 뒤 완료됩니다. 더 이상 읽지 않을 때는 `await chat.disconnect()`를 호출하세요.

## 브라우저

브라우저는 SOOP 라이브 정보 API를 직접 호출할 수 없으므로 애플리케이션 서버가 최신 채널 정보를 조회해야 합니다.

다음은 공개·비밀번호 방의 최소 resolver 예제입니다.

```ts
import { deserializeChannelResolutionError, SoopChat } from "soop-chat/browser";

const chat = new SoopChat({
  streamerId: "soopId",
  resolveChannel: async (streamerId, { signal, roomPassword }) => {
    const response = await fetch("/api/soop-channel", {
      method: "POST",
      headers: { "content-type": "application/json" },
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

계정 로그인 session을 사용하는 endpoint에서 `401`을 단순 `Error`로 던지면 연결 후 재조회가 계속될 수 있습니다. 인증 쿠키와 session 만료 시 재연결 중단 패턴은 [브라우저 리졸버 가이드](docs/browser.md)를 참고하세요.

## 제한방과 인증

`streamerId`는 모든 방송에서 필요합니다. 다음 표는 Node.js 기본 resolver 기준입니다.

| 방 종류                | 추가로 필요한 옵션             |
| ---------------------- | ------------------------------ |
| 공개 방송              | 없음                           |
| 비밀번호 방            | `roomPassword`                 |
| 19금 방                | 권한 있는 `credentials`        |
| 구독플러스 방          | 권한 있는 `credentials`        |
| 로그인 제한 + 비밀번호 | `credentials` + `roomPassword` |

브라우저에서는 `credentials` 대신 애플리케이션 서버의 resolver와 로그인 session을 사용합니다. credential과 비밀번호는 소스·로그·셸 이력·저장소에 남기지 말고 환경 변수나 secret store에서 읽으세요.

```ts
const { SOOP_USERNAME: username, SOOP_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("SOOP credentials are required.");

const chat = new SoopChat({
  streamerId: "soopId",
  credentials: { username, password },
  roomPassword: process.env.SOOP_ROOM_PASSWORD,
});

await chat.connect();
```

`credentials`를 지정하면 내장 resolver는 첫 채널 조회 전에 로그인하며, 공개방을 먼저 익명 조회한 뒤 인증으로 fallback하지 않습니다. Node 기본 경로는 credential과 계정 인증 티켓을 프로세스 메모리에만 유지합니다. 브라우저 인증에서는 계정 credential과 raw `AuthTicket`을 서버 밖으로 보내지 않으며, 서버 session 보관 계약은 [브라우저 리졸버 가이드](docs/browser.md)를 따릅니다.

## 주요 이벤트

| 이벤트             | 사용할 때          | 주의사항                                   |
| ------------------ | ------------------ | ------------------------------------------ |
| `chatMessage`      | 일반 채팅 메시지   | 첫 사용에 권장                             |
| `chatUser`         | 사용자 입장·퇴장   | 입장은 여러 사용자의 batch일 수 있음       |
| `sendBalloon`      | 별풍선 후원        | `fanOrder`는 고유 ID나 정렬 키가 아님      |
| `followItem`       | 구독 세리머니      | 결제 시각이나 신규 구독 발생을 뜻하지 않음 |
| `sendSubscription` | 수신자별 구독 선물 | 전체 선물 개수 이벤트가 아님               |
| `mission`          | 도전·대결미션      | `missionKind`와 `action`으로 먼저 분기     |
| `closeBroad`       | 명시적 방송 종료   | 이어서 `ended: { reason: "offline" }` 발생 |

모든 프로토콜 이벤트에는 `type`, `opcode`, `receivedAt`, `raw`, `data`가 있습니다. 이벤트 선택과 해석상 주의사항, 전체 색인은 [이벤트 가이드](docs/events.md)를 참고하세요.

공통 스트림도 구독할 수 있습니다.

```ts
const off = chat.on("event", (event) => console.log(event.type, event.data));
chat.on("unknown", (event) => console.log("새 opcode", event.opcode));
chat.on("protocolError", ({ error }) => console.error(error));

off();
```

`raw`에는 사용자 ID·닉네임·메시지 등 개인정보가 있을 수 있으므로 보관 정책 없이 기록하지 마세요.

## 상세 레퍼런스

- 정확한 export: [`src/node.ts`](src/node.ts), [`src/browser.ts`](src/browser.ts)
- 옵션, 기본값, lifecycle 타입: [`src/types.ts`](src/types.ts)의 타입과 JSDoc
- 이벤트 데이터 타입: [`src/events.ts`](src/events.ts)의 타입과 JSDoc
- 오류 타입과 직렬화 계약: [`src/errors.ts`](src/errors.ts)의 타입과 JSDoc
- 브라우저/서버 경계: [브라우저 리졸버 가이드](docs/browser.md)
- 이벤트 의미와 caveat: [이벤트 가이드](docs/events.md)

## 연결과 오류 처리

`chat.state === "connected"`이면 채팅방 입장이 끝난 상태입니다. 전체 `ConnectionState`와 옵션 기본값은 `src/types.ts`의 JSDoc이 기준입니다.

```ts
chat.on("stateChange", ({ previous, current }) => {
  console.log(`${previous} -> ${current}`);
});

chat.on("reconnecting", ({ attempt, delayMs, error }) => {
  console.warn({ attempt, delayMs, error });
});

chat.on("ended", ({ reason, restriction }) => {
  console.log({ reason, restriction });
});
```

예기치 않은 transport 종료에는 기본적으로 채널 정보를 다시 조회해 지수 backoff로 재연결합니다. 최대 재시도 횟수 제한은 없으며, 명시적 방송 종료·접근 제한 또는 `disconnect()`까지 계속 시도합니다. 다음 방송을 읽으려면 `connect()`를 다시 호출하세요. 사용자 정의 `ChannelResolver`는 전달받은 `AbortSignal`을 따르고 방송별 `ChannelInfo`를 캐시하지 않아야 합니다.

`connect()` 실패는 Promise 예외로 전달됩니다. 라이브러리 오류는 `SoopChatError`를 상속합니다. `AuthenticationError`는 Node 계정 인증, `BrowserResolverRequiredError`는 브라우저 resolver 누락에서 발생하며, `BroadcastOfflineError`, `RestrictedRoomError`, `ChannelResolutionError`, `ProtocolError`는 두 entrypoint가 공유합니다.

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

## 개발

```sh
npm install
npx playwright install chromium firefox webkit
npm run format
npm run check
npm run test:browser
npm run pack:check
```

`npm run check`는 typecheck, lint, format check, 단위 테스트와 build를 실행합니다. browser test와 package 내용 검사는 CI에서도 별도로 실행합니다. maintainer용 wire protocol과 조사 근거는 저장소의 [프로토콜 문서](https://github.com/joyfuI/soop-chat/blob/main/docs/protocol.md)와 [research 문서](https://github.com/joyfuI/soop-chat/blob/main/docs/research/protocol-evidence.md)를 참고하세요.

실제 방송 smoke test는 필요한 환경변수가 이미 준비된 경우에만 선택적으로 실행합니다.

```sh
SOOP_STREAMER_ID=soopId npm run test:live
```
