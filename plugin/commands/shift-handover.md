---
description: Prepare a support shift handover from Teletype data
argument-hint: "[channel]"
---

Support shift report for the Teletype project.

1. Call `get_project_status` with `aspect: "all"` for balance, operator availability, API status, and channel issues.
2. Call `find_conversations` with `status: "unanswered"` and `limit: 20` for the queue. Focus on the channel from: $ARGUMENTS, if given.
3. Prepare a shift handover covering project status, available operators, unanswered conversations with links, and risks for the next shift.
