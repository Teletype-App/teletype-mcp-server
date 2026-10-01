import { t } from "./i18n.js";
import type { ToolResult } from "./types.js";
import type { ToolName } from "./tool-catalog.js";

type Data = Record<string, unknown>;

function object(value: unknown): Data {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Data) : {};
}

function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "symbol") return value.description ?? "";
  return "";
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function link(label: string, url: unknown): string {
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) return label;
  const safeLabel = label.replace(/([\\[\]\\])/g, "\\$1");
  const safeUrl = url.replace(/\(/g, "%28").replace(/\)/g, "%29");
  return `[${safeLabel}](${safeUrl})`;
}

function fieldLines(data: Data, keys: readonly string[]): string[] {
  return keys.flatMap((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === "") return [];
    return [`${key}: ${text(value)}`];
  });
}

function preview(value: unknown): string {
  return text(value).replace(/\s+/g, " ").slice(0, 240);
}

// Whitespace collapsed but never truncated: the detailed response_format relies on it.
function fullText(value: unknown): string {
  return text(value).replace(/\s+/g, " ").trim();
}

function wantsDetailed(args?: Record<string, unknown>): boolean {
  return args?.response_format === "detailed";
}

export function presentToolResult(
  name: ToolName,
  result: ToolResult,
  args?: Record<string, unknown>,
): ToolResult {
  if (!result.structuredContent) return result;
  const data = object(result.structuredContent);
  const partialErrors = list(data.partial_errors).map(text).filter(Boolean);
  const notices = list(data.notices).map(text).filter(Boolean);
  if (result.isError && !partialErrors.length) return result;
  const lines: string[] = [];

  switch (name) {
    case "create_dialog_by_phone": {
      lines.push(
        data.dry_run === true
          ? t("presentation.createDialogByPhone.preview")
          : t("presentation.createDialogByPhone.createdOrFound"),
      );
      lines.push(...fieldLines(data, ["phone", "channel_name", "dialog_id", "dialog_url"]));
      if (data.dry_run === true) {
        lines.push(t("presentation.createDialogByPhone.assignmentWarning"));
        lines.push(
          ...fieldLines(object(data.side_effects_if_confirmed), [
            "may_create_dialog",
            "may_assign_project_owner_to_existing_open_dialog",
            "sends_message",
          ]),
        );
      } else if (data.dialog_url) {
        lines.push(link(t("presentation.createDialogByPhone.openDialog"), data.dialog_url));
      }
      break;
    }
    case "list_clients": {
      const clients = list(data.clients);
      lines.push(t("presentation.listClients.count", { count: text(data.total_returned) }));
      for (const item of clients.slice(0, 20)) {
        const client = object(item);
        lines.push(
          `- ${[client.name, client.phone, client.email].map(text).filter(Boolean).join(" · ")} · client_id: ${text(client.client_id)}`,
        );
      }
      if (clients.length > 20) lines.push(t("presentation.listClients.moreInStructuredContent"));
      if (data.has_more)
        lines.push(t("presentation.listClients.nextPage", { page: text(data.next_page) }));
      break;
    }
    case "find_messages": {
      const messages = list(data.messages);
      lines.push(
        t("presentation.findMessages.count", {
          count: text(data.total_returned),
          page: text(data.page),
        }),
      );
      for (const item of messages.slice(0, 20)) {
        const message = object(item);
        const body = wantsDetailed(args) ? fullText(message.text) : preview(message.text);
        const label = [body, message.created_at].map(text).filter(Boolean).join(" · ");
        lines.push(
          `- ${link(label || text(message.message_id), message.link_to_message)} · message_id: ${text(message.message_id)} · dialog_id: ${text(message.dialog_id)}`,
        );
      }
      if (messages.length > 20) lines.push(t("presentation.findMessages.moreInStructuredContent"));
      if (data.has_more)
        lines.push(t("presentation.findMessages.nextPage", { page: text(data.next_page) }));
      break;
    }
    case "send_reply_to_client": {
      if (data.dry_run === true) {
        lines.push(t("presentation.sendReplyToClient.dryRunHeader"));
        const target = object(data.target);
        lines.push(
          ...fieldLines(target, [
            "client_name",
            "client_phone",
            "channel_name",
            "channel_type",
            "assigned_operator",
            "dialog_id",
          ]),
        );
        const message = object(data.message);
        if (message.text) {
          lines.push(
            t("presentation.sendReplyToClient.dryRunMessage", { text: preview(message.text) }),
          );
        }
        lines.push(
          ...fieldLines(object(data.side_effects), [
            "creates_new_dialog",
            "may_create_dialog",
            "may_reassign_open_dialog",
            "sends_message",
            "marks_dialog_answered",
            "auto_close",
          ]),
        );
        break;
      }
      const messageIds = list(data.message_ids);
      lines.push(
        data.created_or_found_dialog === true && messageIds.length === 0
          ? t("presentation.sendReplyToClient.dialogCreatedWithoutMessage")
          : t("presentation.sendReplyToClient.acceptedForSending"),
      );
      lines.push(
        ...fieldLines(
          data,
          Object.keys(data).filter((key) => key !== "hint" && key !== "partial_errors"),
        ),
      );
      break;
    }
    case "find_conversations": {
      const detailed = wantsDetailed(args);
      const dialogs = list(data.dialogs);
      lines.push(
        t("presentation.findConversations.conversationsFound", {
          text: text(data.total_returned || 0),
        }),
      );
      const defaults = object(data.defaults_applied);
      if (Object.keys(defaults).length) {
        const applied = Object.entries(defaults)
          .map(([key, value]) => `${key}=${text(value)}`)
          .join(", ");
        lines.push(t("presentation.findConversations.defaultsApplied", { defaults: applied }));
      }
      for (const item of dialogs.slice(0, 20)) {
        const dialog = object(item);
        const label =
          [dialog.client_name, dialog.channel, preview(dialog.last_message_preview)]
            .map(text)
            .filter(Boolean)
            .join(" · ") || text(dialog.dialog_id);
        lines.push(
          `- ${link(label, dialog.link_to_dialog)}${dialog.dialog_id ? ` · dialog_id: ${text(dialog.dialog_id)}` : ""}${dialog.last_message_at ? ` · ${text(dialog.last_message_at)}` : ""}`,
        );
        if (detailed) {
          const extra = fieldLines(dialog, [
            "appeal_id",
            "client_name",
            "channel",
            "last_message_preview",
            "last_message_at",
            "status",
            "is_unanswered",
            "assigned_operator",
            "channel_type",
            "client_id",
          ]).join(" · ");
          if (extra) lines.push(`  ${extra}`);
        }
      }
      if (dialogs.length > 20)
        lines.push(
          t("presentation.findConversations.moreConversationsStructuredContent", {
            value1: dialogs.length - 20,
          }),
        );
      if (data.search_truncated)
        lines.push(t("presentation.findConversations.searchIsLimitedRefineYour"));
      if (data.has_more && typeof data.next_page_hint === "string") lines.push(data.next_page_hint);
      break;
    }
    case "lookup_client_profile": {
      const detailed = wantsDetailed(args);
      lines.push(
        link(
          text(data.name) || text(data.client_id) || t("presentation.lookupClientProfile.client"),
          data.profile_url,
        ),
      );
      lines.push(...fieldLines(data, ["phone", "email", "tags", "custom_fields"]));
      const notes = list(data.notes);
      if (notes.length) {
        lines.push(t("presentation.lookupClientProfile.notes", { notesCount: notes.length }));
        for (const item of notes.slice(0, 5)) {
          const note = object(item);
          lines.push(`- ${preview(note.text)}${note.operator ? ` (${text(note.operator)})` : ""}`);
          if (detailed) {
            const extra = fieldLines(note, ["id", "created_at"]).join(" · ");
            if (extra) lines.push(`  ${extra}`);
          }
        }
      }
      const dialogs = list(data.recent_dialogs);
      if (dialogs.length) {
        lines.push(
          t("presentation.lookupClientProfile.recentConversations", {
            dialogsCount: dialogs.length,
          }),
        );
        for (const item of dialogs.slice(0, 5)) {
          const dialog = object(item);
          lines.push(
            `- ${link(preview(dialog.last_message_preview) || text(dialog.dialog_id), dialog.link_to_dialog)}${dialog.dialog_id ? ` · dialog_id: ${text(dialog.dialog_id)}` : ""}`,
          );
          if (detailed) {
            const extra = fieldLines(dialog, [
              "status",
              "last_message_at",
              "channel_id",
              "appeal_id",
            ]).join(" · ");
            if (extra) lines.push(`  ${extra}`);
          }
        }
      }
      if (typeof data.recent_dialogs_total === "number" && data.recent_dialogs_total > 5) {
        lines.push(
          t("presentation.lookupClientProfile.moreDialogsExist", {
            total: data.recent_dialogs_total,
          }),
        );
      }
      break;
    }
    case "read_conversation_thread": {
      const detailed = wantsDetailed(args);
      lines.push(link(t("presentation.readConversationThread.conversation"), data.link_to_dialog));
      lines.push(...fieldLines(data, ["status", "is_unanswered", "client", "messages_count"]));
      const messages = list(data.messages);
      for (const item of messages.slice(-20)) {
        const message = object(item);
        const body =
          (detailed ? fullText(message.text) : preview(message.text)) ||
          t("presentation.readConversationThread.attachment");
        const label = `${text(message.author)}: ${body}`;
        lines.push(
          `- ${link(label, message.link_to_message)}${message.created_at ? ` · ${text(message.created_at)}` : ""}`,
        );
        if (detailed) {
          const extra = fieldLines(message, [
            "message_id",
            "status",
            "replied_to",
            "position",
            "operator_id",
          ]).join(" · ");
          if (extra) lines.push(`  ${extra}`);
          const attachments = list(message.attachments);
          if (attachments.length) {
            const names = attachments
              .map((a) => text(object(a).name || object(a).type || object(a).url))
              .filter(Boolean)
              .join(", ");
            if (names)
              lines.push(`  ${t("presentation.readConversationThread.attachments", { names })}`);
          }
        }
      }
      if (messages.length > 20)
        lines.push(
          t("presentation.readConversationThread.moreMessagesStructuredContent", {
            value1: messages.length - 20,
          }),
        );
      const requestedLimit =
        typeof args?.messages_limit === "number" && args.messages_limit > 0
          ? Math.floor(args.messages_limit)
          : 50;
      if (messages.length >= requestedLimit) {
        lines.push(
          t("presentation.readConversationThread.threadMayContinue", { limit: requestedLimit }),
        );
      }
      lines.push(t("presentation.readConversationThread.draftEvidenceReminder"));
      break;
    }
    case "read_client_history": {
      const detailed = wantsDetailed(args);
      lines.push(
        t("presentation.readClientHistory.historyHeader", { count: list(data.dialogs).length }),
      );
      for (const item of list(data.dialogs)) {
        const dialog = object(item);
        const label =
          [dialog.channel, dialog.status].map(text).filter(Boolean).join(" · ") ||
          text(dialog.dialog_id);
        lines.push(
          `- ${link(label, dialog.link_to_dialog)}${dialog.last_message_at ? ` · ${text(dialog.last_message_at)}` : ""}`,
        );
        if (detailed) {
          const extra = fieldLines(dialog, ["dialog_id", "appeal_id", "messages_count"]).join(
            " · ",
          );
          if (extra) lines.push(`  ${extra}`);
        }
        const messages = list(dialog.messages);
        for (const m of messages) {
          const message = object(m);
          const body =
            (detailed ? fullText(message.text) : preview(message.text)) ||
            t("presentation.readConversationThread.attachment");
          const messageLabel = `${text(message.author)}: ${body}`;
          lines.push(
            `  - ${link(messageLabel, message.link_to_message)}${message.created_at ? ` · ${text(message.created_at)}` : ""}`,
          );
          if (detailed) {
            const extra = fieldLines(message, ["message_id"]).join(" · ");
            if (extra) lines.push(`  ${extra}`);
          }
        }
        if (!messages.length) lines.push(`  ${t("presentation.readClientHistory.noMessages")}`);
      }
      break;
    }
    case "list_workspace_metadata":
      for (const [key, value] of Object.entries(data)) {
        if (!Array.isArray(value)) continue;
        lines.push(`${key}: ${value.length}`);
        for (const item of value.slice(0, 20)) {
          const entry = object(item);
          const label = text(entry.name || entry.title || entry.label || entry.id) || preview(item);
          const details = fieldLines(entry, ["id", "type", "active", "status"]);
          lines.push(`- ${label}${details.length ? ` · ${details.join(" · ")}` : ""}`);
        }
        if (value.length > 20)
          lines.push(
            t("presentation.listWorkspaceMetadata.moreEntriesStructuredContent", {
              value1: value.length - 20,
            }),
          );
      }
      break;
    case "get_project_status": {
      const sections =
        Object.keys(data)
          .filter((key) => key !== "warnings" && key !== "hint")
          .join(", ") || t("presentation.getProjectStatus.noData");
      lines.push(t("presentation.getProjectStatus.statusSections", { sections: sections }));
      const technical = object(data.technical);
      lines.push(
        ...fieldLines(technical, [
          "api_status",
          "webhook_errors_count",
          "channels_total",
          "channels_active",
        ]),
      );
      for (const item of list(technical.channels_with_issues).slice(0, 20)) {
        const channel = object(item);
        lines.push(
          `- ${text(channel.name || channel.id)}${channel.type ? ` · ${text(channel.type)}` : ""} · active: ${text(channel.active)}`,
        );
      }
      lines.push(
        ...fieldLines(object(data.financial), [
          "balance_rub",
          "paid_until",
          "days_remaining",
          "project_active",
          "project_paid",
        ]),
        ...fieldLines(object(data.team), ["operators_total", "operators_available"]),
      );
      for (const item of list(data.warnings)) {
        const warning = object(item);
        lines.push(`- ${text(warning.severity)}: ${text(warning.message)}`);
      }
      break;
    }
    case "send_whatsapp_template": {
      if (data.dry_run === true) {
        lines.push(t("presentation.sendWhatsappTemplate.dryRunHeader"));
        lines.push(...fieldLines(data, ["template_id", "channel_id", "dialog_id"]));
        lines.push(
          ...fieldLines(object(data.target), ["client_name", "client_phone", "channel_name"]),
        );
        break;
      }
      break;
    }
    case "get_capabilities": {
      lines.push(
        t("presentation.getCapabilities.header", {
          readOnly: text(data.read_only),
          toolsets: list(data.active_toolsets).map(text).join(", "),
        }),
      );
      const project = object(data.project);
      const details = [text(project.name), project.domain ? `(${text(project.domain)})` : ""]
        .filter(Boolean)
        .join(" ");
      if (details) {
        lines.push(t("presentation.getCapabilities.workspace", { details: details }));
      }
      for (const item of list(data.tools)) {
        const tool = object(item);
        lines.push(
          `- ${text(tool.name)} (${text(tool.toolset)}${
            tool.writes_data ? `, ${t("presentation.getCapabilities.writes")}` : ""
          })`,
        );
      }
      break;
    }
    default:
      lines.push(
        ...fieldLines(
          data,
          Object.keys(data).filter((key) => key !== "hint" && key !== "partial_errors"),
        ),
      );
  }

  const partialWrite =
    partialErrors.length > 0 &&
    (name === "annotate_client_record" || name === "resolve_conversation");
  if (partialErrors.length) {
    lines.unshift(
      partialWrite
        ? t("presentation.presentToolResult.someActionsHaveBeenCompleted")
        : t("presentation.presentToolResult.someDataIsNotAvailable"),
    );
    lines.push(
      ...partialErrors.map((error) => t("presentation.presentToolResult.error", { error: error })),
    );
  }
  if (notices.length) {
    lines.push(...notices.map((notice) => t("presentation.presentToolResult.notice", { notice })));
  }
  if (typeof data.hint === "string") lines.push(data.hint);
  return {
    ...result,
    content: [
      {
        type: "text",
        text:
          lines.filter(Boolean).join("\n") ||
          t("presentation.presentToolResult.doneDataStructuredContent"),
      },
    ],
    ...(partialWrite ? { isError: true } : {}),
  };
}
