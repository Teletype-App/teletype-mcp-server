---
description: Triage unanswered Teletype conversations by urgency and suggest next actions
argument-hint: "[channel] [limit]"
---

Triage the queue of unanswered Teletype requests.

1. Call `find_conversations` with `status: "unanswered"`. Apply a channel or limit from: $ARGUMENTS. Default limit: 10.
2. For each conversation, study the client's last message and the wait time.
3. Classify urgency: 🔴 Critical (complaints, payment failures, VIP clients), 🟡 Standard questions (delivery, consultation), 🟢 Low priority (information requests).
4. Show a short summary table with links to dialogs and recommended next actions. Draft nothing and send nothing yet.

Follow the `teletype-support` skill rules for links, confirmation, and dry-run.
