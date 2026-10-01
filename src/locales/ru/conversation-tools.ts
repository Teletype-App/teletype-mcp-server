import type { MessageValue } from "../types.js";

export const conversationMessages = {
  "conversation.findConversations.unnamed": "(без имени)",
  "conversation.findConversations.channelIsNotUniquelyDefined": ({
    channel,
  }: {
    channel: MessageValue;
  }) => `Канал '${channel}' не определён однозначно.`,
  "conversation.findConversations.candidatesFoundSpecifyNameOr": ({
    list,
  }: {
    list: MessageValue;
  }) =>
    `Найдено кандидатов: ${list}. Уточните название или используйте list_workspace_metadata с resource='channels'.`,
  "conversation.findConversations.thereAreNoChannelsThis": `Каналов с таким именем нет. Список доступных: list_workspace_metadata с resource='channels'.`,
  "conversation.findConversations.clientNameUnknown": "неизвестно",
  "conversation.findConversations.tagsNotFound": ({ value1 }: { value1: MessageValue }) =>
    `Теги не найдены: ${value1}.`,
  "conversation.findConversations.getListTagsViaList": `Получите список тегов через list_workspace_metadata с resource='tags'.`,
  "conversation.findConversations.clientWasNotUniquelyFound": ({
    client,
  }: {
    client: MessageValue;
  }) => `Клиент '${client}' не найден однозначно.`,
  "conversation.findConversations.candidatesPassClientIdOr": ({ cands }: { cands: MessageValue }) =>
    `Кандидаты: ${cands}. Передайте client_id или уточните параметр.`,
  "conversation.findConversations.usePhoneEmailOrClient": `Используйте телефон, email или client_id.`,
  "conversation.findConversations.operatorWasNotUniquelyFound": ({
    operator,
  }: {
    operator: MessageValue;
  }) => `Оператор '${operator}' не найден однозначно.`,
  "conversation.findConversations.candidates": ({ list }: { list: MessageValue }) =>
    `Кандидаты: ${list}.`,
  "conversation.findConversations.listOperatorsListWorkspaceMetadata": `Список операторов: list_workspace_metadata с resource='operators'.`,
  "conversation.findConversations.categoryIsAmbiguous": ({
    category,
  }: {
    category: MessageValue;
  }) => `Категория '${category}' не определена однозначно.`,
  "conversation.findConversations.listCategoriesListWorkspaceMetadata": `Список категорий: list_workspace_metadata с resource='categories'.`,
  "conversation.findConversations.whenPresentingConversationsUserShow":
    "ОБЯЗАТЕЛЬНО при выводе пользователю каждый диалог должен содержать кликабельную ссылку из поля link_to_dialog. Формат markdown: `- [Имя клиента, канал, превью](link_to_dialog), дата`. Не выводи технические dialog_id/appeal_id/client_id пользователю, они нужны только для следующих вызовов инструментов.",
  "conversation.findConversations.thereAreNoDialogsMatching":
    "Нет диалогов, соответствующих фильтру. Попробуйте status='all' или ослабьте фильтры.",
  "conversation.findConversations.useDialogIdReadConversation":
    "Используйте dialog_id для read_conversation_thread, send_reply_to_client или resolve_conversation.",
  "conversation.lookupClientProfile.clientParameterIsRequired": "Параметр 'client' обязателен.",
  "conversation.lookupClientProfile.passNamePhoneEmailOr":
    "Передайте имя, телефон, email или client_id.",
  "conversation.lookupClientProfile.clientWasNotUniquelyFound": ({
    client,
    candidatesCount,
  }: {
    client: MessageValue;
    candidatesCount: MessageValue;
  }) => `Клиент '${client}' не найден однозначно (${candidatesCount} кандидатов).`,
  "conversation.lookupClientProfile.candidatesRetrySelectedClientId": ({
    json,
  }: {
    json: MessageValue;
  }) => `Кандидаты:
${json}
Повторите вызов с client=client_id одного из них.`,
  "conversation.lookupClientProfile.thereAreNoClientsSuch": "Клиентов с такими данными в базе нет.",
  "conversation.lookupClientProfile.profile": ({ error }: { error: MessageValue }) =>
    `Профиль: ${error}`,
  "conversation.lookupClientProfile.customFields": ({ error }: { error: MessageValue }) =>
    `Пользовательские поля: ${error}`,
  "conversation.lookupClientProfile.notes": ({ error }: { error: MessageValue }) =>
    `Заметки: ${error}`,
  "conversation.lookupClientProfile.unknownError": "неизвестная ошибка",
  "conversation.lookupClientProfile.conversationHistory": ({
    message,
  }: {
    message: MessageValue;
  }) => `История диалогов: ${message}`,
  "conversation.lookupClientProfile.sendMessageUseSendReply":
    "Для отправки сообщения используйте send_reply_to_client с recipient_dialog_id из recent_dialogs либо передайте client + channel для нового диалога.",
  "conversation.readClientHistory.dialogScan": ({ error }: { error: MessageValue }) =>
    `Не удалось получить список диалогов: ${error}`,
  "conversation.readClientHistory.dialogMessages": ({
    dialog,
    error,
  }: {
    dialog: MessageValue;
    error: MessageValue;
  }) => `Не удалось прочитать сообщения диалога ${dialog}: ${error}`,
  "conversation.readClientHistory.hint":
    "Ответьте через send_reply_to_client с recipient_dialog_id. Полный тред диалога читается через read_conversation_thread.",
  "conversation.readConversationThread.conversationNotMarkedAsRead":
    "Диалог не помечен прочитанным: передайте confirm=true после подтверждения пользователя.",
  "conversation.common.repeatWithConfirm":
    "Повторите вызов с confirm: true, чтобы применить действие.",
  "conversation.readConversationThread.needDialogIdORClient": "Нужен dialog_id ИЛИ client.",
  "conversation.readConversationThread.passDialogIdDirectlyOr":
    "Передайте dialog_id напрямую, либо client (имя/телефон/email/client_id), будет взят последний диалог клиента.",
  "conversation.readConversationThread.clientHasNoDialogs": ({ id }: { id: MessageValue }) =>
    `У клиента ${id} нет диалогов.`,
  "conversation.readConversationThread.createNewOneViaSend":
    "Создайте новый через send_reply_to_client с client + channel.",
  "conversation.readConversationThread.alwaysShowLinkDialogWhen":
    "При выводе диалога пользователю ВСЕГДА показывай ссылку link_to_dialog. При цитировании конкретного сообщения используй ссылку link_to_message, она ведёт на нужную позицию в переписке. Не выводи технические dialog_id/appeal_id/message_id.",
  "conversation.readConversationThread.replyUseSendReplyClient": ({ did }: { did: MessageValue }) =>
    `Для ответа используйте send_reply_to_client с recipient_dialog_id='${did}'. Для закрытия: resolve_conversation.`,
  "conversation.resolveConversation.dialogHasNotBeenChanged":
    "Диалог не изменён: передайте confirm=true после проверки dialog_id и итоговых действий.",
  "conversation.resolveConversation.dialogIdParameterIsRequired": "Параметр dialog_id обязателен.",
  "conversation.resolveConversation.getDialogIdViaFind":
    "Получите dialog_id через find_conversations.",
  "conversation.resolveConversation.openSessionsWereMarkedUnanswered":
    "Открытые обращения диалога помечены неотвеченными. Закрытые обращения API не изменяет.",
  "conversation.error": "ошибка",
  "conversation.resolveConversation.failedMarkConversationAsUnanswered": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Не удалось пометить диалог неотвеченным: ${msg}`,
  "conversation.resolveConversation.failedMarkConversationAsAnswered": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Не удалось пометить диалог отвеченным: ${msg}`,
  "conversation.resolveConversation.automaticOperatorAssignmentFailed": ({
    msg,
  }: {
    msg: MessageValue;
  }) => `Ошибка автораспределения оператора: ${msg}`,
  "conversation.resolveConversation.operatorIsAmbiguousSeveralWere": ({
    trimmed,
    value2,
  }: {
    trimmed: MessageValue;
    value2: MessageValue;
  }) => `Оператор '${trimmed}' неоднозначен: найдено несколько (${value2}).`,
  "conversation.resolveConversation.operatorNotFound": ({ trimmed }: { trimmed: MessageValue }) =>
    `Оператор '${trimmed}' не найден.`,
  "conversation.resolveConversation.operatorAssignmentError": ({ msg }: { msg: MessageValue }) =>
    `Ошибка назначения оператора: ${msg}`,
  "conversation.resolveConversation.failedDetermineConversationClient": ({
    message,
  }: {
    message: MessageValue;
  }) => `Не удалось определить клиента диалога: ${message}`,
  "conversation.resolveConversation.finalNoteWasNotCreated":
    "Итоговая заметка не создана: клиент диалога не определён.",
  "conversation.resolveConversation.noTagsWereAddedBecause":
    "Теги не добавлены: клиент диалога не определён.",
  "conversation.resolveConversation.categoryNotFound": ({ category }: { category: MessageValue }) =>
    `Категория '${category}' не найдена.`,
  "conversation.resolveConversation.autoAssigned": "назначен автоматически",
  "conversation.resolveConversation.listCategoriesBeforeRetry":
    "Изменений нет. Перед повторным вызовом получите названия через list_workspace_metadata(resource='categories').",
  "conversation.resolveConversation.failedSetCategory": ({ msg }: { msg: MessageValue }) =>
    `Ошибка установки категории: ${msg}`,
  "conversation.resolveConversation.errorCreatingNote": ({ msg }: { msg: MessageValue }) =>
    `Ошибка создания заметки: ${msg}`,
  "conversation.resolveConversation.nonExistentTags": ({ value1 }: { value1: MessageValue }) =>
    `Несуществующие теги: ${value1}.`,
  "conversation.resolveConversation.tagNotAdded": ({
    value1,
    message,
  }: {
    value1: MessageValue;
    message: MessageValue;
  }) => `Тег ${value1} не добавлен: ${message}`,
  "conversation.resolveConversation.failedCloseDialog": ({ msg }: { msg: MessageValue }) =>
    `Не удалось закрыть диалог: ${msg}`,
  "conversation.resolveConversation.someEarlierActionsMayHave":
    "Часть предварительных действий могла быть применена. Диалог не закрыт.",
  "conversation.resolveConversation.conversationIsClosed": "Диалог закрыт.",
  "conversation.resolveConversation.dialogIsLeftOpenClose":
    "Диалог оставлен открытым (close=false).",
  "conversation.findConversations.tagsExcludedNoMatch": ({ value1 }: { value1: MessageValue }) =>
    `Теги не найдены и исключены из фильтра: ${value1}. Результаты отфильтрованы только по остальным тегам. Точный список тегов: list_workspace_metadata(resource='tags').`,
  "conversation.findConversations.morePagesRepeatCall": ({ page }: { page: MessageValue }) =>
    `Под фильтры подходит больше диалогов. Вызовите find_conversations снова с page=${page}, чтобы получить следующую порцию.`,
  "conversation.readConversationThread.readOnlyBlocksMarkSeen":
    "Сервер работает в режиме только для чтения, поэтому mark_seen=true не применён.",
  "conversation.readConversationThread.restartWithoutReadOnly":
    "Перезапустите сервер без TELETYPE_MCP_READ_ONLY / --read-only, чтобы отмечать диалоги прочитанными.",
} as const;
