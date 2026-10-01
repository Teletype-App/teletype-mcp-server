import { t as translate } from "./i18n.js";
import { loadToolPolicy as resolveToolPolicy } from "./tool-policy.js";
import { TeletypeApiError, teletypeRequest } from "./teletype-api.js";
import type { ToolArgs } from "./tool-catalog.js";
import {
  decodeClientDetails,
  decodeDialogDetails,
  decodeDialogPage,
  decodeMessagePage,
  decodeClientPage,
  decodeCustomFields,
  decodeClientNotes,
  decodeClientDialog,
  decodeDialogSessions,
  decodeSessionDetails,
  decodeGroupClients,
  decodeCreatedNote,
} from "./api-contract.js";
import {
  loadChannels,
  loadProjectDomain,
  operatorDisplayName,
  apiDate,
  resolveTagIds,
  resolveChannel,
  resolveOperator,
  resolveCategoryId,
  resolveClient,
} from "./entity-resolver.js";
import {
  errorMessage,
  jsonResult,
  getAppealId,
  buildDialogUrl,
  buildMessageUrl,
  errorResult,
} from "./tool-helpers.js";
import {
  channelCandidatesHint,
  clientCandidatesHint,
  operatorCandidatesHint,
  categoryCandidatesHint,
} from "./candidate-hints.js";
import type {
  ChannelItem,
  ClientItem,
  DialogItem,
  MessageItem,
  DialogListResponse,
  ClientListResponse,
  MessageListResponse,
  ToolResult,
} from "./types.js";

export async function listClients(args: ToolArgs<"list_clients">): Promise<ToolResult> {
  const page = args.page ?? 1;
  const limit = args.limit ?? 20;
  const phone = args.phone?.trim();
  const data = await teletypeRequest<ClientListResponse>("/clients", {
    query: { page, pageSize: limit, ...(phone ? { clientPhone: phone } : {}) },
    decode: decodeClientPage,
  });
  const clients = data.items.map((client) => ({
    client_id: client.id,
    name: client.name ?? null,
    phone: client.phone ?? null,
    email: client.email ?? null,
  }));
  const hasMore = data.totalPages !== undefined ? page < data.totalPages : clients.length === limit;
  return jsonResult({
    clients,
    total_returned: clients.length,
    total_items: data.totalItems ?? null,
    page,
    has_more: hasMore,
    next_page: hasMore ? page + 1 : null,
  });
}

export async function findMessages(args: ToolArgs<"find_messages">): Promise<ToolResult> {
  const page = args.page ?? 1;
  const limit = args.limit ?? 50;
  const textQuery = args.query?.trim().toLowerCase();
  let channelId: string | undefined;
  if (args.channel) {
    const resolved = await resolveChannel(args.channel);
    if (!resolved.channel) {
      return errorResult(
        translate("conversation.findConversations.channelIsNotUniquelyDefined", {
          channel: args.channel,
        }),
        channelCandidatesHint(resolved.candidates),
      );
    }
    channelId = resolved.channel.id;
  }
  const data = await teletypeRequest<MessageListResponse>("/messages", {
    query: {
      page,
      pageSize: limit,
      dialogId: args.dialog_id,
      clientId: args.client_id,
      channelId,
      onlyActive: args.only_active ? 1 : 0,
    },
    decode: decodeMessagePage,
  });
  const domain = await loadProjectDomain();
  const messages = data.items
    .filter((message) => !textQuery || (message.text ?? "").toLowerCase().includes(textQuery))
    .map((message) => ({
      message_id: message.id,
      dialog_id: message.dialogId ?? args.dialog_id ?? null,
      client_id: message.client?.id ?? message.clientId ?? args.client_id ?? null,
      link_to_message: buildMessageUrl(domain, message.sessionId, message.position) ?? null,
      text: message.text ?? "",
      author:
        message.isItClient === false || message.operator?.id || message.operatorId
          ? "operator"
          : "client",
      created_at: apiDate(message.createdAt) ?? message.created_at ?? null,
      status: message.status ?? null,
      attachments: message.attachments ?? [],
    }));
  const hasMore =
    data.totalPages !== undefined ? page < data.totalPages : data.items.length === limit;
  return jsonResult({
    messages,
    total_returned: messages.length,
    total_api_items: data.totalItems ?? null,
    page,
    has_more: hasMore,
    next_page: hasMore ? page + 1 : null,
    search_scope: textQuery ? "current_page" : "none",
  });
}

export async function findConversations(args: ToolArgs<"find_conversations">): Promise<ToolResult> {
  const status = (args.status as string) || "open";
  const channel = args.channel;
  const tags = (args.tags as string[]) ?? [];
  const operator = args.operator;
  const client = args.client;
  const category = args.category;
  const limit = args.limit || 20;
  const textQuery = typeof args.query === "string" ? args.query.trim().toLowerCase() : undefined;
  const channelType =
    typeof args.channel_type === "string" && args.channel_type.trim()
      ? args.channel_type.trim()
      : undefined;

  // Echo what the call applied implicitly so the model sees its own query.
  const defaultsApplied: Record<string, string | number> = {};
  if (args.status === undefined) defaultsApplied.status = status;
  if (args.limit === undefined) defaultsApplied.limit = limit;
  const resolved: Record<string, unknown> = {};

  const query: Record<string, string | number | boolean | string[] | undefined | null> = {
    pageSize: Math.min(limit * 2, 100),
  };
  if (status === "unanswered") {
    query.status = "open";
  } else if (["open", "close", "all"].includes(status)) {
    query.status = status;
  }
  if (channelType) {
    query.channelType = channelType;
  }

  if (channel) {
    const res = await resolveChannel(channel);
    if (!res.channel) {
      return errorResult(
        translate("conversation.findConversations.channelIsNotUniquelyDefined", {
          channel: channel,
        }),
        channelCandidatesHint(res.candidates),
      );
    }
    query.channelId = res.channel.id;
    resolved.channel_id = res.channel.id;
  }

  const notices: string[] = [];
  if (tags.length) {
    const t = await resolveTagIds(tags);
    if (t.missing.length && !t.resolved.length) {
      return errorResult(
        translate("conversation.findConversations.tagsNotFound", { value1: t.missing.join(", ") }),
        translate("conversation.findConversations.getListTagsViaList"),
      );
    }
    if (t.missing.length) {
      // Partial tag match: run with the tags that resolved instead of failing the call.
      notices.push(
        translate("conversation.findConversations.tagsExcludedNoMatch", {
          value1: t.missing.join(", "),
        }),
      );
    }
    if (t.resolved.length) {
      query.tagIds = t.resolved;
      resolved.tag_ids = t.resolved;
    }
  }

  const needsLocalFiltering = Boolean(
    client || operator || category || status === "unanswered" || textQuery,
  );
  const requestedPage = typeof args.page === "number" && args.page > 0 ? Math.floor(args.page) : 1;
  const maxPages = needsLocalFiltering ? requestedPage + 4 : requestedPage;
  let dialogs: DialogItem[] = [];
  let totalUnanswered: number | undefined;
  let searchTruncated = false;
  for (let page = requestedPage; page <= maxPages; page += 1) {
    const data = await teletypeRequest<DialogListResponse>("/dialogs", {
      query: { ...query, page },
      decode: decodeDialogPage,
    });
    const pageItems = data?.items ?? [];
    dialogs.push(...pageItems);
    totalUnanswered ??= data?.totalUnanswered;
    if (pageItems.length < Number(query.pageSize)) break;
    searchTruncated = page === maxPages;
  }

  if (client) {
    const r = await resolveClient({ client });
    if (!r.client) {
      return errorResult(
        translate("conversation.findConversations.clientWasNotUniquelyFound", { client: client }),
        clientCandidatesHint(r.candidates),
      );
    }
    const cid = r.client.id;
    resolved.client_id = cid;
    dialogs = dialogs.filter((d) => d.clientId === cid || d.client?.id === cid);
  }

  if (operator) {
    if (operator === "unassigned") {
      dialogs = dialogs.filter((d) => !d.assignedOperatorId && !d.operator?.id);
    } else {
      const r = await resolveOperator(operator);
      if (!r.operator) {
        return errorResult(
          translate("conversation.findConversations.operatorWasNotUniquelyFound", {
            operator: operator,
          }),
          operatorCandidatesHint(r.candidates),
        );
      }
      const oid = r.operator.id;
      resolved.operator_id = oid;
      dialogs = dialogs.filter((d) => (d.assignedOperatorId || d.operator?.id) === oid);
    }
  }

  if (category) {
    const r = await resolveCategoryId(category);
    if (!r.id) {
      return errorResult(
        r.candidates.length
          ? translate("conversation.findConversations.categoryIsAmbiguous", { category: category })
          : translate("conversation.resolveConversation.categoryNotFound", { category: category }),
        categoryCandidatesHint(r.candidates),
      );
    }
    resolved.category_id = r.id;
    dialogs = dialogs.filter(
      (d) => d.lastCategoryId === r.id || d.categoryId === r.id || d.category?.id === r.id,
    );
  }

  if (status === "unanswered") {
    dialogs = dialogs.filter((d) => d.isUnanswered === true || d.unanswered === true);
  }

  if (textQuery) {
    dialogs = dialogs.filter((d) => {
      const msg = (d.lastMessage?.text || d.lastMessageText || "").toLowerCase();
      const clientName = (d.client?.name || d.clientName || d.client?.phone || "").toLowerCase();
      return msg.includes(textQuery) || clientName.includes(textQuery);
    });
  }

  const [channels, projectDomain] = await Promise.all([loadChannels(), loadProjectDomain()]);
  const channelById = new Map(channels.map((c) => [c.id, c]));

  const projected = dialogs.slice(0, limit).map((d) => {
    const channelId = d.channel?.id || d.channelId;
    const ch = channelId ? (channelById.get(channelId) ?? d.channel) : undefined;
    const appealId = getAppealId(d);
    // Keep the user-facing link before internal IDs in serialized tool output.
    return {
      link_to_dialog: buildDialogUrl(projectDomain, appealId),
      client_name:
        d.client?.name ||
        d.clientName ||
        d.client?.phone ||
        translate("conversation.findConversations.clientNameUnknown"),
      channel: ch?.name || ch?.channelType || channelId,
      channel_type: ch?.channelType || ch?.type,
      last_message_preview: (d.lastMessage?.text || d.lastMessageText || "").slice(0, 120),
      last_message_at: apiDate(d.lastMessageAt || d.lastMessage?.createdAt || d.updatedAt),
      assigned_operator: d.assignedOperatorId || d.operator?.name || null,
      is_unanswered: !!(d.isUnanswered || d.unanswered),
      status: d.status === 10 || d.status === "open" ? "open" : "closed",
      dialog_id: d.id,
      appeal_id: appealId,
      client_id: d.clientId || d.client?.id,
    };
  });

  const hasMore = dialogs.length > projected.length;

  return jsonResult({
    total_returned: projected.length,
    total_unanswered_in_project: totalUnanswered ?? null,
    search_truncated: searchTruncated,
    has_more: hasMore,
    next_page_hint: hasMore
      ? translate("conversation.findConversations.morePagesRepeatCall", {
          page: requestedPage + 1,
        })
      : null,
    ...(notices.length ? { notices } : {}),
    ...(Object.keys(defaultsApplied).length ? { defaults_applied: defaultsApplied } : {}),
    ...(Object.keys(resolved).length ? { resolved } : {}),
    dialogs: projected,
    display_instructions: translate(
      "conversation.findConversations.whenPresentingConversationsUserShow",
    ),
    hint:
      projected.length === 0
        ? translate("conversation.findConversations.thereAreNoDialogsMatching")
        : translate("conversation.findConversations.useDialogIdReadConversation"),
  });
}

export async function lookupClientProfile(
  args: ToolArgs<"lookup_client_profile">,
): Promise<ToolResult> {
  const client = args.client as string | undefined;
  const include_dialog_history = args.include_dialog_history !== false;
  const include_notes = args.include_notes !== false;

  if (!client) {
    return errorResult(
      translate("conversation.lookupClientProfile.clientParameterIsRequired"),
      translate("conversation.lookupClientProfile.passNamePhoneEmailOr"),
    );
  }

  const r = await resolveClient({ client });
  if (!r.client) {
    const cands = r.candidates.slice(0, 10).map((c) => ({
      client_id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
    }));
    return errorResult(
      translate("conversation.lookupClientProfile.clientWasNotUniquelyFound", {
        client: client,
        candidatesCount: r.candidates.length,
      }),
      cands.length
        ? translate("conversation.lookupClientProfile.candidatesRetrySelectedClientId", {
            json: JSON.stringify(cands, null, 2),
          })
        : translate("conversation.lookupClientProfile.thereAreNoClientsSuch"),
    );
  }

  const cid = r.client.id;
  const partialErrors: string[] = [];

  type DetailsLike = ClientItem & { url?: string };
  const detailsP = teletypeRequest<DetailsLike>(`/client/details/${encodeURIComponent(cid)}`, {
    decode: decodeClientDetails,
  }).catch((error: unknown) => {
    partialErrors.push(
      translate("conversation.lookupClientProfile.profile", { error: errorMessage(error) }),
    );
    return r.client as DetailsLike;
  });

  const customFieldsP = teletypeRequest<Record<string, unknown>>(
    `/client/get-custom-fields/${encodeURIComponent(cid)}`,
    { decode: decodeCustomFields },
  ).catch((error: unknown) => {
    partialErrors.push(
      translate("conversation.lookupClientProfile.customFields", { error: errorMessage(error) }),
    );
    return {};
  });

  const notesP = include_notes
    ? teletypeRequest<Record<string, unknown>[]>(`/client/notes-list/${encodeURIComponent(cid)}`, {
        query: { clientId: cid },
        decode: decodeClientNotes,
      }).catch((error: unknown) => {
        partialErrors.push(
          translate("conversation.lookupClientProfile.notes", { error: errorMessage(error) }),
        );
        return [] as Record<string, unknown>[];
      })
    : Promise.resolve([] as Record<string, unknown>[]);

  const [details, customFields, notes] = await Promise.all([detailsP, customFieldsP, notesP]);

  let recent_dialogs: Record<string, unknown>[] = [];
  let recent_dialogs_total: number | undefined;
  if (include_dialog_history) {
    try {
      const [dlgs, projectDomain] = await Promise.all([
        teletypeRequest<DialogListResponse>("/dialogs", {
          query: { pageSize: 50, status: "all" },
          decode: decodeDialogPage,
        }),
        loadProjectDomain(),
      ]);
      const clientDialogs = (dlgs?.items ?? []).filter((d) => (d.clientId || d.client?.id) === cid);
      recent_dialogs = clientDialogs.slice(0, 5).map((d) => {
        const appealId = getAppealId(d);
        return {
          link_to_dialog: buildDialogUrl(projectDomain, appealId),
          status: d.status === 10 || d.status === "open" ? "open" : "closed",
          last_message_at: apiDate(d.lastMessageAt || d.lastMessage?.createdAt || d.updatedAt),
          channel_id: d.channel?.id || d.channelId,
          dialog_id: d.id,
          appeal_id: appealId,
        };
      });
      if (clientDialogs.length > recent_dialogs.length) {
        recent_dialogs_total = clientDialogs.length;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : translate("conversation.lookupClientProfile.unknownError");
      partialErrors.push(
        translate("conversation.lookupClientProfile.conversationHistory", { message: message }),
      );
    }
  }

  const tagNames = (details?.tags ?? [])
    .map((t) => (typeof t === "string" ? t : t.tag || t.name || ""))
    .filter(Boolean);

  const notesMapped = (Array.isArray(notes) ? notes : []).map((n) => {
    const op = (n.operator as Record<string, unknown> | undefined) ?? {};
    return {
      id: n.id as string | undefined,
      text: n.text as string | undefined,
      operator: op.name as string | undefined,
      created_at: (n.created_at || n.createdAt) as string | undefined,
    };
  });

  return jsonResult({
    client_id: cid,
    name: details?.name,
    phone: details?.phone,
    email: details?.email,
    tags: tagNames,
    custom_fields: customFields ?? {},
    notes: notesMapped,
    recent_dialogs,
    ...(recent_dialogs_total !== undefined ? { recent_dialogs_total } : {}),
    partial_errors: partialErrors,
    profile_url: details?.url,
    hint: translate("conversation.lookupClientProfile.sendMessageUseSendReply"),
  });
}

export async function readConversationThread(
  args: ToolArgs<"read_conversation_thread">,
): Promise<ToolResult> {
  const dialog_id = args.dialog_id;
  const client = args.client;
  const messages_limit = args.messages_limit || 50;
  const mark_seen = args.mark_seen === true;

  if (mark_seen && args.confirm !== true) {
    return errorResult(
      translate("conversation.readConversationThread.conversationNotMarkedAsRead"),
      translate("conversation.common.repeatWithConfirm"),
    );
  }

  let did: string | undefined = dialog_id;

  if (!did) {
    if (!client) {
      return errorResult(
        translate("conversation.readConversationThread.needDialogIdORClient"),
        translate("conversation.readConversationThread.passDialogIdDirectlyOr"),
      );
    }
    const r = await resolveClient({ client });
    if (!r.client) {
      return errorResult(
        translate("conversation.findConversations.clientWasNotUniquelyFound", { client: client }),
        clientCandidatesHint(r.candidates),
      );
    }
    const last = await teletypeRequest("/client/dialog", {
      query: { clientId: r.client.id },
      decode: decodeClientDialog,
    });
    did = last?.id;
    if (!did) {
      return errorResult(
        translate("conversation.readConversationThread.clientHasNoDialogs", { id: r.client.id }),
        translate("conversation.readConversationThread.createNewOneViaSend"),
      );
    }
  }

  interface DialogDetails {
    isOpen?: boolean;
    isUnanswered?: boolean;
    sessionId?: string;
    channelId?: string;
    channel?: ChannelItem;
    assignedOperatorId?: string;
    operator?: { id?: string; name?: string } | null;
    categoryId?: string;
    lastCategoryId?: string;
    client?: ClientItem;
    lastSessionId?: string;
    appealExternalId?: string | number;
    id?: string;
  }

  const detailsP = teletypeRequest<DialogDetails>(`/dialog/details/${encodeURIComponent(did)}`, {
    decode: decodeDialogDetails,
  });
  const messagesP = (async (): Promise<MessageListResponse> => {
    const items: MessageItem[] = [];
    const pages = Math.ceil(messages_limit / 100);
    for (let page = 1; page <= pages; page += 1) {
      const data = await teletypeRequest<MessageListResponse>("/messages", {
        query: { dialogId: did, page, pageSize: Math.min(100, messages_limit - items.length) },
        decode: decodeMessagePage,
      });
      items.push(...(data?.items ?? []));
      if (
        !data?.items?.length ||
        data.items.length < Math.min(100, messages_limit - items.length + data.items.length)
      )
        break;
    }
    return { items: items.slice(0, messages_limit) };
  })();
  const domainP = loadProjectDomain();

  const [details, msgs, projectDomain] = await Promise.all([detailsP, messagesP, domainP]);
  const appealId = getAppealId({ ...details, lastSessionId: details?.sessionId, id: did });

  const STATUS_MAP: Record<number, string> = {
    10: "sending",
    20: "failed",
    30: "delivered",
  };

  const messages = (msgs?.items ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      link_to_message: buildMessageUrl(projectDomain, appealId, m.position),
      author: m.isItClient === false || m.operator?.id || m.operatorId ? "operator" : "client",
      text: m.text || "",
      created_at: apiDate(m.createdAt) || m.created_at,
      attachments: (m.attachments ?? []).map((a) => ({
        type: a.type || a.kind,
        url: a.url || a.path,
        name: a.name || a.filename,
        size: a.size,
      })),
      replied_to: m.repliedMessage?.id || m.replied_message_id || m.repliedMessageId || null,
      status: typeof m.status === "number" ? STATUS_MAP[m.status] || m.status : m.status,
      position: m.position,
      message_id: m.id,
      operator_id: m.operator?.id || m.operatorId,
    }));

  const threadNotices: string[] = [];
  let markedSeen = false;
  if (mark_seen && did) {
    if (resolveToolPolicy().readOnly) {
      // Read-only deployments keep the read; only the side effect is declined.
      threadNotices.push(translate("conversation.readConversationThread.readOnlyBlocksMarkSeen"));
    } else {
      try {
        await teletypeRequest(`/dialog/seen/${encodeURIComponent(did)}`, { method: "POST" });
        markedSeen = true;
      } catch {
        // non-blocking for read
      }
    }
  }

  const include_sessions = args.include_sessions === true;
  const session_id = args.session_id;
  const include_group_clients = args.include_group_clients === true;

  let sessions: unknown[] | undefined;
  if (include_sessions && did) {
    try {
      const sessionsRes = await teletypeRequest(`/dialog/sessions/${encodeURIComponent(did)}`, {
        decode: decodeDialogSessions,
      });
      sessions = (sessionsRes?.items ?? []).map((s) => ({
        id: s.id,
        operator: s.operator?.name || s.operator?.id,
        status: s.statusName === "close" || s.status === 20 ? "closed" : s.statusName || "open",
        created_at: s.createdAt,
        closed_at: s.status === 20 || s.statusName === "close" ? s.updatedAt : undefined,
        category: s.appealCategory?.name,
        rate: s.rate,
      }));
    } catch {
      sessions = [];
    }
  }

  let session_details: unknown;
  if (session_id) {
    try {
      const sessionRes = await teletypeRequest<Record<string, unknown>>(
        `/session/view/${encodeURIComponent(session_id)}`,
        { decode: decodeSessionDetails },
      );
      session_details = sessionRes;
    } catch {
      session_details = null;
    }
  }

  let group_clients: unknown[] | undefined;
  if (include_group_clients && did) {
    try {
      const gcRes = await teletypeRequest<unknown[]>(
        `/dialog/group-clients/${encodeURIComponent(did)}`,
        { decode: decodeGroupClients },
      );
      group_clients = Array.isArray(gcRes) ? gcRes : [];
    } catch {
      group_clients = [];
    }
  }

  return jsonResult({
    link_to_dialog: buildDialogUrl(projectDomain, appealId),
    status: details?.isOpen ? "open" : "closed",
    is_unanswered: details?.isUnanswered,
    client: {
      name: details?.client?.name,
      phone: details?.client?.phone,
      email: details?.client?.email,
    },
    messages_count: messages.length,
    messages,
    marked_seen: markedSeen,
    ...(threadNotices.length ? { notices: threadNotices } : {}),
    dialog_id: did,
    appeal_id: appealId,
    channel_id: details?.channel?.id || details?.channelId,
    assigned_operator_id: details?.operator?.id || details?.assignedOperatorId,
    category_id: details?.lastCategoryId || details?.categoryId,
    client_id: details?.client?.id,
    ...(sessions !== undefined ? { sessions } : {}),
    ...(session_details !== undefined ? { session_details } : {}),
    ...(group_clients !== undefined ? { group_clients } : {}),
    display_instructions: translate("conversation.readConversationThread.alwaysShowLinkDialogWhen"),
    hint: translate("conversation.readConversationThread.replyUseSendReplyClient", { did: did }),
  });
}

export async function readClientHistory(
  args: ToolArgs<"read_client_history">,
): Promise<ToolResult> {
  const client = args.client as string | undefined;
  const dialogsLimit = args.dialogs_limit || 3;
  const messagesPerDialog = args.messages_per_dialog || 10;

  if (!client) {
    return errorResult(
      translate("conversation.lookupClientProfile.clientParameterIsRequired"),
      translate("conversation.lookupClientProfile.passNamePhoneEmailOr"),
    );
  }

  const r = await resolveClient({ client });
  if (!r.client) {
    const cands = r.candidates.slice(0, 10).map((c) => ({
      client_id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
    }));
    return errorResult(
      translate("conversation.lookupClientProfile.clientWasNotUniquelyFound", {
        client: client,
        candidatesCount: r.candidates.length,
      }),
      cands.length
        ? translate("conversation.lookupClientProfile.candidatesRetrySelectedClientId", {
            json: JSON.stringify(cands, null, 2),
          })
        : translate("conversation.lookupClientProfile.thereAreNoClientsSuch"),
    );
  }

  const cid = r.client.id;
  const partialErrors: string[] = [];

  let clientDialogs: DialogItem[] = [];
  let projectDomain: string | undefined;
  try {
    const [dlgs, domain] = await Promise.all([
      teletypeRequest<DialogListResponse>("/dialogs", {
        query: { pageSize: 50, status: "all" },
        decode: decodeDialogPage,
      }),
      loadProjectDomain(),
    ]);
    projectDomain = domain;
    clientDialogs = (dlgs?.items ?? []).filter((d) => (d.clientId || d.client?.id) === cid);
  } catch (error) {
    // A failed scan degrades to an empty history instead of failing the call.
    partialErrors.push(
      translate("conversation.readClientHistory.dialogScan", { error: errorMessage(error) }),
    );
  }

  const projected: Record<string, unknown>[] = [];
  for (const d of clientDialogs.slice(0, dialogsLimit)) {
    const appealId = getAppealId(d);
    // messages_per_dialog <= 20 fits one /messages page, so unlike the multi-page
    // loop in read_conversation_thread a single request per dialog is enough.
    let messages: Record<string, unknown>[] = [];
    try {
      const page = await teletypeRequest<MessageListResponse>("/messages", {
        query: { dialogId: d.id, page: 1, pageSize: messagesPerDialog },
        decode: decodeMessagePage,
      });
      messages = (page?.items ?? [])
        .slice()
        .reverse()
        .map((m) => ({
          link_to_message: buildMessageUrl(projectDomain, appealId, m.position),
          author: m.isItClient === false || m.operator?.id || m.operatorId ? "operator" : "client",
          text: m.text || "",
          created_at: apiDate(m.createdAt) || m.created_at,
          message_id: m.id,
        }));
    } catch (error) {
      partialErrors.push(
        translate("conversation.readClientHistory.dialogMessages", {
          dialog: d.id,
          error: errorMessage(error),
        }),
      );
    }
    projected.push({
      link_to_dialog: buildDialogUrl(projectDomain, appealId),
      dialog_id: d.id,
      appeal_id: appealId,
      status: d.status === 10 || d.status === "open" ? "open" : "closed",
      last_message_at: apiDate(d.lastMessageAt || d.lastMessage?.createdAt || d.updatedAt),
      channel: d.channel?.name || d.channel?.channelType || d.channel?.id || d.channelId,
      messages_count: messages.length,
      messages,
    });
  }

  return jsonResult({
    client_id: cid,
    client_name: r.client.name || r.client.phone || r.client.email || cid,
    dialogs_returned: projected.length,
    dialogs: projected,
    partial_errors: partialErrors,
    hint: translate("conversation.readClientHistory.hint"),
  });
}

export async function resolveConversation(
  args: ToolArgs<"resolve_conversation">,
): Promise<ToolResult> {
  if (!args.confirm) {
    return errorResult(
      translate("conversation.resolveConversation.dialogHasNotBeenChanged"),
      translate("conversation.common.repeatWithConfirm"),
    );
  }
  const dialog_id = args.dialog_id as string | undefined;
  const final_note = args.final_note;
  const category = args.category;
  const add_tags = (args.add_tags as string[]) ?? [];
  const mark_unanswered = args.mark_unanswered === true;
  const mark_answered = args.mark_answered === true;
  const assign_operator = args.assign_operator;
  const should_close = args.close !== false;

  if (!dialog_id) {
    return errorResult(
      translate("conversation.resolveConversation.dialogIdParameterIsRequired"),
      translate("conversation.resolveConversation.getDialogIdViaFind"),
    );
  }

  // Resolve user-supplied names before any mutation. An unknown category must not
  // leave a conversation closed with only part of the requested work applied.
  const categoryId = category ? (await resolveCategoryId(category)).id : undefined;
  if (category && !categoryId) {
    return errorResult(
      translate("conversation.resolveConversation.categoryNotFound", { category }),
      translate("conversation.resolveConversation.listCategoriesBeforeRetry"),
    );
  }

  const applied: Record<string, unknown> = {};
  const errors: string[] = [];

  if (mark_unanswered) {
    try {
      await teletypeRequest(`/dialog/unanswered/${encodeURIComponent(dialog_id)}`, {
        method: "POST",
      });
      applied.marked_unanswered = true;
      return jsonResult({
        dialog_id,
        applied,
        partial_errors: errors,
        hint: translate("conversation.resolveConversation.openSessionsWereMarkedUnanswered"),
      });
    } catch (e: unknown) {
      // API errors carry their own hint at the dispatch boundary.
      if (e instanceof TeletypeApiError) throw e;
      const msg = e instanceof Error ? e.message : translate("conversation.error");
      return errorResult(
        translate("conversation.resolveConversation.failedMarkConversationAsUnanswered", {
          msg: msg,
        }),
        translate("server.buildServer.actionCouldBeCompletedCheck"),
      );
    }
  }

  if (mark_answered) {
    try {
      await teletypeRequest(`/dialog/answered/${encodeURIComponent(dialog_id)}`, {
        method: "POST",
      });
      applied.marked_answered = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : translate("conversation.error");
      errors.push(
        translate("conversation.resolveConversation.failedMarkConversationAsAnswered", {
          msg: msg,
        }),
      );
    }
  }

  if (assign_operator) {
    const trimmed = assign_operator.trim();
    if (trimmed.toLowerCase() === "auto") {
      try {
        await teletypeRequest(`/dialog/auto-assign-operator/${encodeURIComponent(dialog_id)}`, {
          method: "POST",
        });
        applied.operator = translate("conversation.resolveConversation.autoAssigned");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : translate("conversation.error");
        errors.push(
          translate("conversation.resolveConversation.automaticOperatorAssignmentFailed", {
            msg: msg,
          }),
        );
      }
    } else {
      const opRes = await resolveOperator(trimmed);
      if (!opRes.operator) {
        if (opRes.candidates.length > 1) {
          errors.push(
            translate("conversation.resolveConversation.operatorIsAmbiguousSeveralWere", {
              trimmed: trimmed,
              value2: opRes.candidates.map(operatorDisplayName).join(", "),
            }),
          );
        } else {
          errors.push(
            translate("conversation.resolveConversation.operatorNotFound", { trimmed: trimmed }),
          );
        }
      } else {
        try {
          await teletypeRequest(`/dialog/set-operator/${encodeURIComponent(dialog_id)}`, {
            method: "POST",
            body: { operator_id: opRes.operator.id },
          });
          applied.operator_id = opRes.operator.id;
          applied.operator_name = operatorDisplayName(opRes.operator);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : translate("conversation.error");
          errors.push(
            translate("conversation.resolveConversation.operatorAssignmentError", { msg: msg }),
          );
        }
      }
    }
  }

  let clientId: string | undefined;
  if (final_note || add_tags.length) {
    try {
      const det = await teletypeRequest(`/dialog/details/${encodeURIComponent(dialog_id)}`, {
        decode: decodeDialogDetails,
      });
      clientId = det?.client?.id || det?.clientId;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("conversation.error");
      errors.push(
        translate("conversation.resolveConversation.failedDetermineConversationClient", {
          message: message,
        }),
      );
    }
  }

  if (!clientId && final_note)
    errors.push(translate("conversation.resolveConversation.finalNoteWasNotCreated"));
  if (!clientId && add_tags.length)
    errors.push(translate("conversation.resolveConversation.noTagsWereAddedBecause"));

  if (category && categoryId) {
    try {
      await teletypeRequest(`/dialog/set-category/${encodeURIComponent(dialog_id)}`, {
        method: "POST",
        body: { category_appointed_id: categoryId },
      });
      applied.category = category;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : translate("conversation.error");
      errors.push(translate("conversation.resolveConversation.failedSetCategory", { msg: msg }));
    }
  }

  if (final_note && clientId) {
    try {
      const res = await teletypeRequest<{ id?: string }>(
        `/client/create-note/${encodeURIComponent(clientId)}`,
        { method: "POST", body: { text: final_note }, decode: decodeCreatedNote },
      );
      applied.note_id = res?.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : translate("conversation.error");
      errors.push(translate("conversation.resolveConversation.errorCreatingNote", { msg: msg }));
    }
  }

  if (add_tags.length && clientId) {
    const t = await resolveTagIds(add_tags);
    if (t.missing.length) {
      errors.push(
        translate("conversation.resolveConversation.nonExistentTags", {
          value1: t.missing.join(", "),
        }),
      );
    }
    const tagResults = await Promise.allSettled(
      t.resolved.map((tagId) =>
        teletypeRequest(`/client/add-tag/${encodeURIComponent(clientId)}`, {
          method: "POST",
          body: { tag_id: tagId },
        }),
      ),
    );
    applied.tags_added = tagResults.filter(({ status }) => status === "fulfilled").length;
    tagResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const message =
          result.reason instanceof Error ? result.reason.message : translate("conversation.error");
        errors.push(
          translate("conversation.resolveConversation.tagNotAdded", {
            value1: t.resolved[index],
            message: message,
          }),
        );
      }
    });
  }

  if (should_close) {
    try {
      await teletypeRequest(`/dialog/close/${encodeURIComponent(dialog_id)}`, { method: "POST" });
      applied.closed = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : translate("conversation.error");
      return {
        ...jsonResult({
          dialog_id,
          applied,
          partial_errors: [
            ...errors,
            translate("conversation.resolveConversation.failedCloseDialog", { msg: msg }),
          ],
          hint: translate("conversation.resolveConversation.someEarlierActionsMayHave"),
        }),
        isError: true,
      };
    }
  } else {
    applied.closed = false;
  }

  return jsonResult({
    dialog_id,
    applied,
    partial_errors: errors,
    hint: should_close
      ? translate("conversation.resolveConversation.conversationIsClosed")
      : translate("conversation.resolveConversation.dialogIsLeftOpenClose"),
  });
}
