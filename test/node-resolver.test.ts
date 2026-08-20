import assert from "node:assert/strict";
import test from "node:test";
import { BroadcastOfflineError, resolveNodeChannel, RestrictedRoomError } from "../src/node.js";

void test("resolves and validates SOOP channel information", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        CHANNEL: {
          RESULT: 1,
          BNO: "10",
          CHATNO: "20",
          CHDOMAIN: "chat.example.test",
          CHPT: "8060",
          BPWD: "N",
        },
      }),
    );

  const result = await resolveNodeChannel("streamer", { signal: new AbortController().signal });
  assert.deepEqual(result, {
    broadcastNo: "10",
    chatNo: "20",
    chatDomain: "chat.example.test",
    chatPort: 8060,
  });
});

void test("distinguishes offline and password rooms", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response(JSON.stringify({ CHANNEL: { RESULT: 0 } }));
  await assert.rejects(
    resolveNodeChannel("offline", { signal: new AbortController().signal }),
    BroadcastOfflineError,
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        CHANNEL: {
          RESULT: 1,
          BNO: "10",
          CHATNO: "20",
          CHDOMAIN: "chat.example.test",
          CHPT: 8060,
          BPWD: "Y",
        },
      }),
    );
  await assert.rejects(
    resolveNodeChannel("password", { signal: new AbortController().signal }),
    RestrictedRoomError,
  );
});
