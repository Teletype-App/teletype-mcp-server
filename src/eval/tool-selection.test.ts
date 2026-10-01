import { describe, expect, it } from "vitest";
import { evaluateToolSelection } from "./tool-selection.js";
import type { ToolCallingModel } from "./openai-compatible.js";

describe("tool selection eval", () => {
  it("checks the first choice using the real tool descriptions without executing tools", async () => {
    const observed: string[] = [];
    const model: ToolCallingModel = {
      complete(messages, tools) {
        expect(tools).toHaveLength(17);
        observed.push(String(messages[1]?.content));
        const name = observed.length === 1 ? "list_workspace_metadata" : "get_project_status";
        return Promise.resolve({
          content: "",
          toolCalls: [{ id: "call-1", type: "function", function: { name, arguments: "{}" } }],
          assistantMessage: { role: "assistant", content: null },
        });
      },
    };

    const report = await evaluateToolSelection(model, [
      { id: "inventory", prompt: "Какие каналы?", expected: "list_workspace_metadata" },
      { id: "health", prompt: "Есть ли сбои?", expected: "list_workspace_metadata" },
    ]);

    expect(observed).toEqual(["Какие каналы?", "Есть ли сбои?"]);
    expect(report.score).toBe(0.5);
    expect(report.cases.map(({ actual, passed }) => [actual, passed])).toEqual([
      ["list_workspace_metadata", true],
      ["get_project_status", false],
    ]);
  });
});
