import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const registryJson = JSON.parse(readFileSync(new URL("../server.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;
const actualTag = process.env.GITHUB_REF_NAME;

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
    console.log(`Release ${actualTag} matches package, registry, and built CLI versions.`);
  }
}
