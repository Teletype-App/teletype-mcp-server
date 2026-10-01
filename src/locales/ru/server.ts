import type { MessageValue } from "../types.js";

export const serverMessages = {
  "server.instructions": `Инструменты клиентской поддержки Teletype (https://teletype.app).

Для чтения выбирай узкий запрос. Неотвеченные диалоги: find_conversations(status='unanswered'). Старые сообщения: find_messages(query=...) с переходом по страницам, пока has_more=true. Для проверки номера без записи: list_clients(phone=...). Список каналов: list_workspace_metadata(resource='channels'). Состояние каналов и Public API: get_project_status(aspect='technical'). Вызов без фильтра может вернуть лишние или ограниченные данные.

Для следующих вызовов используй ID из ответов. Имена клиентов, операторов, каналов, тегов и категорий тоже принимаются, но не придумывай названия категорий и тегов. Если пользователь просит назначить категорию, сначала получи точные названия через list_workspace_metadata(resource='categories'). Закрытие диалога не требует категории.

Перед изменением данных получи подтверждение пользователя, если он уже не дал его. Передай confirm=true в send_reply_to_client, create_dialog_by_phone, send_whatsapp_template, manage_sent_message, annotate_client_record, resolve_conversation, manage_operator_group и configure_project_webhook. Для read_conversation_thread это нужно при mark_seen=true. Просьба подготовить черновик не разрешает отправку.

После изменения сообщи, что применено, и перечисли partial_errors, если они есть. При отправке accepted=true означает, что Teletype принял запрос, но доставка адресату не подтверждена. Не называй сообщение доставленным без проверки статуса. Не повторяй запись при неизвестном результате.

Показывай ссылки на диалоги и сообщения из link_to_dialog и link_to_message. Для первого сообщения через Edna WhatsApp или отправки вне 24-часового окна используй send_whatsapp_template с зарегистрированным WABA ID. Шаблоны быстрых ответов не содержат WABA-шаблоны.`,
  "server.buildServer.toolResponseDoesNotMatch": ({ name }: { name: MessageValue }) =>
    `Ответ инструмента '${name}' не соответствует объявленной схеме.`,
  "server.buildServer.actionCouldBeCompletedCheck":
    "Действие могло выполниться. Проверьте его результат перед повторным вызовом.",
  "server.buildServer.internalToolError": ({ name }: { name: MessageValue }) =>
    `Внутренняя ошибка инструмента '${name}'.`,
  "server.buildServer.provideDevelopersRequestIDX":
    "Сообщите разработчикам идентификатор запроса из заголовка X-Request-Id или журнала сервера.",
  "server.buildServer.apiErrorRetryableHint":
    "Похоже, ошибка временная. Повторите тот же вызов через короткое время.",
  "server.buildServer.apiErrorAuthHint":
    "Проверьте настройку X-Auth-Token и права токена в панели Teletype.",
} as const;
