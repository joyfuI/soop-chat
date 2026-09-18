# soop-chat 작업 지침

## 프로젝트 범위

- `soop-chat`은 SOOP 라이브 채팅을 읽는 ESM 전용 TypeScript 라이브러리다.
- Node.js 24 이상과 현대 브라우저를 지원한다. Node는 채널 조회와 선택적 계정 인증을 직접 수행하고, 브라우저는 애플리케이션 서버의 `ChannelResolver`를 사용한다.
- 공개 범위는 읽기 전용이다. 검증되지 않은 채팅 전송 API를 추가하지 않는다.
- Node는 `ws`, 브라우저는 표준 `WebSocket`을 사용한다. transport 구현과 소켓 주입은 public API가 아니다.

## 작업 규칙

- 사용자가 명시적으로 코드 수정을 요청하기 전에는 코드를 수정하지 않는다.
- 사용자가 명시적으로 커밋을 요청하기 전에는 커밋하지 않는다.
- 커밋 메시지는 Conventional Commits의 영문 type 뒤에 한국어 요약을 쓴다.
- `package.json`의 `exports`가 public API 경계다. 기존 API와 Node/browser 경계를 불필요하게 깨지 않는다.
- 새 의존성보다 표준 API와 기존 코드를 우선한다.
- 프로토콜 관련 코드를 수정하기 전에 [`docs/protocol.md`](docs/protocol.md)를 읽는다. 세부 근거가 필요할 때만 [`docs/research/protocol-evidence.md`](docs/research/protocol-evidence.md)를 읽는다.
- `AGENTS.md`는 작업 규칙, 아키텍처 또는 high-risk invariant가 바뀔 때만 갱신한다. 조사 기록을 누적하지 않는다.

## High-risk invariant

- 패킷 길이는 JavaScript 문자열 길이가 아니라 UTF-8 byte 수로 계산한다.
- WebSocket message 하나가 protocol packet 하나라고 가정하지 않는다. 분할·병합 패킷과 알 수 없는 opcode/raw byte를 손실 없이 처리한다.
- 방송마다 달라지는 채널 정보와 인증 연결 정보는 연결할 때 다시 조회하며 방송 간에 캐시하지 않는다.
- 명시적 방송 종료는 일반 transport disconnect와 구분한다. 자동 재연결 여부와 이후 수동 연결의 재조회 계약을 유지한다.
- 의미가 확인되지 않은 필드를 추측해 public API로 만들지 않는다. 원본은 `raw`에 보존하고 근거 수준을 구분한다.
- TLS 인증서 검증을 비활성화하지 않는다.

정확한 URL, packet header, handshake, opcode와 인증 wire 형식은 [`docs/protocol.md`](docs/protocol.md)가 기준이다.

## 인증과 데이터 안전

- Node 기본 경로의 계정 정보, `AuthTicket`, 방 비밀번호는 로그·URL·fixture·소스나 일반 설정 저장소에 넣지 않는다. credential은 환경 변수나 secret manager에서 주입하고, 런타임에는 필요한 수명 동안만 프로세스 메모리에 둔다.
- 브라우저 서버 경로에서는 raw credential과 `AuthTicket`을 브라우저 JavaScript나 API payload에 노출하지 않는다. `AuthTicket`은 서버 측 session store에 보관하거나 인증된 암호화 방식으로 봉인한 opaque `HttpOnly` cookie session으로 유지할 수 있으며, 자세한 계약은 [`docs/browser.md`](docs/browser.md)를 따른다.
- Node 기본 경로의 인증 값을 공개 `ChannelInfo`나 이벤트에 노출하지 않는다.
- 실제 사용자 ID, 닉네임, 메시지, credential 또는 복구 가능한 실방송 캡처를 커밋하지 않는다. 테스트는 합성 또는 복구 불가능하게 비식별화한 데이터만 사용한다.
- 개인정보가 있을 수 있는 `raw` 이벤트를 명시적 보관 정책 없이 기록하지 않는다.

## 코드 지도

- `src/client.ts`: 연결 상태, handshake, heartbeat와 reconnect 수명주기
- `src/types.ts`: 공개 채널·resolver·reconnect·lifecycle 공통 타입
- `src/protocol.ts`: framing, packet codec와 event decoder
- `src/events.ts`: 공개 event/opcode catalog와 데이터 타입
- `src/node-resolver.ts`: Node 라이브 정보 조회와 인증
- `src/channel.ts`: 채널 입력 검증과 메모리 내 인증 연결
- `src/errors.ts`: 공개 오류 계층과 서버/브라우저 직렬화
- `src/node.ts`, `src/browser.ts`: package public entrypoint
- `test/`: 합성 단위 테스트와 브라우저·선택 실행형 live smoke test

## 문서 지도

| 정보                                                   | Source of Truth                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| export, 정확한 타입, 기본값, 공개 lifecycle 타입/옵션  | TypeScript 코드와 JSDoc                                                    |
| 처음 사용하는 방법                                     | [`README.md`](README.md)                                                   |
| 브라우저/서버 경계와 사용 계약                         | [`docs/browser.md`](docs/browser.md)                                       |
| 공개 이벤트의 의미와 주의사항                          | [`docs/events.md`](docs/events.md)                                         |
| wire protocol, framing, connection lifecycle invariant | [`docs/protocol.md`](docs/protocol.md)                                     |
| 표본, 플레이어 빌드, 반례, 조사 근거                   | [`docs/research/protocol-evidence.md`](docs/research/protocol-evidence.md) |
| 에이전트 작업 규칙과 high-risk invariant               | `AGENTS.md`                                                                |

상세 설명은 Source of Truth 한 곳에만 두고 다른 문서에서는 짧게 요약해 링크한다. 변경할 때는 해당 Source of Truth와 관련 테스트를 함께 갱신한다.

## 필수 검증

변경에 해당하는 행만 조합해 실행하고, 실행하지 못한 항목은 이유를 남긴다. 현재 문서 전용 링크 검사 script는 없으므로 docs-only 변경은 링크와 코드 예제를 직접 대조한다.

| 변경 범위                   | 검증                                                         |
| --------------------------- | ------------------------------------------------------------ |
| 모든 변경                   | `npm run format`                                             |
| docs-only                   | `npm run format:check`, 링크·예제와 Source of Truth 대조     |
| `docs/events.md`            | `npm run test:unit`                                          |
| 일반 TypeScript             | `npm run check`                                              |
| browser 또는 core lifecycle | `npm run check`, `npm run test:browser`                      |
| package exports·배포 파일   | `npm run check`, `npm run pack:check`                        |
| protocol·resolver·인증 통합 | `npm run check`, browser 경계 변경 시 `npm run test:browser` |

`npm run check`는 typecheck, lint, format check, 단위 테스트와 build를 실행한다. `npm run test:live`는 protocol·Node resolver·인증·실제 SOOP 연동을 바꾸고 필요한 환경변수와 credential이 이미 제공된 경우에만 고려하며 새 credential을 요구하거나 기록하지 않는다.
