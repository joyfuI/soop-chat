import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, request as httpRequest } from "node:http";
import https from "node:https";
import { connect as netConnect } from "node:net";
import test from "node:test";
import { SoopChat } from "../src/node.js";
import { encodePacket } from "../src/protocol.js";

void test(
  "Node preserves Sec-WebSocket-Key casing for binary handshake, chat, and broadcast end",
  { timeout: 5000 },
  async (context) => {
    const server = createServer();
    let peer: { write(data: Uint8Array): boolean; destroy(): void } | undefined;
    const send = (payload: Uint8Array) => {
      assert.ok(payload.length < 126);
      assert.ok(peer);
      peer.write(Buffer.concat([Buffer.from([0x82, payload.length]), payload]));
    };
    server.on("upgrade", (request, socket) => {
      const key = request.headers["sec-websocket-key"];
      assert.equal(typeof key, "string");
      assert.ok(request.rawHeaders.includes("Sec-WebSocket-Key"));
      assert.ok(!request.rawHeaders.includes("sec-websocket-key"));
      assert.equal(request.headers["sec-websocket-protocol"], "chat");
      const accept = createHash("sha1")
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest("base64");
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\nSec-WebSocket-Protocol: chat\r\n\r\n`,
      );
      peer = socket;
      socket.resume();
      send(
        Buffer.concat([
          encodePacket("0001", "\x0cuser\x0c16|0"),
          encodePacket("0002", "\x0c2\x0cstreamer\x0c1\x0c10\x0c2]family\x0cignored\x0c16|0"),
        ]),
      );
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const port = address.port;
    // Redirect only the test request; ws still creates the actual upgrade headers and frames.
    context.mock.method(https, "request", (options: https.RequestOptions) => {
      assert.equal(options.host, "chat.example.test");
      assert.equal(options.port, "8061");
      assert.equal(options.path, "/Websocket/streamer");
      return httpRequest({
        ...options,
        protocol: "http:",
        host: "127.0.0.1",
        port,
        createConnection: () => netConnect({ host: "127.0.0.1", port }),
      });
    });
    const client = new SoopChat({
      streamerId: "streamer",
      resolveChannel: async () => ({
        broadcastNo: "1",
        chatNo: "2",
        chatDomain: "CHAT.EXAMPLE.TEST",
        chatPort: 8060,
      }),
      reconnect: false,
    });
    context.after(async () => {
      await client.disconnect();
      peer?.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    });
    await client.connect();
    assert.equal(client.state, "connected");
    const message = new Promise<string>((resolve) =>
      client.on("chatMessage", ({ data }) => resolve(data.message)),
    );
    send(encodePacket("0005", "\x0chello\x0csender\x0c0\x0c1\x0c2\x0cnickname\x0c16|0\x0c0"));
    assert.equal(await message, "hello");
    const ended = new Promise<string>((resolve) =>
      client.on("ended", ({ reason }) => resolve(reason)),
    );
    send(encodePacket("0088", ""));
    assert.equal(await ended, "offline");
    assert.equal(client.state, "closed");
  },
);

for (const action of ["disconnect", "timeout"] as const) {
  void test(
    `Node safely handles ${action} during an HTTP upgrade`,
    { timeout: 5000 },
    async (context) => {
      const server = createServer();
      let peer: { destroy(): void } | undefined;
      const upgrading = new Promise<void>((resolve) => {
        server.on("upgrade", (_request, socket) => {
          peer = socket;
          resolve();
        });
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      context.mock.method(https, "request", (options: https.RequestOptions) =>
        httpRequest({
          ...options,
          protocol: "http:",
          host: "127.0.0.1",
          port: address.port,
          createConnection: () => netConnect({ host: "127.0.0.1", port: address.port }),
        }),
      );
      const client = new SoopChat({
        streamerId: "streamer",
        resolveChannel: async () => ({
          broadcastNo: "1",
          chatNo: "2",
          chatDomain: "chat.example.test",
          chatPort: 8060,
        }),
        reconnect: false,
        handshakeTimeoutMs: action === "timeout" ? 100 : 1000,
      });
      context.after(async () => {
        await client.disconnect();
        peer?.destroy();
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      });
      const rejected = assert.rejects(
        client.connect(),
        action === "timeout" ? /handshake timed out/ : { name: "AbortError" },
      );
      await upgrading;
      if (action === "disconnect") await client.disconnect();
      await rejected;
      assert.equal(client.state, "closed");
    },
  );
}
