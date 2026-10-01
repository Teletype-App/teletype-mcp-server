---
description: Create a structured bug report or escalation from a Teletype conversation
argument-hint: "<dialog_id> [component]"
---

Escalation from the Teletype conversation: $ARGUMENTS

1. Call `read_conversation_thread` for that dialog.
2. Write a bug report with:
   - Component (from the arguments, or infer it and say so)
   - The issue as reported by the client
   - Reproduction steps, if known
   - Expected and actual behavior
   - Client environment, including browser, OS, screenshots, and links
   - A link to the Teletype conversation.
