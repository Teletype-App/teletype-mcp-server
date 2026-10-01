import { describe, expect, it } from "vitest";
import { handleGetPrompt, PROMPT_DEFINITIONS } from "./prompts.js";

describe("MCP Prompts", () => {
  it("defines standard prompts with expected schemas", () => {
    const names = PROMPT_DEFINITIONS.map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(["triage-inbox", "draft-reply", "client-summary", "escalate-issue"]),
    );
  });

  it("renders triage-inbox prompt with arguments", () => {
    const res = handleGetPrompt("triage-inbox", { limit: "15", channel_id: "support" });
    expect(res.messages).toHaveLength(1);
    expect(res.messages[0]?.role).toBe("user");
    const content = res.messages[0]?.content;
    expect(content?.type).toBe("text");
    if (content?.type === "text") {
      expect(content.text).toContain("limit=15");
      expect(content.text).toContain("channel='support'");
    }
  });

  it("renders draft-reply prompt with dialog_id and instructions", () => {
    const res = handleGetPrompt("draft-reply", {
      dialog_id: "dlg-100",
      instructions: "согласован возврат, предложить скидку 10%",
    });
    const content = res.messages[0]?.content;
    expect(content?.type).toBe("text");
    if (content?.type === "text") {
      expect(content.text).toContain("dlg-100");
      expect(content.text).toContain("согласован возврат, предложить скидку 10%");
      expect(content.text).toContain("\nAdditional operator instructions:");
    }
  });

  it("renders client-summary prompt with client identifier", () => {
    const res = handleGetPrompt("client-summary", {
      client: "client-42",
    });
    const content = res.messages[0]?.content;
    expect(content?.type).toBe("text");
    if (content?.type === "text") {
      expect(content.text).toContain("client-42");
    }
  });

  it("renders escalate-issue prompt with dialog and component", () => {
    const res = handleGetPrompt("escalate-issue", {
      dialog_id: "dlg-100",
      component: "Шлюз оплаты",
    });
    const content = res.messages[0]?.content;
    expect(content?.type).toBe("text");
    if (content?.type === "text") {
      expect(content.text).toContain("dlg-100");
      expect(content.text).toContain("Шлюз оплаты");
      expect(content.text).toContain("   - Component: Шлюз оплаты\n   - The issue");
    }
  });

  it("renders shift-handover prompt with channel filter", () => {
    const res = handleGetPrompt("shift-handover", {
      channel_id: "channel-telegram",
    });
    const content = res.messages[0]?.content;
    expect(content?.type).toBe("text");
    if (content?.type === "text") {
      expect(content.text).toContain("channel-telegram");
      expect(content.text).toContain("get_project_status");
      expect(content.text).toContain("find_conversations");
    }
  });

  it("throws error for unknown prompt name", () => {
    expect(() => handleGetPrompt("non-existent-prompt")).toThrow(
      /Unknown prompt 'non-existent-prompt'/,
    );
  });
});
