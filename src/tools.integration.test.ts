import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Config } from "./config.js";
import { createHttpApp } from "./http.js";
import { startFakeTeletypeApi, type FakeTeletypeApi } from "./test-support/fake-teletype-api.js";

describe("Teletype tools against the Public API contract", () => {
  let fakeApi: FakeTeletypeApi;
  let app: ReturnType<typeof createHttpApp>;
  let tokenSequence = 0;

  beforeAll(async () => {
    fakeApi = await startFakeTeletypeApi();
    const config: Config = {
      transport: "http",
      port: 4311,
      host: "127.0.0.1",
      publicBaseUrl: "http://127.0.0.1:4311",
      allowedOrigins: ["http://127.0.0.1:4311"],
      apiBase: fakeApi.baseUrl,
      projectUrl: "teletype.app",
      requestTimeoutMs: 2_000,
      maxResponseBytes: 1_000_000,
      maxUploadBytes: 1_000_000,
      maxConcurrentRequests: 32,
      maxConcurrentPerToken: 4,
      enableLocalUploads: false,
      allowedFileRoots: [],
      logLevel: "error",
      readOnly: false,
      toolsets: null,
    };
    app = createHttpApp(config);
  });

  afterAll(async () => fakeApi.close());
  beforeEach(() => {
    fakeApi.reset();
  });

  function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Expected an object in the MCP response");
    }
    return value as Record<string, unknown>;
  }

  function mcpResult(body: unknown): Record<string, unknown> {
    return record(record(body).result);
  }

  function modernRpc(id: number, method: string, params: Record<string, unknown>) {
    return {
      jsonrpc: "2.0",
      id,
      method,
      params: {
        ...params,
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientInfo": { name: "integration-test", version: "1.0.0" },
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    };
  }

  async function callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", name)
      .send(modernRpc(tokenSequence, "tools/call", { name, arguments: args }));
    expect(response.status).toBe(200);
    const result = mcpResult(response.body);
    expect(result.isError).not.toBe(true);
    return record(result.structuredContent);
  }

  async function callMcp(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    tokenSequence += 1;
    const call = request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", method);
    const name = method === "resources/read" ? params.uri : params.name;
    if (typeof name === "string") call.set("Mcp-Name", name);
    const response = await call.send(modernRpc(tokenSequence, method, params));
    expect(response.status).toBe(200);
    return mcpResult(response.body);
  }

  function resourceText(result: Record<string, unknown>): string {
    const contents = result.contents;
    if (!Array.isArray(contents)) throw new Error("Resource contents are missing");
    const first: unknown = contents[0];
    if (
      !first ||
      typeof first !== "object" ||
      !("text" in first) ||
      typeof first.text !== "string"
    ) {
      throw new Error("Expected a text resource");
    }
    return first.text;
  }

  it("finds unanswered conversations and returns structured content", async () => {
    const result = await callTool("find_conversations", { status: "unanswered" });
    expect(result).toMatchObject({ total_returned: 1, search_truncated: false });
    expect(result.dialogs).toEqual([
      expect.objectContaining({ dialog_id: "dialog-open", client_name: "Иван Петров" }),
    ]);
  });

  it("lists clients by phone and keeps API pagination visible", async () => {
    const byPhone = await callTool("list_clients", { phone: "+79990000001" });
    expect(byPhone).toMatchObject({
      total_returned: 1,
      has_more: false,
      clients: [expect.objectContaining({ client_id: "client-ivan" })],
    });
    const normalizedPart = await callTool("list_clients", { phone: "79990000001" });
    expect(normalizedPart.clients).toEqual([expect.objectContaining({ client_id: "client-ivan" })]);
    const firstPage = await callTool("list_clients", { page: 1, limit: 1 });
    expect(firstPage).toMatchObject({ page: 1, has_more: true, next_page: 2 });
  });

  it("finds old message text by continuing through API pages", async () => {
    const first = await callTool("find_messages", { query: "номер заказа 777", limit: 1 });
    expect(first).toMatchObject({ total_returned: 0, has_more: true, next_page: 2 });

    let found: Record<string, unknown> | undefined;
    let page = 2;
    while (!found && page <= 4) {
      const result = await callTool("find_messages", { query: "номер заказа 777", limit: 1, page });
      found = (result.messages as Record<string, unknown>[])[0];
      page = (result.next_page as number | null) ?? 5;
    }
    expect(found).toMatchObject({
      message_id: "message-ivan-2",
      dialog_id: "dialog-ivan-second",
      text: "Номер заказа 777",
    });
  });

  it("filters conversations by search query matching message text or client name", async () => {
    const resByText = await callTool("find_conversations", { status: "all", query: "доставка" });
    expect(resByText.dialogs).toEqual([expect.objectContaining({ dialog_id: "dialog-open" })]);

    const resByName = await callTool("find_conversations", { status: "all", query: "Анна" });
    expect(resByName.dialogs).toEqual([expect.objectContaining({ dialog_id: "dialog-closed" })]);
  });

  it("loads a client profile by an opaque Public API ID", async () => {
    const result = await callTool("lookup_client_profile", { client: "client-ivan" });
    expect(result).toMatchObject({
      client_id: "client-ivan",
      name: "Иван Петров",
      custom_fields: { order_id: "ORDER-42" },
      partial_errors: [],
    });
    expect(result.recent_dialogs).toEqual([
      expect.objectContaining({ dialog_id: "dialog-open" }),
      expect.objectContaining({ dialog_id: "dialog-ivan-second" }),
    ]);
  });

  it("reads a thread in chronological order with current message fields", async () => {
    const result = await callTool("read_conversation_thread", { dialog_id: "dialog-open" });
    expect(result).toMatchObject({ dialog_id: "dialog-open", status: "open", messages_count: 2 });
    expect(result.messages).toEqual([
      expect.objectContaining({ message_id: "message-client", author: "client" }),
      expect.objectContaining({ message_id: "message-operator", author: "operator" }),
    ]);
  });

  it("reads client history across recent dialogs in one call", async () => {
    const result = await callTool("read_client_history", { client: "client-ivan" });
    expect(result).toMatchObject({
      client_id: "client-ivan",
      client_name: "Иван Петров",
      dialogs_returned: 2,
      partial_errors: [],
    });
    const dialogs = result.dialogs as Record<string, unknown>[];
    expect(dialogs.map((dialog) => dialog.dialog_id)).toEqual([
      "dialog-open",
      "dialog-ivan-second",
    ]);
    const [firstDialog, secondDialog] = dialogs;
    const messages = (firstDialog?.messages ?? []) as Record<string, unknown>[];
    expect(messages.map((message) => message.message_id)).toEqual([
      "message-client",
      "message-operator",
    ]);
    expect(messages[0]?.author).toBe("client");
    expect(String(firstDialog?.link_to_dialog)).toContain("appealId=session-open");
    expect(String(secondDialog?.link_to_dialog)).toContain("appealId=session-ivan-2");
  });

  it("honors dialogs_limit and messages_per_dialog slices", async () => {
    const result = await callTool("read_client_history", {
      client: "Иван Петров",
      dialogs_limit: 1,
      messages_per_dialog: 1,
    });
    expect(result.dialogs_returned).toBe(1);
    const [onlyDialog] = result.dialogs as Record<string, unknown>[];
    expect(onlyDialog?.dialog_id).toBe("dialog-open");
    const messages = (onlyDialog?.messages ?? []) as Record<string, unknown>[];
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message_id).toBe("message-operator");
  });

  it("fails read_client_history with a hint when the client does not resolve", async () => {
    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "read_client_history")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "read_client_history",
          arguments: { client: "Никто Такой" },
        }),
      );
    const result = mcpResult(response.body);
    expect(result.isError).toBe(true);
    expect(record(result.structuredContent).error).toBeTruthy();
  });

  it("degrades to partial_errors when a message page fails", async () => {
    // 404 instead of 500: GET 5xx is retried now, a one-shot 500 would be absorbed.
    fakeApi.failNext("/messages", 404);
    const result = await callTool("read_client_history", { client: "client-ivan" });
    expect(result.dialogs_returned).toBe(2);
    const [failedDialog, okDialog] = result.dialogs as Record<string, unknown>[];
    expect(failedDialog?.messages_count).toBe(0);
    expect(okDialog?.messages_count).toBe(2);
    expect(result.partial_errors).toHaveLength(1);
  });

  it("rejects dialogs_limit above the schema maximum", async () => {
    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "read_client_history")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "read_client_history",
          arguments: { client: "client-ivan", dialogs_limit: 9 },
        }),
      );
    expect(mcpResult(response.body).isError).toBe(true);
  });

  it("teaches the confirm retry in fatal send errors", async () => {
    const unconfirmed = await callMcp("tools/call", {
      name: "send_reply_to_client",
      arguments: { recipient_dialog_id: "dialog-open", text: "Привет" },
    });
    expect(unconfirmed.isError).toBe(true);
    expect(String(record(unconfirmed.structuredContent).hint)).toContain("confirm: true");
  });

  it("hints the expected text argument when update has no text", async () => {
    const missing = await callMcp("tools/call", {
      name: "manage_sent_message",
      arguments: { message_id: "sent-1", action: "update", confirm: true },
    });
    expect(missing.isError).toBe(true);
    const structured = record(missing.structuredContent);
    expect(String(structured.error)).toContain("text");
    expect(String(structured.hint)).toContain("action: 'update'");
  });

  it("lists channel candidates by name when a channel query is ambiguous", async () => {
    const ambiguous = await callMcp("tools/call", {
      name: "send_reply_to_client",
      arguments: {
        dry_run: true,
        client: "Иван Петров",
        channel: "a",
        text: "Проверка кандидатов",
      },
    });
    expect(ambiguous.isError).toBe(true);
    const hint = String(record(ambiguous.structuredContent).hint);
    expect(hint).toContain("Telegram Support [telegram]");
    expect(hint).toContain("Old Email [email]");
    expect(hint).toContain("WhatsApp Sales [whatsapp_edna]");
  });

  it("sends a reply only after explicit confirmation and reports queue acceptance", async () => {
    const result = await callTool("send_reply_to_client", {
      recipient_dialog_id: "dialog-open",
      text: "Заказ будет доставлен завтра",
      confirm: true,
    });
    expect(result).toMatchObject({
      accepted: true,
      delivery_confirmed: false,
      marked_answered: true,
      message_ids: [expect.any(String)],
    });
    expect(fakeApi.state.sentMessages).toContainEqual({
      dialogId: "dialog-open",
      text: "Заказ будет доставлен завтра",
      url: undefined,
    });
    expect(fakeApi.state.answeredDialogs).toContain("dialog-open");
    const thread = await callTool("read_conversation_thread", { dialog_id: "dialog-open" });
    expect(thread.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message_id: "sent-1",
          text: "Заказ будет доставлен завтра",
          status: "sending",
        }),
      ]),
    );
  });

  it("applies client annotations and reports each effect", async () => {
    const result = await callTool("annotate_client_record", {
      client: "client-ivan",
      dialog_id: "dialog-open",
      add_tags: ["Возврат"],
      remove_tags: ["VIP"],
      note: "Клиенту обещана доставка",
      dialog_category: "Решено",
      confirm: true,
    });
    expect(result).toMatchObject({
      client_id: "client-ivan",
      applied: {
        tags_added: 1,
        tags_removed: 1,
        note_id: expect.any(String) as unknown,
        dialog_category: "Решено",
      },
      partial_errors: [],
    });
    expect(fakeApi.state.clientTags["client-ivan"]).toEqual(["tag-refund"]);
    expect(fakeApi.state.dialogCategories["dialog-open"]).toBe("category-resolved");
  });

  it("adds a client note when only the conversation ID identifies the client", async () => {
    const result = await callTool("annotate_client_record", {
      dialog_id: "dialog-open",
      note: "Согласовать доставку",
      confirm: true,
    });
    expect(result).toMatchObject({
      client_id: "client-ivan",
      applied: { note_id: expect.any(String) as unknown },
      partial_errors: [],
    });
    expect(fakeApi.state.notes).toContainEqual({
      clientId: "client-ivan",
      text: "Согласовать доставку",
    });
  });

  it("does not report a client annotation as successful when no change was requested", async () => {
    const result = await callMcp("tools/call", {
      name: "annotate_client_record",
      arguments: { client: "client-ivan", confirm: true },
    });
    expect(result.isError).toBe(true);
    expect(fakeApi.state.notes).toHaveLength(0);
  });

  it("closes a conversation and exposes the applied outcome", async () => {
    const result = await callTool("resolve_conversation", {
      dialog_id: "dialog-open",
      category: "Решено",
      confirm: true,
    });
    expect(result).toMatchObject({
      dialog_id: "dialog-open",
      applied: { category: "Решено", closed: true },
      partial_errors: [],
    });
    expect(fakeApi.state.closedDialogs).toContain("dialog-open");
    const closed = await callTool("find_conversations", { status: "close" });
    expect(closed.dialogs).toEqual([
      expect.objectContaining({ dialog_id: "dialog-open", status: "closed" }),
      expect.objectContaining({ dialog_id: "dialog-ivan-second", status: "closed" }),
      expect.objectContaining({ dialog_id: "dialog-closed", status: "closed" }),
      expect.objectContaining({ dialog_id: "dialog-whatsapp", status: "closed" }),
    ]);
    const thread = await callTool("read_conversation_thread", { dialog_id: "dialog-open" });
    expect(thread.status).toBe("closed");
  });

  it("rejects an unknown category before closing or changing a conversation", async () => {
    const result = await callMcp("tools/call", {
      name: "resolve_conversation",
      arguments: {
        dialog_id: "dialog-open",
        category: "Unknown category",
        mark_answered: true,
        confirm: true,
      },
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain("list_workspace_metadata");
    expect(fakeApi.state.closedDialogs).not.toContain("dialog-open");
    expect(fakeApi.state.answeredDialogs).not.toContain("dialog-open");
    expect(fakeApi.state.dialogCategories["dialog-open"]).toBeUndefined();
  });

  it("assigns an operator and leaves the conversation open when close=false", async () => {
    const result = await callTool("resolve_conversation", {
      dialog_id: "dialog-open",
      assign_operator: "Анна",
      close: false,
      confirm: true,
    });
    expect(result).toMatchObject({
      dialog_id: "dialog-open",
      applied: {
        operator_id: "operator-anna",
        closed: false,
      },
      partial_errors: [],
    });
    expect(fakeApi.state.dialogOperators["dialog-open"]).toBe("operator-anna");
    expect(fakeApi.state.closedDialogs).not.toContain("dialog-open-assigned");
  });

  it("lists inactive channels and real operator account statuses", async () => {
    const result = await callTool("list_workspace_metadata", { resource: "all" });
    expect(result.channels).toEqual([
      expect.objectContaining({ id: "channel-telegram", active: true }),
      expect.objectContaining({ id: "channel-email", active: false }),
      expect.objectContaining({ id: "channel-whatsapp", active: true }),
    ]);
    expect(result.operators).toEqual([
      expect.objectContaining({ id: "operator-anna", status: "available" }),
      expect.objectContaining({ id: "operator-boris", status: "busy" }),
    ]);
    expect(result.resource_errors).toEqual({});
  });

  it("builds a technical project status without inventing channel health", async () => {
    const result = await callTool("get_project_status", { aspect: "technical" });
    expect(result.technical).toEqual(
      expect.objectContaining({
        api_status: "ok",
        channels_total: 3,
        channels_active: 2,
      }),
    );
    expect(result.warnings).toEqual([
      expect.objectContaining({ category: "channel", severity: "high" }),
    ]);
  });

  it("auto-assigns conversation operator when requested", async () => {
    const result = await callTool("resolve_conversation", {
      dialog_id: "dialog-open",
      assign_operator: "auto",
      close: false,
      confirm: true,
    });
    expect(result).toMatchObject({
      dialog_id: "dialog-open",
      applied: {
        operator: "auto-assigned",
        closed: false,
      },
      partial_errors: [],
    });
    expect(fakeApi.state.autoAssignedDialogs).toContain("dialog-open");
  });

  it("marks conversation as answered when mark_answered is true", async () => {
    const result = await callTool("resolve_conversation", {
      dialog_id: "dialog-open",
      mark_answered: true,
      close: false,
      confirm: true,
    });
    expect(result).toMatchObject({
      dialog_id: "dialog-open",
      applied: {
        marked_answered: true,
        closed: false,
      },
      partial_errors: [],
    });
    expect(fakeApi.state.answeredDialogs).toContain("dialog-open");
  });

  it("requires confirmation before marking a conversation as seen", async () => {
    const unconfirmed = await callMcp("tools/call", {
      name: "read_conversation_thread",
      arguments: { dialog_id: "dialog-open", mark_seen: true },
    });
    expect(unconfirmed.isError).toBe(true);
    expect(fakeApi.state.seenDialogs).not.toContain("dialog-open");

    const result = await callTool("read_conversation_thread", {
      dialog_id: "dialog-open",
      mark_seen: true,
      confirm: true,
    });
    expect(result).toMatchObject({ dialog_id: "dialog-open" });
    expect(fakeApi.state.seenDialogs).toContain("dialog-open");
  });

  it("updates client identity fields in annotate_client_record", async () => {
    const result = await callTool("annotate_client_record", {
      client: "client-ivan",
      name: "Иван Сергеевич",
      phone: "+79998887766",
      email: "ivan.new@example.com",
      confirm: true,
    });
    expect(result).toMatchObject({
      client_id: "client-ivan",
      applied: {
        identity_updated: {
          name: "Иван Сергеевич",
          phone: "+79998887766",
          email: "ivan.new@example.com",
        },
      },
      partial_errors: [],
    });
    expect(fakeApi.state.updatedClients["client-ivan"]).toEqual({
      name: "Иван Сергеевич",
      phone: "+79998887766",
      email: "ivan.new@example.com",
    });
  });

  it("manages sent messages: update, delete, and resend", async () => {
    const updateResult = await callTool("manage_sent_message", {
      action: "update",
      message_id: "message-operator",
      text: "Исправленный текст сообщения",
      confirm: true,
    });
    expect(updateResult).toMatchObject({
      message_id: "message-operator",
      action: "update",
      status: "updated",
    });
    expect(fakeApi.state.updatedMessages["message-operator"]).toBe("Исправленный текст сообщения");

    const resendResult = await callTool("manage_sent_message", {
      action: "resend",
      message_id: "message-operator",
      confirm: true,
    });
    expect(resendResult).toMatchObject({
      message_id: "message-operator",
      action: "resend",
      status: "resent",
    });
    expect(fakeApi.state.resentMessages).toContain("message-operator");

    const deleteResult = await callTool("manage_sent_message", {
      action: "delete",
      message_id: "message-operator",
      confirm: true,
    });
    expect(deleteResult).toMatchObject({
      message_id: "message-operator",
      action: "delete",
      status: "deleted",
    });
    expect(fakeApi.state.deletedMessages).toContain("message-operator");
  });

  it("fetches operator groups via list_workspace_metadata", async () => {
    const result = await callTool("list_workspace_metadata", { resource: "groups" });
    expect(result.groups).toEqual([
      expect.objectContaining({ id: "group-support", name: "Первая линия" }),
      expect.objectContaining({ id: "group-sales", name: "Отдел продаж" }),
    ]);
  });

  it("fetches detailed group info by group_id or group name", async () => {
    const byIdResult = await callTool("list_workspace_metadata", { group_id: "group-support" });
    expect(byIdResult.group).toEqual(
      expect.objectContaining({
        id: "group-support",
        name: "Первая линия",
        description: "Первая линия саппорта",
        operator_ids: ["operator-anna"],
      }),
    );

    const byNameResult = await callTool("list_workspace_metadata", { group_id: "Первая линия" });
    expect(byNameResult.group).toEqual(
      expect.objectContaining({
        id: "group-support",
        name: "Первая линия",
      }),
    );
  });

  it("lists and renders MCP prompts", async () => {
    const listResult = await callMcp("prompts/list");
    expect(listResult.prompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "triage-inbox" }),
        expect.objectContaining({ name: "draft-reply" }),
        expect.objectContaining({ name: "client-summary" }),
        expect.objectContaining({ name: "escalate-issue" }),
        expect.objectContaining({ name: "shift-handover" }),
      ]),
    );

    const getResult = await callMcp("prompts/get", {
      name: "triage-inbox",
      arguments: { limit: "10" },
    });
    expect(getResult.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: expect.objectContaining({
          type: "text",
          text: expect.stringContaining("find_conversations") as unknown,
        }) as unknown,
      }) as unknown,
    ]);
  });

  it("lists and reads MCP resources", async () => {
    const listResult = await callMcp("resources/list");
    expect(listResult.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: "teletype://project/status" }),
        expect.objectContaining({ uri: "teletype://workspace/metadata" }),
      ]),
    );

    const readStatus = await callMcp("resources/read", {
      uri: "teletype://project/status",
    });
    expect(readStatus.contents).toEqual([
      expect.objectContaining({
        uri: "teletype://project/status",
        mimeType: "application/json",
      }),
    ]);
    const statusParsed: unknown = JSON.parse(resourceText(readStatus));
    expect(statusParsed).toMatchObject({
      technical: { api_status: "ok" },
    });

    const readMeta = await callMcp("resources/read", {
      uri: "teletype://workspace/metadata",
    });
    expect(readMeta.contents).toEqual([
      expect.objectContaining({
        uri: "teletype://workspace/metadata",
        mimeType: "application/json",
      }),
    ]);
    const metaParsed: unknown = JSON.parse(resourceText(readMeta));
    expect(metaParsed).toHaveProperty("channels");

    const readUnanswered = await callMcp("resources/read", {
      uri: "teletype://dialogs/unanswered",
    });
    expect(readUnanswered.contents).toEqual([
      expect.objectContaining({
        uri: "teletype://dialogs/unanswered",
        mimeType: "application/json",
      }),
    ]);
    const unansweredParsed: unknown = JSON.parse(resourceText(readUnanswered));
    expect(unansweredParsed).toHaveProperty("dialogs");

    const tplListResult = await callMcp("resources/templates/list");
    expect(tplListResult.resourceTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uriTemplate: "teletype://dialogs/{dialogId}" }),
        expect.objectContaining({ uriTemplate: "teletype://clients/{clientId}" }),
      ]),
    );

    const readDialogResource = await callMcp("resources/read", {
      uri: "teletype://dialogs/dialog-open",
    });
    const dialogParsed: unknown = JSON.parse(resourceText(readDialogResource));
    expect(dialogParsed).toMatchObject({
      dialog_id: "dialog-open",
    });
    expect(dialogParsed).toHaveProperty("messages");

    const readClientResource = await callMcp("resources/read", {
      uri: "teletype://clients/client-ivan",
    });
    const clientParsed: unknown = JSON.parse(resourceText(readClientResource));
    expect(clientParsed).toMatchObject({
      client_id: "client-ivan",
    });
  });

  it("sends WhatsApp HSM template via send_whatsapp_template with confirmation", async () => {
    const result = await callTool("send_whatsapp_template", {
      channel_id: "channel-whatsapp",
      dialog_id: "dialog-whatsapp",
      template_id: "tpl-welcome",
      template_params: {
        text_variables: ["Мария", "Заказ #42 готов"],
        button_variables: ["Открыть заказ"],
        attachment: { url: "https://example.test/order.pdf", name: "order.pdf" },
      },
      template_options: { priority: "NORMAL", sendDelay: 0, comment: "Тест" },
      confirm: true,
    });
    expect(result).toMatchObject({
      channel_id: "channel-whatsapp",
      dialog_id: "dialog-whatsapp",
      template_id: "tpl-welcome",
      message_ids: ["wa-msg-101"],
      accepted: true,
      delivery_confirmed: false,
    });
    expect(fakeApi.state.whatsappTemplatesSent).toContainEqual({
      channelId: "channel-whatsapp",
      dialogId: "dialog-whatsapp",
      templateId: "tpl-welcome",
      template_params: {
        text_variables: ["Мария", "Заказ #42 готов"],
        button_variables: ["Открыть заказ"],
        attachment: { url: "https://example.test/order.pdf", name: "order.pdf" },
      },
      template_options: { priority: "NORMAL", sendDelay: "0", comment: "Тест" },
    });
  });

  it("deletes client note via annotate_client_record with delete_note_id", async () => {
    const result = await callTool("annotate_client_record", {
      delete_note_id: "note-to-delete-123",
      confirm: true,
    });
    expect(result).toMatchObject({
      applied: { note_deleted: true },
      partial_errors: [],
    });
    expect(fakeApi.state.deletedNotes).toContain("note-to-delete-123");
  });

  it("rejects mixed client changes without a client target before deleting a note", async () => {
    const result = await callMcp("tools/call", {
      name: "annotate_client_record",
      arguments: {
        delete_note_id: "note-to-delete-123",
        note: "Срочно перезвонить",
        confirm: true,
      },
    });
    expect(result.isError).toBe(true);
    expect(fakeApi.state.deletedNotes).toHaveLength(0);
    expect(fakeApi.state.notes).toHaveLength(0);
  });

  it("returns session history, session details, and group clients in read_conversation_thread", async () => {
    const result = await callTool("read_conversation_thread", {
      dialog_id: "dialog-open",
      include_sessions: true,
      session_id: "session-hist-1",
      include_group_clients: true,
    });
    expect(result).toMatchObject({
      dialog_id: "dialog-open",
      sessions: [
        expect.objectContaining({
          id: "session-hist-1",
          operator: "Борис",
          status: "closed",
          rate: 5,
        }),
      ],
      session_details: expect.objectContaining({
        id: "session-hist-1",
        rate: 5,
      }) as unknown,
      group_clients: [
        expect.objectContaining({ id: "client-group-1", name: "Участник 1" }),
        expect.objectContaining({ id: "client-group-2", name: "Участник 2" }),
      ],
    });
  });

  it("provides argument completions", async () => {
    const completeResult = (await callMcp("completion/complete", {
      ref: { type: "ref/prompt", name: "triage-inbox" },
      argument: { name: "limit", value: "1" },
    })) as { completion: { values: string[] } };
    expect(completeResult.completion.values).toContain("10");

    const channelComplete = (await callMcp("completion/complete", {
      ref: { type: "ref/prompt", name: "triage-inbox" },
      argument: { name: "channel_id", value: "tele" },
    })) as { completion: { values: string[] } };
    expect(channelComplete.completion.values).toContain("channel-telegram");
  });

  it("manages operator groups: member, channel, supervisor, and visibility mutations with confirmation", async () => {
    // Rejects without confirm
    tokenSequence += 1;
    const noConfirmRes = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "manage_operator_group")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "manage_operator_group",
          arguments: {
            group: "group-support",
            action: "add_member",
            operator: "Борис",
          },
        }),
      );
    expect(mcpResult(noConfirmRes.body).isError).toBe(true);

    // Add member
    const addMember = await callTool("manage_operator_group", {
      group: "Первая линия",
      action: "add_member",
      operator: "Борис",
      confirm: true,
    });
    expect(addMember).toMatchObject({
      success: true,
      action: "add_member",
      operator_id: "operator-boris",
    });
    expect(fakeApi.state.groupMembersAdded).toContainEqual({
      groupId: "group-support",
      operatorId: "operator-boris",
    });

    // Remove member
    const removeMember = await callTool("manage_operator_group", {
      group: "Первая линия",
      action: "remove_member",
      operator: "Борис",
      confirm: true,
    });
    expect(removeMember).toMatchObject({ success: true, action: "remove_member" });
    expect(fakeApi.state.groupMembersRemoved).toContainEqual({
      groupId: "group-support",
      operatorId: "operator-boris",
    });

    // Add channel
    const addChan = await callTool("manage_operator_group", {
      group: "Первая линия",
      action: "add_channel",
      channel: "channel-email",
      confirm: true,
    });
    expect(addChan).toMatchObject({ success: true, action: "add_channel" });
    expect(fakeApi.state.groupChannelsAdded).toContainEqual({
      groupId: "group-support",
      channelId: "channel-email",
    });

    // Set supervisor
    const setSup = await callTool("manage_operator_group", {
      group: "Первая линия",
      action: "set_supervisor",
      operator: "Борис",
      is_supervisor: true,
      confirm: true,
    });
    expect(setSup).toMatchObject({ success: true, action: "set_supervisor", is_supervisor: true });
    expect(fakeApi.state.groupSupervisorsSet).toContainEqual({
      groupId: "group-support",
      operatorId: "operator-boris",
      isSupervisor: 1,
    });

    // Set channel visibility
    const setVis = await callTool("manage_operator_group", {
      group: "Первая линия",
      action: "set_channel_visibility",
      channel: "Telegram Support",
      can_view_other_dialogs: false,
      confirm: true,
    });
    expect(setVis).toMatchObject({
      success: true,
      action: "set_channel_visibility",
      can_view_other_dialogs: false,
    });
    expect(fakeApi.state.groupChannelVisibilitiesSet).toContainEqual({
      groupId: "group-support",
      channelId: "channel-telegram",
      canViewOtherDialogs: 0,
    });
  });

  it("configures project public api webhook and active events", async () => {
    // Rejection without confirm
    tokenSequence += 1;
    const noConfirmRes = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "configure_project_webhook")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "configure_project_webhook",
          arguments: {
            webhook_url: "https://example.com/api/webhook",
            active_events: ["new message", "close dialog"],
          },
        }),
      );
    expect(mcpResult(noConfirmRes.body).isError).toBe(true);

    // Successful update
    const updateResult = await callTool("configure_project_webhook", {
      webhook_url: "https://example.com/api/webhook",
      active_events: ["new message", "close dialog"],
      confirm: true,
    });
    expect(updateResult).toMatchObject({
      success: true,
      webhook_url: "https://example.com/api/webhook",
      active_events: ["new message", "close dialog"],
    });
    expect(fakeApi.state.updatedPublicApi).toContainEqual({
      webhookUrl: "https://example.com/api/webhook",
      activeWebhooks: ["new message", "close dialog"],
    });
  });

  it("creates dialog without message via send_reply_to_client create_dialog_only", async () => {
    const res = await callTool("send_reply_to_client", {
      channel: "Telegram Support",
      client: "+79991234567",
      create_dialog_only: true,
      confirm: true,
    });
    expect(res).toMatchObject({
      accepted: true,
      created_or_found_dialog: true,
      dialog_id: "dialog-new-created",
      dialog_url: "https://demo.teletype.app/dialog/dialog-new-created",
    });
    expect(fakeApi.state.createdDialogs).toContainEqual({
      channelId: "channel-telegram",
      clientPhone: "+79991234567",
      clientEmail: undefined,
      clientUsername: undefined,
    });
  });

  it("previews and creates a dialog by phone only after confirmation", async () => {
    const preview = await callTool("create_dialog_by_phone", {
      channel: "WhatsApp Sales",
      phone: "+79991234567",
      dry_run: true,
    });
    expect(preview).toMatchObject({
      dry_run: true,
      created_or_found: false,
      side_effects_if_confirmed: {
        may_assign_project_owner_to_existing_open_dialog: true,
        sends_message: false,
      },
    });
    expect(fakeApi.state.createdDialogs).toEqual([]);

    const unconfirmed = await callMcp("tools/call", {
      name: "create_dialog_by_phone",
      arguments: { channel: "WhatsApp Sales", phone: "+79991234567" },
    });
    expect(unconfirmed.isError).toBe(true);
    expect(fakeApi.state.createdDialogs).toEqual([]);

    const created = await callTool("create_dialog_by_phone", {
      channel: "WhatsApp Sales",
      phone: "+79991234567",
      confirm: true,
    });
    expect(created).toMatchObject({
      created_or_found: true,
      dialog_id: "dialog-new-created",
      sent_message: false,
      may_have_reassigned_operator: true,
    });
    expect(fakeApi.state.createdDialogs).toEqual([
      expect.objectContaining({ channelId: "channel-whatsapp", clientPhone: "+79991234567" }),
    ]);
    expect(fakeApi.state.sentMessages).toEqual([]);
  });

  it("updates client additional_payload and force_additional_payload in annotate_client_record", async () => {
    const res = await callTool("annotate_client_record", {
      client: "client-ivan",
      additional_payload: { source: "marketing_campaign", utm: "autumn_sale" },
      force_additional_payload: true,
      confirm: true,
    });
    expect(res).toMatchObject({
      applied: {
        identity_updated: expect.objectContaining({
          force_additional_payload: 1,
        }) as unknown,
      },
    });
    expect(fakeApi.state.updatedClients["client-ivan"]).toMatchObject({
      additional_payload: JSON.stringify({ source: "marketing_campaign", utm: "autumn_sale" }),
      force_additional_payload: "1",
    });
  });

  it("fetches template directories and filters channels in list_workspace_metadata", async () => {
    const dirResult = await callTool("list_workspace_metadata", {
      resource: "template_directories",
    });
    expect(dirResult).toMatchObject({
      template_directories: [
        expect.objectContaining({
          id: "dir-support",
          name: "Общие шаблоны",
        }),
      ],
    });

    const chanFiltered = await callTool("list_workspace_metadata", {
      resource: "channels",
      channel_type: "telegram",
      only_active: true,
    });
    expect(chanFiltered).toMatchObject({
      channels: [
        expect.objectContaining({
          id: "channel-telegram",
          type: "telegram",
          active: true,
        }),
      ],
    });
  });

  it("filters find_conversations with channel_type and pagination", async () => {
    const res = await callTool("find_conversations", {
      channel_type: "telegram",
      page: 1,
      limit: 10,
    });
    expect(res).toMatchObject({
      total_returned: expect.any(Number) as unknown,
      dialogs: expect.any(Array) as unknown,
    });
  });

  it("reports capabilities, project identity, policy filtering", async () => {
    const res = await callTool("get_capabilities", {});
    expect(res).toMatchObject({
      read_only: false,
      active_toolsets: ["conversations", "messaging", "admin", "meta"],
      locale: "en",
      local_uploads: false,
    });
    expect(res.project).toEqual({ name: "Demo Support", domain: "demo" });
    const tools = res.tools as { name: string; toolset: string; writes_data: boolean }[];
    expect(tools.find((tool) => tool.name === "find_messages")?.writes_data).toBe(false);
    expect(tools.find((tool) => tool.name === "create_dialog_by_phone")?.writes_data).toBe(true);
    expect(tools.find((tool) => tool.name === "send_reply_to_client")?.writes_data).toBe(true);
    expect(res.disabled_tools).toEqual([]);

    vi.stubEnv("TELETYPE_MCP_READ_ONLY", "true");
    try {
      const readOnly = await callTool("get_capabilities", {});
      expect(readOnly.read_only).toBe(true);
      expect(readOnly.disabled_tools).toContain("send_reply_to_client");
      expect(readOnly.disabled_tools).toContain("resolve_conversation");
      expect(readOnly.notes).toEqual(
        expect.arrayContaining([expect.stringContaining("read-only")]),
      );
    } finally {
      vi.unstubAllEnvs();
    }

    // The only Teletype contact is the cached project identity lookup.
    await callTool("get_capabilities", {});
    const paths = fakeApi.state.calls.map((call) => call.path);
    expect(
      paths.filter((path) => !path.endsWith("/project/details")),
      JSON.stringify(paths),
    ).toEqual([]);
  });

  it("returns tools/list in a stable order with a private cache hint", async () => {
    const first = await callMcp("tools/list");
    const second = await callMcp("tools/list");
    const names = (first.tools as { name: string }[]).map((tool) => tool.name);
    const namesAgain = (second.tools as { name: string }[]).map((tool) => tool.name);
    expect(names).toContain("find_messages");
    expect(names).toEqual(namesAgain);
    expect(first.ttlMs).toBe(60_000);
    expect(first.cacheScope).toBe("private");
  });

  it("marks static listings with a private 5-minute cache hint", async () => {
    for (const method of ["prompts/list", "resources/list", "resources/templates/list"]) {
      const result = await callMcp(method);
      expect(result.ttlMs, method).toBe(300_000);
      expect(result.cacheScope, method).toBe("private");
    }
  });

  it("hints the token setup when the API rejects auth on a read", async () => {
    fakeApi.failNext("/dialogs", 401);
    const res = await callMcp("tools/call", {
      name: "find_conversations",
      arguments: { status: "unanswered" },
    });
    expect(res.isError).toBe(true);
    expect(String(record(res.structuredContent).hint)).toContain("X-Auth-Token");
  });

  it("hints a repeat when a confirmed write hits a server error", async () => {
    fakeApi.failNext("/message/send", 500);
    const res = await callMcp("tools/call", {
      name: "send_reply_to_client",
      arguments: { recipient_dialog_id: "dialog-open", text: "Проверка хинта", confirm: true },
    });
    expect(res.isError).toBe(true);
    expect(String(record(res.structuredContent).hint)).toContain("temporary");
  });

  it("fails a group write closed when the group does not resolve", async () => {
    const res = await callMcp("tools/call", {
      name: "manage_operator_group",
      arguments: {
        action: "add_member",
        group: "Несуществующая группа",
        operator: "Борис",
        confirm: true,
      },
    });
    expect(res.isError).toBe(true);
    expect(fakeApi.state.groupMembersAdded).toHaveLength(0);
  });

  it("lists client candidates when an annotate query is ambiguous", async () => {
    const res = await callMcp("tools/call", {
      name: "annotate_client_record",
      arguments: { client: "ан", add_tags: ["VIP"], confirm: true },
    });
    expect(res.isError).toBe(true);
    const hint = String(record(res.structuredContent).hint);
    expect(hint).toContain("(client-ivan)");
    expect(hint).toContain("(client-anna)");
  });

  it("lists client candidates when a thread query by client is ambiguous", async () => {
    const res = await callMcp("tools/call", {
      name: "read_conversation_thread",
      arguments: { client: "ан" },
    });
    expect(res.isError).toBe(true);
    const hint = String(record(res.structuredContent).hint);
    expect(hint).toContain("(client-ivan)");
  });

  it("splits a category miss from an ambiguous category", async () => {
    const miss = await callMcp("tools/call", {
      name: "find_conversations",
      arguments: { category: "Такой категории нет" },
    });
    expect(miss.isError).toBe(true);
    expect(String(record(miss.structuredContent).error)).toContain("not found");

    const ambiguous = await callMcp("tools/call", {
      name: "find_conversations",
      arguments: { category: "о" },
    });
    expect(ambiguous.isError).toBe(true);
    const hint = String(record(ambiguous.structuredContent).hint);
    expect(hint).toContain("Поддержка");
    expect(hint).toContain("Решено");
  });

  it("previews a reply with dry_run without sending anything", async () => {
    const res = await callTool("send_reply_to_client", {
      recipient_dialog_id: "dialog-open",
      text: "Передаём в доставку",
      dry_run: true,
    });
    expect(res).toMatchObject({
      dry_run: true,
      accepted: false,
      delivery_confirmed: false,
      message_ids: [],
      action: "reply_to_existing_dialog",
      target: expect.objectContaining({
        dialog_id: "dialog-open",
        client_name: "Иван Петров",
        channel_name: "Telegram Support",
        assigned_operator: "Анна",
      }) as unknown,
      message: expect.objectContaining({ text: "Передаём в доставку" }) as unknown,
      side_effects: { sends_message: true, marks_dialog_answered: true },
    });
    expect(fakeApi.state.sentMessages).toHaveLength(0);
  });

  it("previews template rendering in dry_run without confirm", async () => {
    const res = await callTool("send_reply_to_client", {
      recipient_dialog_id: "dialog-open",
      template_name: "Доставка",
      template_variables: { name: "Иван" },
      dry_run: true,
    });
    expect(res).toMatchObject({
      dry_run: true,
      message: expect.objectContaining({
        template_name: "Доставка",
        text: "Здравствуйте, Иван!",
      }) as unknown,
    });
  });

  it("keeps dollar replacement syntax literal in template variables", async () => {
    const res = await callTool("send_reply_to_client", {
      recipient_dialog_id: "dialog-open",
      template_name: "Доставка",
      template_variables: { name: "$&" },
      dry_run: true,
    });
    expect(res.message).toMatchObject({ text: "Здравствуйте, $&!" });
  });

  it("rejects send_reply_to_client without confirm when dry_run is absent", async () => {
    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "send_reply_to_client")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "send_reply_to_client",
          arguments: { recipient_dialog_id: "dialog-open", text: "привет" },
        }),
      );
    const result = mcpResult(response.body);
    expect(result.isError).toBe(true);
    expect(fakeApi.state.sentMessages).toHaveLength(0);
  });

  it("previews a WhatsApp template send without contacting the send endpoint", async () => {
    const res = await callTool("send_whatsapp_template", {
      channel_id: "channel-whatsapp",
      dialog_id: "dialog-whatsapp",
      template_id: "waba-template-1",
      template_params: { code: "1234" },
      dry_run: true,
    });
    expect(res).toMatchObject({
      dry_run: true,
      accepted: false,
      delivery_confirmed: false,
      channel_id: "channel-whatsapp",
      dialog_id: "dialog-whatsapp",
      template_id: "waba-template-1",
    });
    const templateSends = fakeApi.state.calls.filter((call) =>
      call.path.startsWith("/whatsapp-edna/send-template"),
    );
    expect(templateSends).toHaveLength(0);
  });

  it("keeps searching when only some tags resolve and reports a notice", async () => {
    const res = await callTool("find_conversations", {
      status: "all",
      tags: ["VIP", "НеСуществует"],
    });
    expect(res.notices).toEqual([expect.stringContaining("НеСуществует")]);
    expect(Array.isArray(res.dialogs)).toBe(true);
  });

  it("fails find_conversations when no tags resolve", async () => {
    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "find_conversations")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "find_conversations",
          arguments: { status: "all", tags: ["НеСуществует"] },
        }),
      );
    const result = mcpResult(response.body);
    expect(result.isError).toBe(true);
  });

  it("exposes has_more and next_page_hint on find_conversations", async () => {
    const single = await callTool("find_conversations", { status: "all", limit: 1 });
    expect(single.has_more).toBe(true);
    expect(single.next_page_hint).toEqual(expect.stringContaining("page=2"));

    const all = await callTool("find_conversations", { status: "all", limit: 50 });
    expect(all.has_more).toBe(false);
    expect(all.next_page_hint).toBeNull();
  });

  it("echoes defaults_applied only when the caller omitted them", async () => {
    const bare = await callTool("find_conversations", {});
    expect(bare.defaults_applied).toEqual({ status: "open", limit: 20 });

    const explicit = await callTool("find_conversations", { status: "all", limit: 5 });
    expect(explicit.defaults_applied).toBeUndefined();
  });

  it("keeps structuredContent stable across response_format values and rejects unknown ones", async () => {
    const concise = await callTool("find_conversations", {});
    const detailed = await callTool("find_conversations", { response_format: "detailed" });
    expect(detailed).toEqual(concise);

    tokenSequence += 1;
    const response = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("X-Teletype-Api-Token", `integration-${tokenSequence}`)
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", "tools/call")
      .set("Mcp-Name", "find_conversations")
      .send(
        modernRpc(tokenSequence, "tools/call", {
          name: "find_conversations",
          arguments: { response_format: "verbose" },
        }),
      );
    expect(mcpResult(response.body).isError).toBe(true);
  });

  it("blocks mark_seen in read-only mode while still reading the thread", async () => {
    vi.stubEnv("TELETYPE_MCP_READ_ONLY", "true");
    try {
      const res = await callTool("read_conversation_thread", {
        dialog_id: "dialog-open",
        mark_seen: true,
        confirm: true,
      });
      expect(res.messages).toBeDefined();
      expect(res.marked_seen).toBe(false);
      expect(res.notices).toEqual([expect.stringContaining("read-only")]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("marks conversations as seen outside read-only mode", async () => {
    const res = await callTool("read_conversation_thread", {
      dialog_id: "dialog-open",
      mark_seen: true,
      confirm: true,
    });
    expect(res.marked_seen).toBe(true);
    expect(res.notices).toBeUndefined();
  });
});
