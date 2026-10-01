import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = await mkdtemp(join(tmpdir(), "teletype-mcp-package-"));
const env = { ...process.env, TELETYPE_API_TOKEN: "package-smoke-placeholder", TRANSPORT: "stdio" };

async function command(file, args, options = {}) {
  return run(file, args, { cwd: root, timeout: 60_000, maxBuffer: 4_000_000, ...options });
}

async function checkProtocol(binary, version, era) {
  const client = new Client(
    { name: "package-smoke", version: "1.0.0" },
    {
      versionNegotiation: era === "legacy" ? { mode: "legacy" } : { mode: { pin: version } },
    },
  );
  const transport = new StdioClientTransport({ command: binary, env, stderr: "pipe" });
  try {
    await client.connect(transport);
    if (client.getProtocolEra() !== era || client.getNegotiatedProtocolVersion() !== version) {
      throw new Error(`Wrong MCP negotiation for ${version}`);
    }
    const listed = await client.listTools();
    if (!listed.tools.some((tool) => tool.name === "find_conversations")) {
      throw new Error(`Packaged CLI did not publish tools for ${version}`);
    }
  } finally {
    await client.close();
  }
}

async function checkEvalFixture(binary) {
  const client = new Client(
    { name: "package-eval-smoke", version: "1.0.0" },
    { versionNegotiation: { mode: "legacy" } },
  );
  const transport = new StdioClientTransport({
    command: binary,
    args: ["--eval-fixture"],
    env: { ...env, TELETYPE_API_TOKEN: "must-not-reach-production" },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    if (!tools.tools.some(({ name }) => name === "eval_start_case")) {
      throw new Error("Packaged eval fixture did not publish eval tools");
    }
    const started = await client.callTool({
      name: "eval_start_case",
      arguments: { case_id: "workspace-metadata" },
    });
    if (started.isError) throw new Error("Packaged eval fixture could not start a case");
    const metadata = await client.callTool({
      name: "list_workspace_metadata",
      arguments: { resource: "channels" },
    });
    if (metadata.isError) throw new Error("Packaged eval fixture could not read fake data");
  } finally {
    await client.close();
  }
}

try {
  const packed = await command("npm", ["pack", "--json", "--pack-destination", directory]);
  const packResult = JSON.parse(packed.stdout);
  const filename = (Array.isArray(packResult) ? packResult[0] : Object.values(packResult)[0])
    ?.filename;
  if (!filename) throw new Error("npm pack did not produce an archive");
  const archive = join(directory, filename);
  await command("npm", [
    "install",
    "--prefix",
    directory,
    "--no-save",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    archive,
  ]);

  const binary = join(directory, "node_modules", ".bin", "teletype-mcp-server");
  const doctor = await command(binary, ["doctor", "--stdio"], { env, cwd: directory });
  if (
    !doctor.stdout.includes("Tools registered: 17 of 17") ||
    doctor.stdout.includes(env.TELETYPE_API_TOKEN)
  ) {
    throw new Error(`Packaged doctor command failed or exposed the test token: ${doctor.stdout}`);
  }

  await command(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const m = await import('teletype-mcp-server'); if (typeof m.buildServer !== 'function') process.exit(1)",
    ],
    { cwd: directory },
  );
  await checkProtocol(binary, "2025-11-25", "legacy");
  await checkProtocol(binary, "2026-07-28", "modern");
  await checkEvalFixture(binary);
  process.stdout.write("Packed CLI, exports, both MCP protocols, and eval fixture: OK\n");
} finally {
  await rm(directory, { recursive: true, force: true });
}
