import type { MessageValue } from "../types.js";

export const workspaceMessages = {
  "workspace.common.unknownError": "неизвестная ошибка",
  "workspace.listWorkspaceMetadata.useNamesNotIDsWhen":
    "Используйте имена (а не ID) при вызове других инструментов, они будут зарезолвлены автоматически.",
  "workspace.getProjectStatus.failedGetBalance": ({ error }: { error: MessageValue }) =>
    `Не удалось получить баланс: ${error}`,
  "workspace.getProjectStatus.failedGetTariff": ({ tariffError }: { tariffError: MessageValue }) =>
    `Не удалось получить тариф: ${tariffError}`,
  "workspace.getProjectStatus.failedGetProjectInformation": ({
    detailsError,
  }: {
    detailsError: MessageValue;
  }) => `Не удалось получить сведения о проекте: ${detailsError}`,
  "workspace.getProjectStatus.balanceIsEnoughDaysTop": ({
    daysRemaining,
  }: {
    daysRemaining: MessageValue;
  }) => `Баланса хватит на ${daysRemaining} дн. Срочно пополните счёт.`,
  "workspace.getProjectStatus.balanceIsEnoughDaysPlan": ({
    daysRemaining,
  }: {
    daysRemaining: MessageValue;
  }) => `Баланса хватит на ${daysRemaining} дн. Запланируйте пополнение.`,
  "workspace.getProjectStatus.thereAreNoOperatorsStatus": "Нет операторов со статусом «доступен».",
  "workspace.getProjectStatus.failedGetListOperators": ({ error }: { error: MessageValue }) =>
    `Не удалось получить список операторов: ${error}`,
  "workspace.getProjectStatus.teletypePublicAPIUnavailable": ({ error }: { error: MessageValue }) =>
    `Публичный API Teletype недоступен: ${error}`,
  "workspace.getProjectStatus.webhookErrorsRecorded": ({
    webhookErrorsCount,
  }: {
    webhookErrorsCount: MessageValue;
  }) => `Зафиксировано ошибок вебхуков: ${webhookErrorsCount}.`,
  "workspace.getProjectStatus.channelIsInactiveClientsMay": ({
    value1,
  }: {
    value1: MessageValue;
  }) => `Канал '${value1}' не активен, клиенты не получают ответы. `,
  "workspace.getProjectStatus.projectHasWarningsCheckWarnings":
    "Есть предупреждения, обратите внимание на блок warnings.",
  "workspace.getProjectStatus.noProjectWarningsFound": "Состояние проекта в норме.",
  "workspace.manageOperatorGroup.actionGroupOperatorsRequiresExplicit":
    "Действие с группой операторов требует явного подтверждения.",
  "workspace.manageOperatorGroup.specifyConfirmTrueUserConfirms":
    "Укажите confirm: true после подтверждения пользователя.",
  "workspace.manageOperatorGroup.groupParameterIsRequiredGroup":
    "Параметр 'group' обязателен (название или ID группы).",
  "workspace.manageOperatorGroup.groupHint":
    "Передайте group с названием или ID из list_workspace_metadata с resource='groups', например group: 'Поддержка'.",
  "workspace.manageOperatorGroup.groupWasNotUniquelyFound": ({
    groupQuery,
  }: {
    groupQuery: MessageValue;
  }) => `Группу '${groupQuery}' не удалось определить однозначно.`,
  "workspace.manageOperatorGroup.noGroupsFoundHint":
    "Группы не найдены. Список доступен через list_workspace_metadata с resource='groups'.",
  "workspace.removeMember.actionRequiresOperatorParameter": ({
    action,
  }: {
    action: MessageValue;
  }) => `Для действия '${action}' требуется параметр 'operator'.`,
  "workspace.removeMember.operatorHint":
    "Передайте operator с именем или ID из list_workspace_metadata с resource='operators'.",
  "workspace.removeMember.operatorWasNotUniquelyFound": ({ opQuery }: { opQuery: MessageValue }) =>
    `Оператор '${opQuery}' не найден однозначно.`,
  "workspace.removeMember.operatorHasBeenAddedGroup": "Оператор добавлен в группу.",
  "workspace.removeMember.operatorHasBeenRemovedGroup": "Оператор удалён из группы.",
  "workspace.removeChannel.actionRequiresChannelParameter": ({
    action,
  }: {
    action: MessageValue;
  }) => `Для действия '${action}' требуется параметр 'channel'.`,
  "workspace.removeChannel.channelHint":
    "Передайте channel с названием или ID из list_workspace_metadata с resource='channels'.",
  "workspace.removeChannel.channelWasNotUniquelyFound": ({ chQuery }: { chQuery: MessageValue }) =>
    `Канал '${chQuery}' не найден однозначно.`,
  "workspace.removeChannel.channelIsLinkedGroup": "Канал привязан к группе.",
  "workspace.removeChannel.channelIsUnlinkedGroup": "Канал отвязан от группы.",
  "workspace.setSupervisor.setSupervisorRequiresOperatorParameter":
    "Для set_supervisor требуется параметр 'operator'.",
  "workspace.setSupervisor.supervisorRightsHaveBeenGranted": "Права супервизора выданы.",
  "workspace.setSupervisor.supervisorRightsHaveBeenRemoved": "Права супервизора сняты.",
  "workspace.setChannelVisibility.setChannelVisibilityRequiresChannel":
    "Для set_channel_visibility требуется параметр 'channel'.",
  "workspace.setChannelVisibility.visibilityOtherOperatorsConversationsChannel":
    "Видимость чужих диалогов в канале для группы обновлена.",
  "workspace.manageOperatorGroup.unknownAction": ({ action }: { action: MessageValue }) =>
    `Неизвестное действие: '${action}'.`,
  "workspace.manageOperatorGroup.validActionsAddMemberRemove":
    "Допустимые действия: add_member, remove_member, add_channel, remove_channel, set_supervisor, set_channel_visibility.",
  "workspace.configureProjectWebhook.settingUpProjectSPublic":
    "Настройка публичного вебхука проекта требует явного подтверждения.",
  "workspace.configureProjectWebhook.webhookIsSetActiveEvents": ({
    webhookUrl,
    activeEventsCount,
  }: {
    webhookUrl: MessageValue;
    activeEventsCount: MessageValue;
  }) => `Вебхук настроен на ${webhookUrl}, активно событий: ${activeEventsCount}.`,
  "workspace.configureProjectWebhook.projectWebhookHasBeenCleared":
    "Вебхук проекта очищен/отключен.",
  "workspace.getCapabilities.readOnlyMode":
    "Сервер работает в режиме только для чтения: пишущие инструменты не зарегистрированы.",
  "workspace.getCapabilities.onlyToolsetsActive": ({ toolsets }: { toolsets: MessageValue }) =>
    `Активны только эти toolsets: ${toolsets}.`,
  "workspace.getCapabilities.markSeenNeedsConfirm":
    "read_conversation_thread отмечает диалог прочитанным только при mark_seen=true и confirm=true.",
  "workspace.getCapabilities.useThisMapBeforeFilters":
    "Сверяйтесь с этой картой перед вызовами, зависящими от опциональных возможностей (WABA-шаблоны, вебхуки, группы операторов).",
} as const;
