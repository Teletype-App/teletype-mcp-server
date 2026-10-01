import { TeletypeApiError } from "./teletype-api.js";
import { loadChannels } from "./entity-resolver.js";
import { TOOL_CATALOG, makeToolDefinition, type ToolArgs, type ToolName } from "./tool-catalog.js";
import { errorResult } from "./tool-helpers.js";
import {
  findConversations,
  listClients,
  findMessages,
  lookupClientProfile,
  readConversationThread,
  readClientHistory,
  resolveConversation,
} from "./conversation-tools.js";
import {
  sendReplyToClient,
  createDialogByPhone,
  manageSentMessage,
  sendWhatsappTemplate,
  annotateClientRecord,
} from "./messaging-tools.js";
import {
  listWorkspaceMetadata,
  getProjectStatus,
  manageOperatorGroup,
  configureProjectWebhook,
  getCapabilities,
} from "./workspace-tools.js";
import type { ToolResult } from "./types.js";

export class TeletypeTools {
  static async findConversations(args: ToolArgs<"find_conversations">): Promise<ToolResult> {
    return findConversations(args);
  }
  static async listClients(args: ToolArgs<"list_clients">): Promise<ToolResult> {
    return listClients(args);
  }
  static async findMessages(args: ToolArgs<"find_messages">): Promise<ToolResult> {
    return findMessages(args);
  }
  static async lookupClientProfile(args: ToolArgs<"lookup_client_profile">): Promise<ToolResult> {
    return lookupClientProfile(args);
  }
  static async readConversationThread(
    args: ToolArgs<"read_conversation_thread">,
  ): Promise<ToolResult> {
    return readConversationThread(args);
  }
  static async readClientHistory(args: ToolArgs<"read_client_history">): Promise<ToolResult> {
    return readClientHistory(args);
  }
  static async sendReplyToClient(args: ToolArgs<"send_reply_to_client">): Promise<ToolResult> {
    return sendReplyToClient(args);
  }
  static async createDialogByPhone(args: ToolArgs<"create_dialog_by_phone">): Promise<ToolResult> {
    return createDialogByPhone(args);
  }
  static async manageSentMessage(args: ToolArgs<"manage_sent_message">): Promise<ToolResult> {
    return manageSentMessage(args);
  }
  static async sendWhatsappTemplate(args: ToolArgs<"send_whatsapp_template">): Promise<ToolResult> {
    return sendWhatsappTemplate(args);
  }
  static async annotateClientRecord(args: ToolArgs<"annotate_client_record">): Promise<ToolResult> {
    return annotateClientRecord(args);
  }
  static async resolveConversation(args: ToolArgs<"resolve_conversation">): Promise<ToolResult> {
    return resolveConversation(args);
  }
  static async listWorkspaceMetadata(
    args: ToolArgs<"list_workspace_metadata">,
  ): Promise<ToolResult> {
    return listWorkspaceMetadata(args);
  }
  static async getProjectStatus(args: ToolArgs<"get_project_status">): Promise<ToolResult> {
    return getProjectStatus(args);
  }
  static async manageOperatorGroup(args: ToolArgs<"manage_operator_group">): Promise<ToolResult> {
    return manageOperatorGroup(args);
  }
  static async configureProjectWebhook(
    args: ToolArgs<"configure_project_webhook">,
  ): Promise<ToolResult> {
    return configureProjectWebhook(args);
  }
  static getCapabilities(args: ToolArgs<"get_capabilities">): Promise<ToolResult> {
    return Promise.resolve(getCapabilities(args));
  }
}

export { TeletypeApiError, errorResult, loadChannels };

export const TOOL_DEFINITIONS = TOOL_CATALOG.map(makeToolDefinition);

export const TOOL_REGISTRY = TOOL_CATALOG.map((contract) => ({
  ...makeToolDefinition(contract),
  handler: TeletypeTools[contract.handlerKey].bind(TeletypeTools),
}));

export const TOOL_DISPATCH = Object.fromEntries(
  TOOL_REGISTRY.map(({ name, handler }) => [name, handler]),
) as { [Name in ToolName]: (args: ToolArgs<Name>) => Promise<ToolResult> };
