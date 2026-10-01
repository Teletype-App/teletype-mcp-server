[English](../CLIENTS.md) | Русский

# MCP-клиенты

Для подключения к хостед-серверу `https://mcp.teletype.app/mcp` нужен Public API токен Teletype. Ниже есть примеры для хостед-сервера и локального запуска при самостоятельном размещении, работе в изолированном контуре или офлайн-eval. Перед запуском клиента, который читает токен из окружения, задайте `TELETYPE_API_TOKEN`. В примерах с `your-teletype-public-api-token` замените заглушку в личном конфиге.

## Codex

Для хостед-эндпоинта добавьте его в `~/.codex/config.toml`. Настройка `env_http_headers` берёт значение заголовка из окружения:

```toml
[mcp_servers.teletype]
url = "https://mcp.teletype.app/mcp"
env_http_headers = { "X-Teletype-Api-Token" = "TELETYPE_API_TOKEN" }
```

Для локального сервера добавьте в тот же файл [этот блок](../../examples/clients/codex.toml). Остальные настройки файла сохраните. Перезапустите Codex и проверьте конфигурацию командой `codex mcp list`. Параметр `env_vars` передаст токен из окружения процессу сервера.

Для установки плагина выполните `codex plugin marketplace add Teletype-App/teletype-mcp-server`, затем откройте `/plugins` в Codex, установите `teletype` и начните новую сессию. Плагин объединяет сервер и скилл. Подробности в [разделе про плагины](../../README-ru.md#плагины-для-claude-code-и-codex).

Без плагинов Codex читает скиллы [Agent Skills](https://agentskills.io) из `~/.agents/skills` (пользовательский уровень) или из `.agents/skills` в репозитории. npm-пакет поставляет скилл `teletype-support` с регламентами поддержки. Для установки выполните:

```bash
mkdir -p ~/.agents/skills
cp -r node_modules/teletype-mcp-server/plugin/skills/teletype-support ~/.agents/skills/
```

## Claude Code

Для хостед-эндпоинта добавьте в `.mcp.json` содержимое [этого файла](../../examples/clients/claude-code-remote.json) или выполните `claude mcp add --transport http teletype https://mcp.teletype.app/mcp --header "X-Teletype-Api-Token: $TELETYPE_API_TOKEN"`. Плагин ниже уже настроен на хостед-сервер.

Для локального запуска скопируйте [этот файл](../../examples/clients/claude-code.json) в `.mcp.json` своего проекта. Claude Code подставит `${TELETYPE_API_TOKEN}` из окружения. Запустите клиент в проекте и проверьте подключение через `/mcp` или `claude mcp list`.

Для установки плагина с сервером, скиллом и командами выполните `/plugin marketplace add Teletype-App/teletype-mcp-server`, затем `/plugin install teletype@teletype-mcp-server`. Подробности в [разделе про плагины](../../README-ru.md#плагины-для-claude-code-и-codex).

## OpenCode

Скопируйте [этот файл](../../examples/clients/opencode.json) в `opencode.json` своего проекта. OpenCode возьмёт токен из `{env:TELETYPE_API_TOKEN}`. Проверьте подключение командой `opencode mcp list`. Настройка `auto` использует версию протокола 2026, если клиент и сервер её согласуют, и версию 2025 в остальных случаях.

## MiniMax Code

Скопируйте [этот конфиг](../../examples/clients/mcode.json) в `.mcp.json` проекта, где запускаете `mcode`. Если файл уже есть, добавьте запись `teletype` в существующий объект `mcpServers`. Перед запуском MiniMax Code задайте `TELETYPE_API_TOKEN` в том же терминале. Конфиг подключает хостед MCP-сервер Teletype. Проверьте подключение через `/mcp`, затем попросите найти неотвеченные диалоги Teletype и убедитесь, что агент вызвал `find_conversations`. MiniMax Code читает `.mcp.json` из корня проекта. Подробности есть в [его инструкции по MCP](https://github.com/MiniMax-AI/minimax-code/blob/main/docs/examples.md#5-connect-an-authenticated-project-mcp-server).

## Cursor

Добавьте запись из [этого конфига](../../examples/clients/cursor.json) в `~/.cursor/mcp.json` или `.cursor/mcp.json` проекта. Cursor подставит `${env:TELETYPE_API_TOKEN}` в HTTP-заголовок. Сделайте токен доступным процессу Cursor, перезапустите клиент и проверьте сервер в **Customize → MCPs**. См. [документацию Cursor MCP](https://prod.cursor.com/docs/mcp).

## VS Code с GitHub Copilot

Добавьте [этот конфиг](../../examples/clients/vscode.json) в `.vscode/mcp.json` проекта или пользовательский MCP-конфиг VS Code. VS Code запросит Public API токен и сохранит его как секретный ввод. Проверьте подключение командой **MCP: List Servers**. Формат `.vscode/mcp.json` использует `servers` и отличается от формата `mcpServers` в Copilot CLI. См. [документацию VS Code MCP](https://code.visualstudio.com/docs/agents/reference/mcp-configuration).

## GitHub Copilot CLI

Добавьте [этот конфиг](../../examples/clients/copilot-cli.json) в личный `~/.copilot/mcp-config.json` и замените заглушку токена. Проверьте сервер командой `copilot mcp list`. Copilot CLI также умеет добавлять удалённый сервер через `copilot mcp add --transport http` с параметром `--header`. См. [инструкцию GitHub](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

## GitHub Copilot в других IDE

Для Copilot в JetBrains IDE, Xcode и Eclipse добавьте [эту запись](../../examples/clients/copilot-other-ides.json) в MCP-конфиг, который открывается из настроек Copilot. Замените заглушку токена в личном конфиге. Здесь используются поля `servers` и `requestInit.headers`, в отличие от примеров для VS Code и Copilot CLI. Visual Studio использует формат `servers` и `inputs` из [примера VS Code](../../examples/clients/vscode.json) в файле `.mcp.json` на уровне решения или пользователя. См. [инструкцию GitHub для других IDE](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-other-copilot-ides.md).

## Облачный агент и code review GitHub Copilot

Добавьте [этот конфиг](../../examples/clients/copilot-cloud.json) в **Settings → Copilot → MCP servers** репозитория. Создайте Agents secret с именем `COPILOT_MCP_TELETYPE_API_TOKEN` на уровне репозитория или организации. Пример разрешает только инструменты без записи в Teletype, поскольку облачный агент Copilot вызывает MCP-инструменты без запроса подтверждения. `read_conversation_thread` исключён: этот инструмент может пометить диалог прочитанным. Copilot code review также проверяет аннотацию `readOnlyHint` у каждого инструмента. См. [инструкцию GitHub по MCP в репозитории](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers).

## Kiro

Добавьте [этот конфиг](../../examples/clients/kiro.json) в `~/.kiro/settings/mcp.json` или `.kiro/settings/mcp.json` проекта. Передайте `TELETYPE_API_TOKEN` процессу Kiro и подтвердите подстановку переменной по запросу. Один формат работает в Kiro IDE и CLI. Проверьте сервер на вкладке MCP в панели Kiro. См. [инструкцию Kiro по MCP](https://kiro.dev/docs/mcp/configuration/).

## Qwen Code

Добавьте [этот конфиг](../../examples/clients/qwen-code.json) в личный `~/.qwen/settings.json` и замените заглушку токена. Поле `httpUrl` выбирает Streamable HTTP. Поле `url` в Qwen Code означает старый SSE, который не используется эндпоинтом Teletype. Проверьте подключение через `/mcp` в Qwen Code. См. [инструкцию Qwen Code по MCP](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/mcp-server/).

## Rovo Dev CLI

Добавьте [этот конфиг](../../examples/clients/rovo-dev.json) в личный `~/.rovodev/mcp.json` и замените заглушку токена. Команда `acli rovodev mcp` откроет файл настроек, а `/mcp` в интерактивной сессии покажет состояние подключения. См. [инструкцию Rovo Dev по MCP](https://support.atlassian.com/rovo/docs/connect-to-an-mcp-server-in-rovo-dev-cli/).

## Antigravity CLI

Добавьте запись сервера из [этого конфига](../../examples/clients/antigravity.json) в `~/.gemini/config/mcp_config.json` или в `.agents/mcp_config.json` своего проекта. Остальные MCP-серверы сохраните. Проверьте подключение командой `agy mcp list`. Сервер получает `TELETYPE_API_TOKEN` из окружения клиента. Для русских описаний и ответов добавьте в запись сервера `"env": { "TELETYPE_MCP_LOCALE": "ru" }`.

В июне 2026 года Google перевела индивидуальные аккаунты с Gemini CLI на Antigravity CLI. Для корпоративных пользователей и авторизации по API-ключу Gemini CLI продолжает работать, но эта инструкция рассчитана на Antigravity CLI. См. [объявление Google](https://github.com/google-gemini/gemini-cli/discussions/28017).

Настройки `tools.<name>.eager` передают агенту отдельную схему аргументов каждого инструмента. Схемы занимают больше места в контексте модели, чем стандартная загрузка Antigravity. Редко используемые инструменты можно убрать из списка `eager`. Настройка `tools.eager` упомянута в [журнале изменений Antigravity CLI](https://github.com/google-antigravity/antigravity-cli/blob/main/CHANGELOG.md).

После подключения попросите агента показать неотвеченные диалоги Teletype. Он должен вызвать `find_conversations` через MCP. Отдельный OpenAI-совместимый API для этого не нужен.

## Devin

Администратор организации добавляет сервер один раз: вкладка **Customize → MCPs**, **Add MCP → Add custom MCP**, транспорт `STDIO`, затем поля из [этого образца](../../examples/clients/devin.json): `command: npx`, `args: ["-y", "teletype-mcp-server", "--stdio"]` и переменная окружения `TELETYPE_API_TOKEN`. После этого участники включают сервер на той же вкладке в своих сессиях. Devin запускает stdio-серверы в своём окружении, поэтому проверяйте запуском сессии с вопросом про инструменты Teletype. Кнопка «Test tools» работает только для удалённых серверов. Подробности в [документации Devin MCP](https://docs.devin.ai/work-with-devin/mcp).

## Windsurf Cascade

Откройте **Open MCP config file** через меню **Actions → MCPs** на панели Cascade и добавьте запись из [этого конфига](../../examples/clients/windsurf.json) в объект `mcpServers`. В актуальном конфиге Cascade запись `${env:TELETYPE_API_TOKEN}` подставляется в HTTP-заголовок. Сделайте токен доступным процессу приложения и проверьте сервер на панели MCP. Это настройка прежнего агента Cascade в Devin Desktop. Новый Devin Local использует свои MCP-настройки. См. [инструкцию Cascade MCP](https://docs.devin.ai/desktop/cascade/mcp).

## Zed

Добавьте запись из [этого конфига](../../examples/clients/zed.json) в блок `context_servers` файла настроек Zed или через **Settings → AI → MCP Servers → Add Server → Add Local Server** с теми же командой, аргументами и переменной `TELETYPE_API_TOKEN`. Для хостед-эндпоинта используйте удалённую запись: `"url": "https://mcp.teletype.app/mcp"` с `"headers": { "X-Teletype-Api-Token": "ваш-токен-teletype-public-api" }`. Зелёный индикатор с подсказкой «Server is active» на странице настроек MCP Servers подтверждает подключение. Подробности в [документации Zed MCP](https://zed.dev/docs/ai/mcp).

## ZCode

Используйте **Settings → MCP Servers → New MCP Server** с типом `stdio` или вставьте JSON из [этого файла](../../examples/clients/zcode.json). При ручном редактировании ZCode читает `mcp.servers` из `~/.zcode/cli/config.json` (пользовательский уровень) или `.zcode/config.json` в корне проекта (уровень проекта). Также принимается стандартный блок `mcpServers` в `~/.agents/mcp.json` или `.agents/mcp.json` проекта. В любом случае задайте `TELETYPE_API_TOKEN` в переменных окружения сервера. Подробности в [документации ZCode MCP](https://zcode.z.ai/en/docs/mcp-services).

## Cline

В Cline откройте **MCP Servers**, выберите **Configure** и добавьте [этот конфиг](../../examples/clients/cline.json) в личные настройки MCP. Замените заглушку токена. Тип `streamableHttp` нужен для хостед-эндпоинта: без поля `type` Cline использует старый SSE. В Cline CLI также есть мастер настройки `cline mcp`. См. [инструкцию Cline MCP](https://github.com/cline/cline/blob/main/docs/mcp/mcp-overview.mdx).

## Roo Code

Если вы уже используете Roo Code, добавьте [этот конфиг](../../examples/clients/roo-code.json) в личные настройки MCP и замените заглушку токена. Для хостед-эндпоинта Roo Code использует тип `streamable-http` с дефисом. [Репозиторий Roo Code архивирован](https://github.com/RooCodeInc/Roo-Code), поэтому пример оставлен для действующих установок. См. [инструкцию GitHub MCP для Roo Code](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-roo-code.md).

## Junie

Добавьте [этот конфиг](../../examples/clients/junie.json) в личный `~/.junie/mcp/mcp.json` и замените заглушку токена. Junie в JetBrains IDE и Junie CLI используют один формат MCP. Проверьте статус сервера через `/mcp` в Junie CLI или **Tools → Junie → MCP Settings** в IDE. См. [инструкцию Junie MCP](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html).

## Continue

Добавьте запись `mcpServers` из [этого YAML-фрагмента](../../examples/clients/continue.yaml) в свой `config.yaml` для Continue. Сохраните `TELETYPE_API_TOKEN=...` в личном `~/.continue/.env`. Для Continue CLI можно также экспортировать переменную перед запуском `cn`. MCP-инструменты доступны в режиме Agent. См. [инструкцию Continue по MCP](https://docs.continue.dev/customize/deep-dives/mcp) и [инструкцию по локальным секретам](https://docs.continue.dev/faqs#managing-local-secrets-and-environment-variables).

## Goose

Добавьте [этот YAML-фрагмент](../../examples/clients/goose.yaml) в личный `~/.config/goose/config.yaml` и замените заглушку токена. Goose подключает MCP-серверы как расширения и использует тип `streamable_http` для хостед-эндпоинта. Удалённое расширение Streamable HTTP можно также добавить через `goose configure`. См. [инструкцию Goose по расширениям](https://github.com/aaif-goose/goose/blob/main/documentation/docs/getting-started/using-extensions.md) и [формат конфига](https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/config-files.md).

## n8n

Добавьте узел **MCP Client** для шага сценария или **MCP Client Tool** для AI Agent. Укажите адрес `https://mcp.teletype.app/mcp`, выберите Streamable HTTP и создайте учётные данные Header Auth с именем заголовка `X-Teletype-Api-Token` и значением Public API токена. Проверьте подключение через список инструментов узла. См. [инструкцию n8n для MCP Client](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcpClient/).

## Flowise

Создайте в Flowise переменную `teletypeApiToken` со значением Public API токена. Добавьте **Custom MCP** к узлу Agent и вставьте [этот конфиг](../../examples/clients/flowise.json) в поле **MCP Server Config**. Обновите **Available Actions**, чтобы загрузить инструменты Teletype. См. [инструкцию Flowise для Custom MCP](https://docs.flowiseai.com/tutorials/tools-and-mcp).

## LibreChat

Добавьте [этот YAML-фрагмент](../../examples/clients/librechat.yaml) в `librechat.yaml`. Каждый пользователь вводит свой Public API токен в настройках MCP, а `customUserVars` позволяет не хранить его в общем конфиге. Выберите сервер Teletype в меню инструментов чата или Agent Builder. Сервер также можно добавить через интерфейс LibreChat: выберите Streamable HTTP, хостед-адрес и авторизацию API Key с пользовательским заголовком `X-Teletype-Api-Token`. См. [инструкцию LibreChat по MCP](https://www.librechat.ai/docs/features/mcp).

## Open WebUI

Администратор открывает **Settings → Admin → Integrations → External Tool Servers → Add Connection**. Выберите **MCP (Streamable HTTP)**, укажите `https://mcp.teletype.app/mcp`, для встроенной авторизации выберите **None**, затем добавьте `{"X-Teletype-Api-Token":"your-teletype-public-api-token"}` в поле пользовательских **Headers**. Сохраните подключение и предоставьте доступ нужным пользователям или группам. Такая настройка использует один токен Teletype для всего подключения. См. [инструкцию Open WebUI по MCP](https://docs.openwebui.com/features/extensibility/mcp/).

## Langflow

Создайте глобальную переменную типа Credential с именем `TELETYPE_API_TOKEN` и своим Public API токеном. В **Settings → MCP Servers → Add MCP Server** выберите **HTTP/SSE**, укажите `https://mcp.teletype.app/mcp` и добавьте заголовок `X-Teletype-Api-Token` со значением `TELETYPE_API_TOKEN`. Добавьте компонент **MCP Tools** в сценарий и соедините его выход **Toolset** со входом **Tools** агента. См. [инструкцию Langflow для MCP-клиента](https://docs.langflow.org/mcp-client).

## Dify

На странице **Tools** выберите **MCP** и добавьте хостед-сервер `https://mcp.teletype.app/mcp`. В пользовательских HTTP-заголовках задайте `X-Teletype-Api-Token` со значением Public API токена. Добавьте полученные инструменты Teletype в Agent или сценарий. Dify поддерживает встроенные MCP-инструменты и заголовки для подключения сервера. См. [объявление Dify о встроенном MCP](https://dify.ai/blog/v1-6-0-built-in-two-way-mcp-support) и [код управления MCP-серверами](https://github.com/langgenius/dify/blob/main/api/services/tools/mcp_tools_manage_service.py).

## OpenHands CLI

Экспортируйте токен в терминале и выполните `openhands mcp add teletype --transport http --header "X-Teletype-Api-Token: $TELETYPE_API_TOKEN" https://mcp.teletype.app/mcp`. Проверьте настройку командой `openhands mcp list`. CLI хранит MCP-конфигурацию в `~/.openhands/mcp.json`. См. [справочник команд OpenHands CLI](https://github.com/OpenHands/docs/blob/main/openhands/usage/cli/command-reference.mdx).

## Claude Desktop

Скачайте пакет `.mcpb` из [релизов проекта](https://github.com/Teletype-App/teletype-mcp-server/releases) и откройте его в Claude Desktop. Введите Public API токен по запросу. В [быстром старте](../../README-ru.md#быстрый-старт) также показана ручная настройка `claude_desktop_config.json`. См. [инструкцию Claude по расширениям](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).

## Eval через агента клиента

Тестовый режим запускает те же MCP-инструменты с локальной имитацией Teletype API. Токен Teletype не нужен. Запросы не попадают в реальный проект. Для оценки подключите один из конфигов:

| Клиент | Конфиг для eval |
| --- | --- |
| Codex | [codex-eval.toml](../../examples/clients/codex-eval.toml), добавьте блок в `~/.codex/config.toml` |
| Claude Code | [claude-code-eval.json](../../examples/clients/claude-code-eval.json), передайте через `claude --mcp-config path/to/claude-code-eval.json --strict-mcp-config` |
| OpenCode | [opencode-eval.json](../../examples/clients/opencode-eval.json), скопируйте в `opencode.json` отдельного тестового проекта |
| Antigravity CLI | [antigravity-eval.json](../../examples/clients/antigravity-eval.json), добавьте запись сервера в `~/.gemini/config/mcp_config.json` или `.agents/mcp_config.json` |

Для запуска Antigravity без запросов подтверждения добавьте `mcp(teletype_eval/*)` в `permissions.allow` файла `~/.gemini/antigravity-cli/settings.json`. После eval удалите разрешение и запись тестового сервера из файла, в который её добавили. Иначе вызовы MCP-инструментов потребуют подтверждения.

Попросите агента:

> Вызови `eval_list_cases`. Начни `workspace-metadata` через `eval_start_case`, выполни полученное задание инструментами Teletype, затем вызови `eval_grade_case` со своим итоговым ответом. Покажи `metrics` и проваленные проверки.

`eval_start_case` очищает тестовые изменения и историю вызовов. `eval_grade_case` возвращает отдельные показатели в `metrics`: `outcome_passed` проверяет конечное состояние тестового проекта для записи и нужный вызов инструмента для чтения, `first_target_call_passed` проверяет первый вызов целевого инструмента, `answer_passed` проверяет ответ, `safety_passed` проверяет запрещённые и лишние записи. `tool_errors` показывает число вызовов с ошибкой. `recovered_after_error` отмечает случаи, когда цель достигнута после такой ошибки. Старые поля `score` и `passed` сохранены как общая диагностика.

Один запуск агента считается одной попыткой, даже если он исправил ошибку до вызова `eval_grade_case`. При сравнении моделей записывайте первый вызов `eval_grade_case`, потому что после показа проверки агент может исправить ответ. Этот режим подходит для ручной отладки, а не для слепого бенчмарка.

Итоги запусков есть в [результатах eval](EVAL_RESULTS.md).

Для запуска из локального репозитория выполните `npm run build`, затем укажите `node` как команду, а `/absolute/path/to/dist/index.js` как первый аргумент. Сохраните флаги вроде `--stdio` или `--eval-fixture`. Если команда задаётся массивом, используйте `["node", "/absolute/path/to/dist/index.js", "--stdio"]`. Для конфига с хостед-сервером локальная сборка не нужна.

Синтаксис конфигов сверен с [OpenAI Docs для Codex](https://developers.openai.com/codex/mcp), [документацией Claude Code](https://code.claude.com/docs/en/mcp), [документацией OpenCode](https://opencode.ai/v2/docs/mcp-servers), [документацией Antigravity](https://www.antigravity.google/docs/mcp), [документацией Devin MCP](https://docs.devin.ai/work-with-devin/mcp), [документацией Zed MCP](https://zed.dev/docs/ai/mcp) и [документацией ZCode MCP](https://zcode.z.ai/en/docs/mcp-services).
