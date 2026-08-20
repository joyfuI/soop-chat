import { SoopChat } from "../dist/node.js";

const streamerId = process.env.SOOP_STREAMER_ID;
if (!streamerId)
  throw new Error("Set SOOP_STREAMER_ID to an actively streaming public broadcaster ID.");

const chat = new SoopChat({ streamerId, reconnect: false });
let rawPackets = 0;
chat.on("raw", () => {
  rawPackets += 1;
});

const timeout = setTimeout(() => {
  void chat.disconnect();
}, 15_000);

try {
  await chat.connect();
  console.log(`Connected to ${streamerId}; observed ${rawPackets} handshake packet(s).`);
} finally {
  clearTimeout(timeout);
  await chat.disconnect();
}
