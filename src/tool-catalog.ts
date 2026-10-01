import { t } from "./i18n.js";
import type { Tool } from "@modelcontextprotocol/server";
import type { FromSchema } from "json-schema-to-ts";

export const TOOL_CATALOG = [
  {
    name: "find_conversations",
    description: t("toolCatalog.findConversations.description"),
    title: t("toolCatalog.findConversations.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["unanswered", "open", "close", "all"],
          description: t("toolCatalog.findConversations.status.description"),
        },
        channel: {
          type: "string",
          description: t("toolCatalog.findConversations.channel.description"),
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: t("toolCatalog.findConversations.tags.description"),
        },
        operator: {
          type: "string",
          description: t("toolCatalog.findConversations.operator.description"),
        },
        client: {
          type: "string",
          description: t("toolCatalog.findConversations.client.description"),
        },
        category: {
          type: "string",
          description: t("toolCatalog.findConversations.category.description"),
        },
        query: {
          type: "string",
          description: t("toolCatalog.findConversations.query.description"),
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: t("toolCatalog.findConversations.limit.description"),
        },
        channel_type: {
          type: "string",
          description: t("toolCatalog.findConversations.channelType.description"),
        },
        page: {
          type: "integer",
          minimum: 1,
          description: t("toolCatalog.findConversations.page.description"),
        },
        response_format: {
          type: "string",
          enum: ["concise", "detailed"],
          description: t("toolCatalog.findConversations.responseFormat.description"),
        },
      },
    },

    outputSchema: {
      type: "object",
      properties: {
        total_returned: { type: "integer" },
        search_truncated: { type: "boolean" },
        has_more: { type: "boolean" },
        next_page_hint: { anyOf: [{ type: "string" }, { type: "null" }] },
        notices: { type: "array", items: { type: "string" } },
        defaults_applied: { type: "object" },
        resolved: { type: "object" },
        dialogs: { type: "array", items: { type: "object" } },
      },
      required: ["total_returned", "search_truncated", "dialogs"],
      additionalProperties: true,
    },
    handlerKey: "findConversations",
    writesData: false,
  },
  {
    name: "list_clients",
    description: t("toolCatalog.listClients.description"),
    title: t("toolCatalog.listClients.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        phone: { type: "string", description: t("toolCatalog.listClients.phone.description") },
        page: {
          type: "integer",
          minimum: 1,
          description: t("toolCatalog.listClients.page.description"),
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: t("toolCatalog.listClients.limit.description"),
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        clients: { type: "array", items: { type: "object" } },
        total_returned: { type: "integer" },
        page: { type: "integer" },
        has_more: { type: "boolean" },
      },
      required: ["clients", "total_returned", "page", "has_more"],
      additionalProperties: true,
    },
    handlerKey: "listClients",
    writesData: false,
  },
  {
    name: "find_messages",
    description: t("toolCatalog.findMessages.description"),
    title: t("toolCatalog.findMessages.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: t("toolCatalog.findMessages.query.description") },
        dialog_id: {
          type: "string",
          description: t("toolCatalog.findMessages.dialogId.description"),
        },
        client_id: {
          type: "string",
          description: t("toolCatalog.findMessages.clientId.description"),
        },
        channel: { type: "string", description: t("toolCatalog.findMessages.channel.description") },
        only_active: {
          type: "boolean",
          description: t("toolCatalog.findMessages.onlyActive.description"),
        },
        page: {
          type: "integer",
          minimum: 1,
          description: t("toolCatalog.findMessages.page.description"),
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: t("toolCatalog.findMessages.limit.description"),
        },
        response_format: {
          type: "string",
          enum: ["concise", "detailed"],
          description: t("toolCatalog.findMessages.responseFormat.description"),
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        messages: { type: "array", items: { type: "object" } },
        total_returned: { type: "integer" },
        page: { type: "integer" },
        has_more: { type: "boolean" },
      },
      required: ["messages", "total_returned", "page", "has_more"],
      additionalProperties: true,
    },
    handlerKey: "findMessages",
    writesData: false,
  },
  {
    name: "lookup_client_profile",
    description: t("toolCatalog.lookupClientProfile.description"),
    title: t("toolCatalog.lookupClientProfile.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        client: {
          type: "string",
          description: t("toolCatalog.lookupClientProfile.client.description"),
        },
        include_dialog_history: {
          type: "boolean",
          description: t("toolCatalog.lookupClientProfile.includeDialogHistory.description"),
        },
        include_notes: {
          type: "boolean",
          description: t("toolCatalog.lookupClientProfile.includeNotes.description"),
        },
        response_format: {
          type: "string",
          enum: ["concise", "detailed"],
          description: t("toolCatalog.lookupClientProfile.responseFormat.description"),
        },
      },
      required: ["client"],
    },

    outputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        recent_dialogs: { type: "array", items: { type: "object" } },
        partial_errors: { type: "array", items: { type: "string" } },
      },
      required: ["client_id", "recent_dialogs", "partial_errors"],
      additionalProperties: true,
    },
    handlerKey: "lookupClientProfile",
    writesData: false,
  },
  {
    name: "read_conversation_thread",
    description: t("toolCatalog.readConversationThread.description"),
    title: t("toolCatalog.readConversationThread.title"),
    toolset: "conversations",
    // Claude Code omits this tool if its input schema uses conditional if/then.
    // The handler checks confirm before marking a dialog as seen.
    inputSchema: {
      type: "object",
      properties: {
        dialog_id: {
          type: "string",
          description: t("toolCatalog.readConversationThread.dialogId.description"),
        },
        client: {
          type: "string",
          description: t("toolCatalog.readConversationThread.client.description"),
        },
        messages_limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          description: t("toolCatalog.readConversationThread.messagesLimit.description"),
        },
        mark_seen: {
          type: "boolean",
          description: t("toolCatalog.readConversationThread.markSeen.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.readConversationThread.confirm.description"),
        },
        include_sessions: {
          type: "boolean",
          description: t("toolCatalog.readConversationThread.includeSessions.description"),
        },
        session_id: {
          type: "string",
          description: t("toolCatalog.readConversationThread.sessionId.description"),
        },
        include_group_clients: {
          type: "boolean",
          description: t("toolCatalog.readConversationThread.includeGroupClients.description"),
        },
        response_format: {
          type: "string",
          enum: ["concise", "detailed"],
          description: t("toolCatalog.readConversationThread.responseFormat.description"),
        },
      },
    },

    outputSchema: {
      type: "object",
      properties: {
        dialog_id: { type: "string" },
        messages_count: { type: "integer" },
        messages: { type: "array", items: { type: "object" } },
        marked_seen: { type: "boolean" },
        notices: { type: "array", items: { type: "string" } },
      },
      required: ["dialog_id", "messages_count", "messages"],
      additionalProperties: true,
    },
    handlerKey: "readConversationThread",
    writesData: false,
  },
  {
    name: "read_client_history",
    description: t("toolCatalog.readClientHistory.description"),
    title: t("toolCatalog.readClientHistory.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        client: {
          type: "string",
          description: t("toolCatalog.readClientHistory.client.description"),
        },
        dialogs_limit: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          description: t("toolCatalog.readClientHistory.dialogsLimit.description"),
        },
        messages_per_dialog: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          description: t("toolCatalog.readClientHistory.messagesPerDialog.description"),
        },
        response_format: {
          type: "string",
          enum: ["concise", "detailed"],
          description: t("toolCatalog.readClientHistory.responseFormat.description"),
        },
      },
      required: ["client"],
    },
    outputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        client_name: { type: "string" },
        dialogs_returned: { type: "integer" },
        dialogs: { type: "array", items: { type: "object" } },
        partial_errors: { type: "array", items: { type: "string" } },
      },
      required: ["client_id", "client_name", "dialogs_returned", "dialogs", "partial_errors"],
      additionalProperties: true,
    },
    handlerKey: "readClientHistory",
    writesData: false,
  },
  {
    name: "send_reply_to_client",
    description: t("toolCatalog.sendReplyToClient.description"),
    title: t("toolCatalog.sendReplyToClient.title"),
    toolset: "messaging",
    inputSchema: {
      type: "object",
      properties: {
        recipient_dialog_id: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.recipientDialogId.description"),
        },
        client: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.client.description"),
        },
        channel: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.channel.description"),
        },
        text: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.text.description"),
        },
        template_name: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.templateName.description"),
        },
        template_variables: {
          type: "object",
          description: t("toolCatalog.sendReplyToClient.templateVariables.description"),
          additionalProperties: { type: "string" },
        },
        attachment_url: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.attachmentUrl.description"),
        },
        attachment_path: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.attachmentPath.description"),
        },
        reply_to_message_id: {
          type: "string",
          description: t("toolCatalog.sendReplyToClient.replyToMessageId.description"),
        },
        mark_dialog_answered: {
          type: "boolean",
          description: t("toolCatalog.sendReplyToClient.markDialogAnswered.description"),
        },
        auto_close: {
          type: "boolean",
          description: t("toolCatalog.sendReplyToClient.autoClose.description"),
        },
        create_dialog_only: {
          type: "boolean",
          description: t("toolCatalog.sendReplyToClient.createDialogOnly.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.sendReplyToClient.confirm.description"),
        },
        dry_run: {
          type: "boolean",
          description: t("toolCatalog.sendReplyToClient.dryRun.description"),
        },
      },
    },

    outputSchema: {
      type: "object",
      properties: {
        accepted: { type: "boolean" },
        delivery_confirmed: { type: "boolean" },
        message_ids: { type: "array", items: { type: "string" } },
        dry_run: { type: "boolean" },
      },
      required: [],
      additionalProperties: true,
    },
    handlerKey: "sendReplyToClient",
    writesData: true,
  },
  {
    name: "create_dialog_by_phone",
    description: t("toolCatalog.createDialogByPhone.description"),
    title: t("toolCatalog.createDialogByPhone.title"),
    toolset: "messaging",
    inputSchema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: t("toolCatalog.createDialogByPhone.phone.description"),
        },
        channel: {
          type: "string",
          description: t("toolCatalog.createDialogByPhone.channel.description"),
        },
        dry_run: {
          type: "boolean",
          description: t("toolCatalog.createDialogByPhone.dryRun.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.createDialogByPhone.confirm.description"),
        },
      },
      required: ["phone", "channel"],
    },
    outputSchema: {
      type: "object",
      properties: {
        dry_run: { type: "boolean" },
        created_or_found: { type: "boolean" },
        dialog_id: { type: "string" },
        dialog_url: { type: "string" },
      },
      required: ["dry_run", "created_or_found"],
      additionalProperties: true,
    },
    handlerKey: "createDialogByPhone",
    writesData: true,
  },
  {
    name: "annotate_client_record",
    description: t("toolCatalog.annotateClientRecord.description"),
    title: t("toolCatalog.annotateClientRecord.title"),
    toolset: "messaging",
    inputSchema: {
      type: "object",
      properties: {
        client: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.client.description"),
        },
        dialog_id: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.dialogId.description"),
        },
        add_tags: {
          type: "array",
          items: { type: "string" },
          description: t("toolCatalog.annotateClientRecord.addTags.description"),
        },
        remove_tags: {
          type: "array",
          items: { type: "string" },
          description: t("toolCatalog.annotateClientRecord.removeTags.description"),
        },
        note: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.note.description"),
        },
        delete_note_id: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.deleteNoteId.description"),
        },
        custom_fields: {
          type: "object",
          description: t("toolCatalog.annotateClientRecord.customFields.description"),
          additionalProperties: true,
        },
        dialog_category: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.dialogCategory.description"),
        },
        name: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.name.description"),
        },
        phone: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.phone.description"),
        },
        email: {
          type: "string",
          description: t("toolCatalog.annotateClientRecord.email.description"),
        },
        additional_payload: {
          description: t("toolCatalog.annotateClientRecord.additionalPayload.description"),
          oneOf: [{ type: "object", additionalProperties: true }, { type: "string" }],
        },
        force_additional_payload: {
          type: "boolean",
          description: t("toolCatalog.annotateClientRecord.forceAdditionalPayload.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.annotateClientRecord.confirm.description"),
        },
      },
      required: ["confirm"],
    },

    outputSchema: {
      type: "object",
      properties: {
        applied: { type: "object" },
        partial_errors: { type: "array", items: { type: "string" } },
      },
      required: ["applied", "partial_errors"],
      additionalProperties: true,
    },
    handlerKey: "annotateClientRecord",
    writesData: true,
  },
  {
    name: "resolve_conversation",
    description: t("toolCatalog.resolveConversation.description"),
    title: t("toolCatalog.resolveConversation.title"),
    toolset: "conversations",
    inputSchema: {
      type: "object",
      properties: {
        dialog_id: {
          type: "string",
          description: t("toolCatalog.resolveConversation.dialogId.description"),
        },
        assign_operator: {
          type: "string",
          description: t("toolCatalog.resolveConversation.assignOperator.description"),
        },
        close: {
          type: "boolean",
          description: t("toolCatalog.resolveConversation.close.description"),
        },
        final_note: {
          type: "string",
          description: t("toolCatalog.resolveConversation.finalNote.description"),
        },
        category: {
          type: "string",
          description: t("toolCatalog.resolveConversation.category.description"),
        },
        add_tags: {
          type: "array",
          items: { type: "string" },
          description: t("toolCatalog.resolveConversation.addTags.description"),
        },
        mark_unanswered: {
          type: "boolean",
          description: t("toolCatalog.resolveConversation.markUnanswered.description"),
        },
        mark_answered: {
          type: "boolean",
          description: t("toolCatalog.resolveConversation.markAnswered.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.resolveConversation.confirm.description"),
        },
      },
      required: ["dialog_id", "confirm"],
    },

    outputSchema: {
      type: "object",
      properties: {
        dialog_id: { type: "string" },
        applied: { type: "object" },
        partial_errors: { type: "array", items: { type: "string" } },
      },
      required: ["dialog_id", "applied", "partial_errors"],
      additionalProperties: true,
    },
    handlerKey: "resolveConversation",
    writesData: true,
  },
  {
    name: "list_workspace_metadata",
    description: t("toolCatalog.listWorkspaceMetadata.description"),
    title: t("toolCatalog.listWorkspaceMetadata.title"),
    toolset: "admin",
    inputSchema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: [
            "channels",
            "tags",
            "categories",
            "templates",
            "template_directories",
            "operators",
            "groups",
            "all",
          ],
          description: t("toolCatalog.listWorkspaceMetadata.resource.description"),
        },
        group_id: {
          type: "string",
          description: t("toolCatalog.listWorkspaceMetadata.groupId.description"),
        },
        channel_type: {
          type: "string",
          description: t("toolCatalog.listWorkspaceMetadata.channelType.description"),
        },
        only_active: {
          type: "boolean",
          description: t("toolCatalog.listWorkspaceMetadata.onlyActive.description"),
        },
      },
    },

    outputSchema: {
      type: "object",
      properties: {
        resource_errors: { type: "object" },
        group: { type: "object" },
      },
      required: ["resource_errors"],
      additionalProperties: true,
    },
    handlerKey: "listWorkspaceMetadata",
    writesData: false,
  },
  {
    name: "get_project_status",
    description: t("toolCatalog.getProjectStatus.description"),
    title: t("toolCatalog.getProjectStatus.title"),
    toolset: "admin",
    inputSchema: {
      type: "object",
      properties: {
        aspect: {
          type: "string",
          enum: ["financial", "team", "technical", "all"],
          description: t("toolCatalog.getProjectStatus.aspect.description"),
        },
        include_warnings: {
          type: "boolean",
          description: t("toolCatalog.getProjectStatus.includeWarnings.description"),
        },
        operator_details: {
          type: "boolean",
          description: t("toolCatalog.getProjectStatus.operatorDetails.description"),
        },
      },
    },

    outputSchema: { type: "object", additionalProperties: true },
    handlerKey: "getProjectStatus",
    writesData: false,
  },
  {
    name: "manage_sent_message",
    description: t("toolCatalog.manageSentMessage.description"),
    title: t("toolCatalog.manageSentMessage.title"),
    toolset: "messaging",
    inputSchema: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: t("toolCatalog.manageSentMessage.messageId.description"),
        },
        action: {
          type: "string",
          enum: ["update", "delete", "resend"],
          description: t("toolCatalog.manageSentMessage.action.description"),
        },
        text: {
          type: "string",
          description: t("toolCatalog.manageSentMessage.text.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.manageSentMessage.confirm.description"),
        },
      },
      required: ["message_id", "action", "confirm"],
    },

    outputSchema: {
      type: "object",
      properties: {
        message_id: { type: "string" },
        action: { type: "string" },
        status: { type: "string" },
      },
      required: ["message_id", "action", "status"],
      additionalProperties: true,
    },
    handlerKey: "manageSentMessage",
    writesData: true,
  },
  {
    name: "send_whatsapp_template",
    description: t("toolCatalog.sendWhatsappTemplate.description"),
    title: t("toolCatalog.sendWhatsappTemplate.title"),
    toolset: "messaging",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: t("toolCatalog.sendWhatsappTemplate.channelId.description"),
        },
        dialog_id: {
          type: "string",
          description: t("toolCatalog.sendWhatsappTemplate.dialogId.description"),
        },
        template_id: {
          type: "string",
          description: t("toolCatalog.sendWhatsappTemplate.templateId.description"),
        },
        template_params: {
          type: "object",
          description: t("toolCatalog.sendWhatsappTemplate.templateParams.description"),
          properties: {
            text_variables: {
              type: "array",
              items: { type: "string" },
              description: t(
                "toolCatalog.sendWhatsappTemplate.templateParams.textVariables.description",
              ),
            },
            header_variables: {
              type: "array",
              items: { type: "string" },
              description: t(
                "toolCatalog.sendWhatsappTemplate.templateParams.headerVariables.description",
              ),
            },
            button_variables: {
              type: "array",
              items: { type: "string" },
              description: t(
                "toolCatalog.sendWhatsappTemplate.templateParams.buttonVariables.description",
              ),
            },
            attachment: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                name: { type: "string" },
              },
              required: ["url"],
            },
          },
          additionalProperties: true,
        },
        template_options: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "REALTIME"] },
            sendDelay: { type: "integer", minimum: 0 },
            comment: { type: "string" },
          },
          additionalProperties: true,
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.sendWhatsappTemplate.confirm.description"),
        },
        dry_run: {
          type: "boolean",
          description: t("toolCatalog.sendWhatsappTemplate.dryRun.description"),
        },
      },
      required: ["channel_id", "dialog_id", "template_id"],
    },

    outputSchema: {
      type: "object",
      properties: {
        channel_id: { type: "string" },
        dialog_id: { type: "string" },
        template_id: { type: "string" },
        message_ids: { type: "array", items: { type: "string" } },
        accepted: { type: "boolean" },
        delivery_confirmed: { type: "boolean" },
        dry_run: { type: "boolean" },
      },
      required: ["channel_id", "dialog_id", "template_id"],
      additionalProperties: true,
    },
    handlerKey: "sendWhatsappTemplate",
    writesData: true,
  },
  {
    name: "manage_operator_group",
    description: t("toolCatalog.manageOperatorGroup.description"),
    title: t("toolCatalog.manageOperatorGroup.title"),
    toolset: "admin",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "add_member",
            "remove_member",
            "add_channel",
            "remove_channel",
            "set_supervisor",
            "set_channel_visibility",
          ],
          description: t("toolCatalog.manageOperatorGroup.action.description"),
        },
        group: {
          type: "string",
          description: t("toolCatalog.manageOperatorGroup.group.description"),
        },
        operator: {
          type: "string",
          description: t("toolCatalog.manageOperatorGroup.operator.description"),
        },
        channel: {
          type: "string",
          description: t("toolCatalog.manageOperatorGroup.channel.description"),
        },
        is_supervisor: {
          type: "boolean",
          description: t("toolCatalog.manageOperatorGroup.isSupervisor.description"),
        },
        can_view_other_dialogs: {
          type: "boolean",
          description: t("toolCatalog.manageOperatorGroup.canViewOtherDialogs.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.manageOperatorGroup.confirm.description"),
        },
      },
      required: ["action", "group", "confirm"],
    },

    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        action: { type: "string" },
        group_id: { type: "string" },
        hint: { type: "string" },
      },
      required: ["success", "action", "group_id"],
      additionalProperties: true,
    },
    handlerKey: "manageOperatorGroup",
    writesData: true,
  },
  {
    name: "configure_project_webhook",
    description: t("toolCatalog.configureProjectWebhook.description"),
    title: t("toolCatalog.configureProjectWebhook.title"),
    toolset: "admin",
    inputSchema: {
      type: "object",
      properties: {
        webhook_url: {
          type: "string",
          description: t("toolCatalog.configureProjectWebhook.webhookUrl.description"),
        },
        active_events: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "new message",
              "success send",
              "message status change",
              "message deleted",
              "new note",
              "new dialog",
              "open dialog",
              "close dialog",
              "person change",
              "appeal rate",
              "messages templates updated",
              "session operator changed",
              "channel deleted",
              "channel status updated",
            ],
          },
          description: t("toolCatalog.configureProjectWebhook.activeEvents.description"),
        },
        confirm: {
          type: "boolean",
          const: true,
          description: t("toolCatalog.configureProjectWebhook.confirm.description"),
        },
      },
      required: ["confirm"],
    },

    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        webhook_url: { anyOf: [{ type: "string" }, { type: "null" }] },
        active_events: { type: "array", items: { type: "string" } },
      },
      required: ["success"],
      additionalProperties: true,
    },
    handlerKey: "configureProjectWebhook",
    writesData: true,
  },
  {
    name: "get_capabilities",
    description: t("toolCatalog.getCapabilities.description"),
    title: t("toolCatalog.getCapabilities.title"),
    toolset: "meta",
    inputSchema: {
      type: "object",
      properties: {},
    },

    outputSchema: {
      type: "object",
      properties: {
        read_only: { type: "boolean" },
        active_toolsets: { type: "array", items: { type: "string" } },
        available_toolsets: { type: "array", items: { type: "string" } },
        project: { type: "object" },
        tools: { type: "array", items: { type: "object" } },
        locale: { type: "string" },
        local_uploads: { type: "boolean" },
        notes: { type: "array", items: { type: "string" } },
      },
      required: ["read_only", "active_toolsets", "tools"],
      additionalProperties: true,
    },
    handlerKey: "getCapabilities",
    writesData: false,
  },
] as const;

export type ToolName = (typeof TOOL_CATALOG)[number]["name"];
export type ToolArgs<Name extends ToolName> = FromSchema<
  Extract<(typeof TOOL_CATALOG)[number], { name: Name }>["inputSchema"]
>;

export type ToolContract = (typeof TOOL_CATALOG)[number];

export const TOOLSET_NAMES = ["conversations", "messaging", "admin", "meta"] as const;

export type ToolsetName = (typeof TOOLSET_NAMES)[number];

export function toolsetOf(name: ToolName): ToolsetName {
  const entry = (TOOL_CATALOG as readonly { name: string; toolset: ToolsetName }[]).find(
    (tool) => tool.name === name,
  );
  return entry?.toolset ?? "meta";
}

export function makeToolDefinition(definition: ToolContract): Tool & { name: ToolName } {
  const tool = structuredClone(definition) as Tool & { name: ToolName };
  Reflect.deleteProperty(tool, "handlerKey");
  Reflect.deleteProperty(tool, "writesData");
  Reflect.deleteProperty(tool, "toolset");
  const canMarkSeen = tool.name === "read_conversation_thread";
  tool.inputSchema.additionalProperties = false;
  tool.annotations = {
    title: definition.title,
    readOnlyHint: !definition.writesData && !canMarkSeen,
    destructiveHint: definition.writesData,
    idempotentHint: !definition.writesData,
    openWorldHint: true,
  };
  return tool;
}
