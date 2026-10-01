English | [Русский](README-ru.md)

# Teletype MCP Server

[![CI](https://github.com/Teletype-App/teletype-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Teletype-App/teletype-mcp-server/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/teletype-mcp-server.svg)](https://www.npmjs.com/package/teletype-mcp-server) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![MCP](https://img.shields.io/badge/MCP-Protocol-blue.svg)](https://modelcontextprotocol.io)

[Architecture](docs/ARCHITECTURE.md) | [MCP clients](docs/CLIENTS.md) | [Tools reference](docs/TOOLS.md)

MCP server for [Teletype](https://teletype.app). Its tools cover daily support work: finding and reading conversations, looking up customer profiles, sending replies, adding internal context, and checking project status.

## Quick start

**Hosted server (recommended).** Teletype runs the MCP server at `https://mcp.teletype.app/mcp`. Connect with your project's Public API token. No local installation is needed. In Claude Code:

```bash
claude mcp add --transport http teletype https://mcp.teletype.app/mcp \
  --header "X-Teletype-Api-Token: your-teletype-public-api-token"
```

or merge [this file](examples/clients/claude-code-remote.json) into `.mcp.json` (Claude Code expands `${TELETYPE_API_TOKEN}` from the environment):

```json
{
  "mcpServers": {
    "teletype": {
      "type": "http",
      "url": "https://mcp.teletype.app/mcp",
      "headers": { "X-Teletype-Api-Token": "${TELETYPE_API_TOKEN}" }
    }
  }
}
```

For Claude Code and Codex, plugins install the server and the `teletype-support` skill in one step. See [Plugins for Claude Code and Codex](#plugins-for-claude-code-and-codex).

**Run locally.** Claude Desktop users on macOS or Windows can download the `.mcpb` file from the project's [releases](https://github.com/Teletype-App/teletype-mcp-server/releases), open it, and enter their Teletype Public API token when prompted. To run from source, use `npm ci && npm run build`, then point an MCP client at `node /absolute/path/to/dist/index.js --stdio` with `TELETYPE_API_TOKEN` in its environment.

For other clients, use Node.js 20.19+, 22.13+, or 24.x and a Teletype Public API token. You can also add this server to Claude Desktop's `claude_desktop_config.json` manually:

```json
{
  "mcpServers": {
    "teletype": {
      "command": "npx",
      "args": ["-y", "teletype-mcp-server", "--stdio"],
      "env": { "TELETYPE_API_TOKEN": "your-teletype-public-api-token" }
    }
  }
}
```

Restart the client and ask it to list Teletype tools. The server supports the 2025 `initialize` handshake and MCP 2026-07-28. You can check local setup without contacting Teletype:

```bash
TELETYPE_API_TOKEN=your-token npx -y teletype-mcp-server doctor --stdio
```

For Cursor, Zed, and other MCP clients, use the same command, arguments, and environment variable.

For Cursor, VS Code with Copilot, Codex, Claude Code, OpenCode, Antigravity CLI, and other supported clients, see [MCP clients](docs/CLIENTS.md). The examples cover hosted HTTP and local stdio connections. A separate OpenAI-compatible endpoint is optional and only used by `eval:model`.

For Claude Code and Codex there are plugins that install the server, the `teletype-support` skill, and support slash commands in one step. See [Plugins for Claude Code and Codex](#plugins-for-claude-code-and-codex).

## Tools

The 17 tools are grouped into toolsets: `conversations`, `messaging`, `admin`, and `meta`. You can register all of them (default), restrict the server to selected toolsets with `--toolsets`, or run it read-only with `--read-only`. The [tools reference](docs/TOOLS.md) documents every parameter.

- `find_conversations`: find conversations by status, channel, channel type (`channel_type`), customer, tag, operator, category, search query, and pagination (`page`).
- `list_clients`: list clients with pagination or find clients by phone without changing data.
- `find_messages`: list project messages or inspect older message text page by page. Continue while `has_more` is true.
- `lookup_client_profile`: return a customer profile with custom fields, notes, and recent conversations.
- `read_conversation_thread`: read messages and links without changing data by default. `mark_seen: true` marks the conversation as read and requires `confirm: true`. `include_sessions: true` adds session history, `session_id` selects session details, and `include_group_clients: true` adds group chat participants.
- `read_client_history`: read a customer's recent conversations in one call, up to five dialogs with a slice of messages each (`dialogs_limit`, `messages_per_dialog`). Use it to gather context across several dialogs before replying.
- `send_reply_to_client`: reply to an existing conversation, start a new one via `/channel/send-message` (supports `auto_close: true`), or create a conversation without messages via `/dialog/create` (`create_dialog_only: true`).
- `create_dialog_by_phone`: create or find a dialog by phone without sending a message. An existing open dialog may be assigned to the project owner. Requires `confirm: true` and supports `dry_run`.
- `send_whatsapp_template`: send an approved WABA template to an existing WhatsApp Edna conversation outside the 24h window. The template ID comes from the project's imported WABA templates, not the quick-reply list.
- `manage_sent_message`: edit text, delete, or resend an operator message.
- `annotate_client_record`: update customer identity (`name`, `phone`, `email`, `additional_payload`, `force_additional_payload`), tags, notes, delete notes (`delete_note_id`), custom fields, or dialog category.
- `resolve_conversation`: close a conversation, reassign it to an operator (or auto-assign via `assign_operator: "auto"`), keep dialog open (`close: false`), or mark open dialogs as answered (`mark_answered: true`) or unanswered (`mark_unanswered: true`).
- `list_workspace_metadata`: list channels (with `channel_type` and `only_active` filters), tags, categories, templates, template folders (`template_directories`), operator groups, and operators.
- `get_project_status`: return billing, operator availability, and technical status of the Teletype project.
- `manage_operator_group`: add/remove group members (`add_member`, `remove_member`), add/remove group channels (`add_channel`, `remove_channel`), set the supervisor role (`set_supervisor`), and configure channel conversation visibility (`set_channel_visibility`).
- `configure_project_webhook`: set the target webhook URL and the enabled active events through `/project/update-public-api`.
- `get_capabilities`: return the server's active tool map (project name and domain, read-only mode, active toolsets, registered tools). Always available.

For unanswered work, use `find_conversations` with `status: "unanswered"`. For a channel inventory, use `list_workspace_metadata` with `resource: "channels"`. For channel and Public API health, use `get_project_status` with `aspect: "technical"`. These filters avoid unrelated data and limited `all` lists. When closing a conversation, omit `category` unless the user requested one. If they did, fetch its exact name from `resource: "categories"` first. An unknown category stops the call before any changes.

Tools that change data require `confirm: true`. The flag reduces accidental calls. The MCP client must still handle authorization and user consent. `send_reply_to_client` and `send_whatsapp_template` accept `dry_run: true` to preview the target and message without sending. `create_dialog_by_phone` accepts `dry_run: true` to preview the target and possible side effects without creating or assigning a dialog. A dry run does not require `confirm`.

Each tool publishes an `outputSchema`. The short `content` text gives the main result and links. The full result is in `structuredContent`, which the server checks against the schema. Partial writes return an error with the applied actions and failures. Check the remote state before retrying a write after a timeout, cancellation, or schema error.

The Public API response decoders accept additional fields. They check the response fields used for reads, writes, and status reporting. An unusable required field produces a tool error without stopping the MCP server.

## Prompts

The server provides these support prompts:

- `triage-inbox`: triage unanswered incoming dialogues by urgency and priority.
- `draft-reply`: draft a customer response grounded in conversation history and tone.
- `client-summary`: summarize customer profile, past issues, and open topics.
- `escalate-issue`: generate a structured escalation packet for engineering or senior support.
- `shift-handover`: support shift handover report covering the backlog queue, channel health, and team availability.

## Resources & Templates

### Static Resources

- `teletype://project/status`: current project status, channel status, and balance.
- `teletype://workspace/metadata`: workspace channels, operators, groups, tags, and categories.
- `teletype://dialogs/unanswered`: current queue of unanswered customer dialogues with direct links.

### Resource Templates

- `teletype://dialogs/{dialogId}`: full message history for a specific dialogue by ID.
- `teletype://clients/{clientId}`: client profile, tags, and notes by client ID.

## Plugins for Claude Code and Codex

The repository is a plugin marketplace for both clients, and one `plugin/` directory serves both formats: `.claude-plugin/plugin.json` plus `commands/` for Claude Code, the portable [Agent Plugins](https://agent-plugins.org) manifests `plugin.json` and `mcp.json` for Codex, and the shared [skills/teletype-support](plugin/skills/teletype-support/SKILL.md).

### Claude Code

The plugin bundles the hosted MCP server (`https://mcp.teletype.app/mcp`, authenticated with the `X-Teletype-Api-Token` header expanded from `TELETYPE_API_TOKEN`), the `teletype-support` skill with the support workflows and safety rules, and five slash commands that mirror the server's MCP prompts: `/triage-inbox`, `/draft-reply`, `/client-summary`, `/escalate-issue`, `/shift-handover`.

```bash
/plugin marketplace add Teletype-App/teletype-mcp-server
/plugin install teletype@teletype-mcp-server
```

Export `TELETYPE_API_TOKEN` in the shell before starting Claude Code. The bundled server inherits it from the client process. The skill carries the multi-step regulations that do not fit tool descriptions: triage order, dry-run before an ambiguous send, category lookup before closing. It triggers on support tasks without a slash command. The five workflows also exist as MCP prompts for clients that show them. The commands cover the sessions where they are not shown.

### Codex

Export `TELETYPE_API_TOKEN` in the shell before starting Codex. The bundled stdio server inherits it from the Codex process.

```bash
codex plugin marketplace add Teletype-App/teletype-mcp-server
```

Then run `/plugins` in Codex, install `teletype`, and start a new session. The plugin adds the skill and the local stdio server (the Agent Plugins spec does not allow variable expansion in HTTP headers, so a per-user token cannot ship inside the plugin). To connect Codex to the hosted endpoint instead, add it to `~/.codex/config.toml`:

```toml
[mcp_servers.teletype]
url = "https://mcp.teletype.app/mcp"
env_http_headers = { "X-Teletype-Api-Token" = "TELETYPE_API_TOKEN" }
```

Codex also reads skills without plugins from `.agents/skills` in the repository or `~/.agents/skills` for the user.

### Other agents

The skill uses the open [Agent Skills](https://agentskills.io) format, supported by OpenCode, Cursor, Gemini CLI, GitHub Copilot, Goose, and others. The npm package ships the skill, so after a regular install:

```bash
mkdir -p ~/.agents/skills
cp -r node_modules/teletype-mcp-server/plugin/skills/teletype-support ~/.agents/skills/
```

## CLI Usage

The server accepts CLI flags and environment variables:

```bash
teletype-mcp-server --help
# Options:
#   -s, --stdio       Use stdio transport
#   --http            Use Streamable HTTP transport (default)
#   -p, --port <num>  Port for HTTP transport (default: 4311)
#   --host <ip>       Host for HTTP transport (default: 127.0.0.1)
#   -v, --version     Show version
#   -h, --help        Show help
```

`--read-only` and `--toolsets <names>` (comma-separated `conversations,messaging,admin,meta`) filter which tools the server registers before any client connects. `get_capabilities` always stays registered and reports the active map.

## Requirements and local installation

- Node.js 20.19+, 22.13+, or 24.x for the packaged CLI.
- a Teletype Public API token from the project settings.

The same Node.js versions support the local `npm start`, `npm run dev`, and `npm run eval:model` scripts.

```bash
npm ci
npm run build
cp .env.example .env
```

## stdio transport

Use stdio for a local personal MCP client. The process reads the token from its environment. File uploads through `attachment_path` are disabled by default. To enable them, set `ENABLE_LOCAL_UPLOADS=true` and list the permitted directories in `TELETYPE_ALLOWED_FILE_ROOTS`. Use directories that other local users cannot write to.

Local build configuration:

```json
{
  "mcpServers": {
    "teletype": {
      "command": "node",
      "args": ["/absolute/path/to/teletype-mcp-server/dist/index.js", "--stdio"],
      "env": { "TELETYPE_API_TOKEN": "..." }
    }
  }
}
```

Run it locally:

```bash
TRANSPORT=stdio TELETYPE_API_TOKEN=... npm start
```

## Streamable HTTP transport

The hosted service at `https://mcp.teletype.app` uses this endpoint. The configuration below is for self-hosting.

The `/mcp` endpoint and stdio transport support both the 2025 `initialize` handshake and MCP 2026-07-28 `server/discover`. Both use the same tool definitions.

Endpoint: `POST /mcp`. Send the Teletype API token with every request in this header:

```http
X-Teletype-Api-Token: <token>
```

Do not send the Teletype token in `Authorization`. The HTTP transport uses `X-Teletype-Api-Token` as its only project credential and has no separate user accounts or scopes. Use HTTPS for remote access. Anyone with the token can access the project through the MCP server.

```bash
TRANSPORT=http HOST=127.0.0.1 PORT=4311 npm start
```

HTTP endpoints:

| Method | Path       | Purpose                       |
| ------ | ---------- | ----------------------------- |
| POST   | `/mcp`     | stateless Streamable HTTP MCP |
| GET    | `/healthz` | health probe                  |

Each HTTP request gets its own MCP Server and transport pair, so concurrent tenants do not share responses or context. The server limits concurrent requests globally and per token. It returns `429` with `Retry-After` when a limit is reached. The HTTP transport cannot read local files.

## Docker

The image runs as an unprivileged user and listens on port `4311` by default:

```bash
docker build -t teletype-mcp-server .
docker run --rm -p 127.0.0.1:4311:4311 \
  -e PUBLIC_BASE_URL=http://127.0.0.1:4311 \
  teletype-mcp-server
```

For a public domain, set its origin in `PUBLIC_BASE_URL` and terminate HTTPS at the reverse proxy.

## Configuration

| Variable                      | Default                                  |
| ----------------------------- | ---------------------------------------- |
| `TRANSPORT`                   | `http`                                   |
| `HOST` / `PORT`               | `127.0.0.1` / `4311`                     |
| `PUBLIC_BASE_URL`             | `http://127.0.0.1:4311`                  |
| `ALLOWED_ORIGINS`             | additional comma-separated origins       |
| `TELETYPE_API_TOKEN`          | required for stdio                       |
| `TELETYPE_API_BASE`           | `https://api.teletype.app/public/api/v1` |
| `TELETYPE_PROJECT_URL`        | `teletype.app`                           |
| `TELETYPE_MCP_LOCALE`         | `en` (`ru` for Russian text)             |
| `TELETYPE_MCP_READ_ONLY`      | `true` unregisters write tools           |
| `TELETYPE_MCP_TOOLSETS`       | comma-separated toolsets to register     |
| `REQUEST_TIMEOUT_MS`          | `15000`                                  |
| `MAX_RESPONSE_BYTES`          | `5000000`                                |
| `MAX_UPLOAD_BYTES`            | `20000000`                               |
| `MAX_CONCURRENT_REQUESTS`     | `32`                                     |
| `MAX_CONCURRENT_PER_TOKEN`    | `4`                                      |
| `ENABLE_LOCAL_UPLOADS`        | `false`                                  |
| `TELETYPE_ALLOWED_FILE_ROOTS` | comma-separated permitted directories    |

`PUBLIC_BASE_URL` and each entry in `ALLOWED_ORIGINS` must be an origin without a path, query, or fragment. The server validates the value whenever a client sends an `Origin` header.

`TELETYPE_MCP_LOCALE` sets the language of MCP instructions, tool descriptions, prompts, hints, and server-generated errors. It applies to the whole server process, including all HTTP clients. Set it to `ru` in the MCP server environment for Russian text. Tool names, argument names, and `structuredContent` fields stay the same. Customer data and error details from Teletype keep their original language. The server does not infer the locale from the host OS or API token.

## Troubleshooting

- Client cannot connect: run `doctor --stdio` with your token, then check the client transport settings.
- `stdio transport requires TELETYPE_API_TOKEN`: add the token to the client's server environment. The doctor checks only local configuration, not token validity.
- Tools missing from the client's list: run `doctor --stdio` and check its `Mode` and `Toolsets` lines, or call `get_capabilities`. `--read-only` and `--toolsets` hide tools at registration time.
- HTTP 401 or 403 from Teletype: check the token in Teletype project settings.
- A write timed out or was cancelled: check the conversation or project state before sending it again.

## Development

```bash
npm run dev
npm run dev:stdio
npm run check:fast
npm run check
npm run test:mutation
npm run mcp:smoke
npm run package:smoke
npm run bundle:mcpb
npm run mcp:conformance
```

`mcp:smoke` checks the 2025 and 2026-07-28 handshakes over HTTP and stdio with the SDK client. The tests also check HTTP token isolation and reject tool results that break their `outputSchema`.

`package:smoke` installs the npm archive in a temporary directory and checks its CLI, exports, both protocol versions, and the eval fixture. `mcp:conformance` runs five short scenarios from the independent MCP conformance suite against a local server and fake Teletype API. Neither command contacts a Teletype project.

`bundle:mcpb` creates `artifacts/teletype-mcp-server-v<version>.mcpb`, validates its manifest, and checks the packaged server through MCP stdio. It does not contact Teletype.

## Model compatibility eval

To run the eval through a terminal agent, connect it to the [offline eval fixture](docs/CLIENTS.md#run-the-eval-inside-your-client). The agent uses MCP tools against fake Teletype data and can request separate outcome, first-attempt, answer, and safety metrics through `eval_grade_case`. No model API endpoint is required.

The [eval results](docs/EVAL_RESULTS.md) cover 21 complete tasks and nine tool-selection cases per terminal client, with token counts, duration, and estimated API-equivalent token cost.

The optional `eval:model` command runs the same checks through an OpenAI-compatible chat completions endpoint. It starts a local fake Teletype API and MCP server and needs no real project token or customer data.

Set an endpoint that provides OpenAI-compatible `POST /chat/completions`:

```bash
cp .env.eval.example .env.eval
# Set EVAL_MODEL_BASE_URL, EVAL_MODEL_NAME, and EVAL_MODEL_API_KEY if needed.
npm run eval:model > eval-report.json
```

For a short check of tool descriptions, run `npm run eval:selection > selection-report.json`. It sends nine synthetic requests to the configured model and checks only the first tool chosen. No Teletype tool runs. A wrong or missing choice exits with code `2`. This check does not measure whether the agent completes the task.

The eval checks:

- tool selection.
- required arguments and runtime validation.
- no write calls in read-only scenarios.
- confirmation before sending or closing.
- key result facts in the final answer.

Twenty-one scenarios run by default. `EVAL_CASES` selects a subset, and `EVAL_THRESHOLD` sets the passing score. Exit codes are `0` for a pass, `2` for a score below the threshold, and `1` for a configuration or runtime error. The JSON report goes to stdout and diagnostics go to stderr. The eval sends scenario text and fake API responses to the configured model endpoint.

The report also includes outcome, first-attempt, answer, and safety rates. Each scenario starts from a fresh fake project. A correction within one agent run counts toward the final outcome but does not change the first-attempt metric.

`npm run check:fast` runs formatting, linting, type checks, and tests. `npm run check` adds Knip, coverage thresholds, a 100% mutation score gate for request isolation and limiting, the build, and package checks with Publint and Are the Types Wrong.

`npm run test:mutation` runs the full mutation suite with a 33% score floor and writes reports to `reports/mutation/`. It takes longer and is not part of `npm run check`.

See [SECURITY.md](docs/SECURITY.md) for vulnerability reporting and [CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines. The project uses the MIT license.
