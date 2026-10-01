import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { buildServer } from "./server.js";
import type { ToolPolicy } from "./tool-policy.js";
import { TOOL_DEFINITIONS } from "./tools.js";

describe("buildServer tool policy filtering", () => {
  async function listTools(policy?: ToolPolicy) {
    const server = buildServer({ policy });
    const client = new Client({ name: "policy-test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(clientTransport), client.connect(serverTransport)]);
    try {
      return await client.listTools();
    } finally {
      await Promise.all([client.close(), server.close()]);
    }
  }

  it("registers every tool when no policy is set", async () => {
    const tools = await listTools();
    expect(tools.tools).toHaveLength(TOOL_DEFINITIONS.length);
    expect(tools.tools.map((tool) => tool.name).sort()).toContain("get_capabilities");
  });

  it("exposes read tools only in read-only mode, even over toolset requests", async () => {
    const tools = await listTools({ readOnly: true, toolsets: null });
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "find_conversations",
      "find_messages",
      "get_capabilities",
      "get_project_status",
      "list_clients",
      "list_workspace_metadata",
      "lookup_client_profile",
      "read_client_history",
      "read_conversation_thread",
    ]);
  });

  it("restricts registration to the requested toolsets but keeps meta", async () => {
    const tools = await listTools({ readOnly: false, toolsets: ["messaging"] });
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "annotate_client_record",
      "create_dialog_by_phone",
      "get_capabilities",
      "manage_sent_message",
      "send_reply_to_client",
      "send_whatsapp_template",
    ]);
  });

  it("advertises human titles and read-only annotations", async () => {
    const tools = await listTools();
    const find = tools.tools.find((tool) => tool.name === "find_conversations");
    expect(find?.title).toBe("Find conversations");
    expect(find?.annotations?.readOnlyHint).toBe(true);
    expect(find?.annotations?.destructiveHint).toBe(false);
    const reply = tools.tools.find((tool) => tool.name === "send_reply_to_client");
    expect(reply?.title).toBe("Send reply to client");
    expect(reply?.annotations?.readOnlyHint).toBe(false);
    expect(reply?.annotations?.destructiveHint).toBe(true);
  });
});
