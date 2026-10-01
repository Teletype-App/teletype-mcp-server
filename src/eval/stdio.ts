import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { loadConfig } from "../config.js";
import { log } from "../log.js";
import { requestContext } from "../request-context.js";
import { startFakeTeletypeApi } from "../test-support/fake-teletype-api.js";
import { createEvalFixture } from "./fixture-server.js";

export async function startEvalStdio(selectionOnly = false): Promise<void> {
  const fakeApi = await startFakeTeletypeApi();
  let handle: ReturnType<typeof serveStdio>;
  try {
    // The SDK may create request callbacks outside the setup AsyncLocalStorage scope.
    // Override inherited production settings before accepting any MCP call.
    process.env.TELETYPE_API_TOKEN = "eval-fixture-only";
    process.env.TELETYPE_API_BASE = fakeApi.baseUrl;
    process.env.TELETYPE_PROJECT_URL = "teletype.app";
    process.env.ENABLE_LOCAL_UPLOADS = "false";
    process.env.LOG_LEVEL = "error";
    const cfg = loadConfig({ ...process.env, TRANSPORT: "stdio" });
    const apiToken = cfg.apiToken;
    if (!apiToken) throw new Error("Eval fixture token was not configured");
    handle = requestContext.run(
      {
        authToken: apiToken,
        allowLocalFiles: false,
        allowedFileRoots: [],
        apiBase: cfg.apiBase,
        projectUrl: cfg.projectUrl,
        requestTimeoutMs: cfg.requestTimeoutMs,
        maxResponseBytes: cfg.maxResponseBytes,
        maxUploadBytes: cfg.maxUploadBytes,
        requestId: "eval-fixture",
        logLevel: "error",
      },
      () => serveStdio(createEvalFixture(fakeApi, selectionOnly), { legacy: "serve" }),
    );
  } catch (error) {
    await fakeApi.close();
    throw error;
  }

  let closing = false;
  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    try {
      await handle.close();
    } finally {
      await fakeApi.close();
    }
  };
  process.stdin.once("end", () => {
    void shutdown();
  });
  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });
  log("info", "eval_fixture_ready");
}
