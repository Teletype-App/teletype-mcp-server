import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCliArgs, runDoctor } from "./index.js";

const packageVersion = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

describe("CLI Argument Parser", () => {
  it("handles --help and -h flags", () => {
    const res1 = parseCliArgs(["--help"], {});
    expect(res1.exitImmediately).toBe(true);
    expect(res1.output).toContain("Teletype MCP Server");

    const res2 = parseCliArgs(["-h"], {});
    expect(res2.exitImmediately).toBe(true);
    expect(res2.output).toContain("Teletype MCP Server");
  });

  it("handles --version and -v flags", () => {
    const res1 = parseCliArgs(["--version"], {});
    expect(res1.exitImmediately).toBe(true);
    expect(res1.output).toBe(packageVersion);

    const res2 = parseCliArgs(["-v"], {});
    expect(res2.exitImmediately).toBe(true);
    expect(res2.output).toBe(packageVersion);
  });

  it("sets TRANSPORT to stdio for --stdio and -s", () => {
    const env1: NodeJS.ProcessEnv = {};
    parseCliArgs(["--stdio"], env1);
    expect(env1.TRANSPORT).toBe("stdio");

    const env2: NodeJS.ProcessEnv = {};
    parseCliArgs(["-s"], env2);
    expect(env2.TRANSPORT).toBe("stdio");
  });

  it("sets TRANSPORT to http for --http", () => {
    const env: NodeJS.ProcessEnv = {};
    parseCliArgs(["--http"], env);
    expect(env.TRANSPORT).toBe("http");
  });

  it("parses --port and -p values", () => {
    const env1: NodeJS.ProcessEnv = {};
    parseCliArgs(["--port", "5000"], env1);
    expect(env1.PORT).toBe("5000");

    const env2: NodeJS.ProcessEnv = {};
    parseCliArgs(["-p", "8080"], env2);
    expect(env2.PORT).toBe("8080");
  });

  it("parses --host value", () => {
    const env: NodeJS.ProcessEnv = {};
    parseCliArgs(["--host", "0.0.0.0"], env);
    expect(env.HOST).toBe("0.0.0.0");
  });

  it("checks registration without contacting the API", async () => {
    const env: NodeJS.ProcessEnv = { TELETYPE_API_TOKEN: "placeholder" };
    expect(parseCliArgs(["doctor", "--stdio"], env).doctor).toBe(true);
    const report = await runDoctor(env);
    expect(report).toContain("MCP protocols: 2025 initialize, 2026-07-28 server/discover");
    expect(report).toContain("Tools registered: 17 of 17");
    expect(report).toContain("Mode: read-write");
    expect(report).toContain("Toolsets: all");
    expect(report).not.toContain("placeholder");
  });

  it("selects stdio transport from the Antigravity example", async () => {
    const config = JSON.parse(readFileSync("examples/clients/antigravity.json", "utf8")) as {
      mcpServers: { teletype: { args: string[] } };
    };
    const env: NodeJS.ProcessEnv = { TELETYPE_API_TOKEN: "placeholder" };
    parseCliArgs(config.mcpServers.teletype.args, env);
    expect(await runDoctor(env)).toContain("Transport: stdio");
  });

  it("reports read-only and toolset filtering in doctor and parseCliArgs flags", async () => {
    const env: NodeJS.ProcessEnv = { TELETYPE_API_TOKEN: "placeholder" };
    parseCliArgs(["--read-only", "--toolsets", "conversations,admin"], env);
    expect(env.TELETYPE_MCP_READ_ONLY).toBe("true");
    expect(env.TELETYPE_MCP_TOOLSETS).toBe("conversations,admin");
    const report = await runDoctor(env);
    expect(report).toContain("Mode: read-only");
    expect(report).toContain("Toolsets: conversations, admin");
    expect(report).toContain("Tools registered: 9 of 17");
    expect(report).toContain("Teletype API was not contacted.");
  });
});
