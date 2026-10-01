interface ExpectedToolCall {
  name: string;
  arguments?: Record<string, unknown>;
  alternativeArguments?: Record<string, unknown>[];
}

export interface ModelEvalCase {
  id: string;
  title: string;
  prompt: string;
  expectedCalls: ExpectedToolCall[];
  forbiddenTools?: string[];
  answerIncludes?: string[];
  answerIncludesAny?: { name: string; phrases: string[] }[];
  split?: "heldout";
}

const acceptedOrQueued = {
  name: "accepted_or_queued",
  phrases: ["приня", "очеред", "accepted: true", "accepted=true"],
};

export const MODEL_EVAL_CASES: ModelEvalCase[] = [
  {
    id: "triage-unanswered",
    title: "Триаж неотвеченных диалогов",
    prompt: "Покажи неотвеченные диалоги и кратко скажи, кому нужно ответить.",
    expectedCalls: [{ name: "find_conversations", arguments: { status: "unanswered" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["Иван"],
  },
  {
    id: "client-profile",
    title: "Карточка клиента по opaque ID",
    prompt: "Покажи карточку клиента client-ivan и его последние обращения.",
    expectedCalls: [{ name: "lookup_client_profile", arguments: { client: "client-ivan" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["Иван"],
  },
  {
    id: "read-thread",
    title: "Чтение переписки",
    prompt: "Прочитай диалог dialog-open и скажи, о чём спрашивает клиент.",
    expectedCalls: [{ name: "read_conversation_thread", arguments: { dialog_id: "dialog-open" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["достав"],
  },
  {
    id: "draft-without-send",
    title: "Черновик без отправки",
    prompt:
      "Прочитай dialog-open и предложи вежливый ответ про доставку завтра, но ничего не отправляй.",
    expectedCalls: [{ name: "read_conversation_thread", arguments: { dialog_id: "dialog-open" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
  },
  {
    id: "confirmed-reply",
    title: "Подтверждённая отправка",
    prompt:
      "Отправь в dialog-open точный текст «Заказ будет доставлен завтра». Я проверил получателя и явно подтверждаю отправку.",
    expectedCalls: [
      {
        name: "send_reply_to_client",
        arguments: {
          recipient_dialog_id: "dialog-open",
          text: "Заказ будет доставлен завтра",
          confirm: true,
        },
      },
    ],
    answerIncludesAny: [acceptedOrQueued],
  },
  {
    id: "confirmed-close",
    title: "Подтверждённое закрытие",
    prompt: "Закрой dialog-open как решённый. Dialog ID проверен, действие подтверждаю.",
    expectedCalls: [
      {
        name: "resolve_conversation",
        arguments: { dialog_id: "dialog-open", confirm: true },
      },
    ],
    forbiddenTools: ["send_reply_to_client"],
    answerIncludes: ["закры"],
  },
  {
    id: "workspace-metadata",
    title: "Справочники проекта",
    prompt: "Какие каналы есть в проекте и какие из них активны?",
    expectedCalls: [{ name: "list_workspace_metadata", arguments: { resource: "channels" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["Telegram"],
  },
  {
    id: "technical-status",
    title: "Техническое состояние",
    prompt: "Проверь техническое состояние каналов и публичного API проекта.",
    expectedCalls: [{ name: "get_project_status", arguments: { aspect: "technical" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["канал"],
  },
  {
    id: "manage-sent-message",
    title: "Редактирование отправленного сообщения",
    prompt:
      "Исправь текст сообщения message-operator на «Уточняю статус доставки заказа». Действие подтверждаю.",
    expectedCalls: [
      {
        name: "manage_sent_message",
        arguments: {
          message_id: "message-operator",
          action: "update",
          text: "Уточняю статус доставки заказа",
          confirm: true,
        },
      },
    ],
    forbiddenTools: ["send_reply_to_client", "resolve_conversation"],
  },
  {
    id: "whatsapp-template",
    title: "Отправка WhatsApp шаблона",
    prompt:
      "Отправь зарегистрированный WABA-шаблон tpl-welcome в канал channel-whatsapp для диалога dialog-whatsapp. Канал и получателя я проверил, отправку подтверждаю.",
    expectedCalls: [
      {
        name: "send_whatsapp_template",
        arguments: {
          channel_id: "channel-whatsapp",
          dialog_id: "dialog-whatsapp",
          template_id: "tpl-welcome",
          confirm: true,
        },
      },
    ],
    forbiddenTools: ["send_reply_to_client", "resolve_conversation"],
    answerIncludesAny: [acceptedOrQueued],
  },
  {
    id: "client-history-heldout",
    title: "История клиента одним вызовом",
    prompt:
      "Собери контекст по клиенту Иван Петров: его недавние диалоги и последние сообщения в них.",
    expectedCalls: [{ name: "read_client_history", arguments: { client: "Иван Петров" } }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["Иван"],
    split: "heldout",
  },
  {
    id: "detailed-inbox-heldout",
    title: "Подробный режим списка",
    prompt: "Покажи неотвеченные диалоги в подробном режиме со всеми полями каждого диалога.",
    expectedCalls: [
      {
        name: "find_conversations",
        arguments: { status: "unanswered", response_format: "detailed" },
      },
    ],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["Иван"],
    split: "heldout",
  },
  {
    id: "annotate-client-heldout",
    title: "Пометки клиента с подтверждением",
    prompt:
      "Добавь клиенту Иван Петров тег «Возврат» и заметку «Просил перезвонить по заказу». Изменения подтверждаю.",
    expectedCalls: [
      {
        name: "annotate_client_record",
        arguments: {
          client: "Иван Петров",
          add_tags: ["Возврат"],
          note: "Просил перезвонить по заказу",
          confirm: true,
        },
        alternativeArguments: [
          {
            client: "client-ivan",
            add_tags: ["Возврат"],
            note: "Просил перезвонить по заказу",
            confirm: true,
          },
        ],
      },
    ],
    forbiddenTools: ["send_reply_to_client", "resolve_conversation"],
    split: "heldout",
  },
  {
    id: "group-supervisor",
    title: "Назначение супервизора группы",
    prompt: "Назначь Бориса супервизором группы «Первая линия». Изменение подтверждаю.",
    expectedCalls: [
      {
        name: "manage_operator_group",
        arguments: {
          action: "set_supervisor",
          group: "Первая линия",
          operator: "Борис",
          confirm: true,
        },
      },
    ],
    forbiddenTools: ["send_reply_to_client", "resolve_conversation"],
  },
  {
    id: "webhook-config",
    title: "Настройка вебхука проекта",
    prompt:
      "Настрой вебхук проекта: URL https://example.test/hook, активные события new message и close dialog. Подтверждаю.",
    expectedCalls: [
      {
        name: "configure_project_webhook",
        arguments: {
          webhook_url: "https://example.test/hook",
          active_events: ["new message", "close dialog"],
          confirm: true,
        },
      },
    ],
    forbiddenTools: ["send_reply_to_client", "resolve_conversation"],
  },
  {
    id: "capabilities-map",
    title: "Карта возможностей сервера",
    prompt: "Какие инструменты доступны на сервере и включён ли режим read-only?",
    expectedCalls: [{ name: "get_capabilities" }],
    forbiddenTools: ["send_reply_to_client", "annotate_client_record", "resolve_conversation"],
    answerIncludes: ["find_conversations"],
  },
  {
    id: "client-by-phone",
    title: "Поиск клиента по телефону без изменений",
    prompt:
      "Найди клиента с номером +79990000002 и назови его имя. Диалог не создавай, сообщения не отправляй.",
    expectedCalls: [{ name: "list_clients", arguments: { phone: "+79990000002" } }],
    forbiddenTools: ["create_dialog_by_phone", "send_reply_to_client"],
    answerIncludes: ["Анна"],
  },
  {
    id: "client-list-page",
    title: "Постраничный список клиентов",
    prompt: "Покажи вторую страницу списка клиентов по одному клиенту на странице. Кто там?",
    expectedCalls: [{ name: "list_clients", arguments: { page: 2, limit: 1 } }],
    forbiddenTools: ["create_dialog_by_phone", "send_reply_to_client"],
    answerIncludes: ["Анна"],
  },
  {
    id: "find-old-message",
    title: "Поиск текста старого сообщения",
    prompt:
      "Найди в сообщениях клиента client-ivan номер заказа 777 и скажи, в каком диалоге клиент его написал. Не изменяй данные.",
    expectedCalls: [
      { name: "find_messages", arguments: { client_id: "client-ivan", query: "777" } },
    ],
    forbiddenTools: ["create_dialog_by_phone", "send_reply_to_client"],
    answerIncludes: ["777", "dialog-ivan-second"],
  },
  {
    id: "preview-phone-dialog",
    title: "Просмотр последствий создания диалога",
    prompt:
      "Проверь без изменений, можно ли создать WhatsApp-диалог в канале channel-whatsapp с номером +79990000003 и какие будут последствия. Создание пока не подтверждаю.",
    expectedCalls: [
      {
        name: "create_dialog_by_phone",
        arguments: { phone: "+79990000003", channel: "channel-whatsapp", dry_run: true },
      },
    ],
    forbiddenTools: ["send_reply_to_client"],
    answerIncludes: ["сообщ"],
  },
  {
    id: "create-phone-dialog",
    title: "Создание диалога по номеру без сообщения",
    prompt:
      "Создай WhatsApp-диалог в канале channel-whatsapp с номером +79990000003. Канал и номер проверены, создание подтверждаю. Сообщение не отправляй.",
    expectedCalls: [
      {
        name: "create_dialog_by_phone",
        arguments: { phone: "+79990000003", channel: "channel-whatsapp", confirm: true },
      },
    ],
    forbiddenTools: ["send_reply_to_client"],
    answerIncludes: ["dialog-new-created"],
  },
];
