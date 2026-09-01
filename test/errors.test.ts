import assert from "node:assert/strict";
import test from "node:test";
import {
  BroadcastOfflineError,
  ChannelResolutionError,
  deserializeChannelResolutionError,
  RestrictedRoomError,
  serializeChannelResolutionError,
  type SerializedChannelResolutionError,
} from "../src/browser.js";

void test("serializes and restores channel resolution error classes", () => {
  const serialized: SerializedChannelResolutionError[] = [
    serializeChannelResolutionError(new BroadcastOfflineError("streamer")),
    serializeChannelResolutionError(new RestrictedRoomError("adult")),
    serializeChannelResolutionError(new ChannelResolutionError("Synthetic resolver failure.")),
  ];
  const [offline, restricted, failed] = serialized.map((error) =>
    deserializeChannelResolutionError(error, { streamerId: "streamer" }),
  );

  assert.ok(offline instanceof BroadcastOfflineError);
  assert.ok(restricted instanceof RestrictedRoomError);
  assert.equal(restricted.reason, "adult");
  assert.ok(failed instanceof ChannelResolutionError);
});

void test("falls back safely for unknown or malformed serialized errors", () => {
  for (const input of [
    { code: "FUTURE_ERROR", message: "Unknown future error." },
    { code: "RESTRICTED_ROOM", message: "Invalid reason.", reason: "other" },
    {},
    null,
    42,
  ]) {
    const error = deserializeChannelResolutionError(input);
    assert.ok(error instanceof ChannelResolutionError);
    assert.equal(error.code, "CHANNEL_RESOLUTION_FAILED");
  }
});
