import type { MessageValue } from "../types.js";

export const messagingMessages = {
  "messaging.createDialogByPhone.invalidPhone": "Укажите номер телефона минимум из семи цифр.",
  "messaging.createDialogByPhone.channelDoesNotSupportPhone":
    "Этот канал не поддерживает создание диалога по номеру телефона.",
  "messaging.createDialogByPhone.confirmRequired":
    "Для создания или поиска диалога по номеру нужен confirm: true. В существующем открытом диалоге оператором может стать владелец проекта.",
  "messaging.sendReplyToClient.sendingFailedPassConfirmTrue":
    "Отправка не выполнена: передайте confirm=true после подтверждения текста и получателя.",
  "messaging.common.repeatWithConfirmTrue":
    "Повторите вызов с confirm: true, чтобы применить действие.",
  "messaging.sendReplyToClient.creatingConversationRequiresBothClient":
    "Для создания нового диалога требуются параметры client И channel.",
  "messaging.sendReplyToClient.alternativelyPassRecipientDialogId":
    "Либо передайте recipient_dialog_id для ответа в существующий диалог.",
  "messaging.sendReplyToClient.channelWasNotUniquelyFound": ({
    channel,
  }: {
    channel: MessageValue;
  }) => `Канал '${channel}' не найден однозначно.`,
  "messaging.sendReplyToClient.conversationCreatedViaDialogCreate":
    "Teletype создал или нашёл диалог через /dialog/create без отправки сообщения.",
  "messaging.sendReplyToClient.templateNotFound": ({
    templateName,
  }: {
    templateName: MessageValue;
  }) => `Шаблон '${templateName}' не найден.`,
  "messaging.sendReplyToClient.listAvailableTemplatesListWorkspace": `Список доступных шаблонов: list_workspace_metadata с resource='templates'.`,
  "messaging.sendReplyToClient.nothingSendSpecifyTextTemplate":
    "Нечего отправлять: укажите text, template_name, attachment_url или attachment_path.",
  "messaging.sendReplyToClient.atLeastOneTheseParameters":
    "Минимум один из этих параметров обязателен.",
  "messaging.sendReplyToClient.messageQueuedChannelUseRead":
    "Сообщение поставлено в очередь канала. Используйте read_conversation_thread для проверки статуса доставки.",
  "messaging.sendReplyToClient.creatingConversationRequiresBothClient2":
    "Для нового диалога нужны параметры client И channel.",
  "messaging.sendReplyToClient.newDialogHasBeenCreated":
    "Teletype создал или нашёл диалог. Сохраните dialog_id для дальнейших действий.",
  "messaging.manageSentMessage.actionFailedPassConfirmTrue":
    "Действие не выполнено: передайте confirm=true для подтверждения операции над сообщением.",
  "messaging.manageSentMessage.messageIdParameterIsRequired": "Параметр message_id обязателен.",
  "messaging.manageSentMessage.messageIdHint":
    "Возьмите message_id из поля message_ids ответа send_reply_to_client или из поля message_id сообщения в read_conversation_thread.",
  "messaging.manageSentMessage.actionParameterIsRequiredUpdate":
    "Параметр action обязателен ('update', 'delete', 'resend').",
  "messaging.manageSentMessage.actionHint":
    "Передайте action со значением 'update', 'delete' или 'resend', например action: 'resend'.",
  "messaging.manageSentMessage.updateActionYouMustSpecify":
    "Для действия 'update' необходимо указать новый текст в параметре text.",
  "messaging.manageSentMessage.updateTextHint":
    "Пример: action: 'update', text: 'Исправленный текст ответа'.",
  "messaging.manageSentMessage.messageHasBeenSuccessfullyEdited":
    "Сообщение успешно отредактировано.",
  "messaging.manageSentMessage.messageWasSuccessfullyDeleted": "Сообщение успешно удалено.",
  "messaging.manageSentMessage.messageResendingHasBeenInitiated":
    "Повторная отправка сообщения инициирована.",
  "messaging.error": "ошибка",
  "messaging.manageSentMessage.errorPerformingActionMessage": ({
    action,
    messageId,
    msg,
  }: {
    action: MessageValue;
    messageId: MessageValue;
    msg: MessageValue;
  }) => `Ошибка выполнения действия '${action}' над сообщением ${messageId}: ${msg}`,
  "messaging.addBracketFormFields.invalidTemplateParameterName": ({ key }: { key: MessageValue }) =>
    `Недопустимое имя параметра шаблона: ${key}.`,
  "messaging.sendWhatsappTemplate.templateSubmissionFailedPassConfirm":
    "Отправка шаблона не выполнена: передайте confirm=true для подтверждения отправки.",
  "messaging.sendWhatsappTemplate.parametersChannelIdDialogId":
    "Параметры channel_id, dialog_id и template_id обязательны.",
  "messaging.sendWhatsappTemplate.requiredParamsHint":
    "Возьмите channel_id из list_workspace_metadata с resource='channels', dialog_id из find_conversations, template_id из list_workspace_metadata с resource='templates'.",
  "messaging.sendWhatsappTemplate.teletypeHasAcceptedWhatsAppTemplate":
    "Teletype принял шаблон WhatsApp к отправке. Статус доставки проверяйте по вебхукам.",
  "messaging.sendWhatsappTemplate.errorSendingWhatsAppTemplate": ({ msg }: { msg: MessageValue }) =>
    `Ошибка отправки WhatsApp шаблона: ${msg}`,
  "messaging.annotateClientRecord.changesNotAppliedPassConfirm":
    "Изменения не применены: передайте confirm=true после проверки клиента и значений.",
  "messaging.annotateClientRecord.passClientDialogIdOr":
    "Нужен client, dialog_id ИЛИ delete_note_id.",
  "messaging.annotateClientRecord.passClientNamePhoneEmail":
    "Передайте client (имя/телефон/email/client_id), dialog_id или delete_note_id.",
  "messaging.annotateClientRecord.forceRequiresPayload":
    "Передайте additional_payload, если указан force_additional_payload.",
  "messaging.annotateClientRecord.categoryRequiresDialogId":
    "Для изменения категории диалога передайте dialog_id.",
  "messaging.annotateClientRecord.noChangesRequested":
    "Укажите хотя бы одно изменение клиента или диалога.",
  "messaging.annotateClientRecord.clientChangesRequireTarget":
    "Для изменения данных клиента передайте client или dialog_id.",
  "messaging.annotateClientRecord.dialogHasNoClient":
    "В диалоге нет ID клиента. Передайте client явно.",
  "messaging.annotateClientRecord.clientWasNotUniquelyFound": ({
    client,
    candidatesCount,
  }: {
    client: MessageValue;
    candidatesCount: MessageValue;
  }) => `Клиент '${client}' не найден однозначно (${candidatesCount} кандидатов).`,
  "messaging.annotateClientRecord.nonExistentTags": ({ value1 }: { value1: MessageValue }) =>
    `Несуществующие теги: ${value1}.`,
  "messaging.annotateClientRecord.failedAddTag": ({
    tagId,
    message,
  }: {
    tagId: MessageValue;
    message: MessageValue;
  }) => `Тег ${tagId} не добавлен: ${message}`,
  "messaging.annotateClientRecord.failedRemoveTag": ({
    tagId,
    message,
  }: {
    tagId: MessageValue;
    message: MessageValue;
  }) => `Тег ${tagId} не удалён: ${message}`,
  "messaging.annotateClientRecord.errorCreatingNote": ({ msg }: { msg: MessageValue }) =>
    `Ошибка создания заметки: ${msg}`,
  "messaging.annotateClientRecord.errorDeletingNote": ({
    deleteNoteId,
    msg,
  }: {
    deleteNoteId: MessageValue;
    msg: MessageValue;
  }) => `Ошибка удаления заметки '${deleteNoteId}': ${msg}`,
  "messaging.annotateClientRecord.errorUpdatingCustomFields": ({ msg }: { msg: MessageValue }) =>
    `Ошибка обновления кастомных полей: ${msg}`,
  "messaging.annotateClientRecord.errorUpdatingClientContacts": ({ msg }: { msg: MessageValue }) =>
    `Ошибка обновления контактов клиента: ${msg}`,
  "messaging.annotateClientRecord.categoryNotFound": ({
    dialogCategory,
  }: {
    dialogCategory: MessageValue;
  }) => `Категория '${dialogCategory}' не найдена.`,
  "messaging.annotateClientRecord.failedSetCategory": ({ msg }: { msg: MessageValue }) =>
    `Ошибка установки категории: ${msg}`,
  "messaging.annotateClientRecord.someOperationsFailedCheckPartial":
    "Часть операций не выполнена, см. partial_errors. Остальное применено.",
  "messaging.annotateClientRecord.allOperationsWereCompletedSuccessfully":
    "Все операции выполнены успешно.",
  "messaging.sendReplyToClient.dryRunPreviewNothingWasSent": ({
    channelName,
    clientName,
  }: {
    channelName: MessageValue;
    clientName: MessageValue;
  }) =>
    `Предпросмотр: ничего не отправлено. При следующем вызове с confirm=true сообщение уйдёт клиенту ${clientName} через канал ${channelName}.`,
  "messaging.sendWhatsappTemplate.dryRunPreviewNothingWasSent":
    "Предпросмотр: ничего не отправлено. WABA-шаблон уйдёт только после повторного вызова с confirm=true. Помните про 24-часовое окно обслуживания: вне его доставимы только одобренные шаблоны.",
} as const;
