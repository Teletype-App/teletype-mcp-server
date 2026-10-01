import type { MessageValue } from "../types.js";

export const messagingMessages = {
  "messaging.createDialogByPhone.invalidPhone": "Enter a phone number with at least seven digits.",
  "messaging.createDialogByPhone.channelDoesNotSupportPhone":
    "This channel does not support creating a conversation by phone number.",
  "messaging.createDialogByPhone.confirmRequired":
    "Creating or finding a conversation by phone requires confirm: true. An existing open conversation may be assigned to the project owner.",
  "messaging.sendReplyToClient.sendingFailedPassConfirmTrue":
    "Sending failed: pass confirm=true after confirming the text and recipient.",
  "messaging.common.repeatWithConfirmTrue":
    "Repeat the call with confirm: true to apply the action.",
  "messaging.sendReplyToClient.creatingConversationRequiresBothClient":
    "Creating a conversation requires both client and channel.",
  "messaging.sendReplyToClient.alternativelyPassRecipientDialogId":
    "Alternatively, pass recipient_dialog_id to reply in an existing conversation.",
  "messaging.sendReplyToClient.channelWasNotUniquelyFound": ({
    channel,
  }: {
    channel: MessageValue;
  }) => `Channel '${channel}' was not uniquely found.`,
  "messaging.sendReplyToClient.conversationCreatedViaDialogCreate":
    "Teletype created or found a conversation via /dialog/create without sending a message.",
  "messaging.sendReplyToClient.templateNotFound": ({
    templateName,
  }: {
    templateName: MessageValue;
  }) => `Template '${templateName}' not found.`,
  "messaging.sendReplyToClient.listAvailableTemplatesListWorkspace":
    "List available templates with list_workspace_metadata(resource='templates').",
  "messaging.sendReplyToClient.nothingSendSpecifyTextTemplate":
    "Nothing to send: specify text, template_name, attachment_url or attachment_path.",
  "messaging.sendReplyToClient.atLeastOneTheseParameters":
    "At least one of these parameters is required.",
  "messaging.sendReplyToClient.messageQueuedChannelUseRead":
    "Message queued for the channel. Use read_conversation_thread to check delivery status.",
  "messaging.sendReplyToClient.creatingConversationRequiresBothClient2":
    "Creating a conversation requires both client and channel.",
  "messaging.sendReplyToClient.newDialogHasBeenCreated":
    "Teletype created or found a dialog. Save dialog_id for further action.",
  "messaging.manageSentMessage.actionFailedPassConfirmTrue":
    "Action failed: pass confirm=true to confirm the operation on the message.",
  "messaging.manageSentMessage.messageIdParameterIsRequired":
    "The message_id parameter is required.",
  "messaging.manageSentMessage.messageIdHint":
    "Take message_id from the message_ids field of send_reply_to_client or the message_id field of a message in read_conversation_thread.",
  "messaging.manageSentMessage.actionParameterIsRequiredUpdate":
    "The action parameter is required ('update', 'delete', 'resend').",
  "messaging.manageSentMessage.actionHint":
    "Pass action as 'update', 'delete' or 'resend', for example action: 'resend'.",
  "messaging.manageSentMessage.updateActionYouMustSpecify":
    "For the 'update' action, you must specify new text in the text parameter.",
  "messaging.manageSentMessage.updateTextHint":
    "Example: action: 'update', text: 'Revised reply text'.",
  "messaging.manageSentMessage.messageHasBeenSuccessfullyEdited":
    "The message has been successfully edited.",
  "messaging.manageSentMessage.messageWasSuccessfullyDeleted":
    "The message was successfully deleted.",
  "messaging.manageSentMessage.messageResendingHasBeenInitiated":
    "Message resending has been initiated.",
  "messaging.error": "error",
  "messaging.manageSentMessage.errorPerformingActionMessage": ({
    action,
    messageId,
    msg,
  }: {
    action: MessageValue;
    messageId: MessageValue;
    msg: MessageValue;
  }) => `Error performing action '${action}' on message ${messageId}: ${msg}`,
  "messaging.addBracketFormFields.invalidTemplateParameterName": ({ key }: { key: MessageValue }) =>
    `Invalid template parameter name: ${key}.`,
  "messaging.sendWhatsappTemplate.templateSubmissionFailedPassConfirm":
    "Template submission failed: pass confirm=true to confirm submission.",
  "messaging.sendWhatsappTemplate.parametersChannelIdDialogId":
    "The parameters channel_id, dialog_id and template_id are required.",
  "messaging.sendWhatsappTemplate.requiredParamsHint":
    "Take channel_id from list_workspace_metadata(resource='channels'), dialog_id from find_conversations, template_id from list_workspace_metadata(resource='templates').",
  "messaging.sendWhatsappTemplate.teletypeHasAcceptedWhatsAppTemplate":
    "Teletype has accepted the WhatsApp template for sending. Check delivery status using webhooks.",
  "messaging.sendWhatsappTemplate.errorSendingWhatsAppTemplate": ({ msg }: { msg: MessageValue }) =>
    `Error sending WhatsApp template: ${msg}`,
  "messaging.annotateClientRecord.changesNotAppliedPassConfirm":
    "Changes not applied: pass confirm=true after checking client and values.",
  "messaging.annotateClientRecord.passClientDialogIdOr":
    "Pass client, dialog_id, or delete_note_id.",
  "messaging.annotateClientRecord.passClientNamePhoneEmail":
    "Pass client (name/phone/email/client_id), dialog_id or delete_note_id.",
  "messaging.annotateClientRecord.forceRequiresPayload":
    "Pass additional_payload when force_additional_payload is set.",
  "messaging.annotateClientRecord.categoryRequiresDialogId":
    "Pass dialog_id to change the conversation category.",
  "messaging.annotateClientRecord.noChangesRequested":
    "Pass at least one client or conversation change.",
  "messaging.annotateClientRecord.clientChangesRequireTarget":
    "Pass client or dialog_id to identify the client before changing client data.",
  "messaging.annotateClientRecord.dialogHasNoClient":
    "The conversation does not identify a client. Pass client explicitly.",
  "messaging.annotateClientRecord.clientWasNotUniquelyFound": ({
    client,
    candidatesCount,
  }: {
    client: MessageValue;
    candidatesCount: MessageValue;
  }) => `Client '${client}' was not uniquely found (${candidatesCount} candidates).`,
  "messaging.annotateClientRecord.nonExistentTags": ({ value1 }: { value1: MessageValue }) =>
    `Non-existent tags: ${value1}.`,
  "messaging.annotateClientRecord.failedAddTag": ({
    tagId,
    message,
  }: {
    tagId: MessageValue;
    message: MessageValue;
  }) => `Failed to add tag ${tagId}: ${message}`,
  "messaging.annotateClientRecord.failedRemoveTag": ({
    tagId,
    message,
  }: {
    tagId: MessageValue;
    message: MessageValue;
  }) => `Failed to remove tag ${tagId}: ${message}`,
  "messaging.annotateClientRecord.errorCreatingNote": ({ msg }: { msg: MessageValue }) =>
    `Error creating note: ${msg}`,
  "messaging.annotateClientRecord.errorDeletingNote": ({
    deleteNoteId,
    msg,
  }: {
    deleteNoteId: MessageValue;
    msg: MessageValue;
  }) => `Error deleting note '${deleteNoteId}': ${msg}`,
  "messaging.annotateClientRecord.errorUpdatingCustomFields": ({ msg }: { msg: MessageValue }) =>
    `Error updating custom fields: ${msg}`,
  "messaging.annotateClientRecord.errorUpdatingClientContacts": ({ msg }: { msg: MessageValue }) =>
    `Error updating client contacts: ${msg}`,
  "messaging.annotateClientRecord.categoryNotFound": ({
    dialogCategory,
  }: {
    dialogCategory: MessageValue;
  }) => `Category '${dialogCategory}' not found.`,
  "messaging.annotateClientRecord.failedSetCategory": ({ msg }: { msg: MessageValue }) =>
    `Failed to set category: ${msg}`,
  "messaging.annotateClientRecord.someOperationsFailedCheckPartial":
    "Some operations failed. Check partial_errors before retrying. Other changes were applied.",
  "messaging.annotateClientRecord.allOperationsWereCompletedSuccessfully":
    "All operations were completed successfully.",
  "messaging.sendReplyToClient.dryRunPreviewNothingWasSent": ({
    channelName,
    clientName,
  }: {
    channelName: MessageValue;
    clientName: MessageValue;
  }) =>
    `Dry run: nothing was sent. On the next call with confirm=true, the message goes to ${clientName} via ${channelName}.`,
  "messaging.sendWhatsappTemplate.dryRunPreviewNothingWasSent":
    "Dry run: nothing was sent. The WABA template goes out only after a repeat call with confirm=true. Remember the 24-hour customer service window: outside it, only approved templates are deliverable.",
} as const;
