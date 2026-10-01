import type { MessageValue } from "../types.js";

export const serverMessages = {
  "server.instructions":
    "Teletype customer support tools (https://teletype.app).\n\nUse the narrowest read that answers the request. For unanswered work, call find_conversations(status='unanswered'). For older message text, use find_messages(query=...) and continue through pages while has_more is true. Use list_clients(phone=...) to check a number without changing data. For channel lists, call list_workspace_metadata(resource='channels'). For channel and Public API health, call get_project_status(aspect='technical'). Broad defaults may return unrelated or limited data.\n\nUse IDs returned by reads for follow-up calls. Names are accepted for clients, operators, channels, tags and categories, but do not invent a category or tag name. If the user requests a category, list_workspace_metadata(resource='categories') gives the exact names. Closing a conversation does not require a category.\n\nBefore a write, obtain the user's confirmation unless already given. Pass confirm=true to send_reply_to_client, create_dialog_by_phone, send_whatsapp_template, manage_sent_message, annotate_client_record, resolve_conversation, manage_operator_group and configure_project_webhook. read_conversation_thread needs it when mark_seen=true. A draft request is read-only.\n\nAfter a write, report the applied action and any partial_errors. For sends, accepted=true means Teletype accepted the request for sending, not that the recipient received it. Check delivery status before claiming delivery. Avoid repeating a write after an uncertain result.\n\nShow conversation and message links using link_to_dialog and link_to_message. For a first Edna WhatsApp message or one outside the 24-hour window, use send_whatsapp_template with a registered WABA template ID. Quick reply templates do not list WABA templates.",
  "server.buildServer.toolResponseDoesNotMatch": ({ name }: { name: MessageValue }) =>
    `Tool response '${name}' does not match the declared schema.`,
  "server.buildServer.actionCouldBeCompletedCheck":
    "The action could be completed. Check the result before calling again.",
  "server.buildServer.internalToolError": ({ name }: { name: MessageValue }) =>
    `Internal tool error '${name}'.`,
  "server.buildServer.provideDevelopersRequestIDX":
    "Provide developers with the request ID from the X-Request-Id header or server log.",
  "server.buildServer.apiErrorRetryableHint": "This looks temporary. Repeat the same call shortly.",
  "server.buildServer.apiErrorAuthHint":
    "Check the X-Auth-Token setup and the token permissions in the Teletype admin panel.",
} as const;
