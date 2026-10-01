---
description: Read a Teletype conversation and draft a reply for approval
argument-hint: "<dialog_id> [instructions]"
---

Preparing a response to the Teletype conversation from: $ARGUMENTS

1. Call `read_conversation_thread` for that dialog to read the recent messages.
2. If needed, call `lookup_client_profile` for context.
3. Draft a clear, empathetic reply in the language requested by the user or used by the client. Apply any extra instructions from the arguments.
4. Show the draft to the user before calling `send_reply_to_client`. Sending requires `confirm: true` and the user's explicit approval.

Follow the `teletype-support` skill rules for dry-run and delivery reporting.
