import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

let server: Server;
let origin: string;

test.beforeAll(async () => {
  const dist = join(process.cwd(), "dist");
  server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.setHeader("content-type", "text/html");
      response.end("<!doctype html><title>soop-chat browser smoke</title>");
      return;
    }
    const relative = normalize(request.url?.split("?")[0]?.replace(/^\/+/, "") ?? "");
    if (relative.startsWith("..")) {
      response.writeHead(403).end();
      return;
    }
    try {
      const contents = await readFile(join(dist, relative));
      response.setHeader("content-type", extname(relative) === ".js" ? "text/javascript" : "application/octet-stream");
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start browser smoke server.");
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("browser entry imports without Node polyfills and requires a resolver", async ({ page }) => {
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const module = await import("/browser.js");
    const client = new module.SoopChat({
      streamerId: "synthetic",
      resolveChannel: async () => ({
        broadcastNo: "1",
        chatNo: "2",
        chatDomain: "chat.example.test",
        chatPort: 8060,
      }),
    });
    let missingResolverError = "";
    try {
      new module.SoopChat({ streamerId: "synthetic" });
    } catch (error) {
      missingResolverError = error instanceof Error ? error.name : String(error);
    }
    return {
      state: client.state,
      knownOpcodes: Object.keys(module.EVENT_CATALOG).length,
      missingResolverError,
    };
  });
  expect(result).toEqual({
    state: "idle",
    knownOpcodes: 101,
    missingResolverError: "BrowserResolverRequiredError",
  });
});
