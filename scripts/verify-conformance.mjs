import { execFile } from "node:child_process";
import { createServer, request as httpRequest } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createHttpApp } from "../dist/http.js";
import { startFakeTeletypeApi } from "../dist/test-support/fake-teletype-api.js";

process.env.LOG_LEVEL = "error";

const run = promisify(execFile);
const directory = await mkdtemp(join(tmpdir(), "teletype-mcp-conformance-"));
const scenarios = [
  ["2025-11-25", "server-initialize"],
  ["2025-11-25", "tools-list"],
  ["2026-07-28", "tools-list"],
  ["2026-07-28", "prompts-list"],
  ["2026-07-28", "resources-list"],
];
let fakeApi;
let upstream;
let proxy;

try {
  fakeApi = await startFakeTeletypeApi();
  const app = createHttpApp({
    transport: "http",
    port: 0,
    host: "127.0.0.1",
    publicBaseUrl: "http://127.0.0.1:4311",
    allowedOrigins: ["http://127.0.0.1:4311"],
    apiBase: fakeApi.baseUrl,
    projectUrl: "teletype.app",
    requestTimeoutMs: 2_000,
    maxResponseBytes: 1_000_000,
    maxUploadBytes: 1_000_000,
    maxConcurrentRequests: 32,
    maxConcurrentPerToken: 4,
    enableLocalUploads: false,
    allowedFileRoots: [],
    logLevel: "error",
  });
  upstream = await new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.once("error", reject);
  });
  const upstreamAddress = upstream.address();
  if (!upstreamAddress || typeof upstreamAddress === "string") throw new Error("No upstream port");
  const testProxy = createServer((incoming, outgoing) => {
    const forward = httpRequest(
      {
        hostname: "127.0.0.1",
        port: upstreamAddress.port,
        path: incoming.url,
        method: incoming.method,
        headers: {
          ...incoming.headers,
          host: `127.0.0.1:${upstreamAddress.port}`,
          "x-teletype-api-token": "conformance-placeholder",
        },
      },
      (response) => {
        outgoing.writeHead(response.statusCode ?? 500, response.headers);
        response.pipe(outgoing);
      },
    );
    forward.on("error", (error) => {
      outgoing.writeHead(502);
      outgoing.end(error.message);
    });
    incoming.pipe(forward);
  });
  await new Promise((resolve, reject) => {
    testProxy.listen(0, "127.0.0.1", resolve);
    testProxy.once("error", reject);
  });
  proxy = testProxy;
  const proxyAddress = proxy.address();
  if (!proxyAddress || typeof proxyAddress === "string") throw new Error("No proxy port");
  const url = `http://127.0.0.1:${proxyAddress.port}/mcp`;

  for (const [version, scenario] of scenarios) {
    const args = [
      "--yes",
      "@modelcontextprotocol/conformance@0.2.0-alpha.11",
      "server",
      "--url",
      url,
      "--scenario",
      scenario,
      "--spec-version",
      version,
    ];
    let stdout;
    let stderr;
    try {
      ({ stdout, stderr } = await run("npx", args, {
        cwd: directory,
        timeout: 20_000,
        maxBuffer: 4_000_000,
      }));
    } catch (error) {
      throw new Error(
        `${version} ${scenario} failed: ${error.stderr || error.stdout || error.message}`,
        { cause: error },
      );
    }
    process.stdout.write(`${version} ${scenario}: OK\n`);
    if (process.env.CONFORMANCE_VERBOSE === "1") process.stdout.write(stdout + stderr);
  }
} finally {
  if (proxy) await new Promise((resolve) => proxy.close(resolve));
  if (upstream) await new Promise((resolve) => upstream.close(resolve));
  if (fakeApi) await fakeApi.close();
  await rm(directory, { recursive: true, force: true });
}
