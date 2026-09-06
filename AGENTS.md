# soop-chat 작업 지침

## 프로젝트 범위

- `soop-chat`은 SOOP 라이브 채팅을 읽는 ESM 전용 TypeScript 라이브러리다.
- Node.js 24 이상과 현대 브라우저를 지원한다. Node는 채널 조회와 선택적 계정 인증을 직접 수행하고, 브라우저는 애플리케이션 서버가 제공하는 `ChannelResolver`를 사용한다.
- 공개 방송과 비밀번호 방은 계정 없이 읽을 수 있다. 19금 방과 구독플러스 방은 권한이 있는 계정의 인증이 필요하다.
- 현재 공개 범위는 읽기 전용이다. 검증되지 않은 채팅 전송 API를 추가하지 않는다.
- Node와 브라우저 모두 표준 WebSocket을 사용한다. transport 구현 타입과 소켓 주입은 public API가 아니다.

## 작업 규칙

- 사용자가 명시적으로 코드 수정을 요청하기 전에는 코드를 수정하지 않는다.
- 사용자가 명시적으로 커밋을 요청하기 전에는 커밋하지 않는다.
- 커밋 메시지는 Conventional Commits의 영문 type 뒤에 한국어 요약을 쓴다.
- 기존 공개 API와 Node/browser 경계를 불필요하게 깨지 않는다. 새 의존성보다 표준 API와 기존 코드를 우선한다.
- `AGENTS.md`는 작업 규칙, 아키텍처 또는 핵심 invariant가 바뀔 때만 갱신한다. 조사 결과와 일회성 검증 기록을 changelog처럼 누적하지 않는다.

## 핵심 프로토콜 invariant

- WebSocket URL은 `wss://<소문자 CHDOMAIN>:<CHPT + 1>/Websocket/<streamerId>`이고 서브프로토콜은 `chat`이다.
- 패킷 헤더는 `ESC TAB`, 숫자 opcode 4자리, UTF-8 payload byte 길이 6자리, 숫자 flags 2자리의 14바이트다.
- payload 필드는 form feed(`0x0c`)로 구분한다. 길이는 JavaScript 문자열 길이가 아니라 UTF-8 byte 수로 계산한다.
- 하나의 WebSocket message가 하나의 프로토콜 패킷이라는 가정을 두지 않는다. 분할·병합된 패킷과 알 수 없는 opcode/raw byte를 손실 없이 처리한다.
- 익명 입장은 `0001` 응답 뒤 `0002`를 보내며, 입장 완료 뒤 `0000` heartbeat를 보낸다.
- `chatNo`와 인증용 `TK`·`FTK`는 방송/연결마다 다시 조회한다. 방송 간에 캐시하지 않는다.
- 명시적 방송 종료 `0088`은 일반 transport disconnect와 구분하며 자동 재연결하지 않는다. 이후 수동 `connect()`는 채널을 다시 조회한다.
- 플레이어나 실방송에서 의미가 확인되지 않은 필드는 추측해서 public API에 추가하지 않는다. 원본은 `raw`에 보존하고 근거 수준은 event provenance로 구분한다.
- 공식 플레이어 검증은 문서에 기록된 과거 빌드를 재사용하지 않고 검증 시점의 최신 공식 번들을 기준으로 한다. 빌드 번호는 조사 근거 재현을 위한 기록으로만 남긴다.
- TLS 인증서 검증을 비활성화하지 않는다.

## 인증과 데이터 안전

- 계정 정보, `AuthTicket`, `TK`, `FTK`, 방 비밀번호는 로그·URL·fixture·저장소에 넣지 않고 필요한 수명 동안 메모리에서만 다룬다.
- Node 기본 경로의 인증 값은 공개 `ChannelInfo`와 이벤트에 노출하지 않는다. 서버 보조 브라우저 경로는 `AuthTicket`을 브라우저에 보내지 않고 WebSocket 입장용 `TK`·`FTK`만 `AuthenticatedChannelInfo`로 전달한다.
- 실제 사용자 ID, 닉네임, 메시지, credential 또는 복구 가능한 실방송 캡처를 커밋하지 않는다. 테스트는 합성 또는 복구 불가능하게 비식별화한 데이터만 사용한다.
- `raw` 이벤트에는 개인정보가 있을 수 있으므로 명시적 보관 정책 없이 기록하지 않는다.

## 코드와 문서 위치

- `package.json`의 `exports`가 공개 API 경계다. `.`의 `src/node.ts`와 `./browser`의 `src/browser.ts`에서 재노출하는 타입까지 공개 계약으로 취급한다. 소스 파일의 `export`만으로 package public API가 되지는 않는다.
- `src/client.ts`: 연결 상태, handshake, heartbeat와 reconnect 수명주기
- `src/protocol.ts`: framing, packet codec와 event decoder
- `src/events.ts`: 공개 event/opcode catalog와 데이터 타입
- `src/node-resolver.ts`: Node 라이브 정보 조회와 인증
- `src/channel.ts`: 채널 입력 검증과 메모리 내 인증 연결
- `src/errors.ts`: 공개 오류 계층과 서버/브라우저 직렬화
- `test/`: 합성 단위 테스트와 브라우저·선택 실행형 live smoke test
- `README.md`: 설치, 주요 공개 API, 보안 및 운영 사용법. 전체 타입 계약은 공개 symbol의 JSDoc과 타입 선언이 기준이다.
- `docs/browser.md`: 브라우저 resolver 서버, 인증과 ticket 보안 계약
- `docs/events.md`: 공개 이벤트 필드의 의미와 provenance. 구조와 타입의 원본은 `src/events.ts`다.
- `docs/protocol.md`: 현재 wire protocol 계약과 미확인 사항. 세부 표본·관찰 기록은 연결된 `docs/research/protocol-evidence.md`에서 필요할 때만 읽는다.

변경에 해당하는 문서를 함께 갱신한다.

- 프로토콜 사실·invariant → `docs/protocol.md` + 관련 테스트. 세부 관찰 근거는 연결된 evidence 문서에 보존
- 이벤트명·opcode·필드·의미·provenance → `docs/events.md` + 관련 테스트
- option·public export·오류 계약 → 해당 JSDoc + 필요한 README/API 안내
- 브라우저 인증·resolver 경계 → `docs/browser.md`
- public entrypoint → `package.json`의 `exports` + entrypoint + README/JSDoc

주요 공개 symbol의 JSDoc은 IDE에서 사용 계약, 기본값, runtime 경계와 보안 제약을 알 수 있게 짧게 유지한다.

## 필수 검증

코드 변경 후 다음을 실행하고, 실행하지 못한 항목은 이유를 남긴다.

```sh
npm run format
npm run check
npm run test:browser
npm run pack:check
```

`npm run check`는 typecheck, lint, format check, 단위 테스트와 build를 실행한다.

`npm run test:live`는 protocol·Node resolver·인증·실제 SOOP 연동 동작을 바꾼 경우에만 고려한다. 위의 결정적 검증을 우선하고, 필요한 환경변수와 해당 방의 credential이 이미 제공된 환경에서만 선택적으로 실행한다(설정은 README 참고). credential을 새로 요구하거나 문서·fixture·로그에 기록하지 않는다. 실행할 수 없으면 이유를 남기되 그 자체를 작업 실패로 간주하지 않는다.
