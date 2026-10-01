import type { MessageValue } from "../types.js";

export const promptsMessages = {
  "prompts.triageInbox.description":
    "Проанализировать очередь неотвеченных диалогов Teletype, приоритизировать их по срочности и составить план обработки для оператора.",
  "prompts.triageInbox.channelId.description":
    "ID канала для фильтрации (опционально, если нужно разобрать конкретный канал).",
  "prompts.triageInbox.limit.description":
    "Сколько диалогов загрузить для анализа (по умолчанию 10).",
  "prompts.draftReply.description":
    "Изучить историю обращения клиента и составить качественный вежливый ответ в соответствии с tone-of-voice саппорта.",
  "prompts.draftReply.dialogId.description": "ID диалога в Teletype для ответа.",
  "prompts.draftReply.instructions.description":
    "Особые пожелания или тезисы ответа (например, 'согласован возврат, предложить скидку 10%').",
  "prompts.clientSummary.description":
    "Сформировать комплексную карточку клиента: контакты, теги, заметки, предыдущие обращения и тональность.",
  "prompts.clientSummary.client.description": "Имя, телефон, email или ID клиента для поиска.",
  "prompts.escalateIssue.description":
    "Собрать из переписки с клиентом структурированный баг-репорт / карточку эскалации для команды разработки.",
  "prompts.escalateIssue.dialogId.description": "ID диалога с сообщением о проблеме.",
  "prompts.escalateIssue.component.description":
    "Компонент или сервис (например, 'Оплата', 'Мобильное приложение', 'Интеграция CRM').",
  "prompts.shiftHandover.description":
    "Сформировать отчёт по смене поддержки: неотвеченные обращения, каналы с проблемами, доступность команды и предупреждения по балансу/вебхукам.",
  "prompts.shiftHandover.channelId.description": "ID канала для фокусной проверки (опционально).",
  "prompts.triageInbox.channel": ({ channelId }: { channelId: MessageValue }) =>
    `, channel='${channelId}'`,
  "prompts.triageInbox.triagePlanQueueUnansweredRequests":
    "План триажа очереди неотвеченных обращений",
  "prompts.triageInbox.step1CallFindConversationsStatus": ({
    channelText,
    limit,
  }: {
    channelText: MessageValue;
    limit: MessageValue;
  }) => `1. Вызови find_conversations с status='unanswered'${channelText}, limit=${limit}.
2. Для каждого найденного диалога изучи последнее сообщение клиента и время ожидания.
3. Раздели диалоги на категории срочности:
   - 🔴 Критичные (жалобы, сбои оплаты, VIP-клиенты).
   - 🟡 Стандартные вопросы (доставка, консультация).
   - 🟢 Низкий приоритет (информационные запросы).
4. Выведи краткую сводную таблицу с ссылками на диалоги и рекомендуемыми следующими действиями.`,
  "prompts.draftReply.additionalOperatorInstructions": ({
    instructions,
  }: {
    instructions: MessageValue;
  }) => `
Дополнительные указания оператора:
${instructions}`,
  "prompts.draftReply.preparingResponseConversation": ({ dialogId }: { dialogId: MessageValue }) =>
    `Подготовка ответа в диалог ${dialogId}`,
  "prompts.draftReply.step1CallReadConversationThread": ({
    dialogId,
    extra,
  }: {
    dialogId: MessageValue;
    extra: MessageValue;
  }) => `1. Вызови read_conversation_thread для dialog_id='${dialogId}', чтобы прочитать последние сообщения.
2. При необходимости вызови lookup_client_profile для контекста о клиенте.
3. Составь ясный и вежливый ответ на языке, который запросил пользователь или использовал клиент.${extra}
4. Предложи черновик ответа пользователю перед отправкой через send_reply_to_client (помни, что инструмент требует confirm=true).`,
  "prompts.clientSummary.clientSummary": ({ client }: { client: MessageValue }) =>
    `Резюме клиента ${client}`,
  "prompts.clientSummary.step1CallLookupClientProfile": ({
    client,
  }: {
    client: MessageValue;
  }) => `1. Вызови lookup_client_profile с client='${client}'.
2. Сформируй краткое резюме:
   - Имя и контактные данные.
   - Теги и кастомные поля (сегмент, номер заказа).
   - Заметки операторов.
   - История и статус недавних обращений.
   - Рекомендации по дальнейшей работе с клиентом.`,
  "prompts.escalateIssue.component": ({
    component,
  }: {
    component: MessageValue;
  }) => `   - Компонент: ${component}
`,
  "prompts.escalateIssue.escalationConversation": ({ dialogId }: { dialogId: MessageValue }) =>
    `Эскалация проблемы из диалога ${dialogId}`,
  "prompts.escalateIssue.step1CallReadConversationThread": ({
    dialogId,
    comp,
  }: {
    dialogId: MessageValue;
    comp: MessageValue;
  }) => `1. Вызови read_conversation_thread для dialog_id='${dialogId}'.
2. Сформируй техническую карточку бага/инцидента:
${comp}   - Краткое описание проблемы со слов клиента
   - Шаги воспроизведения (если описаны)
   - Ожидаемое vs фактическое поведение
   - Окружение клиента (браузер, ОС, скриншоты/ссылки из сообщений)
   - Ссылка на диалог в Teletype для разработчиков.`,
  "prompts.shiftHandover.focusChannel": ({ channelId }: { channelId: MessageValue }) =>
    ` с фокусом на канал '${channelId}'`,
  "prompts.shiftHandover.supportShiftReport": ({ channelText }: { channelText: MessageValue }) =>
    `Отчёт по смене поддержки${channelText}`,
  "prompts.shiftHandover.step1CallGetProjectStatus": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `1. Вызови get_project_status(aspect='all'), чтобы проверить баланс, доступность операторов, статус API и каналы с проблемами.
2. Вызови find_conversations с status='unanswered', limit=20${value1}, чтобы оценить текущий бэклог.
3. Составь структурированный отчёт передачи смены:
   - 📊 Текущее состояние (баланс, срок до окончания, активные каналы).
   - 👥 Операторы на линии (доступные / отсутствующие).
   - 📥 Неотвеченные диалоги (количество, самые старые обращения, критичные клиенты со ссылками на диалоги).
   - ⚠️ Риски и предупреждения (проблемные каналы, ошибки вебхуков, недостаток операторов).
   - 🎯 Фокус для следующей смены.`,
  "prompts.handleGetPrompt.unknownPromptAvailable": ({
    name,
    value2,
  }: {
    name: MessageValue;
    value2: MessageValue;
  }) => `Неизвестный промпт '${name}'. Доступны: ${value2}`,
} as const;
