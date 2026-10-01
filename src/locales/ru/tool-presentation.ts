import type { MessageValue } from "../types.js";

export const presentationMessages = {
  "presentation.createDialogByPhone.preview": "Предпросмотр: диалог не создавался.",
  "presentation.createDialogByPhone.createdOrFound":
    "Teletype создал или нашёл диалог. Сообщение не отправлялось.",
  "presentation.createDialogByPhone.assignmentWarning":
    "Подтверждённый вызов может назначить владельца проекта оператором существующего открытого диалога.",
  "presentation.createDialogByPhone.openDialog": "Открыть диалог",
  "presentation.listClients.count": ({ count }: { count: MessageValue }) =>
    `Клиентов на этой странице: ${count}`,
  "presentation.listClients.moreInStructuredContent": "Остальные клиенты есть в structuredContent.",
  "presentation.listClients.nextPage": ({ page }: { page: MessageValue }) =>
    `Есть следующие клиенты. Продолжите с page=${page}.`,
  "presentation.findMessages.count": ({
    count,
    page,
  }: {
    count: MessageValue;
    page: MessageValue;
  }) => `Сообщений по запросу на странице API ${page}: ${count}`,
  "presentation.findMessages.moreInStructuredContent":
    "Остальные сообщения есть в structuredContent.",
  "presentation.findMessages.nextPage": ({ page }: { page: MessageValue }) =>
    `Есть более старые сообщения. Продолжите с page=${page} прежде чем считать, что текста нет.`,
  "presentation.sendReplyToClient.acceptedForSending":
    "Teletype принял сообщение к отправке. Доставка получателю не подтверждена.",
  "presentation.sendReplyToClient.dialogCreatedWithoutMessage":
    "Teletype создал или нашёл диалог. Сообщение не отправлялось.",
  "presentation.findConversations.conversationsFound": ({ text }: { text: MessageValue }) =>
    `Найдено диалогов: ${text}.`,
  "presentation.findConversations.moreConversationsStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `Ещё ${value1} диалогов в structuredContent.`,
  "presentation.findConversations.searchIsLimitedRefineYour": "Поиск ограничен. Уточните фильтры.",
  "presentation.findConversations.defaultsApplied": ({ defaults }: { defaults: MessageValue }) =>
    `Применены значения по умолчанию: ${defaults}.`,
  "presentation.lookupClientProfile.moreDialogsExist": ({ total }: { total: MessageValue }) =>
    `У клиента ${total} диалогов в недавнем окне, показаны последние 5.`,
  "presentation.readConversationThread.threadMayContinue": ({ limit }: { limit: MessageValue }) =>
    `Возвращено не меньше ${limit} сообщений. Увеличьте messages_limit, чтобы прочитать более старые.`,
  "presentation.lookupClientProfile.client": "Клиент",
  "presentation.lookupClientProfile.notes": ({ notesCount }: { notesCount: MessageValue }) =>
    `Заметки: ${notesCount}.`,
  "presentation.lookupClientProfile.recentConversations": ({
    dialogsCount,
  }: {
    dialogsCount: MessageValue;
  }) => `Последние диалоги: ${dialogsCount}.`,
  "presentation.readConversationThread.conversation": "Диалог",
  "presentation.readConversationThread.draftEvidenceReminder":
    "Для черновика ответа опирайтесь на переписку и факты, явно сообщённые пользователем. Не обещайте звонок курьера, уведомление, перенос времени или адреса и другие действия без подтверждения.",
  "presentation.readConversationThread.attachment": "[вложение]",
  "presentation.readConversationThread.attachments": ({ names }: { names: MessageValue }) =>
    `вложения: ${names}`,
  "presentation.readConversationThread.moreMessagesStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `Ещё ${value1} сообщений в structuredContent.`,
  "presentation.listWorkspaceMetadata.moreEntriesStructuredContent": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `Ещё ${value1} записей в structuredContent.`,
  "presentation.getProjectStatus.noData": "нет данных",
  "presentation.getProjectStatus.statusSections": ({ sections }: { sections: MessageValue }) =>
    `Разделы статуса: ${sections}.`,
  "presentation.presentToolResult.someActionsHaveBeenCompleted":
    "Часть действий выполнена. Проверьте состояние перед повтором.",
  "presentation.presentToolResult.someDataIsNotAvailable": "Часть данных недоступна.",
  "presentation.presentToolResult.error": ({ error }: { error: MessageValue }) =>
    `Ошибка: ${error}`,
  "presentation.presentToolResult.doneDataStructuredContent": "Готово. Данные в structuredContent.",
  "presentation.presentToolResult.notice": ({ notice }: { notice: MessageValue }) =>
    `Примечание: ${notice}`,
  "presentation.sendReplyToClient.dryRunHeader":
    "Предпросмотр: ничего не отправлено. Сообщение уйдёт:",
  "presentation.sendReplyToClient.dryRunMessage": ({ text }: { text: MessageValue }) =>
    `Сообщение: ${text}`,
  "presentation.sendWhatsappTemplate.dryRunHeader":
    "Предпросмотр: ничего не отправлено. WABA-шаблон:",
  "presentation.getCapabilities.header": ({
    readOnly,
    toolsets,
  }: {
    readOnly: MessageValue;
    toolsets: MessageValue;
  }) => `Возможности сервера, только чтение: ${readOnly}, активные toolsets: ${toolsets}`,
  "presentation.getCapabilities.workspace": ({ details }: { details: MessageValue }) =>
    `Проект: ${details}`,
  "presentation.getCapabilities.writes": "запись данных",
  "presentation.readClientHistory.historyHeader": ({ count }: { count: MessageValue }) =>
    `Недавние диалоги: ${count}.`,
  "presentation.readClientHistory.noMessages": "Для этого диалога сообщения не получены.",
} as const;
