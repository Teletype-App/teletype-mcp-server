import { execFile } from "node:child_process";
import { cp, copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(await readFile(join(root, "mcpb/manifest.json"), "utf8"));

if (manifest.version !== pkg.version) {
  throw new Error(`MCPB manifest version ${manifest.version} differs from package ${pkg.version}`);
}

const staging = await mkdtemp(join(tmpdir(), "teletype-mcpb-"));
const output = join(root, "artifacts", `${pkg.name}-v${pkg.version}.mcpb`);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

async function run(command, args, cwd, env = process.env) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd,
    env,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function checkStdio(staging) {
  const client = new Client({ name: "mcpb-build-check", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(staging, "dist/stdio.js")],
    env: {
      ...process.env,
      TELETYPE_API_TOKEN: "mcpb-build-check",
      LOG_LEVEL: "error",
    },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    if (tools.length !== 17) throw new Error(`Expected 17 packaged tools, got ${tools.length}`);
  } finally {
    await client.close();
  }
}

try {
  await cp(join(root, "dist"), join(staging, "dist"), { recursive: true });
  for (const file of ["package.json", "package-lock.json", "LICENSE"]) {
    await copyFile(join(root, file), join(staging, file));
  }
  await copyFile(join(root, "mcpb/manifest.json"), join(staging, "manifest.json"));
  await run(npm, ["ci", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"], staging);
  await run(process.execPath, ["dist/index.js", "doctor", "--stdio"], staging, {
    ...process.env,
    TELETYPE_API_TOKEN: "mcpb-build-check",
  });
  await checkStdio(staging);
  await run(npm, ["exec", "--", "mcpb", "validate", staging], root);
  await mkdir(dirname(output), { recursive: true });
  await run(npm, ["exec", "--", "mcpb", "pack", staging, output], root);
  process.stdout.write(`${output}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
