English | [Русский](ru/TOOLS.md)

# Tools reference

All 17 tools of the Teletype MCP server: what each tool does, which parameters it takes, and when it needs confirmation. The same information is available at runtime from the server itself. Call `get_capabilities` first if you are unsure what is active.

## Tool map

| Tool | Toolset | Writes data | Needs `confirm` |
| --- | --- | --- | --- |
| `find_conversations` | conversations | no | no |
| `list_clients` | conversations | no | no |
| `find_messages` | conversations | no | no |
| `lookup_client_profile` | conversations | no | no |
| `read_conversation_thread` | conversations | only with `mark_seen: true` | only for `mark_seen` |
| `read_client_history` | conversations | no | no |
| `resolve_conversation` | conversations | yes | yes |
| `send_reply_to_client` | messaging | yes | yes (`dry_run` exempt) |
| `create_dialog_by_phone` | messaging | yes | yes (`dry_run` exempt) |
| `send_whatsapp_template` | messaging | yes | yes (`dry_run` exempt) |
| `manage_sent_message` | messaging | yes | yes |
| `annotate_client_record` | messaging | yes | yes |
| `list_workspace_metadata` | admin | no | no |
| `get_project_status` | admin | no | no |
| `manage_operator_group` | admin | yes | yes |
| `configure_project_webhook` | admin | yes | yes |
| `get_capabilities` | meta | no | no |

## Toolsets

Every tool belongs to exactly one toolset. The `meta` toolset is always active so the agent can always ask the server what is available.

| Toolset         | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| `conversations` | Find, read, and close conversations and look up client profiles |
| `messaging`     | Send and manage messages, annotate client records               |
| `admin`         | Workspace metadata, project status, operators, webhooks         |
| `meta`          | Server self-description (`get_capabilities`)                    |

Restrict the active toolsets without code changes:

```bash
# CLI flags (stdio and http)
teletype-mcp-server --stdio --read-only --toolsets conversations,messaging

# or environment variables
TELETYPE_MCP_READ_ONLY=true
TELETYPE_MCP_TOOLSETS=conversations,admin
```

- `TELETYPE_MCP_TOOLSETS` accepts a comma-separated list. Unknown names fail startup with the list of valid toolsets. Repeats are deduplicated.
- `TELETYPE_MCP_READ_ONLY=true` unregisters every write tool. It takes priority over `TELETYPE_MCP_TOOLSETS`. In read-only mode `read_conversation_thread` stays available, but `mark_seen: true` is declined with a notice instead of changing data.
- Filtering happens at server startup, before `tools/list`: filtered-out tools are invisible to the client, not just rejected.

## Confirmation and dry-run

Write tools require `confirm: true` in the arguments. The flag reduces accidental calls. The MCP client must still handle authorization and user consent.

`send_reply_to_client` and `send_whatsapp_template` accept `dry_run: true` to resolve the recipient, render the message or template, and return the target (client, phone, channel, dialog) with `side_effects` without sending anything. `create_dialog_by_phone` accepts `dry_run: true` to preview the target and possible side effects without creating or assigning a dialog. None of these previews requires `confirm`.

Every tool publishes an `outputSchema`. The short `content` text gives the main result and links. The full result is in `structuredContent`, validated against the schema. Partial writes return an error listing applied actions and failures (`partial_errors`). When an API call still fails, the error carries a hint: repeat shortly for temporary failures, check the token for auth errors.

---

## conversations

### `find_conversations`: Find conversations

Find conversations by status, channel, channel type, client, tags, operator, category, or text query. Each result includes a `link_to_dialog` to show as a clickable Markdown link. Pagination goes through `page`/`limit`. The response reports `has_more` and a `next_page_hint`.

| Parameter | Description |
| --- | --- |
| `status` | `open` (default) / `close` / `unanswered` / `all`. Use `unanswered` for triage. |
| `channel` | Channel name or type (`telegram`, `whatsapp_teletype`, `email`, …), resolved automatically. |
| `channel_type` | Explicit channel-type filter. |
| `tags` | Tag names. All listed tags must match. Unknown-but-partial lists proceed with the matched ones and report the excluded tags in `notices`. |
| `operator` | Operator name (full or partial) or `unassigned`. |
| `client` | Name, phone, email, or client_id. |
| `category` | Exact category name. List them first via `list_workspace_metadata(resource: "categories")`. |
| `query` | Case-insensitive substring search over the last message or client name. |
| `limit` / `page` | Page size (default 20, allowed 1 to 100) and page number (default 1). Pages beyond the last return an empty list. |
| `response_format` | `concise` (default) keeps the text short, `detailed` adds per-item fields to the text. `structuredContent` always carries all fields. |

### `list_clients`: List clients

List clients by API page, optionally filtering by part of a phone number. This is the safe way to check whether a number belongs to an existing client. Pass `page` and `limit` (default 1 and 20). Continue with `next_page` while `has_more` is true. The Public API does not offer name or email filters on this endpoint.

### `find_messages`: Find messages

List messages across the project or restrict them with `dialog_id`, `client_id`, `channel`, or `only_active`. Pass `page` and `limit` (default 1 and 50). Optional `query` checks message text on the returned API page only. Continue with `next_page` while `has_more` is true before concluding that an older message is absent. `total_api_items` counts messages before local text matching. The Public API does not provide full-text or date filters for `/messages`. Results include `dialog_id`, `message_id`, full text in `structuredContent`, and a message link when the API supplies a session ID.

### `lookup_client_profile`: Client profile lookup

One call returns contacts, tags, custom fields, recent notes, and the last conversations with links. Accepts a name, phone, email, or client_id. Ambiguous names return candidate lists.

| Parameter | Description |
| --- | --- |
| `client` | Name, phone (any format), email, or client_id. |
| `include_dialog_history` | Include the last 5 conversations (default true). |
| `include_notes` | Include operator notes (default true). |
| `response_format` | `concise` (default) keeps the text short, `detailed` adds per-item fields to the text. `structuredContent` always carries all fields. |

### `read_conversation_thread`: Read conversation thread

Read messages in chronological order with authors, attachments, replies, delivery status, and timestamps. It also returns channel, client, operator, and category. Read-only by default.

| Parameter | Description |
| --- | --- |
| `dialog_id` | Conversation ID from `find_conversations`. |
| `client` | Alternative to `dialog_id`: the client's latest conversation is used. |
| `messages_limit` | Recent messages to return (default 50, allowed 1 to 200). |
| `mark_seen` | Mark the conversation as read in the Teletype panel. Requires `confirm: true`. In read-only mode the read succeeds but the mark is declined with a notice. |
| `confirm` | Confirms `mark_seen`. |
| `include_sessions` | Session history: dates, operators, statuses, categories. |
| `session_id` | Extended details for one session. |
| `include_group_clients` | Group chat participants (default false). |
| `response_format` | `concise` (default) keeps the text short, `detailed` adds per-item fields to the text. `structuredContent` always carries all fields. |

### `read_client_history`: Read client history

Read the customer's recent conversations in one call: the latest dialogs with a slice of messages, channels, and links. Use it to gather context across several dialogs before replying. For full metadata of a single dialog use `read_conversation_thread`.

| Parameter | Description |
| --- | --- |
| `client` | Name, phone, email, or client_id. |
| `dialogs_limit` | Dialogs to return, 1 to 5 (default 3). |
| `messages_per_dialog` | Messages per dialog, 1 to 20 (default 10). |
| `response_format` | `concise` (default) keeps the text short, `detailed` adds per-item fields to the text. `structuredContent` always carries all fields. |

### `resolve_conversation`: Resolve conversation

Close a conversation or hand it to an operator. Default closes the dialog. `close: false` keeps it open for reassignment, category, or tags only. `mark_answered` / `mark_unanswered` flag open requests without closing. Closing does not require a category. Omit `category` unless the user asked for one, and fetch the exact name from `resource: "categories"` first.

| Parameter | Description |
| --- | --- |
| `dialog_id` | Conversation ID. |
| `assign_operator` | Operator ID/name/email or `auto` for automatic distribution. |
| `close` | Close after other actions (default true). |
| `category` | Optional exact category name. |
| `add_tags` | Client tags to add when closing. |
| `final_note` | Final note attached on close. |
| `mark_answered` / `mark_unanswered` | Flag open requests without closing. |
| `confirm` | Required. |

---

## messaging

### `send_reply_to_client`: Send reply to client

Reply to an existing conversation, start a new one through a channel (optionally `auto_close: true`), or create an empty conversation (`create_dialog_only: true`). Supports text, project templates with `{{variable}}` substitutions, public attachment URLs, local attachment paths (stdio only, disabled by default), and quoting via `reply_to_message_id`. Marks the conversation answered by default. The result reports API acceptance, not confirmed delivery.

| Parameter | Description |
| --- | --- |
| `recipient_dialog_id` | Existing conversation to reply to. Overrides client/channel. |
| `client` / `channel` | For a new conversation: recipient and sending channel. |
| `text` | Message text, optional when `template_name` is used. |
| `template_name` / `template_variables` | Project template and its `{"name": "Ivan"}` substitutions. |
| `attachment_url` | Public URL Teletype downloads and sends. |
| `attachment_path` | Local absolute path. Trusted stdio mode only, needs `ENABLE_LOCAL_UPLOADS`. |
| `reply_to_message_id` | Quoted message. |
| `mark_dialog_answered` | Default true. |
| `auto_close` | Auto-close a session opened through a channel send. |
| `create_dialog_only` | Create the conversation without sending text. |
| `dry_run` | Preview the resolved target and rendered message without sending. No `confirm` needed. |
| `confirm` | Required unless `dry_run: true`. |

### `create_dialog_by_phone`: Create or find a dialog by phone

Calls `/dialog/create` with a phone number and a phone-capable channel without sending a message. This is a write operation. The API can return an existing dialog and assign the project owner as operator when it is open. The result therefore says `created_or_found`, not that a new dialog was definitely created. Use `list_clients(phone=...)` for a read-only phone lookup.

| Parameter | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `phone`   | Recipient phone number.                                       |
| `channel` | Phone-capable channel name, type, or ID.                      |
| `dry_run` | Preview the target and possible side effects without a write. |
| `confirm` | Required for the actual call.                                 |

### `send_whatsapp_template`: Send WhatsApp template

Send a WABA-approved template in an existing Edna WhatsApp conversation outside the 24-hour service window. The template ID comes from the project's imported WABA templates, not from the quick-reply list that `list_workspace_metadata` returns.

| Parameter | Description |
| --- | --- |
| `channel_id` | WhatsApp channel ID from `resource: "channels"`. |
| `dialog_id` | Conversation ID. |
| `template_id` | WABA template ID imported from Edna. |
| `template_params.text_variables` | Values for `{{1}}`, `{{2}}` body variables. |
| `template_params.header_variables` / `button_variables` | Header and button variable values. |
| `dry_run` | Validate parameters and preview the target without sending. No `confirm` needed. |
| `confirm` | Required unless `dry_run: true`. |

### `manage_sent_message`: Manage sent message

Edit, delete, or resend an operator message.

| Parameter    | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `message_id` | From `send_reply_to_client` or `read_conversation_thread`. |
| `action`     | `update` / `delete` / `resend`.                            |
| `text`       | New text, required for `update`.                           |
| `confirm`    | Required.                                                  |

### `annotate_client_record`: Annotate client record

One call updates client or conversation metadata: tags, a note, custom fields, identity fields, or the dialog category. If one operation fails, others may still have been applied. Check `applied` and `partial_errors` before retrying.

| Parameter | Description |
| --- | --- |
| `client` | Required for tag/note/field operations. |
| `dialog_id` | Required only when changing `dialog_category`. |
| `add_tags` / `remove_tags` | Tag names to add or delete. |
| `note` / `delete_note_id` | New note text, or a note ID to delete. |
| `custom_fields` | `{"order_id": "1234", "segment": "B2B"}`. Replaces values by key. |
| `name` / `phone` / `email` | Identity updates. |
| `additional_payload` / `force_additional_payload` | Extra client data. Overwrites instead of merging. |
| `dialog_category` | Category name for the dialog. |
| `confirm` | Required. |

---

## admin

### `list_workspace_metadata`: Workspace metadata

List channels, tags, categories, quick-reply templates, template folders, operators, or operator groups. Results are cached for one minute. Prefer one `resource` over the truncation-prone `all`.

| Parameter | Description |
| --- | --- |
| `resource` | `channels` / `tags` / `categories` / `templates` / `template_directories` / `operators` / `groups` / `all`. |
| `group_id` | Group ID or name for `/group/view/:groupId` details. |
| `channel_type` / `only_active` | Channel filters. |

### `get_project_status`: Project status

Project health in one call: balance and billing, operator availability, Public API status, channel activity, webhook errors, plus derived warnings.

| Parameter          | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `aspect`           | `technical` / `financial` / `team` / `all` (default). |
| `include_warnings` | Derived warning block (default true).                 |
| `operator_details` | Expanded operator list for `team`.                    |

### `manage_operator_group`: Manage operator group

Add or remove group members, link or unlink channels, assign supervisors, and control whether members can view other operators' conversations in a channel. Group names come from `list_workspace_metadata(resource='groups')`. If the group does not resolve to exactly one group, the tool stops without writing.

| Parameter | Description |
| --- | --- |
| `action` | `add_member` / `remove_member` / `add_channel` / `remove_channel` / `set_supervisor` / `set_channel_visibility`. |
| `group` | Group name or ID. |
| `operator` | For member actions and `set_supervisor`. |
| `channel` | For channel actions and `set_channel_visibility`. |
| `is_supervisor` | Grant or remove supervisor access. |
| `can_view_other_dialogs` | Channel-level conversation visibility. |
| `confirm` | Required. |

### `configure_project_webhook`: Configure project webhook

Set the project's Public API webhook URL and its active event list.

| Parameter       | Description                                               |
| --------------- | --------------------------------------------------------- |
| `webhook_url`   | Receiver URL. An empty string removes it.                 |
| `active_events` | Events to activate. A missing or empty list disables all. |
| `confirm`       | Required.                                                 |

---

## meta

### `get_capabilities`: Server capabilities

Returns the server's active tool map: `project` (name and domain), `read_only`, `active_toolsets`, every registered tool with its toolset and `writes_data` flag, `disabled_tools`, locale, and local-upload availability. Call it first when unsure which tools or filters are active, for example after connecting with `--read-only` or `--toolsets`.

No parameters. Always available regardless of toolset configuration.
