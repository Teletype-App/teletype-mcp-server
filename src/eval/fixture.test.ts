import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";

describe("offline eval fixture", () => {
  it("offers only production tools in selection mode", async () => {
    const client = new Client({ name: "selection-fixture-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts", "--eval-selection-fixture"],
      env: { ...process.env, TRANSPORT: "stdio" },
      stderr: "inherit",
    });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.map(({ name }) => name)).toContain("list_clients");
      expect(tools.tools.map(({ name }) => name)).not.toContain("eval_list_cases");
      expect(tools.tools.map(({ name }) => name)).not.toContain("eval_start_case");
      expect(tools.tools.map(({ name }) => name)).not.toContain("eval_grade_case");
      const result = await client.callTool({
        name: "list_clients",
        arguments: { phone: "+79990000002" },
      });
      expect(result.structuredContent).toMatchObject({
        clients: [expect.objectContaining({ name: "Анна Смирнова" })],
      });
    } finally {
      await client.close();
    }
  });

  it.each([
    ["2025-11-25", "legacy"],
    ["2026-07-28", "modern"],
  ] as const)("runs through a %s MCP client", async (version, era) => {
    const client = new Client(
      { name: "eval-fixture-test", version: "1.0.0" },
      { versionNegotiation: era === "legacy" ? { mode: "legacy" } : { mode: { pin: version } } },
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts", "--eval-fixture"],
      env: {
        ...process.env,
        TRANSPORT: "stdio",
        TELETYPE_API_TOKEN: "inherited-live-token-must-be-ignored",
        TELETYPE_API_BASE: "http://127.0.0.1:1/public/api/v1",
      },
      stderr: "inherit",
    });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.map(({ name }) => name)).toContain("eval_start_case");

      const started = await client.callTool({
        name: "eval_start_case",
        arguments: { case_id: "workspace-metadata" },
      });
      expect(started.structuredContent).toMatchObject({ case_id: "workspace-metadata" });

      const metadata = await client.callTool({
        name: "list_workspace_metadata",
        arguments: { resource: "channels" },
      });
      expect(metadata.isError, JSON.stringify(metadata)).not.toBe(true);

      const grade = await client.callTool({
        name: "eval_grade_case",
        arguments: { answer: "В проекте есть активный канал Telegram." },
      });
      expect(grade.structuredContent).toMatchObject({
        score: 1,
        passed: true,
        metrics: {
          outcome_passed: true,
          first_target_call_passed: true,
          answer_passed: true,
          safety_passed: true,
          recovered_after_error: false,
          tool_errors: 0,
        },
      });
      expect((grade.structuredContent as { trace: { name: string }[] }).trace).toEqual([
        expect.objectContaining({ name: "list_workspace_metadata" }),
      ]);

      await client.callTool({
        name: "eval_start_case",
        arguments: { case_id: "workspace-metadata" },
      });
      const emptyGrade = await client.callTool({
        name: "eval_grade_case",
        arguments: { answer: "В проекте есть активный канал Telegram." },
      });
      expect(emptyGrade.structuredContent).toMatchObject({ passed: false, trace: [] });
    } finally {
      await client.close();
    }
  });
});
