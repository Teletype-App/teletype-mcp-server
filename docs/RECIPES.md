English | [Русский](ru/RECIPES.md)

# Recipes

Ready-to-paste prompts for common manager and operator routines. Each recipe names the tools it uses and what to watch out for. They complement the five workflows in the `teletype-support` skill and its slash commands. Those cover inbox triage, drafting, client summaries, escalations, and shift handovers. These recipes cover reporting, history searches, and client outreach.

Most recipes only read data. Recipes that write data say so explicitly, and every write goes through `confirm: true`.

Tips that apply everywhere:

- Call `get_capabilities` first if you are unsure which tools or toolsets are active.
- Results include `link_to_dialog` (and `link_to_message` inside threads). Always show these links to the user.
- Search tools have no date filters, so period recipes fetch a generous page of results and filter by timestamps on the agent side: `last_message_at` on dialogs, `created_at` on messages.

## Morning digest for a manager

Goal: see what arrived overnight and what needs attention now. Uses `find_conversations` and `get_project_status`.

```text
Collect the morning digest: 1) how many conversations are open and how many are
unanswered, 2) what arrived in the last 12 hours, 3) which unanswered dialogs
have been waiting the longest, 4) operator availability. Show a table with
links to the dialogs.
```

What the agent does:

1. `find_conversations` with `status: "unanswered"` and a generous `limit`, oldest `last_message_at` first, for the backlog.
2. `find_conversations` with `status: "open"`, keep results whose `last_message_at` falls inside the last 12 hours.
3. `get_project_status` with `aspect: "team"` for operator availability.
4. Lead with the counts, then list the oldest unanswered dialogs with links.

## Unanswered backlog triage

Goal: work through dialogs that waited too long and group them by likely reason. Uses `find_conversations` and `read_conversation_thread`.

```text
Take unanswered dialogs whose last message is older than 6 hours. Read each
thread briefly and group them by likely reason: missing answer from us, waiting
on the client, spam or noise. For each group show the count, the dialog links,
and one line per dialog on what it would take to close it.
```

What the agent does:

1. `find_conversations` with `status: "unanswered"` and a generous `limit`.
2. Drop dialogs whose `last_message_at` is younger than the cutoff.
3. `read_conversation_thread` per dialog with a small `messages_limit` to classify it.
4. Report groups with links before suggesting any action, the operator decides what to close.

## Voice of the client

Goal: summarize what clients write about over a period. Uses `find_conversations` and `read_conversation_thread`.

```text
Summarize client conversations from the last 30 days: the top recurring topics
and reasons for contact, anything that looks like a growing problem, and
notable quotes with links. Use categories and tags where they exist, read a
sample of threads per topic rather than every dialog.
```

What the agent does:

1. `list_workspace_metadata` with `resource: "categories"` to know the existing vocabulary.
2. `find_conversations` per interesting category or with a text `query` for candidate topics.
3. `read_conversation_thread` on a sample per bucket, not on every dialog, to keep cost sane. `response_format: "detailed"` puts full message texts and ids into the text without extra calls.
4. Report topics ranked by volume, with representative quotes and `link_to_message` references.

## Tag and category audit

Goal: find misplaced or stale labels and clean them up. Uses `list_workspace_metadata`, `find_conversations`, and `annotate_client_record`. This one writes data.

```text
Audit our labels: 1) list existing tags and categories, 2) find near-duplicate
tag names, 3) sample dialogs and clients per tag to spot labels that no longer
match the content. Propose a cleanup plan first, apply nothing without my
explicit approval.
```

What the agent does:

1. `list_workspace_metadata` with `resource: "all"` for the current tag and category vocabulary.
2. `find_conversations` per suspicious tag or category to sample what it is actually attached to.
3. Present the proposed renames, merges, and removals as a table and wait for approval.
4. Apply approved changes via `annotate_client_record` with `add_tags`, `remove_tags`, or `dialog_category`, one `confirm: true` call per client or dialog. The tool reports `partial_errors` when some operations fail. Check it before moving on.

## Call prep card

Goal: brief an operator before an outbound call. Uses `lookup_client_profile` and `read_conversation_thread`.

```text
Prepare a call card for the client named Ivan Petrov: contact details and tags,
what we talked about recently and how it ended, open promises or issues, and
the tone of the last exchange. Keep it under 15 lines.
```

What the agent does:

1. `lookup_client_profile` with the name, phone, or email for the full profile in one call: contacts, tags, custom fields, operator notes, recent dialogs.
2. `read_conversation_thread` on the most recent dialog when the profile alone is not enough.
3. `read_client_history` instead of the two calls above when the last few dialogs together give the context: up to five dialogs with messages in one call.
4. Format the card: who the client is, history in two or three lines, open items, suggested opening line.

## Check a phone number before contacting a client

Goal: find a client by phone without creating a dialog. Uses `list_clients`.

```text
Find the client with phone +79990000002. Show the name and client ID. Do not create a dialog or send a message.
```

What the agent does:

1. Call `list_clients` with `phone: "+79990000002"`.
2. If several clients match, show each match and ask which one the operator means before taking an action.
3. For an unfiltered client list, use `page` and `limit`, then continue while `has_more` is true.

## Find an older message by its text

Goal: locate a past message and link to its dialog. Uses `find_messages`.

```text
Find the message from client client-ivan that mentions order 777. Show the text and a link to the message or dialog. Search older pages if needed. Do not change data.
```

What the agent does:

1. Call `find_messages` with `client_id: "client-ivan"` and `query: "777"`.
2. Continue with `next_page` while `has_more` is true, even if the current page has no text matches. Text matching happens within each fetched API page.
3. Show `link_to_message` when present and keep the dialog ID for follow-up reads.

## Create a dialog by phone

Goal: open a WhatsApp dialog without sending a message. Uses `create_dialog_by_phone`. This recipe writes data.

```text
Preview creating a dialog in channel channel-whatsapp for +79990000003. Tell me whether the operation may change an existing assignment. Wait for my confirmation before creating it. Do not send a message.
```

What the agent does:

1. Call `create_dialog_by_phone` with `dry_run: true`, the phone number, and the channel.
2. Explain that the API may create a dialog or assign an existing open dialog to the project owner. A dry run changes nothing.
3. After explicit confirmation, call the same tool with `confirm: true` and show the returned dialog link. This tool does not send a message.
