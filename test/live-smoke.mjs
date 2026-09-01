import { SoopChat } from "../dist/node.js";

const streamerId = process.env.SOOP_STREAMER_ID;
if (!streamerId)
  throw new Error("Set SOOP_STREAMER_ID to an actively streaming public broadcaster ID.");
const roomPassword = process.env.SOOP_ROOM_PASSWORD;
const username = process.env.SOOP_USERNAME;
const password = process.env.SOOP_PASSWORD;
if (Boolean(username) !== Boolean(password)) {
  throw new Error("Set both SOOP_USERNAME and SOOP_PASSWORD, or neither.");
}

const chat = new SoopChat({
  streamerId,
  ...(roomPassword ? { roomPassword } : {}),
  ...(username && password ? { credentials: { username, password } } : {}),
  reconnect: false,
});
let rawPackets = 0;
chat.on("raw", () => {
  rawPackets += 1;
});

const timeout = setTimeout(() => {
  void chat.disconnect();
}, 15_000);

try {
  await chat.connect();
  console.log(`Connected; observed ${rawPackets} handshake packet(s).`);
} finally {
  clearTimeout(timeout);
  await chat.disconnect();
}
