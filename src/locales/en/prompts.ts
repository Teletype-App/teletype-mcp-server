import type { MessageValue } from "../types.js";

export const promptsMessages = {
  "prompts.triageInbox.description":
    "Triage unanswered Teletype conversations by urgency and suggest the operator's next actions.",
  "prompts.triageInbox.channelId.description": "Optional channel ID to limit the queue.",
  "prompts.triageInbox.limit.description": "How many dialogs to load for analysis (default 10).",
  "prompts.draftReply.description":
    "Read the client's conversation and draft a clear, polite reply in the requested tone.",
  "prompts.draftReply.dialogId.description": "Teletype conversation ID for the response.",
  "prompts.draftReply.instructions.description":
    "Extra instructions for the reply, such as 'refund approved, offer a 10% discount'.",
  "prompts.clientSummary.description":
    "Summarize a client's contact details, tags, notes, recent conversations, and sentiment.",
  "prompts.clientSummary.client.description": "Name, phone, email or client ID to search.",
  "prompts.escalateIssue.description":
    "Create a structured bug report or escalation from a client conversation.",
  "prompts.escalateIssue.dialogId.description": "ID of the dialog with the problem message.",
  "prompts.escalateIssue.component.description":
    "Component or service (for example, 'Payment', 'Mobile application', 'CRM integration').",
  "prompts.shiftHandover.description":
    "Prepare a support shift handover with unanswered conversations, channel issues, team availability, and project warnings.",
  "prompts.shiftHandover.channelId.description": "Channel ID for focus check (optional).",
  "prompts.triageInbox.channel": ({ channelId }: { channelId: MessageValue }) =>
    `, channel='${channelId}'`,
  "prompts.triageInbox.triagePlanQueueUnansweredRequests":
    "Triage plan for the queue of unanswered requests",
  "prompts.triageInbox.step1CallFindConversationsStatus": ({
    channelText,
    limit,
  }: {
    channelText: MessageValue;
    limit: MessageValue;
  }) => `1. Call find_conversations with status='unanswered'${channelText}, limit=${limit}.
2. For each conversation found, study the client’s last message and wait time.
3. Divide conversations into categories of urgency:
   - 🔴 Critical (complaints, payment failures, VIP clients)
   - 🟡 Standard questions (delivery, consultation)
   - 🟢 Low priority (information requests).
4. Display a short summary table with links to dialogs and recommended next actions.`,
  "prompts.draftReply.additionalOperatorInstructions": ({
    instructions,
  }: {
    instructions: MessageValue;
  }) => `
Additional operator instructions:
${instructions}`,
  "prompts.draftReply.preparingResponseConversation": ({ dialogId }: { dialogId: MessageValue }) =>
    `Preparing a response to the conversation ${dialogId}`,
  "prompts.draftReply.step1CallReadConversationThread": ({
    dialogId,
    extra,
  }: {
    dialogId: MessageValue;
    extra: MessageValue;
  }) => `1. Call read_conversation_thread for dialog_id='${dialogId}' to read recent messages.
2. If needed, call lookup_client_profile for context.
3. Draft a clear, empathetic reply in the language requested by the user or used by the client.${extra}
4. Show the draft to the user before calling send_reply_to_client. Sending requires confirm=true.`,
  "prompts.clientSummary.clientSummary": ({ client }: { client: MessageValue }) =>
    `Client summary: ${client}`,
  "prompts.clientSummary.step1CallLookupClientProfile": ({
    client,
  }: {
    client: MessageValue;
  }) => `1. Call lookup_client_profile with client='${client}'.
2. Create a short summary:
   - Name and contact details
   - Tags and custom fields (segment, order number)
   - Operator notes
   - History and status of recent requests
   - Recommendations for further work with the client.`,
  "prompts.escalateIssue.component": ({
    component,
  }: {
    component: MessageValue;
  }) => `   - Component: ${component}
`,
  "prompts.escalateIssue.escalationConversation": ({ dialogId }: { dialogId: MessageValue }) =>
    `Escalation from conversation ${dialogId}`,
  "prompts.escalateIssue.step1CallReadConversationThread": ({
    dialogId,
    comp,
  }: {
    dialogId: MessageValue;
    comp: MessageValue;
  }) => `1. Call read_conversation_thread for dialog_id='${dialogId}'.
2. Write a bug report with:
${comp}   - The issue as reported by the client
   - Reproduction steps, if known
   - Expected and actual behavior
   - Client environment, including browser, OS, screenshots, and links
   - A link to the Teletype conversation.`,
  "prompts.shiftHandover.focusChannel": ({ channelId }: { channelId: MessageValue }) =>
    ` with focus on channel '${channelId}'`,
  "prompts.shiftHandover.supportShiftReport": ({ channelText }: { channelText: MessageValue }) =>
    `Support shift report${channelText}`,
  "prompts.shiftHandover.step1CallGetProjectStatus": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `1. Call get_project_status(aspect='all') for balance, operator availability, API status, and channel issues.
2. Call find_conversations(status='unanswered', limit=20${value1}) for the queue.
3. Prepare a shift handover covering project status, available operators, unanswered conversations with links, and risks for the next shift.`,
  "prompts.handleGetPrompt.unknownPromptAvailable": ({
    name,
    value2,
  }: {
    name: MessageValue;
    value2: MessageValue;
  }) => `Unknown prompt '${name}'. Available: ${value2}`,
} as const;
