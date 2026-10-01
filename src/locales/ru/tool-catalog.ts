export const toolCatalogMessages = {
  "toolCatalog.listClients.title": "Список клиентов",
  "toolCatalog.listClients.description":
    "Получить список клиентов проекта или найти клиентов по номеру телефона без изменения данных. Public API ищет по части нормализованного номера. Для продолжения используйте page и has_more.",
  "toolCatalog.listClients.phone.description":
    "Номер телефона или его часть. Public API ищет по нормализованному номеру.",
  "toolCatalog.listClients.page.description": "Страница API, начиная с 1. По умолчанию 1.",
  "toolCatalog.listClients.limit.description":
    "Клиентов на странице: от 1 до 100. По умолчанию 20.",
  "toolCatalog.findMessages.title": "Поиск сообщений",
  "toolCatalog.findMessages.description":
    "Получить сообщения проекта с фильтрами по диалогу, ID клиента, каналу или тексту сообщения. Параметр query ищет текст, а не ID сообщения. Для редактирования, удаления или повторной отправки по известному message_id сразу используйте manage_sent_message. Поиск текста проверяет только возвращённую страницу API, потому что в Public API нет полнотекстового фильтра. Пока has_more=true, проверьте следующие страницы прежде чем считать, что старого сообщения нет. Для поиска по истории используйте этот инструмент, а не find_conversations.",
  "toolCatalog.findMessages.query.description":
    "Регистронезависимый поиск подстроки в сообщениях этой страницы. Пустой ответ не исключает совпадения на следующих страницах.",
  "toolCatalog.findMessages.dialogId.description":
    "ID диалога для ограничения сообщений. Возьмите из find_conversations или ссылки на диалог.",
  "toolCatalog.findMessages.clientId.description":
    "Точный ID клиента. Сначала вызовите list_clients или lookup_client_profile.",
  "toolCatalog.findMessages.channel.description":
    "Название, тип или ID канала. Преобразуется в channelId.",
  "toolCatalog.findMessages.onlyActive.description":
    "Только активные каналы, если channel не задан. По умолчанию false.",
  "toolCatalog.findMessages.page.description":
    "Страница API для проверки, начиная с 1. По умолчанию 1.",
  "toolCatalog.findMessages.limit.description":
    "Сообщений на странице API: от 1 до 100. По умолчанию 50.",
  "toolCatalog.findMessages.responseFormat.description":
    "По умолчанию краткий текст, detailed включает полный текст сообщений. structuredContent всегда содержит полный текст.",
  "toolCatalog.createDialogByPhone.title": "Создать диалог по телефону",
  "toolCatalog.createDialogByPhone.description":
    "Создать или найти диалог по номеру телефона в подходящем канале без отправки сообщения. Это запись, а не проверка номера: вызов может создать диалог и назначить владельца проекта оператором существующего открытого диалога. Для проверки номера без изменений используйте list_clients. Сначала dry_run, затем confirm=true только по запросу на создание.",
  "toolCatalog.createDialogByPhone.phone.description":
    "Номер получателя. По возможности используйте международный формат.",
  "toolCatalog.createDialogByPhone.channel.description":
    "Название, тип или ID телефонного канала: WhatsApp, MAX, SMS, Kakao, Telegram или VK Direct.",
  "toolCatalog.createDialogByPhone.dryRun.description":
    "Показать канал, номер и возможные эффекты без создания диалога.",
  "toolCatalog.createDialogByPhone.confirm.description":
    "Подтверждение создания или поиска диалога. Может изменить оператора существующего открытого диалога.",
  "toolCatalog.findConversations.description":
    "Поиск диалогов по статусу, каналу, клиенту, тегам, оператору, категории, тексту последнего сообщения или имени клиента. Параметр query не ищет по dialog_id. Если пользователь уже дал dialog_id, передайте его напрямую в read_conversation_thread, resolve_conversation или send_reply_to_client по задаче. Для текста старых сообщений используйте find_messages и переходите по страницам. Для очереди без ответа передайте status='unanswered'. По умолчанию выбираются открытые диалоги, поэтому запрос без статуса не покажет всю очередь. Каждый результат содержит link_to_dialog для ссылки пользователю. Для нескольких диалогов одного клиента используйте read_client_history.",
  "toolCatalog.findConversations.status.description":
    "Фильтр по статусу. По умолчанию 'open'. Используйте 'unanswered' для триажа.",
  "toolCatalog.findConversations.channel.description":
    "Название канала (напр. 'WhatsApp Sales') или его тип (telegram, whatsapp_teletype, email, vk, viber, instagram_direct_business и т.п.). Резолвится автоматически.",
  "toolCatalog.findConversations.tags.description":
    "Список названий тегов клиента (фильтр по И-логике). Например ['VIP', 'возврат'].",
  "toolCatalog.findConversations.operator.description":
    "Имя оператора (полное или часть) или строка 'unassigned' для диалогов без назначенного оператора.",
  "toolCatalog.findConversations.client.description":
    "Имя, телефон, email или client_id: фильтр по клиенту.",
  "toolCatalog.findConversations.category.description":
    "Название категории обращения. Список доступных: list_workspace_metadata с resource='categories'.",
  "toolCatalog.findConversations.query.description":
    "Поисковый запрос по тексту последнего сообщения или имени клиента (регистронезависимый поиск подстроки).",
  "toolCatalog.findConversations.limit.description":
    "Максимум диалогов в ответе. По умолчанию 20. Допустимо от 1 до 100.",
  "toolCatalog.findConversations.channelType.description":
    "Тип канала для фильтрации (например: telegram, whatsapp_teletype, email, vk, viber, instagram_direct_business и др.).",
  "toolCatalog.findConversations.page.description":
    "Номер страницы результатов (по умолчанию 1). Страницы без результатов возвращают пустой список.",
  "toolCatalog.findConversations.responseFormat.description":
    "'concise' (по умолчанию) дает краткий текст. 'detailed' добавляет в текст поля каждого элемента (id, статусы, время, полные тексты сообщений). structuredContent всегда содержит все поля независимо от этого параметра.",
  "toolCatalog.lookupClientProfile.description":
    "Карточка клиента 360°: контактные данные, теги, кастомные поля, последние заметки операторов и список последних диалогов (recent_dialogs, КАЖДЫЙ с полем link_to_dialog, обязательно показывай эти ссылки пользователю как markdown). Один вызов вместо 4-х. Принимает имя, телефон, email или client_id. Если по имени найдено несколько кандидатов, возвращает их список с подсказкой, как уточнить (передать client_id или телефон). Используйте, когда нужно понять контекст конкретного клиента перед ответом или эскалацией.",
  "toolCatalog.lookupClientProfile.client.description":
    "Имя клиента, телефон (любой формат), email или client_id.",
  "toolCatalog.lookupClientProfile.includeDialogHistory.description":
    "Включать ли список последних 5 диалогов. По умолчанию true.",
  "toolCatalog.lookupClientProfile.includeNotes.description":
    "Включать ли заметки операторов. По умолчанию true.",
  "toolCatalog.lookupClientProfile.responseFormat.description":
    "'concise' (по умолчанию) дает краткий текст. 'detailed' добавляет в текст поля каждого элемента (id, статусы, время, полные тексты сообщений). structuredContent всегда содержит все поля независимо от этого параметра.",
  "toolCatalog.readConversationThread.description":
    "Прочитать содержимое диалога: сообщения в хронологическом порядке (от старого к новому) с метаданными: автор (operator/client), вложения, цитирования, статус доставки, время. Плюс краткий контекст диалога: канал, клиент, назначенный оператор, категория. ОБЯЗАТЕЛЬНО при выводе пользователю показывай ссылку link_to_dialog (на сам диалог в админке Teletype). Когда цитируешь конкретное сообщение, используй link_to_message, она ведёт на нужную позицию в переписке. Если dialog_id уже известен, передайте его напрямую без поиска диалогов. Иначе можно передать client (имя/телефон/email/ID), тогда возьмётся последний диалог клиента. В черновике не обещайте действия, сроки и исключения из правил, которые не подтверждены перепиской.",
  "toolCatalog.readConversationThread.dialogId.description":
    "ID диалога. Известный ID передайте напрямую. Вызывайте find_conversations, только если ID нет.",
  "toolCatalog.readConversationThread.client.description":
    "Альтернатива dialog_id: имя/телефон/email/client_id. Будет взят последний диалог клиента.",
  "toolCatalog.readConversationThread.messagesLimit.description":
    "Сколько последних сообщений вернуть. По умолчанию 50. Допустимо от 1 до 200.",
  "toolCatalog.readConversationThread.markSeen.description":
    "Если true, помечает диалог как прочитанный оператором (сбрасывает бейдж непрочитанного в панели Teletype). Требует confirm: true. По умолчанию false.",
  "toolCatalog.readConversationThread.confirm.description":
    "Нужен только вместе с mark_seen: true. Без него запрос mark_seen отклоняется и диалог не читается. Без mark_seen вызов только читает диалог и не меняет статус непрочитанного.",
  "toolCatalog.readConversationThread.includeSessions.description":
    "Если true, возвращает историю обращений (сессий) диалога (даты, операторы, статусы, категории). По умолчанию false.",
  "toolCatalog.readConversationThread.sessionId.description":
    "ID конкретной сессии для получения расширенной информации о ней.",
  "toolCatalog.readConversationThread.includeGroupClients.description":
    "Если true и диалог является групповым чатом, возвращает список участников группы. По умолчанию false.",
  "toolCatalog.readConversationThread.responseFormat.description":
    "'concise' (по умолчанию) дает краткий текст. 'detailed' добавляет в текст поля каждого элемента (id, статусы, время, полные тексты сообщений). structuredContent всегда содержит все поля независимо от этого параметра.",
  "toolCatalog.readClientHistory.description":
    "Прочитать недавние диалоги клиента одним вызовом: последние диалоги с сообщениями, каналами и ссылками. Используйте, чтобы собрать контекст по клиенту за несколько диалогов перед ответом. read_conversation_thread возвращает полные метаданные одного диалога. Принимает имя, телефон, email или client_id.",
  "toolCatalog.readClientHistory.client.description":
    "Имя клиента, телефон (любой формат), email или client_id.",
  "toolCatalog.readClientHistory.dialogsLimit.description":
    "Сколько последних диалогов вернуть, от 1 до 5. По умолчанию 3.",
  "toolCatalog.readClientHistory.messagesPerDialog.description":
    "Сколько последних сообщений вернуть на диалог, от 1 до 20. По умолчанию 10.",
  "toolCatalog.readClientHistory.responseFormat.description":
    "'concise' (по умолчанию) дает краткий текст. 'detailed' добавляет в текст поля каждого элемента (id, статусы, время, полные тексты сообщений). structuredContent всегда содержит все поля независимо от этого параметра.",
  "toolCatalog.readClientHistory.title": "История клиента",
  "toolCatalog.sendReplyToClient.description":
    "Отправить сообщение, только если пользователь попросил об отправке. Для существующего диалога передайте recipient_dialog_id, для нового client и channel. Если нужен черновик, прочитайте диалог через read_conversation_thread и напишите текст без вызова этого инструмента. Поддерживает текст, шаблоны, вложения и цитирование. По умолчанию помечает диалог отвеченным. Требует confirm=true. Результат подтверждает приём API, а не доставку адресату.",
  "toolCatalog.sendReplyToClient.recipientDialogId.description":
    "ID существующего диалога для ответа. Если задан, параметры client/channel игнорируются.",
  "toolCatalog.sendReplyToClient.client.description":
    "Для НОВОГО диалога: имя/телефон/email/client_id получателя.",
  "toolCatalog.sendReplyToClient.channel.description":
    "Для НОВОГО диалога: название или тип канала отправки (telegram, whatsapp_teletype, email и т.п.).",
  "toolCatalog.sendReplyToClient.text.description":
    "Текст сообщения. Опционально, если используется template_name.",
  "toolCatalog.sendReplyToClient.templateName.description":
    "Имя шаблона из библиотеки проекта. Список: list_workspace_metadata с resource='templates'.",
  "toolCatalog.sendReplyToClient.templateVariables.description":
    "Подстановки для шаблона: {'name': 'Иван', 'order_id': '1234'}. В шаблоне переменные обозначаются {{name}}.",
  "toolCatalog.sendReplyToClient.attachmentUrl.description":
    "Публичный URL файла или изображения. Teletype скачает файл по этому URL и перешлёт в канал. Используйте, если файл уже выложен в облако (S3 presigned, Dropbox direct и т.п.).",
  "toolCatalog.sendReplyToClient.attachmentPath.description":
    "Абсолютный путь к локальному файлу. Доступен только в доверенном stdio-режиме. HTTP-сервер отклоняет локальные пути. Имеет приоритет над attachment_url.",
  "toolCatalog.sendReplyToClient.replyToMessageId.description": "ID сообщения, которое цитируется.",
  "toolCatalog.sendReplyToClient.markDialogAnswered.description":
    "Помечать ли диалог отвеченным после отправки. По умолчанию true.",
  "toolCatalog.sendReplyToClient.autoClose.description":
    "Для отправки по каналу (recipient_type='channel'): автоматически закрыть вновь созданное обращение (autoClose=1).",
  "toolCatalog.sendReplyToClient.createDialogOnly.description":
    "Создать диалог с клиентом в канале без отправки текста (через /dialog/create). Требует client и channel.",
  "toolCatalog.sendReplyToClient.confirm.description":
    "Явное подтверждение отправки сообщения или создания диалога.",
  "toolCatalog.annotateClientRecord.description":
    "Бэтч-обновление метаданных вокруг клиента и/или диалога одной операцией: добавить и удалить теги, создать заметку, обновить кастомные поля, выставить категорию диалога. Теги, заметки и поля относятся к клиенту. dialog_category относится к диалогу и требует dialog_id. Заметка попадает в таймлайн текущего диалога клиента как служебное сообщение, операторы видят её в панели Teletype. Если часть операций не удалась, остальные всё равно применяются, в ответе будет partial_errors. Используйте после общения с клиентом для административных пометок ('VIP', 'жаловался на доставку', категория 'Возврат').",
  "toolCatalog.annotateClientRecord.client.description":
    "Имя/телефон/email/client_id. Можно опустить, если dialog_id определяет клиента.",
  "toolCatalog.annotateClientRecord.dialogId.description":
    "ID диалога. Нужен для dialog_category и может определить клиента для других изменений.",
  "toolCatalog.annotateClientRecord.addTags.description":
    "Названия тегов для добавления. Несуществующие теги перечисляются в partial_errors.",
  "toolCatalog.annotateClientRecord.removeTags.description": "Названия тегов для удаления.",
  "toolCatalog.annotateClientRecord.note.description":
    "Текст новой заметки. Она появится в таймлайне текущего диалога клиента, операторы увидят её в панели.",
  "toolCatalog.annotateClientRecord.deleteNoteId.description":
    "ID заметки клиента для удаления (полученный из lookup_client_profile).",
  "toolCatalog.annotateClientRecord.customFields.description":
    "Словарь кастомных полей: {'order_id': '1234', 'segment': 'B2B'}. Заменяет существующие значения по ключам.",
  "toolCatalog.annotateClientRecord.dialogCategory.description":
    "Название категории для диалога (требует dialog_id).",
  "toolCatalog.annotateClientRecord.name.description": "Обновить отображаемое имя клиента.",
  "toolCatalog.annotateClientRecord.phone.description": "Обновить телефон клиента.",
  "toolCatalog.annotateClientRecord.email.description": "Обновить email клиента.",
  "toolCatalog.annotateClientRecord.additionalPayload.description":
    "Дополнительные данные клиента (JSON-строка или объект, например { source: 'website' }).",
  "toolCatalog.annotateClientRecord.forceAdditionalPayload.description":
    "Перезаписать имеющиеся в массиве дополнительной информации данные (true) вместо слияния (false).",
  "toolCatalog.annotateClientRecord.confirm.description":
    "Явное подтверждение изменения данных клиента или диалога.",
  "toolCatalog.resolveConversation.description":
    "Закрыть диалог или передать оператору. По умолчанию close=true. Передавайте close=false, только если диалог нужно оставить открытым. Категория, теги, оператор и заметка необязательны. Закрытие не требует категории. Перед назначением категории или тега узнайте точное название. Требует confirm=true. Перед ответом пользователю и повторным вызовом проверьте applied и partial_errors.",
  "toolCatalog.resolveConversation.dialogId.description":
    "ID диалога. Известный ID передайте напрямую. Ищите его, только если ID нет.",
  "toolCatalog.resolveConversation.assignOperator.description":
    "Назначить оператора на диалог (ID, имя, email оператора, или 'auto' для автораспределения).",
  "toolCatalog.resolveConversation.close.description":
    "Закрыть диалог после выполнения остальных действий (по умолчанию true). Укажите false, если хотите только назначить оператора, установить категорию или теги, оставив диалог открытым.",
  "toolCatalog.resolveConversation.finalNote.description":
    "Итоговая заметка о клиенте, прикрепляется при закрытии.",
  "toolCatalog.resolveConversation.category.description":
    "Необязательное точное название категории. Если пользователь просил категорию, сначала вызовите list_workspace_metadata(resource='categories'). Не выводите название категории из слов «решить» или «закрыть». При простом закрытии опустите поле.",
  "toolCatalog.resolveConversation.addTags.description":
    "Теги клиента для добавления при закрытии.",
  "toolCatalog.resolveConversation.markUnanswered.description":
    "Если true, не закрывает диалог, а помечает его открытые обращения неотвеченными. Закрытые обращения не переоткрываются.",
  "toolCatalog.resolveConversation.markAnswered.description":
    "Если true, помечает открытые обращения диалога отвеченными (снимает флаг неотвеченности).",
  "toolCatalog.resolveConversation.confirm.description":
    "Явное подтверждение закрытия или пометки диалога неотвеченным/отвеченным.",
  "toolCatalog.listWorkspaceMetadata.description":
    "Получить справочник каналов, тегов, категорий, шаблонов быстрых ответов, операторов или групп. Укажите resource для нужного вида. Вызов по умолчанию с 'all' ограничивает каждый список и делает лишние запросы. Для активности каналов используйте resource='channels', для назначения категории сначала получите resource='categories'. WABA-шаблоны находятся отдельно. Кэшируется на минуту.",
  "toolCatalog.listWorkspaceMetadata.resource.description":
    "Выберите нужный справочник: channels, tags, categories, templates, template_directories, operators или groups. 'all' возвращает несколько ограниченных списков и подходит для обзора всего проекта.",
  "toolCatalog.listWorkspaceMetadata.groupId.description":
    "Опционально: ID или название группы для получения подробных данных (операторы, супервайзеры, каналы) через /group/view/:groupId.",
  "toolCatalog.listWorkspaceMetadata.channelType.description":
    "Для resource='channels': фильтрация по типу канала (например telegram, email, whatsapp_teletype).",
  "toolCatalog.listWorkspaceMetadata.onlyActive.description":
    "Для resource='channels': возвращать только активные каналы.",
  "toolCatalog.getProjectStatus.description":
    "Проверить состояние проекта: финансы, доступность операторов, Public API, активность каналов и ошибки вебхуков. Для технического состояния каналов и Public API укажите aspect='technical'. Если нужен список каналов, используйте list_workspace_metadata(resource='channels'). В ответе есть производные предупреждения.",
  "toolCatalog.getProjectStatus.aspect.description":
    "Выберите 'technical' для каналов, Public API и вебхуков, 'financial' для баланса и оплаты, 'team' для операторов или 'all' для общего обзора. По умолчанию 'all'.",
  "toolCatalog.getProjectStatus.includeWarnings.description":
    "Включать ли блок производных предупреждений. По умолчанию true.",
  "toolCatalog.getProjectStatus.operatorDetails.description":
    "Если true, в team возвращается развёрнутый список операторов. По умолчанию false.",
  "toolCatalog.manageSentMessage.description":
    "Управление отправленным сообщением по message_id: редактировать текст, удалить или повторить отправку при сбое. Если пользователь дал message_id, используйте его напрямую без поиска по тексту. Иначе возьмите его из message_ids результата отправки или read_conversation_thread. Требует явного confirm: true.",
  "toolCatalog.manageSentMessage.messageId.description":
    "ID сообщения, полученный из send_reply_to_client или read_conversation_thread.",
  "toolCatalog.manageSentMessage.action.description":
    "Действие: 'update' (редактировать текст), 'delete' (удалить), 'resend' (повторить отправку).",
  "toolCatalog.manageSentMessage.text.description":
    "Новый текст сообщения (обязателен для action='update').",
  "toolCatalog.manageSentMessage.confirm.description":
    "Явное подтверждение выполнения операции над сообщением.",
  "toolCatalog.sendWhatsappTemplate.description":
    "Отправить одобренный WABA-шаблон в существующий диалог канала WhatsApp Edna вне 24-часового сервисного окна. ID WABA-шаблона берите из настроек проекта или от пользователя. Список resource='templates' содержит шаблоны быстрых ответов, а не WABA-шаблоны. Требует confirm: true.",
  "toolCatalog.sendWhatsappTemplate.channelId.description":
    "ID WhatsApp-канала. Известный ID передайте напрямую. Вызовите list_workspace_metadata(resource='channels'), только если ID нет.",
  "toolCatalog.sendWhatsappTemplate.dialogId.description":
    "ID диалога. Известный ID передайте напрямую. Вызовите find_conversations, только если ID нет.",
  "toolCatalog.sendWhatsappTemplate.templateId.description":
    "ID одобренного WABA-шаблона, импортированного из Edna. Его нет в resource='templates' со списком быстрых ответов.",
  "toolCatalog.sendWhatsappTemplate.templateParams.description":
    "Параметры шаблона: text_variables (массив строк для переменных вида {{1}}, {{2}}), button_variables, header_variables, attachment.",
  "toolCatalog.sendWhatsappTemplate.templateParams.textVariables.description":
    "Текстовые значения для подстановки в тело шаблона.",
  "toolCatalog.sendWhatsappTemplate.templateParams.headerVariables.description":
    "Значения для переменных в заголовке шаблона.",
  "toolCatalog.sendWhatsappTemplate.templateParams.buttonVariables.description":
    "Значения для переменных кнопок шаблона.",
  "toolCatalog.sendWhatsappTemplate.confirm.description":
    "Явное подтверждение отправки WhatsApp шаблона клиенту.",
  "toolCatalog.manageOperatorGroup.description":
    "Управление составом и правами групп операторов в Teletype: добавление/удаление участников, привязка/отвязка каналов, назначение супервизора, настройка видимости чужих диалогов. Названия групп берите из list_workspace_metadata с resource='groups'. Требует confirm: true.",
  "toolCatalog.manageOperatorGroup.action.description":
    "Действие: add_member (добавить оператора), remove_member (удалить оператора), add_channel (привязать канал), remove_channel (отвязать канал), set_supervisor (назначить/снять супервизора), set_channel_visibility (видимость диалогов).",
  "toolCatalog.manageOperatorGroup.group.description":
    "Название или ID группы операторов (получите через list_workspace_metadata с resource='groups').",
  "toolCatalog.manageOperatorGroup.operator.description":
    "Имя или ID оператора (для add_member, remove_member, set_supervisor).",
  "toolCatalog.manageOperatorGroup.channel.description":
    "Название или ID канала (для add_channel, remove_channel, set_channel_visibility).",
  "toolCatalog.manageOperatorGroup.isSupervisor.description":
    "Для set_supervisor: true выдаёт права супервизора, false снимает.",
  "toolCatalog.manageOperatorGroup.canViewOtherDialogs.description":
    "Для set_channel_visibility: true разрешает просмотр чужих диалогов в канале, false запрещает.",
  "toolCatalog.manageOperatorGroup.confirm.description":
    "Явное подтверждение изменения конфигурации группы.",
  "toolCatalog.configureProjectWebhook.description":
    "Настройка публичного вебхука проекта Teletype: установка URL получателя и набора активных событий. Пустой active_events отключает все события. Требует confirm: true.",
  "toolCatalog.configureProjectWebhook.webhookUrl.description":
    "URL для получения входящих вебхуков. Пустая строка удаляет текущий URL.",
  "toolCatalog.configureProjectWebhook.activeEvents.description":
    "Список событий для активации. Отсутствие или пустой список отключает все события.",
  "toolCatalog.configureProjectWebhook.confirm.description":
    "Явное подтверждение изменения настроек вебхука проекта.",
  "toolCatalog.findConversations.title": "Поиск диалогов",
  "toolCatalog.lookupClientProfile.title": "Профиль клиента",
  "toolCatalog.readConversationThread.title": "Чтение диалога",
  "toolCatalog.sendReplyToClient.title": "Отправка ответа клиенту",
  "toolCatalog.annotateClientRecord.title": "Аннотирование клиента",
  "toolCatalog.resolveConversation.title": "Обработка диалога",
  "toolCatalog.listWorkspaceMetadata.title": "Метаданные воркспейса",
  "toolCatalog.getProjectStatus.title": "Статус проекта",
  "toolCatalog.manageSentMessage.title": "Управление сообщением",
  "toolCatalog.sendWhatsappTemplate.title": "Отправка WABA-шаблона",
  "toolCatalog.manageOperatorGroup.title": "Управление группой операторов",
  "toolCatalog.configureProjectWebhook.title": "Настройка вебхука",
  "toolCatalog.getCapabilities.title": "Возможности сервера",
  "toolCatalog.getCapabilities.description":
    "Возвращает активную карту инструментов сервера: режим только для чтения, активные toolsets, зарегистрированные инструменты с их набором и признаком записи данных, локаль и доступность локальных вложений. Вызывайте первым, если не уверены, какие инструменты и фильтры доступны. Идентификация проекта запрашивается один раз и кэшируется на 10 минут.",
  "toolCatalog.sendReplyToClient.dryRun.description":
    "Только предпросмотр: определяет получателя, разворачивает шаблон и возвращает полную информацию о цели, ничего не отправляя. confirm не требуется.",
  "toolCatalog.sendWhatsappTemplate.dryRun.description":
    "Только предпросмотр: проверяет параметры и возвращает диалог-получатель и шаблон без отправки. confirm не требуется.",
} as const;
