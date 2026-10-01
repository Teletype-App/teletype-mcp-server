[English](README.md) | Русский

# Teletype MCP Server

[![CI](https://github.com/Teletype-App/teletype-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Teletype-App/teletype-mcp-server/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/teletype-mcp-server.svg)](https://www.npmjs.com/package/teletype-mcp-server) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![MCP](https://img.shields.io/badge/MCP-Protocol-blue.svg)](https://modelcontextprotocol.io)

[Архитектура](docs/ru/ARCHITECTURE.md) | [MCP-клиенты](docs/ru/CLIENTS.md) | [Справочник инструментов](docs/ru/TOOLS.md)

MCP-сервер для [Teletype](https://teletype.app). Его инструменты решают операторские задачи: ищут и читают диалоги, показывают карточку клиента, отправляют ответы, добавляют служебные пометки и проверяют состояние проекта.

## Быстрый старт

**Хостед-сервер (основной способ).** Teletype запускает MCP-сервер по адресу `https://mcp.teletype.app/mcp`. Для подключения нужен Public API токен проекта. Локальная установка не требуется. В Claude Code:

```bash
claude mcp add --transport http teletype https://mcp.teletype.app/mcp \
  --header "X-Teletype-Api-Token: ваш-токен-teletype-public-api"
```

или добавьте в `.mcp.json` содержимое [этого файла](examples/clients/claude-code-remote.json) (Claude Code подставит `${TELETYPE_API_TOKEN}` из окружения):

```json
{
  "mcpServers": {
    "teletype": {
      "type": "http",
      "url": "https://mcp.teletype.app/mcp",
      "headers": { "X-Teletype-Api-Token": "${TELETYPE_API_TOKEN}" }
    }
  }
}
```

Для Claude Code и Codex есть плагины, которые ставят сервер и скилл `teletype-support` одним шагом. См. [Плагины для Claude Code и Codex](#плагины-для-claude-code-и-codex).

**Локальный запуск.** Пользователи Claude Desktop на macOS и Windows могут скачать `.mcpb` из [релизов проекта](https://github.com/Teletype-App/teletype-mcp-server/releases), открыть его и ввести токен Teletype Public API. Для запуска из исходного кода выполните `npm ci && npm run build`, затем подключите в MCP-клиенте команду `node /absolute/path/to/dist/index.js --stdio` с переменной окружения `TELETYPE_API_TOKEN`.

Для остальных клиентов нужны Node.js 20.19+, 22.13+ или 24.x и токен Teletype Public API. Claude Desktop также можно настроить вручную через `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "teletype": {
      "command": "npx",
      "args": ["-y", "teletype-mcp-server", "--stdio"],
      "env": {
        "TELETYPE_API_TOKEN": "ваш-токен-teletype-public-api",
        "TELETYPE_MCP_LOCALE": "ru"
      }
    }
  }
}
```

Перезапустите клиент и попросите показать инструменты Teletype. Сервер поддерживает рукопожатие `initialize` версии 2025 и MCP 2026-07-28. Локальную конфигурацию можно проверить без обращения к Teletype:

```bash
TELETYPE_API_TOKEN=ваш-токен npx -y teletype-mcp-server doctor --stdio
```

Для Cursor, Zed и других MCP-клиентов используйте ту же команду, аргументы и переменную окружения.

Для Cursor, VS Code с Copilot, Codex, Claude Code, OpenCode, Antigravity CLI и других клиентов есть [инструкции по подключению MCP](docs/ru/CLIENTS.md). Примеры охватывают хостед HTTP и локальный stdio. Отдельный OpenAI-совместимый endpoint нужен только для необязательной команды `eval:model`.

Для Claude Code и Codex есть плагины, которые ставят сервер, скилл `teletype-support` и поддержечные слэш-команды одним шагом. См. [Плагины для Claude Code и Codex](#плагины-для-claude-code-и-codex).

## Возможности

17 инструментов сгруппированы в наборы: `conversations`, `messaging`, `admin` и `meta`. По умолчанию зарегистрированы все. Сервер можно ограничить выбранными наборами через `--toolsets` или включить режим только для чтения через `--read-only`. Каждый параметр описан в [справочнике инструментов](docs/ru/TOOLS.md).

- `find_conversations`: поиск диалогов по статусу, каналу, типу канала (`channel_type`), клиенту, тегам, оператору, категории, поисковому запросу и пагинации (`page`).
- `list_clients`: список клиентов с пагинацией и поиск по номеру телефона без изменения данных.
- `find_messages`: список сообщений проекта и поиск по истории с переходом между страницами. Пока `has_more` равен true, поиск не завершён.
- `lookup_client_profile`: профиль клиента с кастомными полями, заметками и последними диалогами.
- `read_conversation_thread`: сообщения и ссылки на диалог. По умолчанию данные не меняются. `mark_seen: true` помечает диалог прочитанным и требует `confirm: true`. `include_sessions: true` добавляет историю обращений, `session_id` выбирает детали сессии, а `include_group_clients: true` добавляет участников группового чата.
- `read_client_history`: недавние диалоги клиента одним вызовом, до пяти диалогов со срезом сообщений в каждом (`dialogs_limit`, `messages_per_dialog`). Используйте, чтобы собрать контекст по клиенту перед ответом.
- `send_reply_to_client`: ответ в диалог, создание нового диалога через `/channel/send-message` (с поддержкой `auto_close: true`) или создание диалога без сообщения через `/dialog/create` (`create_dialog_only: true`).
- `create_dialog_by_phone`: создать или найти диалог по телефону без отправки сообщения. Открытый диалог может перейти владельцу проекта. Требует `confirm: true`, поддерживает `dry_run`.
- `send_whatsapp_template`: отправка одобренного WABA-шаблона в существующий диалог WhatsApp Edna вне 24-часового окна. ID берётся из импортированных WABA-шаблонов проекта, а не из списка быстрых ответов.
- `manage_sent_message`: редактирование текста, удаление или повторная отправка сообщения оператора.
- `annotate_client_record`: обновление данных клиента (`name`, `phone`, `email`, `additional_payload`, `force_additional_payload`), тегов, заметок, удаление заметок (`delete_note_id`), кастомных полей и категории диалога.
- `resolve_conversation`: закрытие диалога, назначение оператора (или автораспределение `assign_operator: "auto"`), сохранение диалога открытым (`close: false`), пометка открытого обращения отвеченным (`mark_answered: true`) или неотвеченным (`mark_unanswered: true`).
- `list_workspace_metadata`: каналы (с фильтрацией `channel_type`, `only_active`), теги, категории, шаблоны, папки шаблонов (`template_directories`), группы операторов и операторы.
- `get_project_status`: финансы, доступность операторов и техническое состояние проекта Teletype.
- `manage_operator_group`: добавление и удаление участников (`add_member`, `remove_member`), привязка и отвязка каналов (`add_channel`, `remove_channel`), назначение супервизора (`set_supervisor`), видимость чужих диалогов (`set_channel_visibility`).
- `configure_project_webhook`: настройка публичного вебхука проекта (`/project/update-public-api`) с URL получателя и набором активных событий.
- `get_capabilities`: карта активных инструментов сервера (имя и домен проекта, режим read-only, активные наборы, зарегистрированные инструменты). Доступен всегда.

Для очереди без ответа вызывайте `find_conversations` с `status: "unanswered"`. Для списка каналов используйте `list_workspace_metadata` с `resource: "channels"`. Для состояния каналов и Public API вызовите `get_project_status` с `aspect: "technical"`. Эти фильтры убирают лишние данные и ограничения списка `all`. При закрытии диалога не передавайте `category`, если пользователь не просил назначить категорию. Если просил, получите точное название через `resource: "categories"`. Неизвестная категория остановит вызов до изменений.

Инструменты, которые меняют данные, требуют `confirm: true`. Флаг снижает риск случайного вызова. За авторизацию и согласие пользователя отвечает MCP-клиент. `send_reply_to_client` и `send_whatsapp_template` принимают `dry_run: true` для проверки получателя и сообщения без отправки. `create_dialog_by_phone` принимает `dry_run: true` для проверки цели и возможных изменений без создания или назначения диалога. Для предварительной проверки `confirm` не нужен.

Каждый инструмент публикует `outputSchema`. В `content` находится короткий текст с результатом и ссылками. Полные данные находятся в `structuredContent`, который сервер проверяет по схеме. При частичной записи ответ содержит применённые действия и ошибки. После таймаута, отмены запроса или ошибки схемы проверьте состояние в Teletype перед повтором записи.

Проверка ответов Public API допускает новые поля. Она проверяет данные, нужные для чтения, записи и отчёта о состоянии проекта. Если обязательное поле стало непригодным, инструмент вернёт ошибку, а MCP-сервер продолжит работу.

## Промпты (MCP Prompts)

Сервер предоставляет промпты для работы службы поддержки:

- `triage-inbox`: сортировка входящих неотвеченных обращений по срочности и приоритетам.
- `draft-reply`: черновик ответа клиенту с учетом контекста переписки и тональности.
- `client-summary`: сводка по клиенту с историей, открытыми вопросами и профилем.
- `escalate-issue`: подготовка структурированной карточки для эскалации бага разработчикам.
- `shift-handover`: отчёт по смене поддержки со списком неотвеченных обращений, состоянием каналов и доступностью операторов.

## Ресурсы и шаблоны ресурсов (MCP Resources & Templates)

### Статические ресурсы

- `teletype://project/status`: оперативный технический статус, состояние каналов и баланс.
- `teletype://workspace/metadata`: снимок каналов, операторов, групп, тегов и категорий.
- `teletype://dialogs/unanswered`: текущая очередь неотвеченных обращений клиентов со ссылками на диалоги.

### Шаблоны ресурсов (Resource Templates)

- `teletype://dialogs/{dialogId}`: полная переписка конкретного диалога по его ID.
- `teletype://clients/{clientId}`: профиль клиента, теги и заметки по ID клиента.

## Плагины для Claude Code и Codex

Репозиторий работает как маркетплейс плагинов для обоих клиентов, и один каталог `plugin/` обслуживает оба формата: `.claude-plugin/plugin.json` плюс `commands/` для Claude Code, переносимые манифесты [Agent Plugins](https://agent-plugins.org) `plugin.json` и `mcp.json` для Codex и общий [skills/teletype-support](plugin/skills/teletype-support/SKILL.md).

### Claude Code

Плагин объединяет хостед-сервер (`https://mcp.teletype.app/mcp`, авторизация заголовком `X-Teletype-Api-Token`, подставляемым из `TELETYPE_API_TOKEN`), скилл `teletype-support` с регламентами поддержки и пять слэш-команд, повторяющих MCP-промпты сервера: `/triage-inbox`, `/draft-reply`, `/client-summary`, `/escalate-issue`, `/shift-handover`.

```bash
/plugin marketplace add Teletype-App/teletype-mcp-server
/plugin install teletype@teletype-mcp-server
```

Экспортируйте `TELETYPE_API_TOKEN` в оболочке перед запуском Claude Code: сервер из плагина наследует его от процесса клиента. Скилл несёт многошаговые регламенты, которым не место в описаниях инструментов: порядок разбора очереди, dry-run перед неоднозначной отправкой, получение категории перед закрытием. Он срабатывает на задачах поддержки без всякой слэш-команды. Те же пять сценариев существуют как MCP-промпты для клиентов, которые их показывают. Команды закрывают сессии, где промптов не видно.

### Codex

Экспортируйте `TELETYPE_API_TOKEN` в оболочке перед запуском Codex. Локальный stdio-сервер из плагина наследует его от процесса Codex.

```bash
codex plugin marketplace add Teletype-App/teletype-mcp-server
```

Затем выполните `/plugins` в Codex, установите `teletype` и начните новую сессию. Плагин добавляет скилл и локальный stdio-сервер (спека Agent Plugins запрещает подстановку переменных в HTTP-заголовки, поэтому пользовательский токен нельзя вложить в сам плагин). Чтобы подключить Codex к хостед-эндпоинту, добавьте его в `~/.codex/config.toml`:

```toml
[mcp_servers.teletype]
url = "https://mcp.teletype.app/mcp"
env_http_headers = { "X-Teletype-Api-Token" = "TELETYPE_API_TOKEN" }
```

Без плагинов Codex читает скиллы из `.agents/skills` в репозитории или из `~/.agents/skills` на уровне пользователя.

### Другие агенты

Скилл использует открытый формат [Agent Skills](https://agentskills.io), который поддерживают OpenCode, Cursor, Gemini CLI, GitHub Copilot, Goose и другие. npm-пакет поставляет скилл, поэтому после обычной установки:

```bash
mkdir -p ~/.agents/skills
cp -r node_modules/teletype-mcp-server/plugin/skills/teletype-support ~/.agents/skills/
```

## CLI-параметры

Сервер поддерживает запуск через CLI-флаги и переменные окружения:

```bash
teletype-mcp-server --help
# Параметры:
#   -s, --stdio       Транспорт stdio
#   --http            Транспорт Streamable HTTP (по умолчанию)
#   -p, --port <num>  Порт для HTTP (по умолчанию: 4311)
#   --host <ip>       Адрес для HTTP (по умолчанию: 127.0.0.1)
#   -v, --version     Вывод версии
#   -h, --help        Справка
```

`--read-only` и `--toolsets <имена>` (список через запятую: `conversations,messaging,admin,meta`) фильтруют инструменты до подключения любого клиента. `get_capabilities` остаётся зарегистрированным всегда и сообщает активную карту.

## Требования и локальная сборка

- Node.js 20.19+, 22.13+ или 24.x для установленного CLI.
- токен Teletype Public API из настроек проекта.

Те же версии Node.js подходят для локальных команд `npm start`, `npm run dev` и `npm run eval:model`.

```bash
npm ci
npm run build
cp .env.example .env
```

## Режим stdio

Для локального MCP-клиента используйте stdio. Процесс получает токен из переменной окружения. Загрузка файлов через `attachment_path` по умолчанию отключена. Чтобы включить её, задайте `ENABLE_LOCAL_UPLOADS=true` и перечислите разрешённые каталоги в `TELETYPE_ALLOWED_FILE_ROOTS`. Выбирайте каталоги, в которые другие локальные пользователи не могут записывать файлы.

Конфигурация при локальной сборке:

```json
{
  "mcpServers": {
    "teletype": {
      "command": "node",
      "args": ["/absolute/path/to/teletype-mcp-server/dist/index.js", "--stdio"],
      "env": { "TELETYPE_API_TOKEN": "..." }
    }
  }
}
```

Локальный запуск:

```bash
TRANSPORT=stdio TELETYPE_API_TOKEN=... npm start
```

## Режим Streamable HTTP

Хостед-сервис по адресу `https://mcp.teletype.app` использует этот эндпоинт. Конфигурация ниже нужна для самостоятельного размещения.

Точка `/mcp` и транспорт stdio поддерживают рукопожатие `initialize` версии 2025 и MCP 2026-07-28 с методом `server/discover`. Оба варианта используют один набор инструментов.

Точка входа: `POST /mcp`. В каждом запросе передавайте токен Teletype API в отдельном заголовке:

```http
X-Teletype-Api-Token: <token>
```

Не передавайте токен Teletype в `Authorization`. HTTP-транспорт использует `X-Teletype-Api-Token` как единственный ключ доступа к проекту. Отдельных учётных записей и прав в MCP-сервере нет. Для удалённого доступа нужен HTTPS. Любой, у кого есть токен, сможет работать с проектом через MCP-сервер.

```bash
TRANSPORT=http HOST=127.0.0.1 PORT=4311 npm start
```

Маршруты HTTP:

| Метод | Путь       | Назначение                                    |
| ----- | ---------- | --------------------------------------------- |
| POST  | `/mcp`     | MCP через Streamable HTTP без хранения сеанса |
| GET   | `/healthz` | Проверка доступности сервера                  |

Для каждого HTTP-запроса создаётся отдельная пара MCP Server/transport, поэтому одновременные арендаторы не делят ответы и контекст. Сервер ограничивает число параллельных запросов глобально и для каждого токена. При превышении лимита он отвечает `429` с `Retry-After`. Через HTTP сервер не читает локальные файлы.

## Docker

Образ запускается от непривилегированного пользователя и по умолчанию слушает порт `4311`:

```bash
docker build -t teletype-mcp-server .
docker run --rm -p 127.0.0.1:4311:4311 \
  -e PUBLIC_BASE_URL=http://127.0.0.1:4311 \
  teletype-mcp-server
```

Для публичного домена укажите его источник (origin) в `PUBLIC_BASE_URL` и настройте HTTPS на обратном прокси.

## Конфигурация

| Переменная                    | Значение по умолчанию                    |
| ----------------------------- | ---------------------------------------- |
| `TRANSPORT`                   | `http`                                   |
| `HOST` / `PORT`               | `127.0.0.1` / `4311`                     |
| `PUBLIC_BASE_URL`             | `http://127.0.0.1:4311`                  |
| `ALLOWED_ORIGINS`             | дополнительные Origin через запятую      |
| `TELETYPE_API_TOKEN`          | обязателен для stdio                     |
| `TELETYPE_API_BASE`           | `https://api.teletype.app/public/api/v1` |
| `TELETYPE_PROJECT_URL`        | `teletype.app`                           |
| `TELETYPE_MCP_LOCALE`         | `en` (`ru` для русского текста)          |
| `TELETYPE_MCP_READ_ONLY`      | `true` убирает пишущие инструменты       |
| `TELETYPE_MCP_TOOLSETS`       | наборы инструментов через запятую        |
| `REQUEST_TIMEOUT_MS`          | `15000`                                  |
| `MAX_RESPONSE_BYTES`          | `5000000`                                |
| `MAX_UPLOAD_BYTES`            | `20000000`                               |
| `MAX_CONCURRENT_REQUESTS`     | `32`                                     |
| `MAX_CONCURRENT_PER_TOKEN`    | `4`                                      |
| `ENABLE_LOCAL_UPLOADS`        | `false`                                  |
| `TELETYPE_ALLOWED_FILE_ROOTS` | разрешённые каталоги через запятую       |

`PUBLIC_BASE_URL` и элементы `ALLOWED_ORIGINS` должны содержать только источник (origin), без пути, строки запроса и фрагмента. Если клиент прислал заголовок `Origin`, сервер проверяет его значение.

`TELETYPE_MCP_LOCALE` задаёт язык инструкций MCP, описаний инструментов, промптов, подсказок и ошибок самого сервера. Настройка действует на весь процесс, включая всех клиентов HTTP-сервера. Для русского текста задайте `TELETYPE_MCP_LOCALE=ru` в окружении MCP-сервера. Названия инструментов, аргументов и полей `structuredContent` не меняются. Данные клиентов и подробности ошибок Teletype остаются на языке исходного ответа. Язык ОС и API-токен не используются для выбора языка.

## Если не работает

- Клиент не подключается: запустите `doctor --stdio` с токеном и проверьте настройки транспорта в клиенте.
- Ошибка `stdio transport requires TELETYPE_API_TOKEN`: передайте токен в окружении MCP-сервера. Команда `doctor` проверяет только локальную конфигурацию, не валидность токена.
- В клиенте видны не все инструменты: запустите `doctor --stdio` и проверьте строки `Mode` и `Toolsets` или вызовите `get_capabilities`. `--read-only` и `--toolsets` скрывают инструменты на этапе регистрации.
- Teletype отвечает HTTP 401 или 403: проверьте токен в настройках проекта.
- Запись прервалась или истекло время ожидания: проверьте состояние диалога или проекта перед повтором.

## Разработка

```bash
npm run dev
npm run dev:stdio
npm run check:fast
npm run check
npm run test:mutation
npm run mcp:smoke
npm run package:smoke
npm run bundle:mcpb
npm run mcp:conformance
```

`mcp:smoke` проверяет рукопожатия версий 2025 и 2026-07-28 через HTTP и stdio клиентом SDK. Тесты также проверяют изоляцию токенов HTTP и отказ при ответе, который нарушает `outputSchema`.

`package:smoke` устанавливает npm-архив во временный каталог и проверяет CLI, экспорты, обе версии протокола и тестовый MCP-режим. `mcp:conformance` запускает пять коротких сценариев независимого тестера MCP на локальном сервере с имитацией Teletype API. Ни одна команда не обращается к реальному проекту Teletype.

`bundle:mcpb` создаёт `artifacts/teletype-mcp-server-v<версия>.mcpb`, проверяет манифест и подключается к упакованному серверу через MCP stdio. Команда не обращается к Teletype.

## Проверка совместимости модели

Для оценки через терминального агента подключите [тестовый MCP-режим](docs/ru/CLIENTS.md#eval-через-агента-клиента). Агент вызывает инструменты на тестовых данных Teletype и получает через `eval_grade_case` отдельные показатели результата, первого вызова, ответа и безопасности. Отдельный API модели не нужен.

В [результатах eval](docs/ru/EVAL_RESULTS.md) есть 21 полная задача и девять проверок выбора инструмента для каждой комбинации терминального клиента и модели, токены, время и расчётная стоимость по тарифам API.

Необязательная команда `eval:model` выполняет те же проверки через OpenAI-совместимый endpoint. Она запускает локальную имитацию Teletype API и MCP-сервер. Токен и данные реального проекта не нужны.

Укажите адрес сервера с совместимым с OpenAI методом `POST /chat/completions`:

```bash
cp .env.eval.example .env.eval
# заполните EVAL_MODEL_BASE_URL, EVAL_MODEL_NAME и при необходимости EVAL_MODEL_API_KEY
npm run eval:model > eval-report.json
```

Для короткой проверки описаний инструментов запустите `npm run eval:selection > selection-report.json`. Команда отправляет модели девять вымышленных запросов и проверяет только выбор первого инструмента. Инструменты Teletype не выполняются. При неверном выборе или отсутствии вызова код выхода равен `2`. Эта проверка не показывает, выполнил ли агент задачу до конца.

Проверяются:

- выбор нужного инструмента.
- обязательные аргументы и проверка аргументов при выполнении.
- отсутствие записывающих вызовов в сценариях без записи.
- подтверждение отправки и закрытия.
- ключевые факты из результата в финальном ответе.

По умолчанию выполняется 21 сценарий. `EVAL_CASES` ограничивает набор, а `EVAL_THRESHOLD` задаёт проходной балл. Коды выхода: `0` при успешной проверке, `2` при балле ниже порога и `1` при ошибке конфигурации или выполнения. JSON-отчёт печатается в stdout, диагностика в stderr. Проверка отправляет указанному серверу модели текст сценариев и ответы имитации API.

Отчёт также содержит доли достигнутых целей, успешных первых вызовов, точных ответов и безопасных действий. Каждый сценарий начинается с чистого тестового проекта. Исправление внутри одного запуска учитывается в конечном результате, но не меняет показатель первого вызова.

`npm run check:fast` проверяет форматирование, ESLint, TypeScript и тесты. `npm run check` добавляет Knip, пороги покрытия, порог мутационного анализа 100% для изоляции запросов и лимитера, сборку и проверки пакета через Publint и Are the Types Wrong.

`npm run test:mutation` запускает полную мутационную проверку с нижним порогом 33% и сохраняет отчёты в `reports/mutation/`. Она занимает больше времени и не входит в `npm run check`.

О раскрытии уязвимостей читайте в [SECURITY-ru.md](docs/ru/SECURITY.md), об участии в разработке в [CONTRIBUTING-ru.md](docs/ru/CONTRIBUTING.md). Лицензия проекта: MIT.
