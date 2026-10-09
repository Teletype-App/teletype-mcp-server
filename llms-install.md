# Install Teletype MCP

Teletype MCP gives AI clients tools for customer conversations, profiles, replies, and workspace settings. A Teletype project Public API token is required. The public hosted endpoint has OAuth disabled.

## Hosted connection

Use Streamable HTTP at `https://mcp.teletype.app/mcp` with the secret header `X-Teletype-Api-Token`. Ask the user to configure their token in their client's private credential settings. Follow the [client-specific examples](docs/CLIENTS.md), including the different variable syntax used by each client.

## Local connection

Use Node.js 20.19+, 22.13+, or 24.x. Launch `npx -y teletype-mcp-server --stdio` with `TELETYPE_API_TOKEN` set in the server's private environment. Add `--read-only` to disable writes. For Claude Desktop, use the `.mcpb` asset from a [published release](https://github.com/Teletype-App/teletype-mcp-server/releases) when available and enter the token in its configuration dialog.

## Plugin

See [plugin/README.md](plugin/README.md) for Claude Code and Cursor configuration, and [README.md](README.md#plugins-for-claude-code-codex-and-cursor) for Codex.

Check the connection by listing tools. Start with a read task. Obtain the user's approval before writes, use `dry_run` where supported, and never add a token to a repository or a public directory listing.
