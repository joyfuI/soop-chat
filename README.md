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

## 이벤트

`on()`은 구독 해제 함수를 반환합니다. 특정 이벤트 외에도 다음 공통 스트림을 사용할 수 있습니다.

```ts
const off = chat.on("event", (event) => console.log(event.type, event.data));
chat.on("raw", (packet) => console.log(packet.opcode, packet.fields));
chat.on("unknown", (event) => console.log("새 opcode", event.opcode));
chat.on("protocolError", ({ error, raw }) => console.error(error, raw));

off();
```

모든 이벤트에는 `type`, `opcode`, `receivedAt`, `raw`, `data`가 있습니다. 현재 알려진 네트워크 opcode 101개와 미래 opcode용 `unknown`을 합쳐 102개 판별 타입을 제공합니다. 이벤트별 의미, 근거 수준, 구조화된 `data` 필드는 [이벤트 레퍼런스](docs/events.md)에서 확인할 수 있습니다.

의미가 확인되지 않은 payload 필드는 이름을 추측하지 않고 `data.fields`와 `raw.fields`에 보존합니다. 현재 62개 opcode가 구조화되어 있으며, 공식 플레이어가 실제로 읽는 로그인·입장 응답, 귓속말, 슬로우모드, 강퇴 목록, 모바일 방송 일시정지, 별풍선·팬레터·상품·애드벌룬·드롭스와 미션 필드를 제공합니다. `chatUser` 퇴장 이벤트의 `isKicked`로 일반 퇴장과 강퇴도 구분할 수 있습니다.

## 자동 재연결

예기치 않은 종료에는 채널 정보를 다시 조회하고 1초부터 최대 30초까지 지수 백오프로 재연결합니다. 채팅 서버가 `0088 closeBroad`를 보내면 `closeBroad`와 `ended: { reason: "offline" }`을 발생시키고 연결을 정상 종료하며 재시도하지 않습니다. 접근 제한도 재시도하지 않습니다.

```ts
const chat = new SoopChat({
  streamerId: "soopId",
  reconnect: {
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

`reconnect: false`로 자동 재연결을 끌 수 있습니다.

## 오류와 제한

- `BroadcastOfflineError`: 방송 중이 아님
- `RestrictedRoomError`: 비밀번호·성인·구독플러스·로그인 제한
- `BrowserResolverRequiredError`: 브라우저 리졸버 누락
- `ChannelResolutionError`: 라이브 정보 API 또는 리졸버 실패
- `ProtocolError`: 프레임 또는 이벤트 payload 해석 실패

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
