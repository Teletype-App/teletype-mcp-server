#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { loadToolPolicy, policyAllows } from "./tool-policy.js";
import { log } from "./log.js";
import { TOOL_DEFINITIONS } from "./tools.js";
import { SERVER_VERSION } from "./version.js";

export const HELP_TEXT = `Teletype MCP Server

Usage:
  teletype-mcp-server [options]
  teletype-mcp-stdio
  npx teletype-mcp-server --stdio
  teletype-mcp-server doctor --stdio
  teletype-mcp-server --eval-fixture
  teletype-mcp-server --eval-selection-fixture

Transports:
  --stdio, -s              Run with stdio transport (default for MCP desktop clients: Claude, Cursor)
  --http                   Run with Streamable HTTP transport (default for multi-tenant / Docker)

HTTP Options:
  --port, -p <number>      HTTP port to listen on (default: 4311, env: PORT)
  --host <string>          HTTP host to bind (default: 127.0.0.1, env: HOST)

Tool filtering:
  --read-only              Register read tools only; write tools are excluded even if
                           explicitly requested (env: TELETYPE_MCP_READ_ONLY=true)
  --toolsets <names>       Comma-separated toolsets to register: conversations, messaging,
                           admin, meta (env: TELETYPE_MCP_TOOLSETS). meta is always active.

General:
  doctor                   Check local configuration and MCP registration without calling Teletype
  --eval-fixture           Run an offline MCP fixture for agent evaluation
  --eval-selection-fixture Run an offline MCP fixture with only production tools
  --version, -v            Show version
  --help, -h               Show this help message

Environment variables:
  TELETYPE_API_TOKEN       Required for stdio transport
  TRANSPORT                'stdio' or 'http' (default: http)
  PUBLIC_BASE_URL          Public origin for HTTP transport (default: http://127.0.0.1:4311)
  TELETYPE_MCP_READ_ONLY   'true' hides all write tools from the tool list
  TELETYPE_MCP_TOOLSETS    Subset of toolsets to register (e.g. 'conversations,admin')
  ENABLE_LOCAL_UPLOADS     Allow local file attachments in stdio mode ('true'/'false')
  TELETYPE_ALLOWED_FILE_ROOTS Permitted directories for local attachments
`;

export function parseCliArgs(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): {
  exitImmediately?: boolean;
  exitCode?: number;
  output?: string;
  doctor?: boolean;
  evalFixture?: boolean;
  evalSelectionFixture?: boolean;
} {
  if (args.includes("--help") || args.includes("-h")) {
    return { exitImmediately: true, exitCode: 0, output: HELP_TEXT };
  }

  if (args.includes("--version") || args.includes("-v")) {
    return { exitImmediately: true, exitCode: 0, output: SERVER_VERSION };
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--stdio" || arg === "-s") {
      env.TRANSPORT = "stdio";
    } else if (arg === "--http") {
      env.TRANSPORT = "http";
    } else if ((arg === "--port" || arg === "-p") && args[i + 1]) {
      env.PORT = args[i + 1];
      i += 1;
    } else if (arg === "--host" && args[i + 1]) {
      env.HOST = args[i + 1];
      i += 1;
    } else if (arg === "--read-only") {
      env.TELETYPE_MCP_READ_ONLY = "true";
    } else if (arg === "--toolsets" && args[i + 1]) {
      env.TELETYPE_MCP_TOOLSETS = args[i + 1];
      i += 1;
    }
  }

  return {
    doctor: args.includes("doctor"),
    evalFixture: args.includes("--eval-fixture") || args.includes("--eval-selection-fixture"),
    evalSelectionFixture: args.includes("--eval-selection-fixture"),
  };
}

export async function runDoctor(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const cfg = loadConfig(env);
  const policy = loadToolPolicy(env);
  const { buildServer } = await import("./server.js");
  const server = buildServer({ policy });
  await server.close();
  const activeTools = TOOL_DEFINITIONS.filter((tool) => policyAllows(policy, tool.name));
  return [
    "Local configuration: OK",
    "MCP protocols: 2025 initialize, 2026-07-28 server/discover",
    `Transport: ${cfg.transport}`,
    `Mode: ${cfg.readOnly ? "read-only" : "read-write"}`,
    `Toolsets: ${cfg.toolsets ? cfg.toolsets.join(", ") : "all"}`,
    `Tools registered: ${activeTools.length} of ${TOOL_DEFINITIONS.length}`,
    `Teletype token: ${cfg.apiToken ? "configured" : "supplied per HTTP request"}`,
    "Teletype API was not contacted.",
  ].join("\n");
}

export { buildServer } from "./server.js";
export {
  TOOL_DEFINITIONS,
  TOOL_DISPATCH,
  TeletypeTools,
  TeletypeApiError,
  errorResult,
} from "./tools.js";
export { PROMPT_DEFINITIONS, handleGetPrompt } from "./prompts.js";
export { RESOURCE_DEFINITIONS, handleReadResource } from "./resources.js";
export { loadConfig, type Config } from "./config.js";
export { requestContext } from "./request-context.js";

export async function main(): Promise<void> {
  const cfg = loadConfig();

  if (cfg.transport === "stdio") {
    await import("./stdio.js");
    return;
  }

  const { startHttpServer } = await import("./http.js");
  const server = await startHttpServer(cfg);
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("info", "shutdown_started", { signal });
    server.close((error) => {
      if (error) {
        log("error", "shutdown_failed", { error: error.message });
        process.exitCode = 1;
      } else {
        log("info", "shutdown_completed");
      }
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

const entryPath = process.argv[1];
const isDirectRun =
  typeof entryPath === "string" &&
  !entryPath.includes("vitest") &&
  (entryPath.endsWith("/index.js") ||
    entryPath.endsWith("/teletype-mcp-server") ||
    entryPath.endsWith("src/index.ts"));

if (isDirectRun) {
  const parsedCli = parseCliArgs(process.argv.slice(2), process.env);
  if (parsedCli.exitImmediately) {
    if (parsedCli.output) console.log(parsedCli.output);
    process.exit(parsedCli.exitCode ?? 0);
  }
  if (parsedCli.evalFixture) {
    import("./eval/stdio.js")
      .then(({ startEvalStdio }) => startEvalStdio(parsedCli.evalSelectionFixture))
      .catch((err: unknown) => {
        log("error", "eval_fixture_fatal", {
          error: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      });
  } else if (parsedCli.doctor) {
    runDoctor()
      .then(console.log)
      .catch((err: unknown) => {
        console.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      });
  } else {
    main().catch((err: unknown) => {
      log("error", "startup_fatal", { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
  }
}
