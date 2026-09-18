# SOOP 채팅 프로토콜 계약과 미확인 사항

이 문서는 현재 구현이 의존하는 wire protocol과 연결 lifecycle을 설명합니다. SOOP의 공식 사양이 아닙니다. 공개 이벤트의 제품 의미와 사용상 주의사항은 [이벤트 가이드](events.md), 실제 표본·시각·플레이어 빌드·반례는 [관찰 근거](research/protocol-evidence.md)를 따릅니다.

평상시에는 이 문서만 읽고, 근거를 다시 검토할 때만 research 문서의 연결된 절을 읽습니다.

## 근거와 보수적 처리

플레이어와 실방송 캡처를 우선하며 참고 라이브러리에서만 확인한 이벤트는 `reference`로 구분합니다. 후속 검증은 과거 기록의 빌드를 재사용하지 않고 검증 시점의 최신 공식 플레이어 번들을 기준으로 합니다.

확인되지 않은 필드에는 의미 있는 이름을 붙이지 않습니다. 알 수 없는 opcode, payload field와 원본 byte는 가능한 한 보존하고, 이벤트별 근거 수준은 [`EVENT_CATALOG`](../src/events.ts)이 관리합니다.

## 연결 정보 조회

Node resolver는 다음 API를 POST로 호출합니다.

```text
https://live.sooplive.com/afreeca/player_live_api.php?bjid={streamerId}
```

요청에는 `bid`, `type=live`, `player_type=html5`, `stream_type=common`, `quality=HD`, `mode=landing` 등이 포함됩니다. 응답의 `BNO`, `CHATNO`, `CHDOMAIN`, `CHPT`를 검증한 뒤 다음 WebSocket을 엽니다.

```text
wss://{lowercase CHDOMAIN}:{CHPT + 1}/Websocket/{encodeURIComponent(streamerId)}
Sec-WebSocket-Protocol: chat
```

방송 인스턴스가 바뀌면 `chatNo`와 인증 연결 정보도 달라질 수 있습니다. 최초 연결, 재연결과 다음 방송 연결마다 resolver를 다시 호출하며 방송 간에 응답을 캐시하지 않습니다.

브라우저에서는 라이브 정보 API의 CORS 제한 때문에 애플리케이션 서버가 조회를 대신합니다. 서버·브라우저 경계는 [브라우저 리졸버 가이드](browser.md)가 기준입니다.

TLS 검증은 비활성화하지 않습니다. 인증서 문제는 환경의 CA 설정을 고치거나 호출자에게 오류로 전달합니다.

## 패킷 framing과 streaming

헤더는 14 byte입니다.

```text
ESC TAB | opcode 4 bytes | payload length 6 bytes | flags 2 bytes | UTF-8 payload
```

opcode·length·flags는 각각 4·6·2자리 숫자입니다. payload length는 JavaScript 문자열 길이가 아니라 UTF-8 byte 수이며, payload field는 form feed(`0x0c`)로 구분합니다.

WebSocket message 경계와 protocol packet 경계가 같다고 가정하지 않습니다. 하나의 message에 여러 packet이 들어오거나 하나의 packet이 여러 message로 나뉠 수 있으므로 byte stream에서 완성된 packet만 꺼냅니다.

framing을 복구하며 버린 byte는 `ProtocolError.discarded`로 제공합니다. decoding에 실패한 packet은 관련 `RawPacket`과 함께 `protocolError`로 전달하고, 알 수 없는 opcode는 `unknown` 이벤트로 원본을 보존합니다.

## 입장 handshake와 heartbeat

익명 입장은 다음 순서입니다.

1. `0001` payload `\f\f\f16\f` 전송
2. 유효한 서버 `0001` 응답 대기
3. `0002` payload `\f{CHATNO}\f\f\f\f\f` 전송
4. 유효한 서버 `0002` 응답 뒤 연결 완료
5. 연결 중 60초마다 `0000` keepalive 전송

handshake 응답도 일반 이벤트 디코더의 field 검증을 통과해야 합니다. 잘못된 응답은 `protocolError`로 보존하며 다음 단계로 진행하지 않습니다. `0001` 이전의 `0002`로 연결을 완료하거나 heartbeat를 시작하지 않고, 중복 `0001`로 입장 요청을 반복하지 않습니다.

입장 완료 전 명시적 방송 종료가 오면 대기 중인 `connect()`를 `BroadcastOfflineError`로 즉시 거부합니다. WebSocket 생성부터 유효한 `0002`까지 timeout을 적용합니다.

Node는 SOOP 서버의 연결 요청 header 호환성을 위해 `ws`를 사용하고 브라우저는 표준 `WebSocket`을 사용합니다. 비교 실험은 [Node WebSocket 연결 요청 헤더 호환성](research/protocol-evidence.md#node-websocket-연결-요청-헤더-호환성)에 보존합니다.

## 종료와 reconnect

정상 종료에는 WebSocket code `1000`, handshake 실패에는 `3000`, transport 실패에는 `3001`을 사용합니다. 클라이언트가 보낼 수 없는 예약 code는 사용하지 않습니다.

`0088 closeBroad`는 명시적 방송 종료입니다. 라이브러리는 `closeBroad`를 먼저 전달하고 `ended: { reason: "offline" }`을 한 번 발생시킨 뒤 정상 종료하며 자동 재연결하지 않습니다. 이후 수동 `connect()`는 resolver부터 다시 실행합니다.

일반 transport 종료에는 채널 정보를 다시 조회한 뒤 지수 backoff로 재연결합니다. 접근 제한과 명시적 방송 종료는 재시도하지 않습니다. retry 중 수동 연결, timeout과 상태 전이의 정확한 공개 계약은 [`SoopChatOptions`](../src/types.ts)와 `src/client.ts`가 기준입니다.

`0007 setBjStat`의 원본 숫자는 방송 중에도 올 수 있어 종료로 해석하지 않습니다. 이벤트 의미와 그 밖의 상태 관련 caveat는 [이벤트 가이드](events.md)를 참고하세요. [방송 종료 관찰 근거](research/protocol-evidence.md#방송-종료)

## 인증 handshake

### 로그인과 19금 방

라이브 정보 API의 `RESULT=-6`은 `RestrictedRoomError("adult")`로 분류합니다. 권한 있는 계정은 다음 순서로 연결합니다.

1. `LoginAction.php`에 계정 정보를 전송해 `AuthTicket`을 받습니다.
2. 라이브 정보 API에 `AuthTicket` cookie를 보내 채널 정보와 `TK`·`FTK`를 받습니다.
3. `0001`에 `\f{TK}\f\f16\f`을 보내고 유효한 `0001` 응답을 기다립니다.
4. `0002`에 `\f{CHATNO}\f{FTK}\f0\f\f\f`을 보냅니다.

`AuthTicket`의 TTL, 무효화 응답과 refresh 절차는 확인되지 않았습니다. 자동 refresh나 인증 실패 후 재로그인을 합성하지 않고 호출자에게 오류를 전달합니다.

서버 보조 브라우저 경로는 `AuthTicket`을 서버에 보관하고 `AuthenticatedChannelInfo`의 WebSocket 입장용 `TK`·`FTK`만 브라우저에 전달합니다. session과 오류 전달을 포함한 보안 계약은 [브라우저 리졸버 가이드](browser.md)를 따릅니다. [로그인 관찰 근거](research/protocol-evidence.md#로그인과-19금-방)

### 비밀번호 방

1. 일반 라이브 정보 요청의 `pwd`로 비밀번호를 보내고 `BPWD=Y`를 확인합니다. `RESULT=1`만으로 정답을 판정하지 않습니다.
2. 반환된 `BNO`와 `type=aid`, `bno`, `pwd`로 같은 API를 다시 요청합니다. 이 단계의 `RESULT`가 `1`이 아니면 `RestrictedRoomError("password")`입니다.
3. `0002`의 추가 정보 field에 `log`, `pwd`, 빈 `auth_info`, `pver=2`, `access_system=html5`를 넣습니다. key/value는 `0x11`, 항목 끝은 `0x12`로 구분합니다.

방 비밀번호는 계정 인증과 독립적입니다. 두 제한이 함께 있으면 라이브 정보 요청의 `AuthTicket`과 비밀번호 handshake를 함께 사용합니다. [비밀번호 방 관찰 근거](research/protocol-evidence.md#비밀번호-방)

### 구독플러스 방

라이브 정보 API의 `RESULT=-14`는 `RestrictedRoomError("subscriptionPlus")`로 분류합니다. 권한 계정에서 받은 `TK`·`FTK`로 같은 인증 handshake를 사용합니다. 전용 채팅 opcode를 합성하지 않고 접근 제한은 연결 전 라이브 정보 API 결과로 판정합니다. [구독플러스 관찰 근거](research/protocol-evidence.md#구독플러스-방)

## 읽기 전용 정책

현재 public API는 수신만 지원합니다. 채팅 전송은 인증된 입장 이후 `0005` 계열 payload를 사용하지만 다음 계약이 확인되지 않았습니다.

- 사용자 권한과 session field
- 메시지 길이, 금칙어와 도배 제한
- 채팅금지, 강퇴와 slow mode 오류
- 재연결 중 중복 전송 방지
- 귓속말과 일반 메시지의 권한 차이

이 조건을 검증하기 전에는 전송 메서드를 public API에 추가하지 않습니다.

## wire-level 미확인 사항

| 주제 | 미확인 범위 | 현재 동작 |
|---|---|---|
| `AuthTicket` | TTL, 무효화와 refresh | 자동 갱신 없이 오류 전달 |
| 접근 제한 | 연결 뒤 제한 변경을 알리는 전용 wire 신호 | resolver 실행 시점의 API 결과만 사용 |
| 채팅 전송 | 권한, 실패, 중복 방지 계약 | 읽기 전용 유지 |
| 미해석 payload | 안정된 field 순서와 의미 | `raw.fields` 또는 원본 JSON 보존 |

이벤트별 미확인 의미는 [이벤트 가이드](events.md), 그 판단의 표본과 반례는 [관찰 근거](research/protocol-evidence.md)에 둡니다.
