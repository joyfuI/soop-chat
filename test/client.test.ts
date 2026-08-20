import assert from "node:assert/strict";
import test from "node:test";
import { SoopChatCore } from "../src/client.js";
import { BroadcastOfflineError } from "../src/errors.js";
import { encodePacket, PacketStreamParser } from "../src/protocol.js";
import type { ChannelInfo, WebSocketLike, WebSocketMessageData } from "../src/types.js";

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

  receive(data: Uint8Array): void {
    this.onmessage?.({ data } as unknown as MessageEvent<WebSocketMessageData>);
  }

  closeFromServer(code = 1006): void {
    this.readyState = 3;
    this.onclose?.({ code, reason: "synthetic close" } as CloseEvent);
  }
}

const turn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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

void test("stops reconnecting when the broadcast becomes offline", async () => {
  const socket = new FakeSocket();
  let resolverCalls = 0;
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => {
      resolverCalls += 1;
      if (resolverCalls > 1) throw new BroadcastOfflineError("streamer");
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

void test("closes without reconnecting when the chat server announces broadcast end", async () => {
  const socket = new FakeSocket();
  const client = new SoopChatCore({
    streamerId: "streamer",
    resolveChannel: async () => channel,
    createWebSocket: () => socket,
    reconnect: { initialDelayMs: 1, maxDelayMs: 1, jitter: 0 },
  });
  const closeEvents: string[] = [];
  const ended: string[] = [];
  const reconnects: number[] = [];
  client.on("closeBroad", (event) => closeEvents.push(event.opcode));
  client.on("ended", (event) => ended.push(event.reason));
  client.on("reconnecting", (event) => reconnects.push(event.attempt));

  await join(client, socket);
  socket.receive(encodePacket("0088", ""));
  await turn();

  assert.deepEqual(closeEvents, ["0088"]);
  assert.deepEqual(ended, ["offline"]);
  assert.deepEqual(reconnects, []);
  assert.equal(socket.readyState, 3);
  assert.equal(client.state, "closed");
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
