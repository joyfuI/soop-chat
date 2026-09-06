import assert from "node:assert/strict";
import test from "node:test";
import * as node from "../src/node.js";
import * as browser from "../src/browser.js";

void test("entrypoints share events and errors but keep Node helpers out of the browser", () => {
  const nodeOnly = ["authenticateNode", "createNodeChannelResolver", "resolveNodeChannel"];
  assert.deepEqual(
    Object.keys(node)
      .filter((key) => !nodeOnly.includes(key))
      .sort(),
    Object.keys(browser).sort(),
  );
  assert.equal(node.EVENT_CATALOG, browser.EVENT_CATALOG);
  assert.equal(node.serializeChannelResolutionError, browser.serializeChannelResolutionError);
  assert.equal(node.deserializeChannelResolutionError, browser.deserializeChannelResolutionError);
  for (const module of [node, browser]) {
    assert.equal("SoopChatCore" in module, false);
    assert.equal("decodePacket" in module, false);
    assert.equal("getChannelAuthentication" in module, false);
  }
});

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as node.WebSocketLike);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as node.WebSocketFactory);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as node.WebSocketMessageData);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as node.VodAdconData);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as browser.WebSocketLike);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as browser.WebSocketFactory);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as browser.WebSocketMessageData);

// @ts-expect-error This implementation or duplicate type is not public in 0.5.0.
assert.ok({} as browser.VodAdconData);
