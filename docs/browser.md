# 브라우저 리졸버와 인증

브라우저용 `SoopChat`은 `soop-chat/browser`에서 가져옵니다. 브라우저는 SOOP 라이브 정보 HTTP API의 CORS 제한 때문에 연결 정보를 직접 조회할 수 없지만, 조회한 정보로 SOOP WebSocket에는 직접 연결할 수 있습니다.

```text
Browser
  -> Application Server
      -> SOOP live-info API

Browser
  -> SOOP WebSocket
```

애플리케이션 서버는 매 연결과 재연결마다 최신 채널 정보를 조회합니다. 계정 인증이 필요할 때도 credential과 계정 수준의 `AuthTicket`은 서버에 남기고, 브라우저에는 WebSocket 입장에 필요한 `TK`·`FTK`만 전달합니다.

## 서버 endpoint 계약

프레임워크와 무관하게 다음 계약을 권장합니다.

```text
POST /api/soop-channel

request:
  { streamerId, roomPassword? }

success:
  ChannelInfo | AuthenticatedChannelInfo

channel failure:
  SerializedChannelResolutionError

session failure:
  application-defined response
  example: 401 { code: "APPLICATION_SESSION_REQUIRED" }

auth:
  application-defined session
  example: opaque HttpOnly cookie

cache:
  Cache-Control: no-store
```

요청의 `streamerId`와 선택적 `roomPassword`는 서버에서 검증합니다. `roomPassword`는 URL에 넣지 않습니다. 잘못된 입력은 애플리케이션 요청 오류로 `400`을 반환하고 channel-resolution 오류로 직렬화하지 않습니다. `SerializedChannelResolutionError`는 방송 종료·제한방·채널 조회 실패 같은 SOOP 채널 해석 오류만 전달합니다. 애플리케이션 session의 누락·만료·검증 실패는 별도 상태와 payload로 응답하며, 위의 `401`은 한 가지 예입니다.

## 브라우저 resolver

```ts
import { deserializeChannelResolutionError, SoopChat } from "soop-chat/browser";

class ApplicationSessionRequiredError extends Error {}

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

    if (response.status === 401) {
      throw new ApplicationSessionRequiredError("Application login is required.");
    }
    if (!response.ok) {
      throw deserializeChannelResolutionError(await response.json(), { streamerId });
    }
    return response.json();
  },
});

chat.on("reconnecting", ({ error }) => {
  if (error instanceof ApplicationSessionRequiredError) {
    void chat.disconnect();
    showApplicationLogin(); // application code
  }
});

chat.on("chatMessage", ({ data }) => console.log(data.message));
try {
  await chat.connect();
} catch (error) {
  if (error instanceof ApplicationSessionRequiredError) showApplicationLogin();
  else throw error;
}
```

`ChannelResolver`는 전달받은 `AbortSignal`을 모든 대기 작업에 전달해야 합니다. signal을 무시하면 `disconnect()` 뒤에도 이전 조회가 남을 수 있습니다. 방송마다 달라지는 `ChannelInfo`는 캐시하지 마세요.

채널 오류 응답을 `deserializeChannelResolutionError`로 복원해야 `BroadcastOfflineError`와 `RestrictedRoomError`가 자동 재연결을 중단합니다. 알 수 없거나 잘못된 오류 payload는 `ChannelResolutionError`로 일반화됩니다.

애플리케이션 로그인·session 오류는 먼저 분기하고 `deserializeChannelResolutionError`에 넘기지 않습니다. 첫 `connect()`에서 발생하면 호출자가 예외를 처리하고, 연결 후 재조회에서 발생하면 위처럼 `reconnecting`의 오류를 구분해 `disconnect()`하고 로그인 UI로 전환합니다. 그렇지 않으면 일반 resolver 오류로 취급되어 횟수 제한 없이 재시도됩니다.

## 서버 구현

아래 코드는 **framework-independent pseudo-code**입니다. `readRequestJson`, `jsonResponse`, session·cookie 함수는 라이브러리 API가 아니라 애플리케이션 구현을 나타냅니다.

두 채널 endpoint는 같은 응답 helper를 사용합니다. 이 경계 안에서 발생한 모든 오류를 직렬화하므로 `BroadcastOfflineError`, `RestrictedRoomError`, 일반 `ChannelResolutionError`와 예상하지 못한 조회 오류가 framework 기본 500 응답으로 새어나가지 않습니다.

```ts
import { RestrictedRoomError, serializeChannelResolutionError } from "soop-chat";

async function channelResolutionResponse(resolve: () => Promise<unknown>) {
  try {
    return jsonResponse(await resolve(), { status: 200, cacheControl: "no-store" });
  } catch (error) {
    return jsonResponse(serializeChannelResolutionError(error), {
      status: error instanceof RestrictedRoomError ? 403 : 503,
      cacheControl: "no-store",
    });
  }
}
```

### 공개·비밀번호 방

```ts
import { resolveNodeChannel } from "soop-chat";

const input = validateChannelRequest(await readRequestJson(request)); // application code

return channelResolutionResponse(() =>
  resolveNodeChannel(input.streamerId, {
    signal: request.signal,
    roomPassword: input.roomPassword,
  }),
);
```

`validateChannelRequest`는 비어 있지 않은 `streamerId`와 선택적 `roomPassword`의 타입·허용 문자를 검사하고, 실패를 `400`으로 처리한 뒤에만 channel-resolution 경계로 넘깁니다.

### 계정 인증이 필요한 방

19금 방에는 성인 인증이 완료된 계정, 구독플러스 방에는 해당 권한이 있는 계정이 필요합니다.

로그인 endpoint는 `authenticateNode`가 반환한 인증 정보를 서버 측 session store에 보관하고 브라우저에는 opaque session ID만 주거나, 인증된 암호화 방식으로 봉인해 `HttpOnly`, `Secure`, 적절한 `SameSite` 속성의 쿠키에 저장할 수 있습니다. 아래는 후자의 무상태 예제입니다. 평문 또는 서명만 적용한 토큰으로 저장하지 마세요. 로그인 실패는 애플리케이션 로그인 응답으로 처리하며 채널 오류로 직렬화하지 않습니다.

```ts
import { authenticateNode } from "soop-chat";

const authentication = await authenticateNode(
  { username, password },
  { signal: request.signal },
);

await sealIntoHttpOnlyCookie(authentication); // application code
```

채널 endpoint는 서버 측 session을 읽거나 쿠키를 복호화해 같은 `resolveNodeChannel`에 전달합니다.

```ts
import { resolveNodeChannel } from "soop-chat";

const input = validateChannelRequest(await readRequestJson(request)); // application code
const authentication = await readApplicationSession(request); // application code
if (!authentication) {
  return jsonResponse(
    { code: "APPLICATION_SESSION_REQUIRED" },
    { status: 401, cacheControl: "no-store" },
  );
}

return channelResolutionResponse(() =>
  resolveNodeChannel(input.streamerId, {
    signal: request.signal,
    roomPassword: input.roomPassword,
    authentication,
  }),
);
```

`readApplicationSession`은 session이 없거나 만료·변조됐거나, 복호화한 payload가 애플리케이션 schema나 `SoopAuthentication` 구조와 맞지 않거나, `authTicket`이 비어 있거나 허용 형식이 아닌 경우에만 `undefined`를 반환합니다. crypto key 설정 오류, 저장소 장애와 프로그래밍 오류 같은 예상하지 못한 실패는 다시 던져 server error로 처리하세요.

형식상 유효한 `AuthTicket`도 SOOP에서 만료·폐기됐을 수 있지만 TTL과 무효화 응답 형태는 확인되지 않았습니다. 따라서 `resolveNodeChannel` 오류를 근거 없이 애플리케이션 session 만료로 바꾸지 마세요.

인증된 조회는 `AuthenticatedChannelInfo`를 반환합니다. 브라우저가 받는 것은 일반 채널 정보와 WebSocket 입장용 `TK`·`FTK`이며, 계정 credential과 `AuthTicket`은 포함되지 않습니다. 라이브러리는 티켓을 내부 메모리로 옮겨 연결하고 원래 응답 객체를 수정하지 않습니다. 애플리케이션도 이 응답을 기록하거나 캐시하지 마세요.

## 보안 계약

- raw 계정 credential, 방 비밀번호, `AuthTicket`, `TK`, `FTK`를 URL, 로그, fixture 또는 영구 저장소에 넣지 않습니다.
- `AuthTicket`은 서버 측 session store에 보관하거나 인증된 암호화 방식으로 봉인한 opaque `HttpOnly` cookie session으로 유지할 수 있습니다. 계정 비밀번호는 cookie에 넣지 않습니다.
- 계정 credential과 raw `AuthTicket`은 브라우저 JavaScript나 API payload로 보내지 않습니다.
- 인증 채널 응답에는 `Cache-Control: no-store`를 적용합니다.
- 연결과 재연결마다 서버에서 최신 채널 정보와 WebSocket 입장용 `TK`·`FTK`를 조회합니다.
- 로그인 상태 확인, 로그아웃, cookie encryption과 HTTP 상태 정책은 애플리케이션이 구현합니다.

정확한 resolver, 응답과 오류 타입은 [`src/types.ts`](../src/types.ts), [`src/errors.ts`](../src/errors.ts), [`src/node-resolver.ts`](../src/node-resolver.ts)의 타입과 JSDoc이 기준입니다. 브라우저 첫 사용 예제는 [README](../README.md#브라우저)를 참고하세요.
