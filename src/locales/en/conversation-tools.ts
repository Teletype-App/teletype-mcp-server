import type { MessageValue } from "../types.js";

export const conversationMessages = {
  "conversation.findConversations.unnamed": "(unnamed)",
  "conversation.findConversations.channelIsNotUniquelyDefined": ({
    channel,
  }: {
    channel: MessageValue;
  }) => `Channel '${channel}' is not uniquely defined.`,
  "conversation.findConversations.candidatesFoundSpecifyNameOr": ({
    list,
  }: {
    list: MessageValue;
  }) =>
    `Candidates found: ${list}. Specify the name or use list_workspace_metadata with resource='channels'.`,
  "conversation.findConversations.thereAreNoChannelsThis":
    "There are no channels with this name. The list of available ones is list_workspace_metadata with resource='channels'.",
  "conversation.findConversations.clientNameUnknown": "unknown",
  "conversation.findConversations.tagsNotFound": ({ value1 }: { value1: MessageValue }) =>
    `Tags not found: ${value1}.`,
  "conversation.findConversations.getListTagsViaList":
    "Get a list of tags via list_workspace_metadata with resource='tags'.",
  "conversation.findConversations.clientWasNotUniquelyFound": ({
    client,
  }: {
    client: MessageValue;
  }) => `Client '${client}' was not uniquely found.`,
  "conversation.findConversations.candidatesPassClientIdOr": ({ cands }: { cands: MessageValue }) =>
    `Candidates: ${cands}. Pass client_id or specify the parameter.`,
  "conversation.findConversations.usePhoneEmailOrClient": "Use phone, email or client_id.",
  "conversation.findConversations.operatorWasNotUniquelyFound": ({
    operator,
  }: {
    operator: MessageValue;
  }) => `The operator '${operator}' was not uniquely found.`,
  "conversation.findConversations.candidates": ({ list }: { list: MessageValue }) =>
    `Candidates: ${list}.`,
  "conversation.findConversations.listOperatorsListWorkspaceMetadata":
    "List of operators - list_workspace_metadata with resource='operators'.",
  "conversation.findConversations.categoryIsAmbiguous": ({
    category,
  }: {
    category: MessageValue;
  }) => `The category '${category}' is ambiguous.`,
  "conversation.findConversations.listCategoriesListWorkspaceMetadata":
    "List of categories - list_workspace_metadata with resource='categories'.",
  "conversation.findConversations.whenPresentingConversationsUserShow":
    "When presenting conversations to the user, show a clickable Markdown link from link_to_dialog for each one. Keep dialog_id, appeal_id, and client_id for tool calls.",
  "conversation.findConversations.thereAreNoDialogsMatching":
    "There are no dialogs matching the filter. Try status='all' or weaken the filters.",
  "conversation.findConversations.useDialogIdReadConversation":
    "Use dialog_id for read_conversation_thread, send_reply_to_client or resolve_conversation.",
  "conversation.lookupClientProfile.clientParameterIsRequired":
    "The 'client' parameter is required.",
  "conversation.lookupClientProfile.passNamePhoneEmailOr": "Pass name, phone, email or client_id.",
  "conversation.lookupClientProfile.clientWasNotUniquelyFound": ({
    client,
    candidatesCount,
  }: {
    client: MessageValue;
    candidatesCount: MessageValue;
  }) => `Client '${client}' was not uniquely found (${candidatesCount} candidates).`,
  "conversation.lookupClientProfile.candidatesRetrySelectedClientId": ({
    json,
  }: {
    json: MessageValue;
  }) => `Candidates:
${json}
Retry with the selected client_id.`,
  "conversation.lookupClientProfile.thereAreNoClientsSuch":
    "There are no clients with such data in the database.",
  "conversation.lookupClientProfile.profile": ({ error }: { error: MessageValue }) =>
    `Profile: ${error}`,
  "conversation.lookupClientProfile.customFields": ({ error }: { error: MessageValue }) =>
    `Custom fields: ${error}`,
  "conversation.lookupClientProfile.notes": ({ error }: { error: MessageValue }) =>
    `Notes: ${error}`,
  "conversation.lookupClientProfile.unknownError": "unknown error",
  "conversation.lookupClientProfile.conversationHistory": ({
    message,
  }: {
    message: MessageValue;
  }) => `Conversation history: ${message}`,
  "conversation.lookupClientProfile.sendMessageUseSendReply":
    "To send a message, use send_reply_to_client with recipient_dialog_id from recent_dialogs, or pass client + channel for a new dialog.",
  "conversation.readClientHistory.dialogScan": ({ error }: { error: MessageValue }) =>
    `Could not list dialogs: ${error}`,
  "conversation.readClientHistory.dialogMessages": ({
    dialog,
    error,
  }: {
    dialog: MessageValue;
    error: MessageValue;
  }) => `Could not read messages of dialog ${dialog}: ${error}`,
  "conversation.readClientHistory.hint":
    "Answer via send_reply_to_client with recipient_dialog_id. Read the full thread of a dialog with read_conversation_thread.",
  "conversation.readConversationThread.conversationNotMarkedAsRead":
    "Conversation not marked as read: pass confirm=true after user confirms.",
  "conversation.common.repeatWithConfirm":
    "Repeat the call with confirm: true to apply the action.",
  "conversation.readConversationThread.needDialogIdORClient": "Need dialog_id OR client.",
  "conversation.readConversationThread.passDialogIdDirectlyOr":
    "Pass dialog_id directly, or client (name/phone/email/client_id) - the last client dialog will be taken.",
  "conversation.readConversationThread.clientHasNoDialogs": ({ id }: { id: MessageValue }) =>
    `Client ${id} has no dialogs.`,
  "conversation.readConversationThread.createNewOneViaSend":
    "Create a new one via send_reply_to_client with client + channel.",
  "conversation.readConversationThread.alwaysShowLinkDialogWhen":
    "Always show link_to_dialog when presenting a conversation. Use link_to_message when quoting a specific message. Keep dialog_id, appeal_id, and message_id for tool calls.",
  "conversation.readConversationThread.replyUseSendReplyClient": ({ did }: { did: MessageValue }) =>
    `To reply, use send_reply_to_client with recipient_dialog_id='${did}'. To close - resolve_conversation.`,
  "conversation.resolveConversation.dialogHasNotBeenChanged":
    "The dialog has not been changed: pass confirm=true after checking the dialog_id and the resulting actions.",
  "conversation.resolveConversation.dialogIdParameterIsRequired":
    "The dialog_id parameter is required.",
  "conversation.resolveConversation.getDialogIdViaFind": "Get dialog_id via find_conversations.",
  "conversation.resolveConversation.openSessionsWereMarkedUnanswered":
    "Open sessions were marked unanswered. The API does not change closed sessions.",
  "conversation.error": "error",
  "conversation.resolveConversation.failedMarkConversationAsUnanswered": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Failed to mark conversation as unanswered: ${msg}`,
  "conversation.resolveConversation.failedMarkConversationAsAnswered": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Failed to mark conversation as answered: ${msg}`,
  "conversation.resolveConversation.automaticOperatorAssignmentFailed": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Automatic operator assignment failed: ${msg}`,
  "conversation.resolveConversation.operatorIsAmbiguousSeveralWere": ({
    trimmed,
    value2,
  }: {
    trimmed: MessageValue;
    value2: MessageValue;
  }) => `The operator '${trimmed}' is ambiguous: several were found (${value2}).`,
  "conversation.resolveConversation.operatorNotFound": ({ trimmed }: { trimmed: MessageValue }) =>
    `Operator '${trimmed}' not found.`,
  "conversation.resolveConversation.operatorAssignmentError": ({ msg }: { msg: MessageValue }) =>
    `Operator assignment error: ${msg}`,
  "conversation.resolveConversation.failedDetermineConversationClient": ({
    message,
  }: {
    message: MessageValue;
  }) => `Failed to determine conversation client: ${message}`,
  "conversation.resolveConversation.finalNoteWasNotCreated":
    "The final note was not created because the conversation's client could not be identified.",
  "conversation.resolveConversation.noTagsWereAddedBecause":
    "No tags were added because the conversation's client could not be identified.",
  "conversation.resolveConversation.categoryNotFound": ({ category }: { category: MessageValue }) =>
    `Category '${category}' not found.`,
  "conversation.resolveConversation.autoAssigned": "auto-assigned",
  "conversation.resolveConversation.listCategoriesBeforeRetry":
    "No changes were made. List available names with list_workspace_metadata(resource='categories') before retrying.",
  "conversation.resolveConversation.failedSetCategory": ({ msg }: { msg: MessageValue }) =>
    `Failed to set category: ${msg}`,
  "conversation.resolveConversation.errorCreatingNote": ({ msg }: { msg: MessageValue }) =>
    `Error creating note: ${msg}`,
  "conversation.resolveConversation.nonExistentTags": ({ value1 }: { value1: MessageValue }) =>
    `Non-existent tags: ${value1}.`,
  "conversation.resolveConversation.tagNotAdded": ({
    value1,
    message,
  }: {
    value1: MessageValue;
    message: MessageValue;
  }) => `Tag ${value1} not added: ${message}`,
  "conversation.resolveConversation.failedCloseDialog": ({ msg }: { msg: MessageValue }) =>
    `Failed to close dialog: ${msg}`,
  "conversation.resolveConversation.someEarlierActionsMayHave":
    "Some earlier actions may have succeeded. The conversation was not closed.",
  "conversation.resolveConversation.conversationIsClosed": "The conversation is closed.",
  "conversation.resolveConversation.dialogIsLeftOpenClose":
    "The dialog is left open (close=false).",
  "conversation.findConversations.tagsExcludedNoMatch": ({ value1 }: { value1: MessageValue }) =>
    `Tags not found and excluded from the filter: ${value1}. Results are filtered by the remaining tags only. Get the exact tag list via list_workspace_metadata(resource='tags').`,
  "conversation.findConversations.morePagesRepeatCall": ({ page }: { page: MessageValue }) =>
    `More conversations matched the filters. Call find_conversations again with page=${page} to fetch the next portion.`,
  "conversation.readConversationThread.readOnlyBlocksMarkSeen":
    "The server runs in read-only mode, so mark_seen=true was not applied.",
  "conversation.readConversationThread.restartWithoutReadOnly":
    "Restart the server without TELETYPE_MCP_READ_ONLY / --read-only to mark conversations as read.",
} as const;
