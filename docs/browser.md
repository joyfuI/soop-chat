# 브라우저 리졸버와 인증

브라우저용 `SoopChat`은 `soop-chat/browser`에서 가져옵니다. SOOP 라이브 정보 API는 임의 웹사이트의 CORS 요청을 허용하지 않으므로, 애플리케이션 서버가 `ChannelResolver`용 endpoint를 제공해야 합니다. 클라이언트 quick start는 [README](../README.md#브라우저)를 참고하세요.

## 익명·비밀번호 방

서버는 요청의 `streamerId`와 선택적인 `roomPassword`를 검증한 뒤 Node entrypoint의 `resolveNodeChannel`을 호출합니다. 비밀번호를 URL이나 로그에 넣지 마세요.

```ts
import {
  resolveNodeChannel,
  RestrictedRoomError,
  serializeChannelResolutionError,
} from "soop-chat";

try {
  const channel = await resolveNodeChannel(streamerId, {
    signal: request.signal,
    roomPassword,
  });
  return Response.json(channel, {
    headers: { "cache-control": "no-store" },
  });
} catch (error) {
  return Response.json(serializeChannelResolutionError(error), {
    status: error instanceof RestrictedRoomError ? 403 : 503,
    headers: { "cache-control": "no-store" },
  });
}
```

브라우저 resolver는 오류 응답을 `deserializeChannelResolutionError`로 복원해야 `BroadcastOfflineError`와 `RestrictedRoomError`가 자동 재연결을 중단합니다. `SerializedChannelResolutionError`는 채널 해석 오류만을 위한 wire type입니다. 알 수 없거나 잘못된 payload와 `AuthenticationError`는 민감한 세부 정보를 제거한 `ChannelResolutionError`로 일반화됩니다. 인증 실패를 구분해야 한다면 deserialize 전에 애플리케이션의 HTTP `401` 정책으로 처리하세요.

`ChannelResolver`는 전달받은 `AbortSignal`을 `fetch` 등 모든 대기 작업에 전달해야 합니다. `disconnect()`가 pending resolution을 즉시 취소할 수 있어야 하며, 방송마다 달라지는 `chatNo`와 채널 정보를 캐시하면 안 됩니다.

## 계정 인증이 필요한 방

19금 방은 성인 인증이 완료된 계정, 구독플러스 방은 해당 권한이 있는 계정이 필요합니다. 로그인과 `AuthTicket` 보관은 애플리케이션 서버가 담당합니다.

로그인 endpoint에서 `authenticateNode`를 호출하고 반환된 `authTicket`을 인증된 암호화 방식으로 봉인해 `HttpOnly`, `Secure`, 적절한 `SameSite` 속성의 쿠키에 저장하세요. 평문이나 서명만 적용한 토큰에는 저장하지 마세요.

```ts
import { authenticateNode } from "soop-chat";

const authentication = await authenticateNode(
  { username, password },
  { signal: request.signal },
);

await encryptAndSetHttpOnlyCookie(authentication); // 애플리케이션 구현
```

채널 endpoint는 쿠키를 복호화하고 같은 `resolveNodeChannel`의 `authentication`에 전달합니다.

```ts
import { resolveNodeChannel } from "soop-chat";

const authentication = await readEncryptedHttpOnlyCookie(request); // 애플리케이션 구현
const channel = await resolveNodeChannel(streamerId, {
  signal: request.signal,
  roomPassword,
  authentication,
});

return Response.json(channel, {
  headers: { "cache-control": "no-store" },
});
```

인증된 호출은 `AuthenticatedChannelInfo`를 반환합니다. 이 값에는 브라우저가 SOOP WebSocket에 접속할 때 필요한 단기 `TK`와 `FTK`만 있고 계정 `AuthTicket`은 없습니다. 브라우저 클라이언트는 두 티켓을 검증한 뒤 열거 가능한 채널 객체에서 제거하고 내부 메모리로 옮깁니다.

## 보안 계약

- 계정 credential, 방 비밀번호, `AuthTicket`, `TK`, `FTK`를 URL, 로그, fixture 또는 영구 저장소에 넣지 않습니다.
- 계정 credential과 `AuthTicket`은 브라우저에 보내지 않습니다.
- 인증 채널 응답에는 `Cache-Control: no-store`를 적용합니다.
- 재연결마다 서버에서 새 `chatNo`, `TK`, `FTK`를 조회합니다.
- 로그인 상태 확인, 로그아웃, cookie encryption과 HTTP 상태 정책은 애플리케이션 프레임워크에서 구현합니다.

프로토콜 관찰 근거와 아직 확인되지 않은 티켓 수명은 [프로토콜 조사 노트](protocol.md#인증-연결)를 참고하세요.
