import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";

describe("stdio protocol", () => {
  it.each([
    ["2025-11-25", "legacy"],
    ["2026-07-28", "modern"],
  ] as const)("serves %s discovery and tool listing", async (version, era) => {
    const client = new Client(
      { name: "stdio-compatibility-test", version: "1.0.0" },
      {
        versionNegotiation: era === "legacy" ? { mode: "legacy" } : { mode: { pin: version } },
      },
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/stdio.ts"],
      env: { ...process.env, TELETYPE_API_TOKEN: "test-token", TRANSPORT: "stdio" },
      stderr: "pipe",
    });
    try {
      await client.connect(transport);
      expect(client.getProtocolEra()).toBe(era);
      expect(client.getNegotiatedProtocolVersion()).toBe(version);
      const listed = await client.listTools();
      expect(listed.tools.some((tool) => tool.name === "find_conversations")).toBe(true);
    } finally {
      await client.close();
    }
  });
});
