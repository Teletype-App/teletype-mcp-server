#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { loadConfig } from "./config.js";
import { requestContext } from "./request-context.js";
import { buildServer } from "./server.js";
import { log } from "./log.js";

function main(): void {
  const cfg = loadConfig({ ...process.env, TRANSPORT: "stdio" });
  if (!cfg.apiToken) throw new Error("TELETYPE_API_TOKEN is required for stdio transport");
  const handle = requestContext.run(
    {
      authToken: cfg.apiToken,
      allowLocalFiles: cfg.enableLocalUploads,
      allowedFileRoots: cfg.allowedFileRoots,
      apiBase: cfg.apiBase,
      projectUrl: cfg.projectUrl,
      requestTimeoutMs: cfg.requestTimeoutMs,
      maxResponseBytes: cfg.maxResponseBytes,
      maxUploadBytes: cfg.maxUploadBytes,
      requestId: "stdio",
      logLevel: cfg.logLevel,
    },
    () => serveStdio(() => buildServer(), { legacy: "serve" }),
  );
  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("info", "stdio_shutdown_started", { signal });
    try {
      await handle.close();
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  // stdout is reserved for the MCP protocol; the logger writes to stderr.
  log("info", "stdio_transport_ready");
}

try {
  main();
} catch (err: unknown) {
  log("error", "stdio_fatal", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
}
