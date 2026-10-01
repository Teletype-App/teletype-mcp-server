import request from "supertest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Server as HttpServer } from "node:http";
import type { Express } from "express";
import type { Config } from "./config.js";
import { createHttpApp } from "./http.js";
import { TOOL_REGISTRY } from "./tools.js";

const config: Config = {
  transport: "http",
  port: 4311,
  host: "127.0.0.1",
  publicBaseUrl: "http://127.0.0.1:4311",
  allowedOrigins: ["http://127.0.0.1:4311", "https://agent.example"],
  apiBase: "https://api.teletype.app/public/api/v1",
  projectUrl: "teletype.app",
  requestTimeoutMs: 15_000,
  maxResponseBytes: 5_000_000,
  maxUploadBytes: 20_000_000,
  maxConcurrentRequests: 32,
  maxConcurrentPerToken: 4,
  enableLocalUploads: false,
  allowedFileRoots: [],
  logLevel: "info",
  readOnly: false,
  toolsets: null,
};

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
  },
};

function modernRpc(id: number, method: string, params: Record<string, unknown> = {}) {
  return {
    jsonrpc: "2.0",
    id,
    method,
    params: {
      ...params,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": { name: "test", version: "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {},
      },
    },
  };
}

function postMcp(app: Express, token: string, method: string, name?: string) {
  const call = request(app)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("X-Teletype-Api-Token", token)
    .set("MCP-Protocol-Version", "2026-07-28")
    .set("Mcp-Method", method);
  if (name) call.set("Mcp-Name", name);
  return call;
}

describe("HTTP transport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not accept a Public API token through Authorization", async () => {
    const response = await request(createHttpApp(config))
      .post("/mcp")
      .set("Authorization", "Bearer wrong-audience-token")
      .send(modernRpc(1, "server/discover"));
    expect(response.status).toBe(401);
  });

  it("rejects an untrusted Origin", async () => {
    const response = await postMcp(createHttpApp(config), "token", "server/discover")
      .set("Origin", "https://evil.example")
      .send(modernRpc(1, "server/discover"));
    expect(response.status).toBe(403);
  });

  it("returns 405 for unsupported MCP methods", async () => {
    const response = await request(createHttpApp(config)).get("/mcp");
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe("POST");
  });

  it("accepts the 2025 initialize handshake", async () => {
    const response = await request(createHttpApp(config))
      .post("/mcp")
      .set("X-Teletype-Api-Token", "tenant")
      .set("Accept", "application/json, text/event-stream")
      .send(initialize);
    expect(response.status).toBe(200);
  });

  it("handles concurrent stateless requests independently", async () => {
    const app = createHttpApp(config);
    const responses = await Promise.all([
      postMcp(app, "tenant-a", "server/discover").send(modernRpc(1, "server/discover")),
      postMcp(app, "tenant-b", "server/discover").send(modernRpc(2, "server/discover")),
    ]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    const first = responses[0].body as {
      result: { supportedVersions: string[]; instructions: string };
    };
    const second = responses[1].body as { result: { supportedVersions: string[] } };
    expect(first.result.supportedVersions).toContain("2026-07-28");
    expect(second.result.supportedVersions).toContain("2026-07-28");
    expect(first.result.instructions).toContain("Teletype");
  });

  it("keeps upstream credentials isolated during concurrent tool calls", async () => {
    const upstreamTokens: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        upstreamTokens.push(String((init.headers as Record<string, string>)["X-Auth-Token"]));
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Response(JSON.stringify({ success: true, data: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    const call = modernRpc(3, "tools/call", {
      name: "list_workspace_metadata",
      arguments: { resource: "tags" },
    });
    const app = createHttpApp(config);
    const responses = await Promise.all(
      ["tenant-one", "tenant-two"].map((token) =>
        postMcp(app, token, "tools/call", "list_workspace_metadata").send(call),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(
      responses.map(({ body }) => (body as { result: { isError?: boolean } }).result.isError),
    ).toEqual([undefined, undefined]);
    expect(upstreamTokens.sort()).toEqual(["tenant-one", "tenant-two"]);
  });

  it("validates tool arguments before executing a write", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await postMcp(
      createHttpApp(config),
      "tenant",
      "tools/call",
      "send_reply_to_client",
    ).send(
      modernRpc(4, "tools/call", {
        name: "send_reply_to_client",
        arguments: { recipient_dialog_id: "dialog", text: "hello" },
      }),
    );
    expect(response.status).toBe(200);
    expect((response.body as { result: { isError: boolean } }).result.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not expose the server filesystem to HTTP tools", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await postMcp(
      createHttpApp(config),
      "tenant",
      "tools/call",
      "send_reply_to_client",
    ).send(
      modernRpc(5, "tools/call", {
        name: "send_reply_to_client",
        arguments: {
          recipient_dialog_id: "dialog",
          attachment_path: "/etc/passwd",
          confirm: true,
        },
      }),
    );
    expect(response.status).toBe(200);
    const result = (response.body as { result: { isError: boolean; content: { text: string }[] } })
      .result;
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("attachment_path is disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publishes safety annotations and the nullable webhook result schema", async () => {
    const response = await postMcp(createHttpApp(config), "tenant", "tools/list").send(
      modernRpc(6, "tools/list"),
    );
    expect(response.status).toBe(200);
    const tools = (
      response.body as {
        result: {
          tools: {
            name: string;
            annotations: { readOnlyHint: boolean; destructiveHint: boolean };
            outputSchema?: { properties?: { webhook_url?: unknown } };
          }[];
        };
      }
    ).result.tools;
    expect(
      tools.find(({ name }) => name === "read_conversation_thread")?.annotations,
    ).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });
    expect(tools.find(({ name }) => name === "send_reply_to_client")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: true,
    });
    expect(
      tools.find(({ name }) => name === "configure_project_webhook")?.outputSchema?.properties
        ?.webhook_url,
    ).toEqual({ anyOf: [{ type: "string" }, { type: "null" }] });
  });

  it.each([
    ["2025-11-25", "legacy"],
    ["2026-07-28", "modern"],
  ] as const)("serves the %s protocol with the SDK client", async (version, era) => {
    const listener: HttpServer = await new Promise((resolve) => {
      const server = createHttpApp(config).listen(0, "127.0.0.1", () => {
        resolve(server);
      });
    });
    const address = listener.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
    const client = new Client(
      { name: "compatibility-test", version: "1.0.0" },
      {
        versionNegotiation: era === "legacy" ? { mode: "legacy" } : { mode: { pin: version } },
      },
    );
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
      { requestInit: { headers: { "X-Teletype-Api-Token": "test-token" } } },
    );
    const entry = TOOL_REGISTRY.find((tool) => tool.name === "find_conversations");
    if (!entry) throw new Error("find_conversations is missing");
    const original = entry.handler;
    entry.handler = () =>
      Promise.resolve({
        content: [{ type: "text" as const, text: "No conversations" }],
        structuredContent: { total_returned: 0, search_truncated: false, dialogs: [] },
      });
    try {
      await client.connect(transport);
      expect(client.getProtocolEra()).toBe(era);
      expect(client.getNegotiatedProtocolVersion()).toBe(version);
      const listed = await client.listTools();
      expect(listed.tools.some((tool) => tool.name === "find_conversations")).toBe(true);
      const result = await client.callTool({ name: "find_conversations", arguments: {} });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({ total_returned: 0, dialogs: [] });
    } finally {
      entry.handler = original;
      await client.close();
      await new Promise<void>((resolve, reject) => {
        listener.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("rejects a successful tool response that violates its output schema", async () => {
    const entry = TOOL_REGISTRY.find((tool) => tool.name === "find_conversations");
    if (!entry) throw new Error("find_conversations is missing");
    const original = entry.handler;
    entry.handler = () =>
      Promise.resolve({
        content: [{ type: "text" as const, text: "bad response" }],
        structuredContent: { dialogs: "invalid" },
      });
    try {
      const response = await postMcp(
        createHttpApp(config),
        "tenant",
        "tools/call",
        "find_conversations",
      ).send(modernRpc(7, "tools/call", { name: "find_conversations", arguments: {} }));
      expect(response.status).toBe(200);
      const result = (
        response.body as { result: { isError?: boolean; content: { text: string }[] } }
      ).result;
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("does not match the declared schema");
      expect(result.content[0]?.text).not.toContain("bad response");
    } finally {
      entry.handler = original;
    }
  });

  it("responds to /healthz, /health, and /live health endpoints", async () => {
    const app = createHttpApp(config);
    for (const path of ["/healthz", "/health", "/live"]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        service: "teletype-mcp-server",
        version: "0.1.0",
      });
    }
  });
});
