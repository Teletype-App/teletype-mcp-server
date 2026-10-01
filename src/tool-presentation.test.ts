import { describe, expect, it } from "vitest";
import { presentToolResult } from "./tool-presentation.js";
import { jsonResult } from "./tool-helpers.js";

describe("MCP tool result presentation", () => {
  it("distinguishes accepted messages from confirmed delivery", () => {
    const result = jsonResult({
      accepted: true,
      delivery_confirmed: false,
      message_ids: ["sent-1"],
    });
    const presented = presentToolResult("send_reply_to_client", result);
    expect(presented.structuredContent).toEqual(result.structuredContent);
    expect(presented.content[0]?.text).toMatch(
      /^Teletype accepted the message for sending\. Delivery to the recipient is not confirmed\./,
    );
  });

  it("does not describe conversation creation as a message send", () => {
    const result = jsonResult({
      accepted: true,
      delivery_confirmed: false,
      message_ids: [],
      created_or_found_dialog: true,
    });
    const presented = presentToolResult("send_reply_to_client", result);
    expect(presented.content[0]?.text).toMatch(
      /^Teletype created or found the conversation\. No message was sent\./,
    );
  });

  it("shows the complete dry-run side effects to text-only clients", () => {
    const result = jsonResult({
      dry_run: true,
      created_or_found: false,
      phone: "+79990000003",
      channel_name: "WhatsApp Sales",
      side_effects_if_confirmed: {
        may_create_dialog: true,
        may_assign_project_owner_to_existing_open_dialog: true,
        sends_message: false,
      },
    });
    const presented = presentToolResult("create_dialog_by_phone", result);
    const text = presented.content[0]?.text ?? "";
    expect(text).toContain("may_create_dialog: true");
    expect(text).toContain("may_assign_project_owner_to_existing_open_dialog: true");
    expect(text).toContain("sends_message: false");
  });

  it("keeps complete data while showing linked conversation summaries", () => {
    const result = jsonResult({
      total_returned: 1,
      dialogs: [
        {
          client_name: "Иван",
          channel: "WhatsApp",
          last_message_preview: "Здравствуйте",
          link_to_dialog: "https://example.test/dialog/1",
          dialog_id: "internal-id",
        },
      ],
    });

    const presented = presentToolResult("find_conversations", result);
    expect(presented.structuredContent).toEqual(result.structuredContent);
    expect(presented.content[0]?.text).toContain(
      "[Иван · WhatsApp · Здравствуйте](https://example.test/dialog/1)",
    );
    expect(presented.content[0]?.text).toContain("dialog_id: internal-id");
  });

  it("shows channel names and active state to text-only MCP clients", () => {
    const result = jsonResult({
      channels: [{ id: "channel-telegram", name: "Telegram Support", active: true }],
    });
    const presented = presentToolResult("list_workspace_metadata", result);
    expect(presented.content[0]?.text).toContain("Telegram Support");
    expect(presented.content[0]?.text).toContain("active: true");
  });

  it("marks a partial write as an error and names applied work", () => {
    const result = jsonResult({
      client_id: "42",
      applied: { name: "Иван" },
      partial_errors: ["Тег не добавлен"],
    });

    const presented = presentToolResult("annotate_client_record", result);
    expect(presented.isError).toBe(true);
    expect(presented.content[0]?.text).toContain('applied: {"name":"Иван"}');
    expect(presented.content[0]?.text).toContain("Error: Тег не добавлен");
  });

  it("shows technical facts to clients that only read text content", () => {
    const result = jsonResult({
      technical: {
        api_status: "ok",
        webhook_errors_count: 2,
        channels_total: 3,
        channels_active: 2,
        channels_with_issues: [{ id: "old-email", name: "Old Email", active: false }],
      },
      warnings: [],
    });
    const presented = presentToolResult("get_project_status", result);
    expect(presented.structuredContent).toEqual(result.structuredContent);
    expect(presented.content[0]?.text).toContain("api_status: ok");
    expect(presented.content[0]?.text).toContain("channels_active: 2");
    expect(presented.content[0]?.text).toContain("Old Email");
  });

  it("renders a dry-run reply as a preview, not a send confirmation", () => {
    const result = jsonResult({
      dry_run: true,
      accepted: false,
      delivery_confirmed: false,
      message_ids: [],
      action: "reply_to_existing_dialog",
      target: {
        dialog_id: "dialog-open",
        client_name: "Иван Петров",
        channel_name: "Telegram Support",
      },
      message: { text: "Передаём в доставку", attachment: "none" },
      side_effects: { sends_message: true, marks_dialog_answered: true },
    });
    const presented = presentToolResult("send_reply_to_client", result);
    const text = presented.content[0]?.text ?? "";
    expect(text).toContain("nothing was sent");
    expect(text).toContain("client_name: Иван Петров");
    expect(text).toContain("Message: Передаём в доставку");
    expect(text).toContain("marks_dialog_answered: true");
    expect(text).not.toMatch(/^Teletype accepted the message/);
  });

  it("appends notices for text-only clients", () => {
    const result = jsonResult({
      total_returned: 1,
      dialogs: [{ client_name: "Иван", dialog_id: "d1" }],
      notices: ["Tags not found and excluded: НеСуществует."],
    });
    const presented = presentToolResult("find_conversations", result);
    expect(presented.content[0]?.text).toContain(
      "Note: Tags not found and excluded: НеСуществует.",
    );
  });

  it("summarizes the capability map for text-only clients", () => {
    const result = jsonResult({
      read_only: true,
      active_toolsets: ["conversations", "meta"],
      project: { name: "Demo Support", domain: "demo" },
      tools: [
        { name: "find_conversations", toolset: "conversations", writes_data: false },
        { name: "get_capabilities", toolset: "meta", writes_data: false },
      ],
      disabled_tools: ["send_reply_to_client"],
    });
    const presented = presentToolResult("get_capabilities", result);
    const text = presented.content[0]?.text ?? "";
    expect(text).toContain("read-only: true");
    expect(text).toContain("Workspace: Demo Support (demo)");
    expect(text).toContain("- find_conversations (conversations)");
  });

  it("shows attachment names only in the detailed thread view", () => {
    const thread = jsonResult({
      link_to_dialog: "https://example.test/1",
      messages_count: 1,
      messages: [
        {
          author: "client",
          text: "Фото чека",
          message_id: "m1",
          attachments: [{ name: "check.png", type: "image" }],
        },
      ],
    });
    const detailed = presentToolResult("read_conversation_thread", thread, {
      response_format: "detailed",
    });
    const detailedText = detailed.content[0]?.text ?? "";
    expect(detailedText).toContain("attachments: check.png");
    const concise = presentToolResult("read_conversation_thread", thread).content[0]?.text ?? "";
    expect(concise).not.toContain("attachments:");
  });

  it("marks writing tools with a writes flag in the capability map", () => {
    const result = jsonResult({
      read_only: false,
      active_toolsets: ["conversations", "messaging"],
      tools: [
        { name: "find_conversations", toolset: "conversations", writes_data: false },
        { name: "send_reply_to_client", toolset: "messaging", writes_data: true },
      ],
      disabled_tools: [],
    });
    const presented = presentToolResult("get_capabilities", result);
    const text = presented.content[0]?.text ?? "";
    expect(text).toContain("- send_reply_to_client (messaging, writes)");
    expect(text).toContain("- find_conversations (conversations)");
  });

  it("keeps concise text byte-identical regardless of response_format presence", () => {
    const findResult = jsonResult({
      total_returned: 1,
      has_more: true,
      next_page_hint: "Call again with page=2.",
      dialogs: [
        {
          client_name: "Иван",
          dialog_id: "d1",
          link_to_dialog: "https://example.test/1",
          status: "open",
          client_id: "client-ivan",
        },
      ],
    });
    const threadResult = jsonResult({
      link_to_dialog: "https://example.test/1",
      messages_count: 1,
      messages: [
        {
          author: "client",
          text: "Когда будет доставка?",
          message_id: "m1",
          link_to_message: "https://example.test/1&p=1",
        },
      ],
    });
    const profileResult = jsonResult({
      client_id: "client-ivan",
      name: "Иван",
      notes: [{ id: "n1", text: "Заметка" }],
      recent_dialogs: [{ dialog_id: "d1", link_to_dialog: "https://example.test/1" }],
      recent_dialogs_total: 7,
    });
    const cases = [
      ["find_conversations", findResult],
      ["read_conversation_thread", threadResult],
      ["lookup_client_profile", profileResult],
    ] as const;
    for (const [name, result] of cases) {
      const baseline = presentToolResult(name, result);
      const empty = presentToolResult(name, result, {});
      const concise = presentToolResult(name, result, { response_format: "concise" });
      expect(empty.content[0]?.text).toBe(baseline.content[0]?.text);
      expect(concise.content[0]?.text).toBe(baseline.content[0]?.text);
    }
  });

  it("response_format detailed adds per-item fields to the text only", () => {
    const findResult = jsonResult({
      total_returned: 1,
      search_truncated: false,
      dialogs: [
        {
          client_name: "Иван",
          dialog_id: "d1",
          appeal_id: "a1",
          link_to_dialog: "https://example.test/1",
          channel: "Telegram Support",
          last_message_preview: "Когда будет доставка?",
          last_message_at: "2026-09-20T09:00:00+00:00",
          status: "open",
          is_unanswered: true,
          assigned_operator: "Анна",
          channel_type: "telegram",
          client_id: "client-ivan",
        },
      ],
    });
    const detailedFind = presentToolResult("find_conversations", findResult, {
      response_format: "detailed",
    });
    const findText = detailedFind.content[0]?.text ?? "";
    expect(findText).toContain("status: open");
    expect(findText).toContain("appeal_id: a1");
    expect(findText).toContain("last_message_preview: Когда будет доставка?");
    expect(findText).toContain("is_unanswered: true");
    expect(findText).toContain("assigned_operator: Анна");
    expect(findText).toContain("client_id: client-ivan");
    expect(detailedFind.structuredContent).toEqual(findResult.structuredContent);
    expect(presentToolResult("find_conversations", findResult).content[0]?.text).not.toContain(
      "status: open",
    );

    const longText = `Подробный вопрос ${"о заказе ".repeat(60).trim()}`;
    const threadResult = jsonResult({
      link_to_dialog: "https://example.test/1",
      messages_count: 1,
      messages: [
        {
          author: "client",
          text: longText,
          message_id: "m1",
          status: "delivered",
          link_to_message: "https://example.test/1&p=1",
        },
      ],
    });
    const detailedThread = presentToolResult("read_conversation_thread", threadResult, {
      response_format: "detailed",
    });
    const threadText = detailedThread.content[0]?.text ?? "";
    expect(threadText).toContain("message_id: m1");
    expect(threadText).toContain("status: delivered");
    expect(threadText).toContain(longText);
    const conciseThread = presentToolResult("read_conversation_thread", threadResult).content[0]
      ?.text;
    expect(conciseThread).not.toContain(longText);
    expect(detailedThread.structuredContent).toEqual(threadResult.structuredContent);
  });

  it("steers text-only clients toward the rest of truncated data", () => {
    const findResult = jsonResult({
      total_returned: 1,
      has_more: true,
      next_page_hint: "Call again with page=2.",
      dialogs: [{ client_name: "Иван", dialog_id: "d1" }],
    });
    expect(presentToolResult("find_conversations", findResult).content[0]?.text).toContain(
      "Call again with page=2.",
    );

    const threadResult = jsonResult({
      link_to_dialog: "https://example.test/1",
      messages_count: 2,
      messages: [
        { author: "client", text: "первое", message_id: "m1" },
        { author: "operator", text: "второе", message_id: "m2" },
      ],
    });
    expect(
      presentToolResult("read_conversation_thread", threadResult, { messages_limit: 2 }).content[0]
        ?.text,
    ).toContain("At least 2 messages were returned.");
    expect(
      presentToolResult("read_conversation_thread", threadResult).content[0]?.text,
    ).not.toContain("At least 2 messages were returned.");

    const profileResult = jsonResult({
      client_id: "client-ivan",
      recent_dialogs: [{ dialog_id: "d1" }],
      recent_dialogs_total: 7,
    });
    expect(presentToolResult("lookup_client_profile", profileResult).content[0]?.text).toContain(
      "The client has 7 conversations in the recent window, showing the latest 5.",
    );
  });

  it("renders client history with per-dialog sections and messages", () => {
    const result = jsonResult({
      client_id: "client-ivan",
      client_name: "Иван Петров",
      dialogs_returned: 2,
      dialogs: [
        {
          link_to_dialog: "https://example.test/1",
          dialog_id: "d1",
          appeal_id: "s1",
          status: "closed",
          channel: "Old Email",
          messages_count: 2,
          messages: [
            {
              link_to_message: "https://example.test/1&p=1",
              author: "client",
              text: "Номер заказа 777",
              created_at: "2026-09-19 08:00",
              message_id: "m1",
            },
            {
              link_to_message: "https://example.test/1&p=2",
              author: "operator",
              text: "Заказ передан на склад",
              message_id: "m2",
            },
          ],
        },
        {
          link_to_dialog: "https://example.test/2",
          dialog_id: "d2",
          messages_count: 0,
          messages: [],
        },
      ],
      partial_errors: [],
    });
    const presented = presentToolResult("read_client_history", result);
    const text = presented.content[0]?.text ?? "";
    expect(text).toContain("Recent dialogs: 2.");
    expect(text).toContain("[Old Email · closed](https://example.test/1)");
    expect(text).toContain("client: Номер заказа 777");
    expect(text).toContain("operator: Заказ передан на склад");
    expect(text).toContain("No messages returned for this dialog.");
    expect(text).not.toContain("message_id: m1");

    const detailed = presentToolResult("read_client_history", result, {
      response_format: "detailed",
    });
    const detailedText = detailed.content[0]?.text ?? "";
    expect(detailedText).toContain("message_id: m1");
    expect(detailedText).toContain("dialog_id: d1");
    expect(detailedText.length).toBeGreaterThan(text.length);
    expect(detailed.structuredContent).toEqual(result.structuredContent);
  });
});
