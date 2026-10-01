import { type Server } from "node:http";
import express, { type Request } from "express";

type JsonRecord = Record<string, unknown>;

interface FakeApiCall {
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: unknown;
  token?: string;
}

export interface FakeTeletypeState {
  calls: FakeApiCall[];
  sentMessages: { dialogId?: string; text?: string; url?: string }[];
  notes: { clientId: string; text: string }[];
  closedDialogs: string[];
  unansweredDialogs: string[];
  answeredDialogs: string[];
  clientTags: Record<string, string[]>;
  dialogCategories: Record<string, string>;
  dialogOperators: Record<string, string>;
  autoAssignedDialogs: string[];
  seenDialogs: string[];
  updatedClients: Record<string, Record<string, string>>;
  updatedMessages: Record<string, string>;
  deletedMessages: string[];
  resentMessages: string[];
  whatsappTemplatesSent: {
    channelId: string;
    dialogId: string;
    templateId: string;
    template_params?: unknown;
    template_options?: unknown;
  }[];
  deletedNotes: string[];
  createdDialogs: {
    channelId: string;
    clientPhone?: string;
    clientEmail?: string;
    clientUsername?: string;
  }[];
  groupMembersAdded: { groupId: string; operatorId: string }[];
  groupMembersRemoved: { groupId: string; operatorId: string }[];
  groupChannelsAdded: { groupId: string; channelId: string }[];
  groupChannelsRemoved: { groupId: string; channelId: string }[];
  groupSupervisorsSet: { groupId: string; operatorId: string; isSupervisor: number }[];
  groupChannelVisibilitiesSet: {
    groupId: string;
    channelId: string;
    canViewOtherDialogs: number;
  }[];
  updatedPublicApi: { webhookUrl?: string; activeWebhooks?: string[] }[];
}

export interface FakeTeletypeApi {
  baseUrl: string;
  state: FakeTeletypeState;
  failNext(path: string, status?: number): void;
  reset(): void;
  close(): Promise<void>;
}

const date = (value: string): { date: string; timezone: string } => ({
  date: value,
  timezone: "UTC",
});

const clients = [
  {
    id: "client-ivan",
    name: "Иван Петров",
    phone: "+79990000001",
    email: "ivan@example.test",
    tags: [{ id: "tag-vip", tag: "VIP" }],
  },
  {
    id: "client-anna",
    name: "Анна Смирнова",
    phone: "+79990000002",
    email: "anna@example.test",
    tags: [{ id: "tag-refund", tag: "Возврат" }],
  },
  {
    id: "client-maria",
    name: "Мария Орлова",
    phone: "+79990000003",
    email: "maria@example.test",
    tags: [],
  },
];

const channels = [
  { id: "channel-telegram", name: "Telegram Support", type: "telegram", active: true },
  { id: "channel-email", name: "Old Email", type: "email", active: false },
  { id: "channel-whatsapp", name: "WhatsApp Sales", type: "whatsapp_edna", active: true },
];

const dialogs = [
  {
    id: "dialog-open",
    lastSessionId: "session-open",
    operator: { id: "operator-anna", name: "Анна" },
    client: clients[0],
    status: 10,
    statusName: "open",
    lastMessage: { id: "message-client", text: "Когда будет доставка?", isItClient: true },
    channel: channels[0],
    createdAt: date("2026-09-20T08:00:00+00:00"),
    lastMessageAt: date("2026-09-20T09:00:00+00:00"),
    isUnanswered: true,
    seen: false,
    countNewMessages: 1,
    isGroupChat: false,
    lastCategoryId: "category-support",
  },
  {
    id: "dialog-ivan-second",
    lastSessionId: "session-ivan-2",
    operator: { id: "operator-boris", name: "Борис" },
    client: clients[0],
    status: 20,
    statusName: "close",
    lastMessage: { id: "message-ivan-2", text: "Номер заказа 777", isItClient: true },
    channel: channels[1],
    createdAt: date("2026-09-19T08:00:00+00:00"),
    lastMessageAt: date("2026-09-19T09:00:00+00:00"),
    isUnanswered: false,
    seen: true,
    countNewMessages: 0,
    isGroupChat: false,
    lastCategoryId: "category-resolved",
  },
  {
    id: "dialog-closed",
    lastSessionId: "session-closed",
    operator: { id: "operator-boris", name: "Борис" },
    client: clients[1],
    status: 20,
    statusName: "close",
    lastMessage: { id: "message-closed", text: "Спасибо", isItClient: true },
    channel: channels[1],
    createdAt: date("2026-09-18T08:00:00+00:00"),
    lastMessageAt: date("2026-09-18T09:00:00+00:00"),
    isUnanswered: false,
    seen: true,
    countNewMessages: 0,
    isGroupChat: false,
    lastCategoryId: "category-resolved",
  },
  {
    id: "dialog-whatsapp",
    lastSessionId: "session-whatsapp",
    operator: { id: "operator-anna", name: "Анна" },
    client: clients[2],
    status: 20,
    statusName: "close",
    lastMessage: { id: "message-whatsapp", text: "Жду подтверждения", isItClient: true },
    channel: channels[2],
    createdAt: date("2026-09-17T08:00:00+00:00"),
    lastMessageAt: date("2026-09-17T09:00:00+00:00"),
    isUnanswered: false,
    seen: true,
    countNewMessages: 0,
    isGroupChat: false,
    lastCategoryId: "category-support",
  },
];

const messages: Record<string, JsonRecord[]> = {
  "dialog-open": [
    {
      id: "message-operator",
      dialogId: "dialog-open",
      sessionId: "session-open",
      position: 2,
      text: "Уточняю статус заказа",
      attachments: [],
      operator: { id: "operator-anna", name: "Анна" },
      client: null,
      status: 30,
      isItClient: false,
      createdAt: date("2026-09-20T08:30:00+00:00"),
      repliedMessage: null,
    },
    {
      id: "message-client",
      dialogId: "dialog-open",
      sessionId: "session-open",
      position: 1,
      text: "Когда будет доставка?",
      attachments: [],
      operator: null,
      client: { id: "client-ivan", name: "Иван Петров" },
      status: 30,
      isItClient: true,
      createdAt: date("2026-09-20T08:00:00+00:00"),
      repliedMessage: null,
    },
  ],
  "dialog-ivan-second": [
    {
      id: "message-ivan-2-reply",
      dialogId: "dialog-ivan-second",
      sessionId: "session-ivan-2",
      position: 2,
      text: "Заказ передан на склад",
      attachments: [],
      operator: { id: "operator-boris", name: "Борис" },
      client: null,
      status: 30,
      isItClient: false,
      createdAt: date("2026-09-19T08:30:00+00:00"),
      repliedMessage: null,
    },
    {
      id: "message-ivan-2",
      dialogId: "dialog-ivan-second",
      sessionId: "session-ivan-2",
      position: 1,
      text: "Номер заказа 777",
      attachments: [],
      operator: null,
      client: { id: "client-ivan", name: "Иван Петров" },
      status: 30,
      isItClient: true,
      createdAt: date("2026-09-19T08:00:00+00:00"),
      repliedMessage: null,
    },
  ],
  "dialog-closed": [],
  "dialog-whatsapp": [],
};

const wabaTemplateIds = new Set(["tpl-welcome"]);

export async function startFakeTeletypeApi(): Promise<FakeTeletypeApi> {
  const app = express();
  const failures = new Map<string, number>();
  const state: FakeTeletypeState = {
    calls: [],
    sentMessages: [],
    notes: [],
    closedDialogs: [],
    unansweredDialogs: [],
    answeredDialogs: [],
    clientTags: {
      "client-ivan": ["tag-vip"],
      "client-anna": ["tag-refund"],
    },
    dialogCategories: {},
    dialogOperators: {},
    autoAssignedDialogs: [],
    seenDialogs: [],
    updatedClients: {},
    updatedMessages: {},
    deletedMessages: [],
    resentMessages: [],
    whatsappTemplatesSent: [],
    deletedNotes: [],
    createdDialogs: [],
    groupMembersAdded: [],
    groupMembersRemoved: [],
    groupChannelsAdded: [],
    groupChannelsRemoved: [],
    groupSupervisorsSet: [],
    groupChannelVisibilitiesSet: [],
    updatedPublicApi: [],
  };
  const initialState = structuredClone(state);

  function currentDialog(dialog: (typeof dialogs)[number]) {
    const closed = state.closedDialogs.includes(dialog.id);
    const lastAnswered = state.answeredDialogs.lastIndexOf(dialog.id);
    const lastUnanswered = state.unansweredDialogs.lastIndexOf(dialog.id);
    const isUnanswered =
      closed || lastAnswered >= 0 || lastUnanswered >= 0
        ? !closed && lastUnanswered > lastAnswered
        : dialog.isUnanswered;
    const seen = dialog.seen || state.seenDialogs.includes(dialog.id);
    return {
      ...dialog,
      status: closed ? 20 : dialog.status,
      statusName: closed ? "close" : dialog.statusName,
      isUnanswered,
      seen,
      countNewMessages: seen ? 0 : dialog.countNewMessages,
      lastCategoryId: state.dialogCategories[dialog.id] ?? dialog.lastCategoryId,
    };
  }

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use((req, res, next) => {
    state.calls.push({
      method: req.method,
      path: req.path,
      query: { ...req.query },
      body: req.body as unknown,
      token: req.header("X-Auth-Token"),
    });
    const status = failures.get(req.path);
    if (status) {
      failures.delete(req.path);
      res
        .status(status)
        .json({ success: false, data: null, errors: [{ message: "fake failure" }] });
      return;
    }
    if (!req.header("X-Auth-Token")) {
      res.status(401).json({ success: false, data: null, errors: [{ message: "unauthorized" }] });
      return;
    }
    next();
  });

  const router = express.Router();
  const ok = (res: express.Response, data: unknown): void => {
    res.json({ success: true, data, errors: [], errorsType: null });
  };

  router.get("/tag/list", (_req, res) => {
    ok(res, [
      { id: "tag-vip", tag: "VIP", color: "#ffd700" },
      { id: "tag-refund", tag: "Возврат", color: "#ff0000" },
    ]);
  });
  router.get("/appeal-categories/list", (_req, res) => {
    ok(res, [
      { id: "category-support", name: "Поддержка" },
      { id: "category-resolved", name: "Решено" },
    ]);
  });
  router.get("/channels", (req, res) => {
    const items =
      (textQuery(req, "onlyActive") ?? "1") === "0"
        ? channels
        : channels.filter(({ active }) => active);
    ok(res, page(items, req));
  });
  router.get("/project/operators", (_req, res) => {
    ok(res, [
      { id: "operator-anna", name: "Анна", last_name: "Иванова", status: 20 },
      { id: "operator-boris", name: "Борис", last_name: "Петров", status: 30 },
    ]);
  });
  router.get("/project/details", (_req, res) => {
    ok(res, { id: "project-demo", name: "Demo Support", domain: "demo" });
  });
  router.get("/project/balance", (_req, res) => {
    ok(res, {
      balance: 150_000,
      paidUntilDate: "2026-10-15",
      promoDaysRemain: 0,
      promoEndDate: null,
      promisedPayment: 0,
    });
  });
  router.get("/project/tariff", (_req, res) => {
    ok(res, { active: true, paid: true, dailyPayment: 10_000, dailyPaymentByPrice: 10_000 });
  });
  router.get("/project/api-status", (_req, res) => {
    ok(res, { webhookErrorsCount: 0 });
  });
  router.get("/template-message/list", (_req, res) => {
    ok(res, {
      directories: [],
      withoutDirectories: {
        templates: [{ id: "template-delivery", name: "Доставка", text: "Здравствуйте, {{name}}!" }],
      },
    });
  });
  router.get("/template-message/directories", (_req, res) => {
    ok(res, [
      {
        id: "dir-support",
        name: "Общие шаблоны",
        description: "Шаблоны службы поддержки",
        projectId: "project-demo",
      },
    ]);
  });

  router.get("/clients", (req, res) => {
    const clientId = textQuery(req, "clientId");
    if (clientId) {
      const client = clients.find(({ id }) => id === clientId);
      if (client) ok(res, client);
      else res.status(500).json({ success: false, data: null, errors: [{ message: "not found" }] });
      return;
    }
    const phone = textQuery(req, "clientPhone");
    const phoneDigits = phone?.replace(/\D/g, "");
    const items = phone
      ? clients.filter(
          (client) => phoneDigits && client.phone.replace(/\D/g, "").includes(phoneDigits),
        )
      : clients;
    ok(res, page(items, req));
  });
  router.get("/client/details/:clientId", (req, res) => {
    const client = clients.find(({ id }) => id === req.params.clientId);
    if (!client) {
      res.status(404).json({ success: false, data: null, errors: [{ message: "not found" }] });
      return;
    }
    ok(res, { ...client, url: `https://demo.teletype.app/clients/${client.id}` });
  });
  router.get("/client/get-custom-fields/:clientId", (req, res) => {
    ok(res, req.params.clientId === "client-ivan" ? { order_id: "ORDER-42" } : {});
  });
  router.get("/client/notes-list/:clientId", (req, res) => {
    ok(
      res,
      state.notes
        .filter(({ clientId }) => clientId === req.params.clientId)
        .map((note, index) => ({ id: `note-${index + 1}`, text: note.text })),
    );
  });
  router.get("/client/dialog", (req, res) => {
    const clientId = textQuery(req, "clientId");
    const dialog = dialogs.find((item) => item.client?.id === clientId);
    ok(res, dialog ? currentDialog(dialog) : null);
  });

  router.get("/dialogs", (req, res) => {
    const allDialogs = dialogs.map(currentDialog);
    let items = allDialogs;
    const status = textQuery(req, "status");
    const channelId = textQuery(req, "channelId");
    if (status && status !== "all") items = items.filter((dialog) => dialog.statusName === status);
    if (channelId) items = items.filter((dialog) => dialog.channel?.id === channelId);
    ok(res, {
      ...page(items, req),
      totalUnanswered: allDialogs.filter((dialog) => dialog.isUnanswered).length,
    });
  });
  router.get("/dialog/details/:dialogId", (req, res) => {
    const initial = dialogs.find(({ id }) => id === req.params.dialogId);
    const dialog = initial ? currentDialog(initial) : undefined;
    if (!dialog) {
      res.status(404).json({ success: false, data: null, errors: [{ message: "not found" }] });
      return;
    }
    ok(res, {
      sessionId: dialog.lastSessionId,
      operator: dialog.operator,
      client: dialog.client,
      isOpen: dialog.statusName === "open",
      isUnanswered: dialog.isUnanswered,
      channelId: dialog.channel?.id,
      categoryId: dialog.lastCategoryId,
    });
  });
  router.get("/messages", (req, res) => {
    const dialogId = textQuery(req, "dialogId") || "";
    const sent = state.sentMessages.flatMap((message, index) =>
      !dialogId || message.dialogId === dialogId
        ? [
            {
              id: `sent-${index + 1}`,
              dialogId,
              sessionId: "session-open",
              position: (messages[dialogId]?.length ?? 0) + index + 1,
              text: message.text ?? "",
              attachments: [],
              operator: { id: "operator-anna", name: "Анна" },
              client: null,
              status: 10,
              isItClient: false,
              createdAt: date("2026-09-20T09:00:00+00:00"),
              repliedMessage: null,
            },
          ]
        : [],
    );
    const channelId = textQuery(req, "channelId");
    const clientId = textQuery(req, "clientId");
    const onlyActive = textQuery(req, "onlyActive") === "1";
    const all = [
      ...sent,
      ...(dialogId ? (messages[dialogId] ?? []) : Object.values(messages).flat()),
    ]
      .filter((message) => {
        const dialog = dialogs.find((item) => item.id === message.dialogId);
        return (
          (!channelId || dialog?.channel?.id === channelId) &&
          (!clientId || dialog?.client?.id === clientId) &&
          (!onlyActive || dialog?.channel?.active)
        );
      })
      .sort((a, b) => {
        const aDate = (a.createdAt as { date: string }).date;
        const bDate = (b.createdAt as { date: string }).date;
        return bDate.localeCompare(aDate);
      });
    ok(res, page(all, req));
  });

  router.post("/message/send", (req, res) => {
    const sent = {
      dialogId: bodyText(req, "dialogId"),
      text: bodyText(req, "text") || undefined,
      url: bodyText(req, "url") || undefined,
    };
    state.sentMessages.push(sent);
    ok(res, { ids: [`sent-${state.sentMessages.length}`] });
  });
  router.post("/channel/send-message", (req, res) => {
    state.sentMessages.push({ text: bodyText(req, "text") || undefined });
    ok(res, { dialog: { id: "dialog-created" }, messages: [`sent-${state.sentMessages.length}`] });
  });
  router.post("/dialog/create", (req, res) => {
    state.createdDialogs.push({
      channelId: bodyText(req, "channelId"),
      clientPhone: bodyText(req, "clientPhone") || undefined,
      clientEmail: bodyText(req, "clientEmail") || undefined,
      clientUsername: bodyText(req, "clientUsername") || undefined,
    });
    ok(res, {
      id: "dialog-new-created",
      url: "https://demo.teletype.app/dialog/dialog-new-created",
    });
  });
  router.post("/dialog/answered/:dialogId", (req, res) => {
    state.answeredDialogs.push(req.params.dialogId);
    ok(res, true);
  });
  router.post("/dialog/unanswered/:dialogId", (req, res) => {
    state.unansweredDialogs.push(req.params.dialogId);
    ok(res, true);
  });
  router.post("/dialog/close/:dialogId", (req, res) => {
    state.closedDialogs.push(req.params.dialogId);
    ok(res, true);
  });
  router.post("/dialog/set-category/:dialogId", (req, res) => {
    state.dialogCategories[req.params.dialogId] = bodyText(req, "category_appointed_id");
    ok(res, true);
  });
  router.post("/dialog/set-operator/:dialogId", (req, res) => {
    state.dialogOperators[req.params.dialogId] = bodyText(req, "operator_id");
    ok(res, true);
  });
  router.post("/dialog/auto-assign-operator/:dialogId", (req, res) => {
    state.autoAssignedDialogs.push(req.params.dialogId);
    ok(res, true);
  });
  router.post("/client/add-tag/:clientId", (req, res) => {
    const tags = (state.clientTags[req.params.clientId] ??= []);
    tags.push(bodyText(req, "tag_id"));
    ok(res, true);
  });
  router.post("/client/remove-tag/:clientId", (req, res) => {
    state.clientTags[req.params.clientId] = (state.clientTags[req.params.clientId] ?? []).filter(
      (tagId) => tagId !== bodyText(req, "tag_id"),
    );
    ok(res, true);
  });
  router.post("/client/create-note/:clientId", (req, res) => {
    state.notes.push({ clientId: req.params.clientId, text: bodyText(req, "text") });
    ok(res, { id: `note-${state.notes.length}` });
  });
  router.post("/client/set-custom-fields/:clientId", (_req, res) => {
    ok(res, true);
  });
  router.post("/client/update/:clientId", (req, res) => {
    const body = Object.fromEntries(
      Object.entries(bodyData(req)).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    state.updatedClients[req.params.clientId] = body;
    ok(res, { id: req.params.clientId, ...body });
  });

  router.post("/dialog/seen/:dialogId", (req, res) => {
    state.seenDialogs.push(req.params.dialogId);
    ok(res, true);
  });

  router.post("/message/update/:messageId", (req, res) => {
    state.updatedMessages[req.params.messageId] = bodyText(req, "text");
    ok(res, true);
  });
  router.post("/message/delete/:messageId", (req, res) => {
    state.deletedMessages.push(req.params.messageId);
    ok(res, true);
  });
  router.post("/message/resend/:messageId", (req, res) => {
    state.resentMessages.push(req.params.messageId);
    ok(res, { result: true });
  });

  router.get("/groups", (_req, res) => {
    ok(res, [
      { id: "group-support", name: "Первая линия", operators: [{ id: "operator-anna" }] },
      { id: "group-sales", name: "Отдел продаж", operators: [{ id: "operator-boris" }] },
    ]);
  });

  router.get("/group/view/:groupId", (req, res) => {
    const list = [
      {
        id: "group-support",
        name: "Первая линия",
        description: "Первая линия саппорта",
        color: "#51C951",
        operatorIds: ["operator-anna"],
        supervisorIds: [],
        channels: [{ channelId: "channel-telegram", canViewOtherDialogs: true }],
      },
      {
        id: "group-sales",
        name: "Отдел продаж",
        description: "Менеджеры продаж",
        color: "#3366FF",
        operatorIds: ["operator-boris"],
        supervisorIds: [],
        channels: [],
      },
    ];
    const found = list.find((g) => g.id === req.params.groupId);
    if (!found) {
      res.status(404).json({ success: false, errors: [{ message: "Group not found" }] });
      return;
    }
    ok(res, found);
  });

  router.post("/group/add-member/:groupId", (req, res) => {
    state.groupMembersAdded.push({
      groupId: req.params.groupId,
      operatorId: bodyText(req, "operatorId"),
    });
    ok(res, true);
  });
  router.post("/group/remove-member/:groupId", (req, res) => {
    state.groupMembersRemoved.push({
      groupId: req.params.groupId,
      operatorId: bodyText(req, "operatorId"),
    });
    ok(res, true);
  });
  router.post("/group/add-channel/:groupId", (req, res) => {
    state.groupChannelsAdded.push({
      groupId: req.params.groupId,
      channelId: bodyText(req, "channelId"),
    });
    ok(res, true);
  });
  router.post("/group/remove-channel/:groupId", (req, res) => {
    state.groupChannelsRemoved.push({
      groupId: req.params.groupId,
      channelId: bodyText(req, "channelId"),
    });
    ok(res, true);
  });
  router.post("/group/set-supervisor/:groupId", (req, res) => {
    state.groupSupervisorsSet.push({
      groupId: req.params.groupId,
      operatorId: bodyText(req, "operatorId"),
      isSupervisor: Number(bodyText(req, "isSupervisor") || 1),
    });
    ok(res, true);
  });
  router.post("/group/set-channel-visibility/:groupId", (req, res) => {
    state.groupChannelVisibilitiesSet.push({
      groupId: req.params.groupId,
      channelId: bodyText(req, "channelId"),
      canViewOtherDialogs: Number(bodyText(req, "canViewOtherDialogs") || 1),
    });
    ok(res, true);
  });

  router.post("/project/update-public-api", (req, res) => {
    const body = bodyData(req);
    const activeWebhooks = body["active_webhooks[]"] ?? body.active_webhooks;
    state.updatedPublicApi.push({
      webhookUrl: bodyText(req, "api_webhook") || undefined,
      activeWebhooks: Array.isArray(activeWebhooks)
        ? activeWebhooks.filter((item): item is string => typeof item === "string")
        : [],
    });
    ok(res, true);
  });

  router.post("/whatsapp-edna/send-template/:channelId", (req, res) => {
    const channel = channels.find(({ id }) => id === req.params.channelId);
    const dialogId = bodyText(req, "dialogId");
    const dialog = dialogs.find(({ id }) => id === dialogId);
    const templateId = bodyText(req, "templateId");
    if (
      !req.is("application/x-www-form-urlencoded") ||
      channel?.type !== "whatsapp_edna" ||
      dialog?.channel?.id !== channel.id ||
      !wabaTemplateIds.has(templateId)
    ) {
      res.status(400).json({
        success: false,
        data: null,
        errors: [{ message: "invalid WhatsApp template request" }],
      });
      return;
    }
    state.whatsappTemplatesSent.push({
      channelId: req.params.channelId,
      dialogId,
      templateId,
      template_params: bodyData(req).template_params,
      ...(bodyData(req).template_options
        ? { template_options: bodyData(req).template_options }
        : {}),
    });
    ok(res, { ids: ["wa-msg-101"] });
  });

  router.get("/client/delete-note/:noteId", (req, res) => {
    state.deletedNotes.push(req.params.noteId);
    ok(res, true);
  });

  router.get("/dialog/sessions/:dialogId", (_req, res) => {
    ok(res, {
      items: [
        {
          id: "session-hist-1",
          status: 20,
          statusName: "close",
          createdAt: date("2026-09-18T08:00:00+00:00").date,
          updatedAt: date("2026-09-18T09:00:00+00:00").date,
          operator: { id: "operator-boris", name: "Борис" },
          appealCategory: { id: "category-resolved", name: "Решено" },
          rate: 5,
        },
      ],
    });
  });

  router.get("/session/view/:sessionId", (req, res) => {
    ok(res, {
      id: req.params.sessionId,
      status: 20,
      statusName: "close",
      rate: 5,
      openedAt: "2026-09-18T08:00:00+00:00",
      closedAt: "2026-09-18T09:00:00+00:00",
      operator: { id: "operator-boris", name: "Борис" },
    });
  });

  router.get("/dialog/group-clients/:dialogId", (_req, res) => {
    ok(res, [
      { id: "client-group-1", name: "Участник 1", phone: "+79991112233" },
      { id: "client-group-2", name: "Участник 2", phone: "+79994445566" },
    ]);
  });

  app.use("/public/api/v1", router);

  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => {
      resolve(listener);
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fake API did not bind a TCP port.");

  return {
    baseUrl: `http://127.0.0.1:${address.port}/public/api/v1`,
    state,
    failNext(path, status = 500) {
      failures.set(`/public/api/v1${path}`, status);
    },
    reset() {
      Object.assign(state, structuredClone(initialState));
      failures.clear();
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        }),
      ),
  };
}

function bodyData(req: Request): Record<string, unknown> {
  const value: unknown = req.body;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function bodyText(req: Request, key: string): string {
  const value = bodyData(req)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function textQuery(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function page<T>(
  items: T[],
  req: Request,
): {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  items: T[];
} {
  const currentPage = Number(textQuery(req, "page") || 1);
  const pageSize = Number(textQuery(req, "pageSize") || 15);
  const offset = (currentPage - 1) * pageSize;
  return {
    currentPage,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    pageSize,
    items: items.slice(offset, offset + pageSize),
  };
}
