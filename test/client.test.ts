import assert from "node:assert/strict";
import test from "node:test";
import { SoopChatCore } from "../src/client.js";
import { deserializeChannelResolutionError } from "../src/errors.js";
import { encodePacket, PacketStreamParser } from "../src/protocol.js";
import type {
  AuthenticatedChannelInfo,
  ChannelInfo,
  WebSocketLike,
  WebSocketMessageData,
} from "../src/types.js";

const channel: ChannelInfo = {
  broadcastNo: "1",
  chatNo: "2",
  chatDomain: "chat.example.test",
  chatPort: 8060,
};

class FakeSocket implements WebSocketLike {
  readyState = 0;
  binaryType: BinaryType = "blob";
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<WebSocketMessageData>) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: Uint8Array[] = [];
  throwOnSend = false;

  send(data: string | ArrayBufferLike | ArrayBufferView): void {
    if (this.throwOnSend) throw new Error("synthetic send failure");
    if (typeof data === "string") this.sent.push(new TextEncoder().encode(data));
    else if (ArrayBuffer.isView(data))
      this.sent.push(new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice());
    else this.sent.push(new Uint8Array(data).slice());
  }

  close(): void {
    this.readyState = 3;
  }

  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  receive(data: WebSocketMessageData): void {
    this.onmessage?.({ data } as unknown as MessageEvent<WebSocketMessageData>);
  }

  closeFromServer(code = 1006): void {
    this.readyState = 3;
    this.onclose?.({ code, reason: "synthetic close" } as CloseEvent);
  }
}

const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function waitFor(condition: () => boolean, timeoutMs = 250): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() >= deadline) assert.fail("Timed out waiting for test condition.");
    await turn();
  }
}

async function settlesWithin<T>(promise: Promise<T>, timeoutMs = 250): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Promise remained pending.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function delayedMessage(): { data: Blob; resolve(bytes: Uint8Array<ArrayBuffer>): void } {
  let release: ((value: ArrayBuffer) => void) | undefined;
  const data = Object.assign(new Blob(), {
    arrayBuffer: () =>
      new Promise<ArrayBuffer>((resolve) => {
        release = resolve;
      }),
  });
  return {
    data,
    resolve(bytes) {
      assert.ok(release);
      release(bytes.buffer);
    },
  };
}

function sentOpcodes(socket: FakeSocket): string[] {
  const parser = new PacketStreamParser();
  return socket.sent.flatMap((packet) => parser.push(packet).packets.map((raw) => raw.opcode));
}

async function join(client: SoopChatCore, socket: FakeSocket): Promise<void> {
  const connecting = client.connect();
  await turn();
  socket.open();
  assert.deepEqual(sentOpcodes(socket), ["0001"]);
  socket.receive(encodePacket("0001"));
  await turn();
  assert.deepEqual(sentOpcodes(socket), ["0001", "0002"]);
  socket.receive(encodePacket("0002"));
  await connecting;
}

void test("connects, emits typed chat, sends heartbeat, and disconnects idempotently", async () => {
  const socket = new FakeSocket();
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      return channel;
    },
    createWebSocket: () => socket,
    heartbeatIntervalMs: 5,
  });
  const messages: string[] = [];
  client.on("chatMessage", (event) => messages.push(event.data.message));

  const first = client.connect();
  const second = client.connect();
  await turn();
  socket.open();
  socket.receive(encodePacket("0001"));
  socket.receive(encodePacket("0002"));
  await Promise.all([first, second]);
  assert.equal(resolverCalls, 1);
  assert.equal(client.state, "connected");

  socket.receive(encodePacket("0005", "\x0chello\x0cuser\x0c\x0c1\x0c2\x0cnick\x0cflag\x0c0"));
  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.deepEqual(messages, ["hello"]);
  assert.ok(sentOpcodes(socket).includes("0000"));

  await client.disconnect();
  await client.disconnect();
  assert.equal(client.state, "closed");
});

void test("uses and validates serialized browser channel authentication", async () => {
  const socket = new FakeSocket();
  const authenticatedChannel: AuthenticatedChannelInfo = {
    ...channel,
    authentication: { ticket: "browser-ticket", fanTicket: "browser-fan-ticket" },
  };
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => authenticatedChannel,
    createWebSocket: () => socket,
  });

  await join(client, socket);
  const connect = new PacketStreamParser().push(socket.sent[0]!).packets[0];
  const joinPacket = new PacketStreamParser().push(socket.sent[1]!).packets[0];
  assert.equal(connect?.fields[0], "browser-ticket");
  assert.equal(joinPacket?.fields[1], "browser-fan-ticket");
  await client.disconnect();

  const invalidClient = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => ({
      ...channel,
      authentication: { ticket: "invalid\x0cticket", fanTicket: "browser-fan-ticket" },
    }),
    createWebSocket: () => new FakeSocket(),
  });
  await assert.rejects(invalidClient.connect(), /invalid authentication/);
});

void test("passes a room password to the resolver and password join packet", async () => {
  const socket = new FakeSocket();
  const client = new SoopChatCore({
    streamerId: "streamer",
    roomPassword: "synthetic-room-password",
    resolveChannel: async (_streamerId, context) => {
      assert.equal(context.roomPassword, "synthetic-room-password");
      return channel;
    },
    createWebSocket: () => socket,
  });

  await join(client, socket);
  const packet = new PacketStreamParser().push(socket.sent[1]!).packets[0];
  assert.deepEqual(packet?.fields.slice(0, 4), ["2", "", "0", ""]);
  assert.equal(
    packet?.fields[4],
    "log\x11\x12pwd\x11synthetic-room-password\x12auth_info\x11\x12pver\x112\x12access_system\x11html5\x12",
  );
  await client.disconnect();

  assert.throws(
    () =>
      new SoopChatCore({
        streamerId: "streamer",
        roomPassword: "invalid\x0cpassword",
        resolveChannel: async () => channel,
        createWebSocket: () => new FakeSocket(),
      }),
    /roomPassword/,
  );
});

void test("re-resolves channel information and reconnects after an unexpected close", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  let resolverCalls = 0;
  const reconnects: number[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      return channel;
    },
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  client.on("reconnecting", (event) => reconnects.push(event.attempt));

  await join(client, firstSocket);
  firstSocket.closeFromServer();
  await new Promise((resolve) => setTimeout(resolve, 8));
  secondSocket.open();
  secondSocket.receive(encodePacket("0001"));
  secondSocket.receive(encodePacket("0002"));
  await turn();

  assert.equal(resolverCalls, 2);
  assert.deepEqual(reconnects, [1]);
  assert.equal(client.state, "connected");
  await client.disconnect();
});

void test("manual connect cancels a scheduled retry instead of opening a second session", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      return channel;
    },
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 40, maxDelayMs: 40, jitter: 0 },
  });

  await join(client, firstSocket);
  firstSocket.closeFromServer();
  const connecting = client.connect();
  await turn();
  secondSocket.open();
  secondSocket.receive(encodePacket("0001"));
  secondSocket.receive(encodePacket("0002"));
  await connecting;
  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.equal(resolverCalls, 2);
  assert.equal(client.state, "connected");
  await client.disconnect();
});

void test("manual connect joins an active reconnect attempt", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  let resolverCalls = 0;
  let releaseReconnect!: (value: ChannelInfo) => void;
  const reconnectChannel = new Promise<ChannelInfo>((resolve) => {
    releaseReconnect = resolve;
  });
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      return resolverCalls === 1 ? channel : reconnectChannel;
    },
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });

  await join(client, firstSocket);
  firstSocket.closeFromServer();
  await waitFor(() => resolverCalls === 2);
  const connecting = client.connect();
  await turn();
  assert.equal(resolverCalls, 2);

  releaseReconnect(channel);
  await turn();
  secondSocket.open();
  secondSocket.receive(encodePacket("0001"));
  secondSocket.receive(encodePacket("0002"));
  await connecting;
  assert.equal(client.state, "connected");
  await client.disconnect();
});

void test("heartbeat send failures enter the reconnect flow without escaping the timer", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  const errors: string[] = [];
  const reconnects: number[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
    heartbeatIntervalMs: 5,
  });
  client.on("error", (error) => errors.push(error.message));
  client.on("reconnecting", ({ attempt }) => reconnects.push(attempt));

  await join(client, firstSocket);
  firstSocket.throwOnSend = true;
  await waitFor(() => sockets.length === 0);
  secondSocket.open();
  secondSocket.receive(encodePacket("0001"));
  secondSocket.receive(encodePacket("0002"));
  await waitFor(() => client.state === "connected");

  assert.deepEqual(errors, ["synthetic send failure"]);
  assert.deepEqual(reconnects, [1]);
  assert.equal(firstSocket.readyState, 3);
  await client.disconnect();
});

void test("a pending decode from an old session does not block or mutate a reconnect", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  const delayed = delayedMessage();
  const ended: string[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  client.on("ended", ({ reason }) => ended.push(reason));

  await join(client, firstSocket);
  firstSocket.receive(delayed.data);
  await turn();
  try {
    firstSocket.closeFromServer();
    await waitFor(() => sockets.length === 0);

    secondSocket.open();
    secondSocket.receive(encodePacket("0001"));
    secondSocket.receive(encodePacket("0002"));
    await waitFor(() => client.state === "connected");

    delayed.resolve(encodePacket("0088", ""));
    await turn();
    assert.equal(client.state, "connected");
    assert.deepEqual(ended, []);
    assert.equal(secondSocket.readyState, 1);
  } finally {
    delayed.resolve(encodePacket("0088", ""));
    await turn();
    await client.disconnect();
  }
});

void test("state listener failures do not stall connect or reconnect", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  const errors: string[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
    heartbeatIntervalMs: 5,
  });
  client.on("stateChange", ({ current }) => {
    if (current === "connected") throw new Error("synthetic state listener failure");
  });
  client.on("error", (error) => errors.push(error.message));

  try {
    await settlesWithin(join(client, firstSocket));
    firstSocket.closeFromServer();
    await waitFor(() => sockets.length === 0);
    secondSocket.open();
    secondSocket.receive(encodePacket("0001"));
    secondSocket.receive(encodePacket("0002"));
    await waitFor(() => client.state === "connected");

    assert.deepEqual(errors, [
      "synthetic state listener failure",
      "synthetic state listener failure",
    ]);
  } finally {
    await client.disconnect();
  }
  assert.equal(firstSocket.readyState, 3);
  assert.equal(secondSocket.readyState, 3);
  const sentCount = secondSocket.sent.length;
  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.equal(secondSocket.sent.length, sentCount);
});

void test("protocol listener failures do not block other listeners or later packets", async () => {
  const socket = new FakeSocket();
  const messages: string[] = [];
  const errors: string[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
  });
  client.on("chatMessage", () => {
    throw new Error("synthetic protocol listener failure");
  });
  client.on("chatMessage", ({ data }) => messages.push(data.message));
  client.on("error", () => {
    throw new Error("synthetic error listener failure");
  });
  client.on("error", (error) => errors.push(error.message));

  try {
    await join(client, socket);
    socket.receive(encodePacket("0005", "\x0cfirst\x0cuser\x0c\x0c1\x0c2\x0cnick\x0cflag\x0c0"));
    socket.receive(encodePacket("0005", "\x0csecond\x0cuser\x0c\x0c1\x0c2\x0cnick\x0cflag\x0c0"));
    await waitFor(() => messages.length === 2);

    assert.deepEqual(messages, ["first", "second"]);
    assert.deepEqual(errors, [
      "synthetic protocol listener failure",
      "synthetic protocol listener failure",
    ]);
  } finally {
    await client.disconnect();
  }
});

void test("times out and cleans up a stalled WebSocket handshake", async () => {
  const socket = new FakeSocket();
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
    handshakeTimeoutMs: 5,
  });

  await assert.rejects(client.connect(), /handshake timed out after 5ms/);
  assert.equal(socket.readyState, 3);
  assert.equal(socket.onopen, null);
  assert.equal(socket.onmessage, null);
  assert.equal(socket.onclose, null);
  assert.equal(socket.onerror, null);
  assert.equal(client.state, "closed");
});

void test("ignores handshake data that finishes decoding after timeout", async () => {
  const socket = new FakeSocket();
  const delayed = delayedMessage();
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
    handshakeTimeoutMs: 5,
  });

  const connecting = client.connect();
  await turn();
  socket.open();
  socket.receive(delayed.data);
  await assert.rejects(connecting, /handshake timed out/);
  delayed.resolve(encodePacket("0002"));
  await turn();
  assert.equal(client.state, "closed");
});

void test("retries when a reconnect handshake times out", async () => {
  const sockets: FakeSocket[] = [];
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
    handshakeTimeoutMs: 5,
  });

  const connecting = client.connect();
  await waitFor(() => sockets.length === 1);
  sockets[0]!.open();
  sockets[0]!.receive(encodePacket("0001"));
  sockets[0]!.receive(encodePacket("0002"));
  await connecting;
  sockets[0]!.closeFromServer();

  await waitFor(() => sockets.length === 3);
  assert.equal(sockets[1]!.readyState, 3);
  assert.equal(client.state, "connecting");
  await client.disconnect();
});

void test("rejects non-finite reconnect options and invalid handshake timeouts", () => {
  const create = (options: Partial<ConstructorParameters<typeof SoopChatCore>[0]>) =>
    new SoopChatCore({
      streamerId: "streamer",
      resolveChannel: async () => channel,
      createWebSocket: () => new FakeSocket(),
      ...options,
    });

  for (const reconnect of [
    { initialDelayMs: Number.NaN },
    { maxDelayMs: Number.POSITIVE_INFINITY },
    { factor: Number.NaN },
    { jitter: Number.NEGATIVE_INFINITY },
  ]) {
    assert.throws(() => create({ reconnect }), /must be finite/);
  }
  for (const handshakeTimeoutMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => create({ handshakeTimeoutMs }), /positive finite number/);
  }
});

void test("stops reconnecting when the broadcast becomes offline", async () => {
  const socket = new FakeSocket();
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      if (resolverCalls > 1) {
        throw deserializeChannelResolutionError(
          {
            code: "BROADCAST_OFFLINE",
            message: 'SOOP broadcaster "streamer" is not live.',
          },
          { streamerId: "streamer" },
        );
      }
      return channel;
    },
    createWebSocket: () => socket,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  const ended: string[] = [];
  client.on("ended", (event) => ended.push(event.reason));

  await join(client, socket);
  socket.closeFromServer();
  await new Promise((resolve) => setTimeout(resolve, 8));
  assert.deepEqual(ended, ["offline"]);
  assert.equal(client.state, "closed");
});

void test("stops reconnecting when a serialized room restriction is restored", async () => {
  const socket = new FakeSocket();
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      if (resolverCalls > 1) {
        throw deserializeChannelResolutionError({
          code: "RESTRICTED_ROOM",
          message: "Access to this room is restricted (adult).",
          reason: "adult",
        });
      }
      return channel;
    },
    createWebSocket: () => socket,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  const ended: Array<{ reason: string; restriction?: string }> = [];
  client.on("ended", (event) => ended.push(event));

  await join(client, socket);
  socket.closeFromServer();
  await new Promise((resolve) => setTimeout(resolve, 8));
  assert.deepEqual(ended, [{ reason: "restricted", restriction: "adult" }]);
  assert.equal(client.state, "closed");
});

void test("closes on broadcast end and re-resolves a later manual connection", async () => {
  const firstSocket = new FakeSocket();
  const secondSocket = new FakeSocket();
  const sockets = [firstSocket, secondSocket];
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => ({ ...channel, chatNo: String(++resolverCalls) }),
    createWebSocket: () => sockets.shift()!,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  const closeEvents: string[] = [];
  const ended: string[] = [];
  const reconnects: number[] = [];
  client.on("closeBroad", (event) => closeEvents.push(event.opcode));
  client.on("ended", (event) => ended.push(event.reason));
  client.on("reconnecting", (event) => reconnects.push(event.attempt));

  await join(client, firstSocket);
  firstSocket.receive(encodePacket("0088", ""));
  await turn();

  assert.deepEqual(closeEvents, ["0088"]);
  assert.deepEqual(ended, ["offline"]);
  assert.deepEqual(reconnects, []);
  assert.equal(firstSocket.readyState, 3);
  assert.equal(client.state, "closed");

  await join(client, secondSocket);
  const secondJoin = new PacketStreamParser().push(secondSocket.sent[1]!).packets[0];
  assert.equal(resolverCalls, 2);
  assert.equal(secondJoin?.fields[0], "2");
  await client.disconnect();
});

void test("disconnect rejects an in-flight connect and leaves no pending session", async () => {
  const socket = new FakeSocket();
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
  });

  const connecting = client.connect();
  await turn();
  socket.open();
  await client.disconnect();
  await assert.rejects(connecting, { name: "AbortError" });
  assert.equal(client.state, "closed");
});

void test("a failed handshake closes its socket and resets client state", async () => {
  const socket = new FakeSocket();
  socket.throwOnSend = true;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
  });

  const connecting = client.connect();
  await turn();
  socket.open();
  await assert.rejects(connecting, /synthetic send failure/);
  assert.equal(socket.readyState, 3);
  assert.equal(client.state, "closed");
});
