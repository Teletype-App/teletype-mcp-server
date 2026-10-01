import type { MessageValue } from "../types.js";

export const resourcesMessages = {
  "resources.workspaceMetadata.name": "Метаданные проекта Teletype",
  "resources.workspaceMetadata.description":
    "Справочник проекта Teletype: каналы, теги, категории, шаблоны, операторы и группы.",
  "resources.projectStatus.name": "Статус проекта Teletype",
  "resources.projectStatus.description":
    "Сводка состояния проекта Teletype: баланс, доступность операторов и ошибки API.",
  "resources.dialogsUnanswered.name": "Неотвеченные диалоги Teletype",
  "resources.dialogsUnanswered.description":
    "Текущая очередь неотвеченных обращений клиентов с ссылками на диалоги.",
  "resources.dialogsItem.name": "Переписка диалога Teletype",
  "resources.dialogsItem.description": "История сообщений диалога Teletype по ID диалога.",
  "resources.clientsItem.name": "Профиль клиента Teletype",
  "resources.clientsItem.description":
    "Профиль клиента Teletype (контакты, теги, заметки) по ID клиента.",
  "resources.handleReadResource.unknownResourceAvailableOrTemplates": ({
    uri,
    value2,
    value3,
  }: {
    uri: MessageValue;
    value2: MessageValue;
    value3: MessageValue;
  }) => `Неизвестный ресурс '${uri}'. Доступны: ${value2} или шаблоны ${value3}`,
} as const;
