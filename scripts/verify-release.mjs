import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const registryJson = JSON.parse(readFileSync(new URL("../server.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;
const actualTag = process.env.GITHUB_REF_NAME;
const lockfile = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));

if (process.env.GITHUB_REPOSITORY) {
  const repository = process.env.GITHUB_REPOSITORY;
  const namespace = `io.github.${repository.split("/")[0]}/`;
  if (!packageJson.mcpName.startsWith(namespace)) {
    console.error(`MCP Registry namespace must match GitHub owner case: ${namespace}.`);
    process.exitCode = 1;
  }
  if (packageJson.repository?.url !== `git+https://github.com/${repository}.git`) {
    console.error("Package repository URL must exactly match GitHub provenance, including case.");
    process.exitCode = 1;
  }
}

if (
  lockfile.version !== packageJson.version ||
  lockfile.packages?.[""]?.version !== packageJson.version
) {
  console.error("Lockfile versions must match the package version.");
  process.exitCode = 1;
}

for (const file of [
  "mcpb/manifest.json",
  "plugin/plugin.json",
  "plugin/.claude-plugin/plugin.json",
  "plugin/.cursor-plugin/plugin.json",
  "lhm.plugin.json",
  "gemini-extension.json",
]) {
  const manifest = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  if (manifest.version !== packageJson.version) {
    console.error(`${file} version ${manifest.version} must match package ${packageJson.version}.`);
    process.exitCode = 1;
  }
}

for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]) {
  const marketplace = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  const plugin = marketplace.plugins.find((entry) => entry.name === "teletype");
  if (plugin?.version !== packageJson.version) {
    console.error(`${file} must include Teletype at version ${packageJson.version}.`);
    process.exitCode = 1;
  }
}

const pinnedPackage = `${packageJson.name}@${packageJson.version}`;
const pluginMcp = JSON.parse(readFileSync(new URL("../plugin/mcp.json", import.meta.url), "utf8"));
if (!pluginMcp.mcpServers.teletype.args.includes(pinnedPackage)) {
  console.error(`The portable plugin launcher must pin ${pinnedPackage}.`);
  process.exitCode = 1;
}

const smitheryConfig = readFileSync(new URL("../smithery.yaml", import.meta.url), "utf8");
if (!smitheryConfig.includes(`'${pinnedPackage}'`)) {
  console.error(`The legacy Smithery launcher must pin ${pinnedPackage}.`);
  process.exitCode = 1;
}

if (
  registryJson.name !== packageJson.mcpName ||
  registryJson.version !== packageJson.version ||
  registryJson.packages?.[0]?.identifier !== packageJson.name ||
  registryJson.packages?.[0]?.version !== packageJson.version
) {
  console.error("MCP Registry metadata must match package name and version.");
  process.exitCode = 1;
}

if (actualTag !== expectedTag) {
  console.error(`Release tag must be ${expectedTag}; received ${actualTag || "<empty>"}.`);
  process.exitCode = 1;
} else {
  const cli = fileURLToPath(new URL("../dist/index.js", import.meta.url));
  const cliVersion = execFileSync(process.execPath, [cli, "--version"], {
    encoding: "utf8",
  }).trim();
  if (cliVersion !== packageJson.version) {
    console.error(
      `Built CLI version ${cliVersion} differs from package version ${packageJson.version}.`,
    );
    process.exitCode = 1;
  } else if (!process.exitCode) {
    console.log(
      `Release ${actualTag} matches package, registry, plugins, MCPB, and built CLI versions.`,
    );
  }
}
