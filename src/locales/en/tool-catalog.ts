export const toolCatalogMessages = {
  "toolCatalog.listClients.title": "List clients",
  "toolCatalog.listClients.description":
    "List project clients, optionally filtering by phone. Use this for a client inventory or to look up a phone number without changing data. The Public API matches part of a normalized phone number. Follow page/has_more to continue.",
  "toolCatalog.listClients.phone.description":
    "Phone number or part of one. The Public API searches normalized phone numbers.",
  "toolCatalog.listClients.page.description": "API page, starting at 1. Default: 1.",
  "toolCatalog.listClients.limit.description": "Clients per page, 1 to 100. Default: 20.",
  "toolCatalog.findMessages.title": "Find messages",
  "toolCatalog.findMessages.description":
    "List project messages, optionally filtered by conversation, client ID, channel, or message text. The query parameter searches message text, not message IDs. To edit, delete, or resend a known message_id, use manage_sent_message directly. Text matching runs only on the returned API page because the Public API has no full-text filter. Continue through pages while has_more is true before concluding that an older message is absent. Use this instead of find_conversations for text in historical messages.",
  "toolCatalog.findMessages.query.description":
    "Case-insensitive substring in message text on this page only. Empty results do not mean no match exists on later pages.",
  "toolCatalog.findMessages.dialogId.description":
    "Conversation ID to restrict messages. From find_conversations or a conversation link.",
  "toolCatalog.findMessages.clientId.description":
    "Exact client ID to restrict messages. Use list_clients or lookup_client_profile first.",
  "toolCatalog.findMessages.channel.description":
    "Channel name, type, or ID. Resolves to channelId.",
  "toolCatalog.findMessages.onlyActive.description":
    "Limit to active channels when channel is omitted. Default: false.",
  "toolCatalog.findMessages.page.description": "API page to inspect, starting at 1. Default: 1.",
  "toolCatalog.findMessages.limit.description": "Messages per API page, 1 to 100. Default: 50.",
  "toolCatalog.findMessages.responseFormat.description":
    "Concise text by default, detailed text includes full message bodies. structuredContent always includes full text.",
  "toolCatalog.createDialogByPhone.title": "Create dialog by phone",
  "toolCatalog.createDialogByPhone.description":
    "Create or find a conversation for a phone number in a phone-capable channel without sending a message. This is a write, not a phone lookup: it may create a conversation and may assign the project owner to an existing open conversation. Use list_clients to check a phone without changing data. Preview with dry_run, then call with confirm: true only when creation is requested.",
  "toolCatalog.createDialogByPhone.phone.description":
    "Recipient phone number. Use an international number when available.",
  "toolCatalog.createDialogByPhone.channel.description":
    "Phone-capable channel name, type, or ID: WhatsApp, MAX, SMS, Kakao, Telegram, or VK Direct.",
  "toolCatalog.createDialogByPhone.dryRun.description":
    "Preview the channel, phone, and possible side effects without creating a dialog.",
  "toolCatalog.createDialogByPhone.confirm.description":
    "Explicit confirmation to create or find the dialog. May change the operator of an existing open dialog.",
  "toolCatalog.findConversations.description":
    "Find Teletype conversations by status (open/close/unanswered/all), channel, client, tags, operator, category, last message text, or client name. The query parameter searches last message text or client name, not dialog IDs. If the user already supplied dialog_id, pass it directly to read_conversation_thread, resolve_conversation, or send_reply_to_client as appropriate. For text in older messages use find_messages and continue through pages. Each result includes link_to_dialog. Show every conversation to the user as a clickable Markdown link. Use this tool for the active queue, unanswered conversations, a client's history, or tagged cases. For several dialogs of one client, prefer read_client_history.",
  "toolCatalog.findConversations.status.description":
    "Filter by status. Default is 'open'. Use 'unanswered' for triage.",
  "toolCatalog.findConversations.channel.description":
    "Channel name (eg 'WhatsApp Sales') or its type (telegram, whatsapp_teletype, email, vk, viber, instagram_direct_business, etc.). Resolves automatically.",
  "toolCatalog.findConversations.tags.description":
    "Client tag names. All listed tags must match. For example, ['VIP', 'refund'].",
  "toolCatalog.findConversations.operator.description":
    "Agent name (full or partial) or 'unassigned' string for dialogs without an assigned agent.",
  "toolCatalog.findConversations.client.description":
    "Name, phone, email or client_id - filter by client.",
  "toolCatalog.findConversations.category.description":
    "Conversation category name. List available categories with list_workspace_metadata(resource='categories').",
  "toolCatalog.findConversations.query.description":
    "Search query based on the text of the last message or client name (case-insensitive substring search).",
  "toolCatalog.findConversations.limit.description":
    "Maximum number of conversations to return. Default: 20. Allowed range is 1 to 100.",
  "toolCatalog.findConversations.channelType.description":
    "Channel type for filtering (for example: telegram, whatsapp_teletype, email, vk, viber, instagram_direct_business, etc.).",
  "toolCatalog.findConversations.page.description":
    "Results page number (default 1). Pages beyond the last one return an empty list.",
  "toolCatalog.findConversations.responseFormat.description":
    "'concise' (default) keeps the text output short. 'detailed' adds per-item fields to the text output (ids, statuses, timestamps, full message texts). structuredContent always contains every field regardless of this parameter.",
  "toolCatalog.lookupClientProfile.description":
    "Get a client's contact details, tags, custom fields, recent notes, and conversations in one call. Each recent_dialogs item includes link_to_dialog. Show these links as Markdown. Accepts a name, phone number, email, or client_id. If a name is ambiguous, the result lists candidates so you can retry with a client_id or phone number.",
  "toolCatalog.lookupClientProfile.client.description":
    "Client name, phone (any format), email or client_id.",
  "toolCatalog.lookupClientProfile.includeDialogHistory.description":
    "Whether to include a list of the last 5 conversations. Defaults to true.",
  "toolCatalog.lookupClientProfile.includeNotes.description":
    "Whether to include operator notes. Defaults to true.",
  "toolCatalog.lookupClientProfile.responseFormat.description":
    "'concise' (default) keeps the text output short. 'detailed' adds per-item fields to the text output (ids, statuses, timestamps, full message texts). structuredContent always contains every field regardless of this parameter.",
  "toolCatalog.readConversationThread.description":
    "Read a conversation's messages in chronological order, including authors, attachments, replies, delivery status, and timestamps. Also returns the channel, client, operator, and category. Show link_to_dialog when presenting the conversation and link_to_message when quoting a message. If dialog_id is already known, pass it directly without listing or searching conversations. Alternatively pass a client to read their latest conversation. When drafting a reply, do not promise actions, deadlines, or policy exceptions that the conversation does not establish.",
  "toolCatalog.readConversationThread.dialogId.description":
    "Conversation ID. Use a known ID directly. Call find_conversations only if the ID is missing.",
  "toolCatalog.readConversationThread.client.description":
    "Alternative dialog_id: name/phone/email/client_id. The client's last conversation will be taken.",
  "toolCatalog.readConversationThread.messagesLimit.description":
    "How many recent messages to return. Default is 50. Allowed range is 1 to 200.",
  "toolCatalog.readConversationThread.markSeen.description":
    "If true, marks the conversation as read by an operator (resets the unread badge in the Teletype panel). Requires confirm: true. Default is false.",
  "toolCatalog.readConversationThread.confirm.description":
    "Required only with mark_seen: true. Without it a mark_seen request is rejected and nothing is read. Without mark_seen the call only reads and leaves the unread state untouched.",
  "toolCatalog.readConversationThread.includeSessions.description":
    "Include the conversation's session history (dates, operators, statuses, and categories). Default: false.",
  "toolCatalog.readConversationThread.sessionId.description":
    "ID of a specific session to obtain extended information about it.",
  "toolCatalog.readConversationThread.includeGroupClients.description":
    "If true and the conversation is a group chat, returns a list of group members. Default is false.",
  "toolCatalog.readConversationThread.responseFormat.description":
    "'concise' (default) keeps the text output short. 'detailed' adds per-item fields to the text output (ids, statuses, timestamps, full message texts). structuredContent always contains every field regardless of this parameter.",
  "toolCatalog.readClientHistory.description":
    "Read a client's recent conversations in one call: the latest dialogs with their messages, channels, and links. Use it to get context on a client across several conversations before replying. read_conversation_thread returns the full metadata of one dialog. Accepts a name, phone number, email, or client_id.",
  "toolCatalog.readClientHistory.client.description":
    "Client name, phone (any format), email or client_id.",
  "toolCatalog.readClientHistory.dialogsLimit.description":
    "How many recent conversations to return, from 1 to 5. Default is 3.",
  "toolCatalog.readClientHistory.messagesPerDialog.description":
    "How many recent messages to return per conversation, from 1 to 20. Default is 10.",
  "toolCatalog.readClientHistory.responseFormat.description":
    "'concise' (default) keeps the text output short. 'detailed' adds per-item fields to the text output (ids, statuses, timestamps, full message texts). structuredContent always contains every field regardless of this parameter.",
  "toolCatalog.readClientHistory.title": "Read client history",
  "toolCatalog.sendReplyToClient.description":
    "Send a message only when the user asked to send it. Pass recipient_dialog_id for an existing conversation, or client and channel to start one. For a draft, use read_conversation_thread and write the draft without calling this tool. Supports text, project templates, attachments, and reply_to_message_id. Marks the conversation answered by default. Requires confirm: true. The result reports API acceptance, not confirmed delivery.",
  "toolCatalog.sendReplyToClient.recipientDialogId.description":
    "ID of the existing conversation to reply to. If set, the client/channel parameters are ignored.",
  "toolCatalog.sendReplyToClient.client.description":
    "For a NEW conversation: recipient's name/phone/email/client_id.",
  "toolCatalog.sendReplyToClient.channel.description":
    "For a NEW conversation: name or type of sending channel (telegram, whatsapp_teletype, email, etc.).",
  "toolCatalog.sendReplyToClient.text.description":
    "Message text. Optional if template_name is used.",
  "toolCatalog.sendReplyToClient.templateName.description":
    "The name of the template from the project library. List - list_workspace_metadata with resource='templates'.",
  "toolCatalog.sendReplyToClient.templateVariables.description":
    "Substitutions for the template: {'name': 'Ivan', 'order_id': '1234'}. In the template, variables are designated {{name}}.",
  "toolCatalog.sendReplyToClient.attachmentUrl.description":
    "Public URL of the file or image. Teletype will download the file from this URL and send it to the channel. Use if the file has already been uploaded to the cloud (S3 presigned, Dropbox direct, etc.).",
  "toolCatalog.sendReplyToClient.attachmentPath.description":
    "Absolute path to a local attachment. Available only in trusted stdio mode. HTTP rejects local paths. Takes precedence over attachment_url.",
  "toolCatalog.sendReplyToClient.replyToMessageId.description":
    "ID of the message that is being quoted.",
  "toolCatalog.sendReplyToClient.markDialogAnswered.description":
    "Whether to mark the conversation as answered after sending. Defaults to true.",
  "toolCatalog.sendReplyToClient.autoClose.description":
    "When sending through a channel (recipient_type='channel'), close the new session automatically (autoClose=1).",
  "toolCatalog.sendReplyToClient.createDialogOnly.description":
    "Create a conversation with a client in a channel without sending text (via /dialog/create). Requires client and channel.",
  "toolCatalog.sendReplyToClient.confirm.description":
    "Explicit confirmation of sending a message or creating a conversation.",
  "toolCatalog.annotateClientRecord.description":
    "Update client or conversation metadata in one call: add or remove tags, create a note, update custom fields, or set a category. Tags, notes, and fields apply to the client. dialog_category applies to the dialog and requires dialog_id. A note becomes a system message in the client's current conversation timeline, visible to operators in the Teletype panel. If an operation fails, other changes may still have been applied. Check partial_errors before retrying. Requires confirm: true.",
  "toolCatalog.annotateClientRecord.client.description":
    "Name/phone/email/client_id. Optional if dialog_id identifies the client.",
  "toolCatalog.annotateClientRecord.dialogId.description":
    "Conversation ID. Required for dialog_category and can identify the client for other changes.",
  "toolCatalog.annotateClientRecord.addTags.description":
    "Names of tags to add. Non-existent tags are listed in partial_errors.",
  "toolCatalog.annotateClientRecord.removeTags.description": "Names of tags to be deleted.",
  "toolCatalog.annotateClientRecord.note.description":
    "The text of the new note. It appears in the client's current conversation timeline, visible to operators.",
  "toolCatalog.annotateClientRecord.deleteNoteId.description":
    "ID of the client note to delete (obtained from lookup_client_profile).",
  "toolCatalog.annotateClientRecord.customFields.description":
    "Dictionary of custom fields: {'order_id': '1234', 'segment': 'B2B'}. Replaces existing values by key.",
  "toolCatalog.annotateClientRecord.dialogCategory.description":
    "Category name for the dialog (requires dialog_id).",
  "toolCatalog.annotateClientRecord.name.description": "Update client display name.",
  "toolCatalog.annotateClientRecord.phone.description": "Update the client's phone.",
  "toolCatalog.annotateClientRecord.email.description": "Update client email.",
  "toolCatalog.annotateClientRecord.additionalPayload.description":
    "Additional client data (JSON string or object, for example { source: 'website' }).",
  "toolCatalog.annotateClientRecord.forceAdditionalPayload.description":
    "Overwrite the data available in the additional information array (true) instead of merging it (false).",
  "toolCatalog.annotateClientRecord.confirm.description":
    "Explicit confirmation of changes to client data or conversation.",
  "toolCatalog.resolveConversation.description":
    "Close a conversation or hand it to an operator. Default: close=true. Use close=false only when the user wants it left open. Category, tags, operator, and final note are optional, separate changes. Closing does not require a category. Look up exact category and tag names before using them. Requires confirm: true. Read applied and partial_errors before reporting or retrying.",
  "toolCatalog.resolveConversation.dialogId.description":
    "Conversation ID. Use a known ID directly. Look it up only if the ID is missing.",
  "toolCatalog.resolveConversation.assignOperator.description":
    "Assign an operator to the conversation (ID, name, email of the operator, or 'auto' for automatic distribution).",
  "toolCatalog.resolveConversation.close.description":
    "Close the dialog after completing other actions (true by default). Specify false if you only want to assign an operator, set a category or tags, leaving the dialog open.",
  "toolCatalog.resolveConversation.finalNote.description":
    "A final note about the client is attached upon closing.",
  "toolCatalog.resolveConversation.category.description":
    "Optional exact category name. First list_workspace_metadata(resource='categories') if the user requested a category. Do not infer or translate a category name from 'resolved' or 'closed'. Omit this field when merely closing a conversation.",
  "toolCatalog.resolveConversation.addTags.description": "Client tags to add when closing.",
  "toolCatalog.resolveConversation.markUnanswered.description":
    "If true, it does not close the conversation, but marks its open requests as unanswered. Closed requests are not re-opened.",
  "toolCatalog.resolveConversation.markAnswered.description":
    "If true, marks open requests in the conversation as answered (clears the unanswered flag).",
  "toolCatalog.resolveConversation.confirm.description":
    "Explicit confirmation to close or mark the conversation as unanswered/answered.",
  "toolCatalog.listWorkspaceMetadata.description":
    "Look up project channels, tags, categories, quick reply templates, operators, or groups. Set resource to the requested kind. The default 'all' can truncate each list and does extra API work. Use resource='channels' for channel names and active state, or resource='categories' before assigning a category. WABA templates are separate. Results are cached for one minute.",
  "toolCatalog.listWorkspaceMetadata.resource.description":
    "Choose one resource when possible: channels, tags, categories, templates, template_directories, operators, or groups. 'all' returns several limited lists and is for requests about the whole workspace.",
  "toolCatalog.listWorkspaceMetadata.groupId.description":
    "Optional: ID or group name for obtaining detailed data (operators, supervisors, channels) via /group/view/:groupId.",
  "toolCatalog.listWorkspaceMetadata.channelType.description":
    "For resource='channels': filtering by channel type (for example telegram, email, whatsapp_teletype).",
  "toolCatalog.listWorkspaceMetadata.onlyActive.description":
    "For resource='channels': return only active channels.",
  "toolCatalog.getProjectStatus.description":
    "Check project health: finances, operator availability, Public API status, channel activity, and webhook errors. For a technical check of channels or the Public API, set aspect='technical'. Use list_workspace_metadata(resource='channels') when the user wants the channel inventory. Includes derived warnings.",
  "toolCatalog.getProjectStatus.aspect.description":
    "Choose 'technical' for channels, Public API, or webhook health, 'financial' for balance and billing, 'team' for operators, or 'all' for a whole-project overview. Default is 'all'.",
  "toolCatalog.getProjectStatus.includeWarnings.description":
    "Whether to include a derived warning block. Defaults to true.",
  "toolCatalog.getProjectStatus.operatorDetails.description":
    "If true, an expanded list of operators is returned to team. Default is false.",
  "toolCatalog.manageSentMessage.description":
    "Manage a sent message in Teletype by its message_id: edit the text, delete it, or resend after failure. If the user supplied message_id, use it directly rather than searching message text. Otherwise take it from the send result's message_ids or read_conversation_thread. Requires an explicit confirm: true.",
  "toolCatalog.manageSentMessage.messageId.description":
    "Message ID obtained from send_reply_to_client or read_conversation_thread.",
  "toolCatalog.manageSentMessage.action.description":
    "Action: 'update' (edit text), 'delete' (delete), 'resend' (resend).",
  "toolCatalog.manageSentMessage.text.description":
    "New message text (required for action='update').",
  "toolCatalog.manageSentMessage.confirm.description": "Confirms the requested message operation.",
  "toolCatalog.sendWhatsappTemplate.description":
    "Send a WABA-approved template in an existing Edna WhatsApp conversation outside the 24-hour service window. Get the WABA template ID from project settings or the user. Quick reply templates returned by list_workspace_metadata are different. Requires confirm: true.",
  "toolCatalog.sendWhatsappTemplate.channelId.description":
    "WhatsApp channel ID. Use a known ID directly. Call list_workspace_metadata(resource='channels') only if it is missing.",
  "toolCatalog.sendWhatsappTemplate.dialogId.description":
    "Conversation ID. Use a known ID directly. Call find_conversations only if it is missing.",
  "toolCatalog.sendWhatsappTemplate.templateId.description":
    "ID of a WABA approved template imported from Edna. It is not in resource='templates' with the list of quick responses.",
  "toolCatalog.sendWhatsappTemplate.templateParams.description":
    "Template parameters: text_variables (array of strings for variables like {{1}}, {{2}}), button_variables, header_variables, attachment.",
  "toolCatalog.sendWhatsappTemplate.templateParams.textVariables.description":
    "Text values to be substituted into the template body.",
  "toolCatalog.sendWhatsappTemplate.templateParams.headerVariables.description":
    "Values for variables in the template header.",
  "toolCatalog.sendWhatsappTemplate.templateParams.buttonVariables.description":
    "Values for template button variables.",
  "toolCatalog.sendWhatsappTemplate.confirm.description":
    "Confirms sending the WhatsApp template to the client.",
  "toolCatalog.manageOperatorGroup.description":
    "Manage operator groups: add or remove members, link or unlink channels, assign supervisors, and control visibility of other operators' conversations. Take group names from list_workspace_metadata(resource='groups'). Requires confirm: true.",
  "toolCatalog.manageOperatorGroup.action.description":
    "Action: add_member (add operator), remove_member (remove operator), add_channel (bind channel), remove_channel (unlink channel), set_supervisor (assign/remove supervisor), set_channel_visibility (dialog visibility).",
  "toolCatalog.manageOperatorGroup.group.description":
    "Operator group name or ID (get it via list_workspace_metadata with resource='groups').",
  "toolCatalog.manageOperatorGroup.operator.description":
    "Operator name or ID (for add_member, remove_member, set_supervisor).",
  "toolCatalog.manageOperatorGroup.channel.description":
    "Channel name or ID (for add_channel, remove_channel, set_channel_visibility).",
  "toolCatalog.manageOperatorGroup.isSupervisor.description":
    "For set_supervisor, true grants supervisor access and false removes it.",
  "toolCatalog.manageOperatorGroup.canViewOtherDialogs.description":
    "For set_channel_visibility: true - allow viewing of other people's conversations in the channel, false - prohibit.",
  "toolCatalog.manageOperatorGroup.confirm.description":
    "Explicit confirmation of a group configuration change.",
  "toolCatalog.configureProjectWebhook.description":
    "Configure the project's Public API webhook URL and active events. An empty active_events list disables all events. Requires confirm: true.",
  "toolCatalog.configureProjectWebhook.webhookUrl.description":
    "URL that receives webhooks. An empty string removes the current URL.",
  "toolCatalog.configureProjectWebhook.activeEvents.description":
    "List of events to activate. A missing or empty list disables all events.",
  "toolCatalog.configureProjectWebhook.confirm.description":
    "Explicit confirmation of changing the project webhook settings.",
  "toolCatalog.findConversations.title": "Find conversations",
  "toolCatalog.lookupClientProfile.title": "Client profile lookup",
  "toolCatalog.readConversationThread.title": "Read conversation thread",
  "toolCatalog.sendReplyToClient.title": "Send reply to client",
  "toolCatalog.annotateClientRecord.title": "Annotate client record",
  "toolCatalog.resolveConversation.title": "Resolve conversation",
  "toolCatalog.listWorkspaceMetadata.title": "Workspace metadata",
  "toolCatalog.getProjectStatus.title": "Project status",
  "toolCatalog.manageSentMessage.title": "Manage sent message",
  "toolCatalog.sendWhatsappTemplate.title": "Send WhatsApp template",
  "toolCatalog.manageOperatorGroup.title": "Manage operator group",
  "toolCatalog.configureProjectWebhook.title": "Configure project webhook",
  "toolCatalog.getCapabilities.title": "Server capabilities",
  "toolCatalog.getCapabilities.description":
    "Return the server's active tool map: read-only mode, active toolsets, registered tools with their toolset and whether they write data, locale, and local-upload availability. Call this first when unsure which tools or filters are available. It fetches the project identity once and caches it for 10 minutes.",
  "toolCatalog.sendReplyToClient.dryRun.description":
    "Preview only: resolve the recipient, render the template, and return the full target without sending anything. Does not require confirm.",
  "toolCatalog.sendWhatsappTemplate.dryRun.description":
    "Preview only: validate parameters and return the target conversation and template without sending. Does not require confirm.",
} as const;
