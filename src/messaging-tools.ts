import { t } from "./i18n.js";
import { TeletypeApiError, teletypeRequest, teletypeUploadRequest } from "./teletype-api.js";
import {
  resolveTagIds,
  resolveChannel,
  resolveCategoryId,
  resolveClient,
  loadChannels,
} from "./entity-resolver.js";
import { jsonResult, errorResult } from "./tool-helpers.js";
import { channelCandidatesHint, clientCandidatesHint } from "./candidate-hints.js";
import type { ToolResult } from "./types.js";
import { log } from "./log.js";
import type { ToolArgs } from "./tool-catalog.js";
import {
  decodeChannelSend,
  decodeCreatedDialog,
  decodeDialogDetails,
  decodeSendMessage,
  decodeTemplateList,
  decodeCreatedNote,
  decodeResendResult,
} from "./api-contract.js";

interface DryRunTarget {
  dialog_id?: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  channel_id?: string;
  channel_name?: string;
  channel_type?: string;
  assigned_operator?: string | null;
  status?: string | null;
}

interface DryRunMessage {
  text: string | null;
  template_name?: string;
  template_variables?: Record<string, unknown>;
  attachment: "url" | "local_upload" | "none";
}

const PHONE_DIALOG_CHANNEL_TYPES = new Set([
  "whatsapp_teletype",
  "whatsapp_edna",
  "max",
  "sms_plusofon",
  "kakao",
  "telegram",
  "vk_direct",
]);

export async function createDialogByPhone(
  args: ToolArgs<"create_dialog_by_phone">,
): Promise<ToolResult> {
  const phone = args.phone.trim();
  if (!/^\+?[\d\s()-]{7,25}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
    return errorResult(t("messaging.createDialogByPhone.invalidPhone"));
  }
  const resolved = await resolveChannel(args.channel);
  if (!resolved.channel) {
    return errorResult(
      t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: args.channel }),
      channelCandidatesHint(resolved.candidates),
    );
  }
  const channel = resolved.channel;
  const channelType = channel.channelType ?? channel.type ?? "";
  if (!PHONE_DIALOG_CHANNEL_TYPES.has(channelType)) {
    return errorResult(t("messaging.createDialogByPhone.channelDoesNotSupportPhone"));
  }
  if (args.dry_run === true) {
    return jsonResult({
      dry_run: true,
      created_or_found: false,
      phone,
      channel_id: channel.id,
      channel_name: channel.name ?? channelType,
      channel_type: channelType,
      side_effects_if_confirmed: {
        may_create_dialog: true,
        may_assign_project_owner_to_existing_open_dialog: true,
        sends_message: false,
      },
    });
  }
  if (args.confirm !== true) {
    return errorResult(
      t("messaging.createDialogByPhone.confirmRequired"),
      t("messaging.common.repeatWithConfirmTrue"),
    );
  }
  const dialog = await teletypeRequest("/dialog/create", {
    method: "POST",
    body: { channelId: channel.id, clientPhone: phone },
    decode: decodeCreatedDialog,
  });
  return jsonResult({
    dry_run: false,
    created_or_found: true,
    dialog_id: dialog.id,
    dialog_url: dialog.url,
    sent_message: false,
    may_have_reassigned_operator: true,
  });
}

// Read-only template resolution shared by the send path and dry-run previews.
async function resolveTemplateMessage(
  template_name: string,
  template_variables: Record<string, unknown> | undefined,
): Promise<{ text?: string; error?: ToolResult }> {
  const tpls = await teletypeRequest("/template-message/list", { decode: decodeTemplateList });
  const all = [
    ...(tpls?.withoutDirectories?.templates ?? []),
    ...(tpls?.directories ?? []).flatMap((d) => d.templates ?? []),
  ];
  const tpl = all.find(
    (t) =>
      (t.name || t.key || "").toLowerCase() === template_name.toLowerCase() ||
      t.id === template_name,
  );
  if (!tpl) {
    return {
      error: errorResult(
        t("messaging.sendReplyToClient.templateNotFound", { templateName: template_name }),
        t("messaging.sendReplyToClient.listAvailableTemplatesListWorkspace"),
      ),
    };
  }
  let messageText = tpl.message || tpl.text || "";
  if (template_variables) {
    for (const [k, v] of Object.entries(template_variables)) {
      const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      messageText = messageText.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, "g"), () =>
        String(v),
      );
    }
  }
  return { text: messageText };
}

async function dryRunDialogTarget(dialogId: string): Promise<DryRunTarget> {
  const [details, channels] = await Promise.all([
    teletypeRequest(`/dialog/details/${encodeURIComponent(dialogId)}`, {
      decode: decodeDialogDetails,
    }),
    loadChannels().catch(() => []),
  ]);
  const channel = details.channel ?? channels.find((c) => c.id === details.channelId);
  return {
    dialog_id: dialogId,
    client_id: details.client?.id || details.clientId,
    client_name: details.client?.name,
    client_phone: details.client?.phone,
    channel_id: channel?.id,
    channel_name: channel?.name,
    channel_type: channel?.channelType || channel?.type,
    assigned_operator: details.operator?.name || details.assignedOperatorId || null,
    status: details.isOpen === undefined ? null : details.isOpen ? "open" : "closed",
  };
}

async function dryRunReplyPreview(args: ToolArgs<"send_reply_to_client">): Promise<ToolResult> {
  const client = args.client;
  const channel = args.channel;
  const recipient_dialog_id = args.recipient_dialog_id;
  const createDialogOnly = args.create_dialog_only === true;

  let message: DryRunMessage = {
    text: typeof args.text === "string" ? args.text : null,
    attachment: args.attachment_path ? "local_upload" : args.attachment_url ? "url" : "none",
  };

  if (args.template_name && !message.text) {
    const rendered = await resolveTemplateMessage(
      args.template_name,
      args.template_variables ?? undefined,
    );
    if (rendered.error) return rendered.error;
    message = {
      ...message,
      text: rendered.text ?? "",
      template_name: args.template_name,
      ...(args.template_variables ? { template_variables: args.template_variables } : {}),
    };
  }

  let target: DryRunTarget;
  let action: string;
  let sideEffects: Record<string, boolean>;

  if (createDialogOnly) {
    if (!client || !channel) {
      return errorResult(
        t("messaging.sendReplyToClient.creatingConversationRequiresBothClient"),
        t("messaging.sendReplyToClient.alternativelyPassRecipientDialogId"),
      );
    }
    const [ch, cl] = await Promise.all([resolveChannel(channel), resolveClient({ client })]);
    if (!ch.channel) {
      return errorResult(
        t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: channel }),
        channelCandidatesHint(ch.candidates),
      );
    }
    target = {
      client_id: cl.client?.id,
      client_name: cl.client?.name,
      client_phone: cl.client?.phone ?? client,
      channel_id: ch.channel.id,
      channel_name: ch.channel.name,
      channel_type: ch.channel.channelType || ch.channel.type,
    };
    action = "create_dialog_without_message";
    sideEffects = {
      may_create_dialog: true,
      may_reassign_open_dialog: true,
      sends_message: false,
      marks_dialog_answered: false,
    };
  } else if (recipient_dialog_id) {
    target = await dryRunDialogTarget(recipient_dialog_id);
    action = "reply_to_existing_dialog";
    sideEffects = {
      creates_new_dialog: false,
      sends_message: true,
      marks_dialog_answered: args.mark_dialog_answered !== false,
    };
  } else {
    if (!client || !channel) {
      return errorResult(
        t("messaging.sendReplyToClient.creatingConversationRequiresBothClient2"),
        t("messaging.sendReplyToClient.alternativelyPassRecipientDialogId"),
      );
    }
    const [ch, cl] = await Promise.all([resolveChannel(channel), resolveClient({ client })]);
    if (!ch.channel) {
      return errorResult(
        t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: channel }),
        channelCandidatesHint(ch.candidates),
      );
    }
    target = {
      client_id: cl.client?.id,
      client_name: cl.client?.name,
      client_phone: cl.client?.phone ?? client,
      channel_id: ch.channel.id,
      channel_name: ch.channel.name,
      channel_type: ch.channel.channelType || ch.channel.type,
    };
    action = "create_new_dialog_with_message";
    sideEffects = {
      creates_new_dialog: true,
      sends_message: true,
      marks_dialog_answered: false,
      auto_close: args.auto_close === true,
    };
  }

  return jsonResult({
    dry_run: true,
    accepted: false,
    delivery_confirmed: false,
    message_ids: [],
    action,
    target,
    message,
    side_effects: sideEffects,
    hint: t("messaging.sendReplyToClient.dryRunPreviewNothingWasSent", {
      channelName: target.channel_name ?? channel ?? recipient_dialog_id ?? "",
      clientName: target.client_name ?? client ?? "",
    }),
  });
}

export async function sendReplyToClient(
  args: ToolArgs<"send_reply_to_client">,
): Promise<ToolResult> {
  if (args.dry_run === true) {
    return dryRunReplyPreview(args);
  }
  if (!args.confirm) {
    return errorResult(
      t("messaging.sendReplyToClient.sendingFailedPassConfirmTrue"),
      t("messaging.common.repeatWithConfirmTrue"),
    );
  }
  const recipient_dialog_id = args.recipient_dialog_id;
  const client = args.client;
  const channel = args.channel;
  const text = args.text;
  const template_name = args.template_name;
  const template_variables = args.template_variables ?? undefined;
  const attachment_url = args.attachment_url;
  const attachment_path = args.attachment_path;
  const reply_to_message_id = args.reply_to_message_id;
  const mark_dialog_answered = args.mark_dialog_answered !== false;

  if (args.create_dialog_only === true) {
    if (!client || !channel) {
      return errorResult(
        t("messaging.sendReplyToClient.creatingConversationRequiresBothClient"),
        t("messaging.sendReplyToClient.alternativelyPassRecipientDialogId"),
      );
    }
    const ch = await resolveChannel(channel);
    if (!ch.channel) {
      return errorResult(
        t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: channel }),
        channelCandidatesHint(ch.candidates),
      );
    }
    const cl = await resolveClient({ client });
    const createBody: Record<string, string> = { channelId: ch.channel.id };
    if (cl.client?.phone) createBody.clientPhone = cl.client.phone;
    if (cl.client?.email) createBody.clientEmail = cl.client.email;
    if (!cl.client) {
      const raw = client;
      if (raw.includes("@")) createBody.clientEmail = raw;
      else if (/[\d+]/.test(raw)) createBody.clientPhone = raw.replace(/[^\d+]/g, "");
      else createBody.clientUsername = raw;
    }
    const res = await teletypeRequest("/dialog/create", {
      method: "POST",
      body: createBody,
      decode: decodeCreatedDialog,
    });
    return jsonResult({
      accepted: true,
      delivery_confirmed: false,
      message_ids: [],
      dialog_id: res?.id,
      dialog_url: res?.url,
      created_or_found_dialog: true,
      hint: t("messaging.sendReplyToClient.conversationCreatedViaDialogCreate"),
    });
  }

  let messageText: string | undefined = text;
  if (template_name && !messageText) {
    const rendered = await resolveTemplateMessage(template_name, template_variables);
    if (rendered.error) return rendered.error;
    messageText = rendered.text ?? "";
  }

  if (!messageText && !attachment_url && !attachment_path) {
    return errorResult(
      t("messaging.sendReplyToClient.nothingSendSpecifyTextTemplate"),
      t("messaging.sendReplyToClient.atLeastOneTheseParameters"),
    );
  }

  if (recipient_dialog_id) {
    let result: ReturnType<typeof decodeSendMessage>;

    if (attachment_path) {
      const fields: Record<string, string | undefined> = {
        dialogId: recipient_dialog_id,
      };
      if (messageText) fields.text = messageText;
      if (reply_to_message_id) fields.replied_message_id = reply_to_message_id;

      result = await teletypeUploadRequest("/message/send", {
        fields,
        filePath: attachment_path,
        decode: decodeSendMessage,
      });
    } else {
      const body: Record<string, unknown> = { dialogId: recipient_dialog_id };
      if (messageText) body.text = messageText;
      if (attachment_url) body.url = attachment_url;
      if (reply_to_message_id) body.replied_message_id = reply_to_message_id;

      result = await teletypeRequest("/message/send", {
        method: "POST",
        body,
        decode: decodeSendMessage,
      });
    }

    let markedAnswered = false;
    if (mark_dialog_answered) {
      try {
        await teletypeRequest(`/dialog/answered/${encodeURIComponent(recipient_dialog_id)}`, {
          method: "POST",
        });
        markedAnswered = true;
      } catch (error) {
        log("warn", "dialog_mark_answered_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return jsonResult({
      accepted: true,
      delivery_confirmed: false,
      dialog_id: recipient_dialog_id,
      message_ids: result?.ids ?? [],
      marked_answered: markedAnswered,
      attachment_mode: attachment_path ? "multipart_upload" : attachment_url ? "url" : "none",
      hint: t("messaging.sendReplyToClient.messageQueuedChannelUseRead"),
    });
  }

  if (!client || !channel) {
    return errorResult(
      t("messaging.sendReplyToClient.creatingConversationRequiresBothClient2"),
      t("messaging.sendReplyToClient.alternativelyPassRecipientDialogId"),
    );
  }

  const ch = await resolveChannel(channel);
  if (!ch.channel) {
    return errorResult(
      t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: channel }),
      channelCandidatesHint(ch.candidates),
    );
  }

  const cl = await resolveClient({ client });

  const baseFields: Record<string, string | undefined> = {
    channelId: ch.channel.id,
    text: messageText || "",
  };
  if (cl.client?.phone) baseFields.clientPhone = cl.client.phone;
  if (cl.client?.email) baseFields.clientEmail = cl.client.email;
  if (!cl.client) {
    const raw = client;
    if (raw.includes("@")) baseFields.clientEmail = raw;
    else if (/[\d+]/.test(raw)) baseFields.clientPhone = raw.replace(/[^\d+]/g, "");
    else baseFields.clientUsername = raw;
  }

  let result: ReturnType<typeof decodeChannelSend>;

  if (attachment_path) {
    if (args.auto_close === true) baseFields.autoClose = "1";
    result = await teletypeUploadRequest("/channel/send-message", {
      fields: baseFields,
      filePath: attachment_path,
      decode: decodeChannelSend,
    });
  } else {
    const body: Record<string, unknown> = { ...baseFields };
    if (attachment_url) body.url = attachment_url;
    if (args.auto_close === true) body.autoClose = 1;
    result = await teletypeRequest("/channel/send-message", {
      method: "POST",
      body,
      decode: decodeChannelSend,
    });
  }

  return jsonResult({
    accepted: true,
    delivery_confirmed: false,
    dialog_id: result?.dialog?.id,
    dialog_url: result?.dialog?.url,
    message_ids: result?.messages ?? [],
    created_or_found_dialog: true,
    attachment_mode: attachment_path ? "multipart_upload" : attachment_url ? "url" : "none",
    hint: t("messaging.sendReplyToClient.newDialogHasBeenCreated"),
  });
}

export async function manageSentMessage(
  args: ToolArgs<"manage_sent_message">,
): Promise<ToolResult> {
  if (!args.confirm) {
    return errorResult(
      t("messaging.manageSentMessage.actionFailedPassConfirmTrue"),
      t("messaging.common.repeatWithConfirmTrue"),
    );
  }
  const message_id = args.message_id as string | undefined;
  const action = args.action as "update" | "delete" | "resend" | undefined;
  const text = args.text;

  if (!message_id) {
    return errorResult(
      t("messaging.manageSentMessage.messageIdParameterIsRequired"),
      t("messaging.manageSentMessage.messageIdHint"),
    );
  }
  if (!action || !["update", "delete", "resend"].includes(action)) {
    return errorResult(
      t("messaging.manageSentMessage.actionParameterIsRequiredUpdate"),
      t("messaging.manageSentMessage.actionHint"),
    );
  }
  const updatedText = text?.trim();
  if (action === "update" && !updatedText) {
    return errorResult(
      t("messaging.manageSentMessage.updateActionYouMustSpecify"),
      t("messaging.manageSentMessage.updateTextHint"),
    );
  }

  try {
    if (action === "update") {
      await teletypeRequest(`/message/update/${encodeURIComponent(message_id)}`, {
        method: "POST",
        body: { text: updatedText },
        bodyType: "form",
      });
      return jsonResult({
        message_id,
        action,
        text: updatedText,
        status: "updated",
        hint: t("messaging.manageSentMessage.messageHasBeenSuccessfullyEdited"),
      });
    } else if (action === "delete") {
      await teletypeRequest(`/message/delete/${encodeURIComponent(message_id)}`, {
        method: "POST",
      });
      return jsonResult({
        message_id,
        action,
        status: "deleted",
        hint: t("messaging.manageSentMessage.messageWasSuccessfullyDeleted"),
      });
    } else {
      const res = await teletypeRequest<{ result?: boolean }>(
        `/message/resend/${encodeURIComponent(message_id)}`,
        {
          method: "POST",
          decode: decodeResendResult,
        },
      );
      return jsonResult({
        message_id,
        action,
        status: res?.result ? "resent" : "resend_queued",
        hint: t("messaging.manageSentMessage.messageResendingHasBeenInitiated"),
      });
    }
  } catch (e: unknown) {
    // API errors carry their own hint at the dispatch boundary.
    if (e instanceof TeletypeApiError) throw e;
    const msg = e instanceof Error ? e.message : t("messaging.error");
    return errorResult(
      t("messaging.manageSentMessage.errorPerformingActionMessage", {
        action: action,
        messageId: message_id,
        msg: msg,
      }),
      t("server.buildServer.actionCouldBeCompletedCheck"),
    );
  }
}

function addBracketFormFields(body: Record<string, unknown>, prefix: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    if (value.every((item) => item === null || typeof item !== "object")) {
      body[`${prefix}[]`] = value;
    } else {
      value.forEach((item, index) => {
        addBracketFormFields(body, `${prefix}[${index}]`, item);
      });
    }
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new TeletypeApiError(
          t("messaging.addBracketFormFields.invalidTemplateParameterName", { key: key }),
        );
      }
      addBracketFormFields(body, `${prefix}[${key}]`, nested);
    }
    return;
  }
  body[prefix] = value;
}

export async function sendWhatsappTemplate(
  args: ToolArgs<"send_whatsapp_template">,
): Promise<ToolResult> {
  const channel_id = args.channel_id as string | undefined;
  const dialog_id = args.dialog_id as string | undefined;
  const template_id = args.template_id as string | undefined;
  const template_params = (args.template_params as Record<string, unknown>) ?? {};
  const template_options = args.template_options;

  if (!channel_id || !dialog_id || !template_id) {
    return errorResult(
      t("messaging.sendWhatsappTemplate.parametersChannelIdDialogId"),
      t("messaging.sendWhatsappTemplate.requiredParamsHint"),
    );
  }

  if (args.dry_run === true) {
    let target: DryRunTarget = { dialog_id, channel_id };
    try {
      target = { ...(await dryRunDialogTarget(dialog_id)), channel_id };
    } catch (error) {
      log("warn", "whatsapp_template_dry_run_details_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return jsonResult({
      dry_run: true,
      channel_id,
      dialog_id,
      template_id,
      message_ids: [],
      accepted: false,
      delivery_confirmed: false,
      target,
      template_params,
      hint: t("messaging.sendWhatsappTemplate.dryRunPreviewNothingWasSent"),
    });
  }

  if (!args.confirm) {
    return errorResult(
      t("messaging.sendWhatsappTemplate.templateSubmissionFailedPassConfirm"),
      t("messaging.common.repeatWithConfirmTrue"),
    );
  }

  try {
    const body: Record<string, unknown> = { dialogId: dialog_id, templateId: template_id };
    addBracketFormFields(body, "template_params", template_params);
    addBracketFormFields(body, "template_options", template_options);
    const res = await teletypeRequest(
      `/whatsapp-edna/send-template/${encodeURIComponent(channel_id)}`,
      {
        method: "POST",
        body,
        bodyType: "form",
        decode: decodeSendMessage,
      },
    );
    return jsonResult({
      channel_id,
      dialog_id,
      template_id,
      message_ids: res.ids,
      accepted: true,
      delivery_confirmed: false,
      hint: t("messaging.sendWhatsappTemplate.teletypeHasAcceptedWhatsAppTemplate"),
    });
  } catch (e: unknown) {
    // API errors carry their own hint at the dispatch boundary.
    if (e instanceof TeletypeApiError) throw e;
    const msg = e instanceof Error ? e.message : t("messaging.error");
    return errorResult(
      t("messaging.sendWhatsappTemplate.errorSendingWhatsAppTemplate", { msg: msg }),
      t("messaging.sendWhatsappTemplate.requiredParamsHint"),
    );
  }
}

export async function annotateClientRecord(
  args: ToolArgs<"annotate_client_record">,
): Promise<ToolResult> {
  if (!args.confirm) {
    return errorResult(
      t("messaging.annotateClientRecord.changesNotAppliedPassConfirm"),
      t("messaging.common.repeatWithConfirmTrue"),
    );
  }
  const client = args.client;
  const dialog_id = args.dialog_id;
  const delete_note_id =
    typeof args.delete_note_id === "string" ? args.delete_note_id.trim() : undefined;
  const add_tags = (args.add_tags as string[]) ?? [];
  const remove_tags = (args.remove_tags as string[]) ?? [];
  const note = args.note;
  const custom_fields = args.custom_fields ?? undefined;
  const dialog_category = args.dialog_category;
  const name = typeof args.name === "string" ? args.name.trim() : undefined;
  const phone = typeof args.phone === "string" ? args.phone.trim() : undefined;
  const email = typeof args.email === "string" ? args.email.trim() : undefined;

  const hasClientChanges =
    add_tags.length > 0 ||
    remove_tags.length > 0 ||
    Boolean(note) ||
    custom_fields !== undefined ||
    name !== undefined ||
    phone !== undefined ||
    email !== undefined ||
    args.additional_payload !== undefined;
  if (args.force_additional_payload !== undefined && args.additional_payload === undefined) {
    return errorResult(t("messaging.annotateClientRecord.forceRequiresPayload"));
  }
  if (dialog_category && !dialog_id) {
    return errorResult(t("messaging.annotateClientRecord.categoryRequiresDialogId"));
  }
  if (!hasClientChanges && !delete_note_id && !dialog_category) {
    return errorResult(t("messaging.annotateClientRecord.noChangesRequested"));
  }
  if (hasClientChanges && !client && !dialog_id) {
    return errorResult(t("messaging.annotateClientRecord.clientChangesRequireTarget"));
  }

  if (!client && !dialog_id && !delete_note_id) {
    return errorResult(
      t("messaging.annotateClientRecord.passClientDialogIdOr"),
      t("messaging.annotateClientRecord.passClientNamePhoneEmail"),
    );
  }

  const applied: Record<string, unknown> = {};
  const errors: string[] = [];

  let cid: string | undefined;
  if (client) {
    const r = await resolveClient({ client });
    if (!r.client) {
      return errorResult(
        t("messaging.annotateClientRecord.clientWasNotUniquelyFound", {
          client: client,
          candidatesCount: r.candidates.length,
        }),
        clientCandidatesHint(r.candidates),
      );
    }
    cid = r.client.id;
  } else if (dialog_id && hasClientChanges) {
    const details = await teletypeRequest(`/dialog/details/${encodeURIComponent(dialog_id)}`, {
      decode: decodeDialogDetails,
    });
    cid = details.client?.id || details.clientId;
    if (!cid) {
      return errorResult(t("messaging.annotateClientRecord.dialogHasNoClient"));
    }
  }

  if (cid && (add_tags.length || remove_tags.length)) {
    const adds = await resolveTagIds(add_tags);
    const rems = await resolveTagIds(remove_tags);
    if (adds.missing.length || rems.missing.length) {
      errors.push(
        t("messaging.annotateClientRecord.nonExistentTags", {
          value1: [...adds.missing, ...rems.missing].join(", "),
        }),
      );
    }
    const operations = [
      ...adds.resolved.map((tagId) => ({ action: "added", tagId }) as const),
      ...rems.resolved.map((tagId) => ({ action: "removed", tagId }) as const),
    ];
    const settled = await Promise.allSettled(
      operations.map(({ action, tagId }) =>
        teletypeRequest(
          `/client/${action === "added" ? "add-tag" : "remove-tag"}/${encodeURIComponent(cid)}`,
          { method: "POST", body: { tag_id: tagId } },
        ),
      ),
    );
    applied.tags_added = settled.filter(
      (result, index) => result.status === "fulfilled" && operations[index]?.action === "added",
    ).length;
    applied.tags_removed = settled.filter(
      (result, index) => result.status === "fulfilled" && operations[index]?.action === "removed",
    ).length;
    settled.forEach((result, index) => {
      if (result.status === "rejected") {
        const operation = operations[index];
        const message =
          result.reason instanceof Error ? result.reason.message : t("messaging.error");
        errors.push(
          operation?.action === "added"
            ? t("messaging.annotateClientRecord.failedAddTag", {
                tagId: operation.tagId,
                message: message,
              })
            : t("messaging.annotateClientRecord.failedRemoveTag", {
                tagId: operation?.tagId,
                message: message,
              }),
        );
      }
    });
  }

  if (cid && note) {
    try {
      const res = await teletypeRequest<{ id?: string }>(
        `/client/create-note/${encodeURIComponent(cid)}`,
        { method: "POST", body: { text: note }, decode: decodeCreatedNote },
      );
      applied.note_id = res?.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("messaging.error");
      errors.push(t("messaging.annotateClientRecord.errorCreatingNote", { msg: msg }));
    }
  }

  if (delete_note_id) {
    try {
      await teletypeRequest(`/client/delete-note/${encodeURIComponent(delete_note_id)}`);
      applied.note_deleted = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("messaging.error");
      errors.push(
        t("messaging.annotateClientRecord.errorDeletingNote", {
          deleteNoteId: delete_note_id,
          msg: msg,
        }),
      );
    }
  }

  if (cid && custom_fields && typeof custom_fields === "object") {
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(custom_fields)) {
        body[`values[${k}]`] = v;
      }
      await teletypeRequest(`/client/set-custom-fields/${encodeURIComponent(cid)}`, {
        method: "POST",
        body,
        bodyType: "form",
      });
      applied.custom_fields_updated = Object.keys(custom_fields);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("messaging.error");
      errors.push(t("messaging.annotateClientRecord.errorUpdatingCustomFields", { msg: msg }));
    }
  }

  const additional_payload = args.additional_payload;
  const force_additional_payload =
    args.force_additional_payload !== undefined
      ? args.force_additional_payload
        ? 1
        : 0
      : undefined;

  if (
    cid &&
    (name !== undefined ||
      phone !== undefined ||
      email !== undefined ||
      additional_payload !== undefined)
  ) {
    try {
      const body: Record<string, string | number> = {};
      if (name !== undefined) body.name = name;
      if (phone !== undefined) body.phone = phone;
      if (email !== undefined) body.email = email;
      if (additional_payload !== undefined) {
        body.additional_payload =
          typeof additional_payload === "string"
            ? additional_payload
            : JSON.stringify(additional_payload);
      }
      if (force_additional_payload !== undefined) {
        body.force_additional_payload = force_additional_payload;
      }
      await teletypeRequest(`/client/update/${encodeURIComponent(cid)}`, {
        method: "POST",
        body,
        bodyType: "form",
      });
      applied.identity_updated = body;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("messaging.error");
      errors.push(t("messaging.annotateClientRecord.errorUpdatingClientContacts", { msg: msg }));
    }
  }

  if (dialog_id && dialog_category) {
    const r = await resolveCategoryId(dialog_category);
    if (!r.id) {
      errors.push(
        t("messaging.annotateClientRecord.categoryNotFound", { dialogCategory: dialog_category }),
      );
    } else {
      try {
        await teletypeRequest(`/dialog/set-category/${encodeURIComponent(dialog_id)}`, {
          method: "POST",
          body: { category_appointed_id: r.id },
        });
        applied.dialog_category = dialog_category;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("messaging.error");
        errors.push(t("messaging.annotateClientRecord.failedSetCategory", { msg: msg }));
      }
    }
  }

  return jsonResult({
    client_id: cid,
    applied,
    partial_errors: errors,
    hint: errors.length
      ? t("messaging.annotateClientRecord.someOperationsFailedCheckPartial")
      : t("messaging.annotateClientRecord.allOperationsWereCompletedSuccessfully"),
  });
}
