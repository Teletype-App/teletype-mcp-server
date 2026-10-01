import type { MessageValue } from "../types.js";

export const presentationMessages = {
  "presentation.createDialogByPhone.preview": "Preview: no dialog was created.",
  "presentation.createDialogByPhone.createdOrFound":
    "Teletype created or found the dialog. No message was sent.",
  "presentation.createDialogByPhone.assignmentWarning":
    "The confirmed call may assign the project owner to an existing open dialog.",
  "presentation.createDialogByPhone.openDialog": "Open dialog",
  "presentation.listClients.count": ({ count }: { count: MessageValue }) =>
    `Clients on this page: ${count}`,
  "presentation.listClients.moreInStructuredContent": "More clients are in structuredContent.",
  "presentation.listClients.nextPage": ({ page }: { page: MessageValue }) =>
    `More clients exist. Continue with page=${page}.`,
  "presentation.findMessages.count": ({
    count,
    page,
  }: {
    count: MessageValue;
    page: MessageValue;
  }) => `Messages matching on API page ${page}: ${count}`,
  "presentation.findMessages.moreInStructuredContent": "More messages are in structuredContent.",
  "presentation.findMessages.nextPage": ({ page }: { page: MessageValue }) =>
    `Older messages remain. Continue with page=${page} before concluding the text is absent.`,
  "presentation.sendReplyToClient.acceptedForSending":
    "Teletype accepted the message for sending. Delivery to the recipient is not confirmed.",
  "presentation.sendReplyToClient.dialogCreatedWithoutMessage":
    "Teletype created or found the conversation. No message was sent.",
  "presentation.findConversations.conversationsFound": ({ text }: { text: MessageValue }) =>
    `Conversations found: ${text}.`,
  "presentation.findConversations.moreConversationsStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `${value1} more conversations in structuredContent.`,
  "presentation.findConversations.searchIsLimitedRefineYour":
    "Search is limited. Refine your filters.",
  "presentation.findConversations.defaultsApplied": ({ defaults }: { defaults: MessageValue }) =>
    `Applied defaults: ${defaults}.`,
  "presentation.lookupClientProfile.moreDialogsExist": ({ total }: { total: MessageValue }) =>
    `The client has ${total} conversations in the recent window, showing the latest 5.`,
  "presentation.readConversationThread.threadMayContinue": ({ limit }: { limit: MessageValue }) =>
    `At least ${limit} messages were returned. Increase messages_limit to read older ones.`,
  "presentation.lookupClientProfile.client": "Client",
  "presentation.lookupClientProfile.notes": ({ notesCount }: { notesCount: MessageValue }) =>
    `Notes: ${notesCount}.`,
  "presentation.lookupClientProfile.recentConversations": ({
    dialogsCount,
  }: {
    dialogsCount: MessageValue;
  }) => `Recent conversations: ${dialogsCount}.`,
  "presentation.readConversationThread.conversation": "Conversation",
  "presentation.readConversationThread.draftEvidenceReminder":
    "When drafting a reply, rely on the conversation and facts explicitly supplied by the user. Do not promise a courier call, notification, changed time or address, or other action without confirmation.",
  "presentation.readConversationThread.attachment": "[attachment]",
  "presentation.readConversationThread.attachments": ({ names }: { names: MessageValue }) =>
    `attachments: ${names}`,
  "presentation.readConversationThread.moreMessagesStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `${value1} more messages in structuredContent.`,
  "presentation.listWorkspaceMetadata.moreEntriesStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `${value1} more entries in structuredContent.`,
  "presentation.getProjectStatus.noData": "no data",
  "presentation.getProjectStatus.statusSections": ({ sections }: { sections: MessageValue }) =>
    `Status sections: ${sections}.`,
  "presentation.presentToolResult.someActionsHaveBeenCompleted":
    "Some of the actions have been completed. Check the status before retrying.",
  "presentation.presentToolResult.someDataIsNotAvailable": "Some data is not available.",
  "presentation.presentToolResult.error": ({ error }: { error: MessageValue }) => `Error: ${error}`,
  "presentation.presentToolResult.doneDataStructuredContent": "Done. Data in structuredContent.",
  "presentation.presentToolResult.notice": ({ notice }: { notice: MessageValue }) =>
    `Note: ${notice}`,
  "presentation.sendReplyToClient.dryRunHeader":
    "Dry run: nothing was sent. The message would go to:",
  "presentation.sendReplyToClient.dryRunMessage": ({ text }: { text: MessageValue }) =>
    `Message: ${text}`,
  "presentation.sendWhatsappTemplate.dryRunHeader":
    "Dry run: nothing was sent. WABA template preview:",
  "presentation.getCapabilities.header": ({
    readOnly,
    toolsets,
  }: {
    readOnly: MessageValue;
    toolsets: MessageValue;
  }) => `Server capabilities, read-only: ${readOnly}, active toolsets: ${toolsets}`,
  "presentation.getCapabilities.workspace": ({ details }: { details: MessageValue }) =>
    `Workspace: ${details}`,
  "presentation.getCapabilities.writes": "writes",
  "presentation.readClientHistory.historyHeader": ({ count }: { count: MessageValue }) =>
    `Recent dialogs: ${count}.`,
  "presentation.readClientHistory.noMessages": "No messages returned for this dialog.",
} as const;
