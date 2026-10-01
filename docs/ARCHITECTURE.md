English | [Русский](ru/ARCHITECTURE.md)

# Architecture of Teletype MCP Server

## 1. Request flow

`teletype-mcp-server` connects MCP clients to the [Teletype](https://teletype.app) customer support platform through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

```
                      +---------------------------------------+
                      |   AI Client (Cursor, Claude, Zed)     |
                      +---------------------------------------+
                                          |
                        [stdio]           |       [Streamable HTTP]
                   (local assistant)      |    (multi-tenant server)
                                          v
                      +---------------------------------------+
                      |     MCP Protocol & Transport Layer    |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     AsyncLocalStorage RequestContext   |
                      |  (token, timeouts, quota, sandbox)    |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |    Ajv Input and Output Validation    |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |           Teletype Tools              |
                      | (find, lookup, read, send, annotate)  |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Rate Limiter & Backoff Engine       |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |          Teletype Public API          |
                      +---------------------------------------+
```

The tool layer has these parts:

| File | Responsibility |
| --- | --- |
| [`tool-catalog.ts`](../src/tool-catalog.ts) | Tool names, descriptions, input and output schemas, and handler keys |
| [`conversation-tools.ts`](../src/conversation-tools.ts), [`messaging-tools.ts`](../src/messaging-tools.ts), [`workspace-tools.ts`](../src/workspace-tools.ts) | Conversation, message, and workspace operations |
| [`entity-resolver.ts`](../src/entity-resolver.ts) | Name resolution and project metadata cache |
| [`candidate-hints.ts`](../src/candidate-hints.ts) | Shared candidate hints for unresolved names |
| [`teletype-api.ts`](../src/teletype-api.ts) | API requests, uploads, response size limit, retry policy, and common response envelope |
| [`api-contract.ts`](../src/api-contract.ts) | Forward-compatible Public API response decoders |
| [`tools.ts`](../src/tools.ts) | Public `TeletypeTools` class and generated tool registry |
| [`tool-presentation.ts`](../src/tool-presentation.ts) | Short text for MCP tool results |

Static MCP listings (`tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`) advertise private cache hints so a host can reuse them within a session instead of refetching.

---

## 2. Architectural decisions

### ADR-001: Tools organized by support task

- **Context**: Teletype exposes separate API endpoints for conversations, clients, messages, and project settings. Common support tasks need data from several endpoints.
- **Decision**: Expose 17 tools organized around those tasks, including `get_capabilities` for the server's active tool map. See the [tool list](../README.md#tools).
- **Result**: `lookup_client_profile`, for example, combines profile data, notes, custom fields, and recent conversations in one call.

### ADR-002: stdio and HTTP modes

- **Context**: Users run MCP either locally on their desktop workstation (via `stdio`) or remotely as a shared microservice (via `Streamable HTTP` in Docker).
- **Decision**:
  - **`stdio` mode**: Intended for a single operator. The API token is read from the process environment (`TELETYPE_API_TOKEN`). Local file attachments (`attachment_path`) are permitted only when explicitly enabled via `ENABLE_LOCAL_UPLOADS=true` within configured directory roots (`TELETYPE_ALLOWED_FILE_ROOTS`).
  - **`HTTP` mode**: Multi-tenant architecture. The API token is provided per-request in the `X-Teletype-Api-Token` header. Local file uploads (`attachment_path`) are strictly rejected to prevent server-side file disclosure.

### ADR-003: Per-Request Context via `AsyncLocalStorage`

- **Context**: HTTP requests from different projects execute concurrently in one Node.js process. A global token or request configuration could mix credentials across requests.
- **Decision**: All per-request parameters (token, API base, limits, upload policies, correlation ID) are scoped using Node.js `AsyncLocalStorage` in [`src/request-context.ts`](../src/request-context.ts).
- **Result**: Asynchronous calls within a request use its token and limits. The HTTP limiter and metadata cache use token-derived keys.

### ADR-004: Confirmation before writes

- **Context**: A mistaken tool call can send a message to a customer or close a conversation.
- **Decision**: The eight dedicated write tools (`send_reply_to_client`, `create_dialog_by_phone`, `send_whatsapp_template`, `manage_sent_message`, `annotate_client_record`, `resolve_conversation`, `manage_operator_group`, `configure_project_webhook`) require `confirm: true` for writes and declare `destructiveHint: true`. The `mark_seen: true` option on `read_conversation_thread` also requires confirmation. That tool declares `readOnlyHint: false` because it can mark a conversation as read, but `destructiveHint: false` because this action is not destructive.
- **Result**: Confirmation reduces accidental writes. The MCP client still needs to handle authorization and user consent.

### ADR-005: Log redaction

- **Context**: API credentials and customer messages can reach error and diagnostic paths.
- **Decision**: [`src/log.ts`](../src/log.ts) removes fields with sensitive names and masks bearer tokens, token query parameters, and `X-Auth-Token` values in logged strings. Callers should avoid logging raw customer data in other fields.

### ADR-006: Links to Teletype conversations

- **Context**: Operators need links from tool results to conversations in Teletype.
- **Decision**: The server resolves the project domain (`loadProjectDomain()`) and adds `link_to_dialog` and `link_to_message` URLs to tool results and resources.

### ADR-007: Prompts and resources

- **Context**: MCP-native clients (Cursor, Claude Desktop, Zed) offer specialized workflows for prompts and resources beyond direct tool calls.
- **Decision**:
  - Provide 5 support prompts (`triage-inbox`, `draft-reply`, `client-summary`, `escalate-issue`, `shift-handover`).
  - Expose static resource URIs backed by live data (`teletype://project/status`, `teletype://workspace/metadata`, `teletype://dialogs/unanswered`).
  - Expose dynamic RFC 6570 Resource Templates (`teletype://dialogs/{dialogId}`, `teletype://clients/{clientId}`) for direct contextual reading of specific conversations and profiles.

### ADR-008: Argument completion

- **Context**: MCP clients can request suggestions while users enter prompt arguments or resource parameters.
- **Decision**:
  - Declare the `completions: {}` capability in the server handshake.
  - Handle `completion/complete` requests in [`src/completions.ts`](../src/completions.ts) with prefix-matched channel IDs, common component tags, and reply instruction templates.

### ADR-009: Two MCP protocol eras

- **Context**: Clients use either the 2025 `initialize` handshake or MCP 2026-07-28 `server/discover`.
- **Decision**: SDK v2 registers tools through `McpServer.registerTool`. `serveStdio` serves both eras. `createMcpHandler` serves modern requests and stateless legacy requests.
- **Result**: HTTP and stdio expose the same tools, prompts, and resources. `npm run mcp:smoke` checks both protocol eras on both transports.

### ADR-010: Tool result schemas

- **Context**: A published `outputSchema` is a promise about successful `structuredContent`.
- **Decision**: Ajv checks successful tool results before the server sends them. The server sends concise text in `content` and complete data in `structuredContent`. A schema failure returns a tool error and tells the caller to check whether a write already took effect.

The tool catalog keeps each published contract and its handler key in one entry. Public API decoders allow extra fields and reject unusable required IDs before tool code reads them.

### ADR-011: Reads retry, writes never do

- **Context**: A single dropped connection or a 5xx response used to fail a read that the client then had to repeat by hand. Repeating a write automatically is unsafe because the first request may have taken effect.
- **Decision**: `teletypeRequest` retries transient failures on GET (5xx and network drops) with a fast backoff capped at 3 seconds and honors `Retry-After`. POST requests never retry. `TeletypeApiError` carries the HTTP status, and the dispatch boundary turns it into a hint: repeat shortly for retryable failures, check the token for 401 and 403.
- **Result**: Short Teletype hiccups heal without a new tool call. Failed writes stay one-shot, and the caller decides on a repeat together with `confirm` again.

### ADR-012: Shared resolver hints and fail-closed group writes

- **Context**: Every tool used to format its own candidate lists for unresolved channel, operator, client, category, and group names. A group write passed the raw query as an ID when resolution failed.
- **Decision**: `candidate-hints.ts` formats up to five candidates for every resolver. `manage_operator_group` stops with an error when the group name does not resolve, because the metadata cache swallows transport errors into an empty list.
- **Result**: Consistent hints across tools, and a transient `/groups` failure can never redirect a write at a wrong or nonexistent ID.

---

## 3. Security boundaries

1. **Tokens**: Teletype API tokens are omitted from tool results and output schemas.
2. **Local files**: Attachment paths in stdio mode are resolved with `realpath` and constrained within `allowedFileRoots`. The opened file descriptor is checked against those roots on Linux. Use private allowed directories on other platforms to prevent concurrent changes to path components by another local user.
3. **Request limits**:
   - HTTP transport limits concurrent requests per token via SHA-256 hashed keys.
   - API responses have a size limit (`maxResponseBytes`, default 5 MB).
   - Outbound requests enforce short abort timeouts (`requestTimeoutMs`, default 15s).
