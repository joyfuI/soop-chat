import assert from "node:assert/strict";
import test from "node:test";
import { getChannelAuthentication } from "../src/channel-authentication.js";
import {
  authenticateNode,
  AuthenticationError,
  BroadcastOfflineError,
  createNodeChannelResolver,
  resolveNodeChannel,
  RestrictedRoomError,
} from "../src/node.js";
import { createConnectPacket, createJoinPacket, PacketStreamParser } from "../src/protocol.js";

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

void test("distinguishes offline and restricted rooms", async (context) => {
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

  globalThis.fetch = async () => new Response(JSON.stringify({ CHANNEL: { RESULT: -6 } }));
  await assert.rejects(
    resolveNodeChannel("adult", { signal: new AbortController().signal }),
    (error) => error instanceof RestrictedRoomError && error.reason === "adult",
  );

  globalThis.fetch = async () => new Response(JSON.stringify({ CHANNEL: { RESULT: -14 } }));
  await assert.rejects(
    resolveNodeChannel("subscription-plus", { signal: new AbortController().signal }),
    (error) => error instanceof RestrictedRoomError && error.reason === "subscriptionPlus",
  );
});

void test("authenticates once and keeps chat tickets out of channel data", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let loginCalls = 0;
  let liveCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("LoginAction.php")) {
      loginCalls += 1;
      assert.ok(init?.body instanceof URLSearchParams);
      const form = init.body;
      assert.equal(form.get("szUid"), "synthetic-user");
      assert.equal(form.get("szPassword"), "synthetic-password");
      const headers = new Headers();
      headers.append("set-cookie", "AuthTicket=synthetic-auth; Path=/; HttpOnly");
      return new Response(JSON.stringify({ RESULT: 1 }), { headers });
    }

    liveCalls += 1;
    assert.equal(new Headers(init?.headers).get("cookie"), "AuthTicket=synthetic-auth");
    return new Response(
      JSON.stringify({
        CHANNEL: {
          RESULT: 1,
          BNO: "10",
          CHATNO: "20",
          CHDOMAIN: "chat.example.test",
          CHPT: "8060",
          BPWD: "N",
          TK: "synthetic-ticket",
          FTK: "synthetic-fan-ticket",
        },
      }),
    );
  };

  const resolver = createNodeChannelResolver({
    username: "synthetic-user",
    password: "synthetic-password",
  });
  const channel = await resolver("streamer", { signal: new AbortController().signal });
  await resolver("streamer", { signal: new AbortController().signal });

  assert.equal(loginCalls, 1);
  assert.equal(liveCalls, 2);
  assert.equal(JSON.stringify(channel).includes("ticket"), false);
  assert.deepEqual(getChannelAuthentication(channel), {
    ticket: "synthetic-ticket",
    fanTicket: "synthetic-fan-ticket",
  });

  const parser = new PacketStreamParser();
  const connect = parser.push(createConnectPacket("synthetic-ticket")).packets[0]!;
  const join = parser.push(createJoinPacket("20", "synthetic-fan-ticket")).packets[0]!;
  assert.deepEqual(connect.fields, ["synthetic-ticket", "", "16", ""]);
  assert.deepEqual(join.fields, ["20", "synthetic-fan-ticket", "0", "", "", ""]);

  globalThis.fetch = async () => new Response(JSON.stringify({ RESULT: 0 }));
  await assert.rejects(
    createNodeChannelResolver({ username: "synthetic-user", password: "wrong" })("streamer", {
      signal: new AbortController().signal,
    }),
    AuthenticationError,
  );
});

void test("returns serializable chat authentication for a browser resolver", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let loginCalls = 0;
  let liveCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("LoginAction.php")) {
      loginCalls += 1;
      const headers = new Headers();
      headers.append("set-cookie", "AuthTicket=browser-auth; Path=/; HttpOnly");
      return new Response(JSON.stringify({ RESULT: 1 }), { headers });
    }

    liveCalls += 1;
    assert.equal(new Headers(init?.headers).get("cookie"), "AuthTicket=browser-auth");
    return new Response(
      JSON.stringify({
        CHANNEL: {
          RESULT: 1,
          BNO: "10",
          CHATNO: "20",
          CHDOMAIN: "chat.example.test",
          CHPT: "8060",
          BPWD: "N",
          TK: "browser-ticket",
          FTK: "browser-fan-ticket",
        },
      }),
    );
  };

  const signal = new AbortController().signal;
  const authentication = await authenticateNode(
    { username: "synthetic-user", password: "synthetic-password" },
    { signal },
  );
  const channel = await resolveNodeChannel("streamer", { signal, authentication });

  assert.deepEqual(authentication, { authTicket: "browser-auth" });
  assert.deepEqual(channel, {
    broadcastNo: "10",
    chatNo: "20",
    chatDomain: "chat.example.test",
    chatPort: 8060,
    authentication: {
      ticket: "browser-ticket",
      fanTicket: "browser-fan-ticket",
    },
  });
  assert.equal(loginCalls, 1);
  assert.equal(liveCalls, 1);
  await assert.rejects(
    resolveNodeChannel("streamer", {
      signal,
      authentication: { authTicket: "invalid;ticket" },
    }),
    AuthenticationError,
  );
  assert.equal(liveCalls, 1);
});
