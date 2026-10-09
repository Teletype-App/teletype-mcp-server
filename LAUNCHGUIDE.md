# Teletype MCP

## Tagline

Connect AI assistants to Teletype customer conversations and support workflows.

## Description

Teletype MCP connects MCP clients to a Teletype customer support project through its Public API. It provides tools for finding conversations, reading messages and customer profiles, drafting and sending replies, and managing workspace data. Use the hosted Streamable HTTP endpoint or run the MIT-licensed server locally over stdio. Access to a Teletype project and its Public API token is required. Teletype account terms and pricing apply separately.

## Setup Requirements

- `TELETYPE_API_TOKEN` (required for stdio): the project's Public API token from Teletype project settings. Keep it in the client's private environment or credential settings. Product and support: https://teletype.app and https://help.teletype.app.
- Hosted endpoint: `https://mcp.teletype.app/mcp` over Streamable HTTP. Send the token in `X-Teletype-Api-Token` on each request. OAuth is disabled on the public hosted endpoint.
- Local runtime: Node.js 20.19+, 22.13+, or 24.x. Run `npx -y teletype-mcp-server --stdio`.
- `TELETYPE_MCP_READ_ONLY` (optional): set to `true` to disable write tools. Local uploads are disabled by default.

## Category

Communication

## Features

- Find conversations by status, channel, and customer.
- Read conversation messages and customer profiles.
- Draft replies with the supplied MCP prompts.
- Send replies and manage conversations when write tools are enabled.
- Inspect channels, templates, operators, and other workspace metadata.
- Triage unanswered conversations and prepare customer summaries.
- Use a read-only configuration for workflows that should not change project data.
- Connect through hosted HTTP, local stdio, a Docker stdio image, or a Claude Desktop bundle.

## Getting Started

- "Find the unanswered conversations in my Teletype project and summarize which need attention first. Do not change anything."
- "Read this customer's conversation and draft a reply for my review."
- Tool: `find_conversations`, find dialogs with filters instead of loading unrelated data.
- Tool: `list_workspace_metadata`, list channels, response templates, and other project settings.
- Tool: `get_project_status`, inspect project status and technical health.

## Tags

mcp, teletype, customer-support, messaging, conversations, helpdesk, claude, cursor

## Documentation URL

https://github.com/Teletype-App/teletype-mcp-server#readme

## Health Check URL

https://mcp.teletype.app/healthz
