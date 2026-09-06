import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import { SoopChat } from "../src/node.js";
import { encodePacket } from "../src/protocol.js";

void test(
  "Node uses native WebSocket for binary handshake, chat, and broadcast end",
  { timeout: 5000 },
  async (context) => {
    const nativeWebSocket = globalThis.WebSocket;
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
    globalThis.WebSocket = class extends nativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        assert.equal(url, "wss://chat.example.test:8061/Websocket/streamer");
        // Only the test URL changes; the runtime's actual WebSocket implementation handles frames.
        super(`ws://127.0.0.1:${port}`, protocols);
      }
    };
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
      globalThis.WebSocket = nativeWebSocket;
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
