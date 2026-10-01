import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const token = process.env.TELETYPE_API_TOKEN?.trim();
const endpoint = process.env.TELETYPE_MCP_URL ?? "https://mcp.teletype.app/mcp";

if (!token) {
  console.error("Set TELETYPE_API_TOKEN to a Public API token before running hosted:smoke.");
  process.exit(1);
}

const url = new URL(endpoint);
if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
  console.error("Use HTTPS for a remote MCP endpoint.");
  process.exit(1);
}

for (const versionNegotiation of [{ mode: "legacy" }, { mode: { pin: "2026-07-28" } }]) {
  const client = new Client(
    { name: "teletype-hosted-smoke", version: "1.0.0" },
    { versionNegotiation },
  );
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { "X-Teletype-Api-Token": token } },
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    if (!listed.tools.some(({ name }) => name === "find_conversations")) {
      throw new Error("The MCP endpoint did not expose Teletype tools.");
    }
    const result = await client.callTool({
      name: "list_workspace_metadata",
      arguments: { resource: "channels" },
    });
    if (result.isError) {
      throw new Error("The Public API token could not read Teletype workspace metadata.");
    }
    console.log(
      `Hosted MCP and Public API read: OK (${listed.tools.length} tools, ${client.getNegotiatedProtocolVersion()})`,
    );
  } finally {
    await client.close();
  }
}
