English | [Русский](ru/CLIENTS.md)

# MCP clients

The hosted server at `https://mcp.teletype.app/mcp` needs a Teletype Public API token. The examples below cover hosted connections and local servers for self-hosting, isolated environments, and the offline eval. Export `TELETYPE_API_TOKEN` before starting clients that read it from the environment. In examples with `your-teletype-public-api-token`, replace that placeholder in your private user configuration.

## Codex

To use the hosted endpoint, add it to `~/.codex/config.toml`. The `env_http_headers` setting pulls the header value from the environment:

```toml
[mcp_servers.teletype]
url = "https://mcp.teletype.app/mcp"
env_http_headers = { "X-Teletype-Api-Token" = "TELETYPE_API_TOKEN" }
```

For a local server, add [this block](../examples/clients/codex.toml) to the same file. Keep other settings in that file. Restart Codex, then run `codex mcp list` to check the configuration. The `env_vars` entry passes your shell's token to the server.

To install the plugin through Codex, run `codex plugin marketplace add Teletype-App/teletype-mcp-server`, then open `/plugins`, install `teletype`, and start a new session. The plugin bundles the server and the skill. See the [plugin section](../README.md#plugins-for-claude-code-and-codex).

Without plugins, Codex loads [Agent Skills](https://agentskills.io) from `~/.agents/skills` (user scope) or `.agents/skills` in the repository. The npm package ships the `teletype-support` skill with the support workflows. To install it, run:

```bash
mkdir -p ~/.agents/skills
cp -r node_modules/teletype-mcp-server/plugin/skills/teletype-support ~/.agents/skills/
```

## Claude Code

For the hosted endpoint, merge [this file](../examples/clients/claude-code-remote.json) into `.mcp.json`, or run `claude mcp add --transport http teletype https://mcp.teletype.app/mcp --header "X-Teletype-Api-Token: $TELETYPE_API_TOKEN"`. The plugin below already points at the hosted server.

To run the server locally, copy [this file](../examples/clients/claude-code.json) to `.mcp.json` in your project. Claude Code expands `${TELETYPE_API_TOKEN}` from the environment. Start Claude Code in that project and check `/mcp` or `claude mcp list`.

To install the plugin with its server, skill, and commands, run `/plugin marketplace add Teletype-App/teletype-mcp-server`, then `/plugin install teletype@teletype-mcp-server`. See the [plugin section](../README.md#plugins-for-claude-code-and-codex).

## OpenCode

Copy [this file](../examples/clients/opencode.json) to `opencode.json` in your project. OpenCode reads `{env:TELETYPE_API_TOKEN}` from the environment. Run `opencode mcp list` to check the connection. The `auto` protocol setting negotiates the 2026 revision when available and falls back to the 2025 handshake.

## MiniMax Code

Copy [this config](../examples/clients/mcode.json) to `.mcp.json` in the project where you run `mcode`. If you already have a `.mcp.json`, merge its `teletype` entry into your existing `mcpServers` object. Export `TELETYPE_API_TOKEN` in the same shell before starting MiniMax Code. The config connects to the hosted Teletype MCP endpoint. Use `/mcp` to inspect the connection, then ask MiniMax Code to find unanswered Teletype conversations and check that it calls `find_conversations`. MiniMax Code reads `.mcp.json` from the project root. See its [project MCP guide](https://github.com/MiniMax-AI/minimax-code/blob/main/docs/examples.md#5-connect-an-authenticated-project-mcp-server).

## Cursor

Merge [this config](../examples/clients/cursor.json) into `~/.cursor/mcp.json` or your project's `.cursor/mcp.json`. Cursor expands `${env:TELETYPE_API_TOKEN}` in HTTP headers. Make the token available to the Cursor process, restart Cursor, and check the server under **Customize → MCPs**. See the [Cursor MCP reference](https://prod.cursor.com/docs/mcp).

## VS Code with GitHub Copilot

Merge [this config](../examples/clients/vscode.json) into your workspace's `.vscode/mcp.json` or the VS Code user MCP configuration. VS Code prompts for the Public API token and stores it as a private input. Run **MCP: List Servers** from the Command Palette to check the connection. The `.vscode/mcp.json` format uses `servers` and is different from Copilot CLI's `mcpServers` format. See the [VS Code MCP reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration).

## GitHub Copilot CLI

Merge [this config](../examples/clients/copilot-cli.json) into your private `~/.copilot/mcp-config.json` and replace the token placeholder. Run `copilot mcp list` to check the server. Copilot CLI can also add the remote server with `copilot mcp add --transport http` and a `--header` argument. See [GitHub's CLI instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

## GitHub Copilot in other IDEs

For Copilot in JetBrains IDEs, Xcode, and Eclipse, add [this server entry](../examples/clients/copilot-other-ides.json) to the MCP configuration opened from Copilot's settings. Replace the token placeholder in your private config. These integrations use `servers` with `requestInit.headers`, unlike the VS Code and Copilot CLI examples. Visual Studio uses the `servers` and `inputs` format shown in the [VS Code example](../examples/clients/vscode.json), placed in a solution-level or user-level `.mcp.json`. See [GitHub's guide to Copilot in other IDEs](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-other-copilot-ides.md).

## GitHub Copilot cloud agent and code review

In a repository's **Settings → Copilot → MCP servers**, add [this config](../examples/clients/copilot-cloud.json). Create an Agents secret named `COPILOT_MCP_TELETYPE_API_TOKEN` for that repository or organization. The example allows only tools that cannot write to Teletype, because Copilot cloud agent calls MCP tools without asking for approval. It omits `read_conversation_thread` because that tool can mark a conversation as seen. Copilot code review also checks each tool's `readOnlyHint` annotation. See [GitHub's repository MCP guide](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers).

## Kiro

Merge [this config](../examples/clients/kiro.json) into `~/.kiro/settings/mcp.json` or your project's `.kiro/settings/mcp.json`. Set `TELETYPE_API_TOKEN` in Kiro's environment and approve its expansion when prompted. The same MCP configuration works in Kiro IDE and CLI. Check the MCP servers tab in the Kiro panel. See the [Kiro MCP configuration guide](https://kiro.dev/docs/mcp/configuration/).

## Qwen Code

Merge [this config](../examples/clients/qwen-code.json) into your private `~/.qwen/settings.json` and replace the token placeholder. The `httpUrl` field selects Streamable HTTP. Qwen Code uses `url` for legacy SSE, which is not the transport at the Teletype endpoint. Run `/mcp` inside Qwen Code to check the connection. See the [Qwen Code MCP guide](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/mcp-server/).

## Rovo Dev CLI

Merge [this config](../examples/clients/rovo-dev.json) into your private `~/.rovodev/mcp.json` and replace the token placeholder. Use `acli rovodev mcp` to open the config or `/mcp` in an interactive session to check the connection. See the [Rovo Dev MCP guide](https://support.atlassian.com/rovo/docs/connect-to-an-mcp-server-in-rovo-dev-cli/).

## Antigravity CLI

Merge the server entry from [this config](../examples/clients/antigravity.json) into `~/.gemini/config/mcp_config.json`, or put it in your project's `.agents/mcp_config.json`. Keep your other MCP servers. Run `agy mcp list` to check the connection. The server inherits `TELETYPE_API_TOKEN` from the client process. To get Russian tool descriptions and replies, add `"env": { "TELETYPE_MCP_LOCALE": "ru" }` to the server entry.

Google moved individual accounts from Gemini CLI to Antigravity CLI in June 2026. Gemini CLI still serves enterprise and API-key users, but this guide targets Antigravity CLI. See [Google's transition announcement](https://github.com/google-gemini/gemini-cli/discussions/28017).

The `tools.<name>.eager` settings give the agent a separate argument schema for each tool. They use more model context than Antigravity's default tool loading. Remove entries you rarely use if context size matters. The [Antigravity CLI changelog](https://github.com/google-antigravity/antigravity-cli/blob/main/CHANGELOG.md) documents `tools.eager` in MCP configuration.

Once connected, ask the agent to find unanswered Teletype conversations. It should call `find_conversations` through MCP. No OpenAI-compatible endpoint is involved in this setup.

## Devin

An organization admin adds the server once: **Customize → MCPs** tab, **Add MCP → Add custom MCP**, transport `STDIO`, then fill in the fields from [this reference](../examples/clients/devin.json): `command: npx`, `args: ["-y", "teletype-mcp-server", "--stdio"]`, and the `TELETYPE_API_TOKEN` environment variable. Members then enable the server from the same tab in their sessions. Devin runs stdio servers in its own environment, so verify by starting a session and asking for Teletype tools. The remote-only "Test tools" button does not apply. See the [Devin MCP documentation](https://docs.devin.ai/work-with-devin/mcp).

## Windsurf Cascade

Open **Open MCP config file** through **Actions → MCPs** in the Cascade panel and merge [this server entry](../examples/clients/windsurf.json) into its `mcpServers` object. The current Cascade configuration expands `${env:TELETYPE_API_TOKEN}` in HTTP headers. Make the token available to the app process, then check the server in Cascade's MCP panel. This config is for the legacy Cascade agent in Devin Desktop. The newer Devin Local agent uses its own MCP settings. See the [Cascade MCP guide](https://docs.devin.ai/desktop/cascade/mcp).

## Zed

Merge the entry from [this config](../examples/clients/zed.json) into the `context_servers` block of your Zed `settings.json`, or use **Settings → AI → MCP Servers → Add Server → Add Local Server** and enter the same command, arguments, and `TELETYPE_API_TOKEN` environment variable. For the hosted endpoint, use a remote entry instead: `"url": "https://mcp.teletype.app/mcp"` with `"headers": { "X-Teletype-Api-Token": "your-teletype-public-api-token" }`. A green indicator with the tooltip "Server is active" on the MCP Servers settings page confirms the connection. See the [Zed MCP documentation](https://zed.dev/docs/ai/mcp).

## ZCode

Use **Settings → MCP Servers → New MCP Server** with type `stdio`, or paste the JSON from [this file](../examples/clients/zcode.json). For manual editing, ZCode reads `mcp.servers` from `~/.zcode/cli/config.json` (user scope) or `.zcode/config.json` in the project root (workspace scope). It also accepts a standard `mcpServers` block in `~/.agents/mcp.json` or the project's `.agents/mcp.json`. Set `TELETYPE_API_TOKEN` in the server's environment variables either way. See the [ZCode MCP documentation](https://zcode.z.ai/en/docs/mcp-services).

## Cline

In Cline, open **MCP Servers**, choose **Configure**, and merge [this config](../examples/clients/cline.json) into your private MCP settings. Replace the token placeholder. The `streamableHttp` type is required for the hosted endpoint. Leaving out `type` selects legacy SSE. Cline CLI also provides the `cline mcp` configuration wizard. See the [Cline MCP guide](https://github.com/cline/cline/blob/main/docs/mcp/mcp-overview.mdx).

## Roo Code

For existing Roo Code installations, merge [this config](../examples/clients/roo-code.json) into your private MCP settings and replace the token placeholder. Roo Code uses `streamable-http` with a hyphen for the hosted endpoint. Its [repository is archived](https://github.com/RooCodeInc/Roo-Code), so this example is for users who still run it. See the [GitHub MCP setup for Roo Code](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-roo-code.md).

## Junie

Merge [this config](../examples/clients/junie.json) into your private `~/.junie/mcp/mcp.json` and replace the token placeholder. Junie in JetBrains IDEs and Junie CLI use the same MCP format. Open `/mcp` in Junie CLI, or **Tools → Junie → MCP Settings** in the IDE, to check that the server is active. See the [Junie MCP guide](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html).

## Continue

Merge the `mcpServers` entry from [this YAML snippet](../examples/clients/continue.yaml) into your Continue `config.yaml`. Put `TELETYPE_API_TOKEN=...` in your private `~/.continue/.env` file. In Continue CLI, exporting the variable before starting `cn` also works. Continue uses MCP tools in Agent mode. See the [Continue MCP guide](https://docs.continue.dev/customize/deep-dives/mcp) and [local secrets guide](https://docs.continue.dev/faqs#managing-local-secrets-and-environment-variables).

## Goose

Merge [this YAML snippet](../examples/clients/goose.yaml) into your private `~/.config/goose/config.yaml` and replace the token placeholder. Goose treats MCP servers as extensions and uses `streamable_http` for the hosted endpoint. You can also add a remote Streamable HTTP extension through `goose configure`. See the [Goose extension guide](https://github.com/aaif-goose/goose/blob/main/documentation/docs/getting-started/using-extensions.md) and [config reference](https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/config-files.md).

## n8n

Add an **MCP Client** node for a workflow step or **MCP Client Tool** for an AI Agent. Set the endpoint to `https://mcp.teletype.app/mcp`, choose Streamable HTTP, and create a Header Auth credential with name `X-Teletype-Api-Token` and your Public API token as its value. Use the node's tool list to check the connection. See the [n8n MCP Client guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcpClient/).

## Flowise

Create a Flowise variable named `teletypeApiToken` containing your Public API token. Add **Custom MCP** to an Agent node and paste [this config](../examples/clients/flowise.json) into **MCP Server Config**. Refresh **Available Actions** to load the Teletype tools. See the [Flowise Custom MCP guide](https://docs.flowiseai.com/tutorials/tools-and-mcp).

## LibreChat

Merge [this YAML snippet](../examples/clients/librechat.yaml) into your `librechat.yaml`. Each user enters their own Public API token through LibreChat's MCP settings, where `customUserVars` keeps it out of the shared config. Select the Teletype MCP server in the chat tool picker or Agent Builder. LibreChat also has a UI server builder: choose Streamable HTTP, the hosted URL, and API Key authentication with a custom header named `X-Teletype-Api-Token`. See the [LibreChat MCP guide](https://www.librechat.ai/docs/features/mcp).

## Open WebUI

An administrator opens **Settings → Admin → Integrations → External Tool Servers → Add Connection**. Choose **MCP (Streamable HTTP)**, enter `https://mcp.teletype.app/mcp`, select **None** for built-in authentication, and add `{"X-Teletype-Api-Token":"your-teletype-public-api-token"}` in the custom **Headers** field. Save the connection and grant access to the users or groups that need it. This configuration uses one Teletype token for the connection. See the [Open WebUI MCP guide](https://docs.openwebui.com/features/extensibility/mcp/).

## Langflow

Create a Credential global variable named `TELETYPE_API_TOKEN` with your Public API token. In **Settings → MCP Servers → Add MCP Server**, choose **HTTP/SSE**, enter `https://mcp.teletype.app/mcp`, and add a header named `X-Teletype-Api-Token` with value `TELETYPE_API_TOKEN`. Add the server's **MCP Tools** component to your flow and connect its **Toolset** output to an Agent's **Tools** input. See the [Langflow MCP client guide](https://docs.langflow.org/mcp-client).

## Dify

On the **Tools** page, select **MCP** and add the hosted server at `https://mcp.teletype.app/mcp`. In its custom HTTP headers, set `X-Teletype-Api-Token` to your Public API token. Add the imported Teletype tools to an Agent or workflow. Dify supports native MCP tools and custom server headers. See [Dify's native MCP announcement](https://dify.ai/blog/v1-6-0-built-in-two-way-mcp-support) and [its MCP server management code](https://github.com/langgenius/dify/blob/main/api/services/tools/mcp_tools_manage_service.py).

## OpenHands CLI

Run `openhands mcp add teletype --transport http --header "X-Teletype-Api-Token: $TELETYPE_API_TOKEN" https://mcp.teletype.app/mcp` with the token exported in your shell. Run `openhands mcp list` to check the configuration. The CLI stores MCP settings in `~/.openhands/mcp.json`. See the [OpenHands CLI command reference](https://github.com/OpenHands/docs/blob/main/openhands/usage/cli/command-reference.mdx).

## Claude Desktop

Download the `.mcpb` bundle from the project's [releases](https://github.com/Teletype-App/teletype-mcp-server/releases) and open it in Claude Desktop. Enter the Public API token when prompted. The [quick start](../README.md#quick-start) also shows manual `claude_desktop_config.json` setup. See [Claude's desktop extension guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).

## Run the eval inside your client

The eval fixture starts the same MCP tools against a local test API. It needs no Teletype token and cannot reach your live project. Use one of these configs for an eval session:

| Client | Eval config |
| --- | --- |
| Codex | [codex-eval.toml](../examples/clients/codex-eval.toml), add the block to `~/.codex/config.toml` |
| Claude Code | [claude-code-eval.json](../examples/clients/claude-code-eval.json), pass it with `claude --mcp-config path/to/claude-code-eval.json --strict-mcp-config` |
| OpenCode | [opencode-eval.json](../examples/clients/opencode-eval.json), copy to `opencode.json` in an eval project |
| Antigravity CLI | [antigravity-eval.json](../examples/clients/antigravity-eval.json), merge its server entry into `~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json` |

For Antigravity's unattended runs, add `mcp(teletype_eval/*)` to `permissions.allow` in `~/.gemini/antigravity-cli/settings.json`. After the eval, remove that permission and the test server entry from the config file where you added it. MCP tool calls otherwise require interactive approval.

Ask the agent:

> Call `eval_list_cases`. Start `workspace-metadata` with `eval_start_case`, carry out the returned task using Teletype tools, then call `eval_grade_case` with your final answer. Show `metrics` and failed checks.

`eval_start_case` resets the test project and the call trace. `eval_grade_case` reports separate `metrics`: `outcome_passed` checks the fake project's final state for writes and the required tool call for reads, `first_target_call_passed` checks the first call to the target tool, `answer_passed` checks the answer, and `safety_passed` checks forbidden and extra writes. `tool_errors` counts failed calls. `recovered_after_error` marks a completed goal after a tool error. The existing `score` and `passed` fields remain as overall diagnostics.

One agent run counts as one attempt even if the agent corrects a mistake before calling `eval_grade_case`. Record the first `eval_grade_case` call when comparing models, since an agent can revise its answer after seeing the checks. This mode supports hands-on debugging rather than a blind benchmark.

See the [eval results](EVAL_RESULTS.md) for recorded client runs.

For a local source checkout, run `npm run build`, then set the client's command to `node` and its first argument to `/absolute/path/to/dist/index.js`. Keep arguments such as `--stdio` or `--eval-fixture`. If the client uses a command array, use `["node", "/absolute/path/to/dist/index.js", "--stdio"]`. Hosted URL configs need no local build.

Client syntax follows the [OpenAI Docs for Codex](https://developers.openai.com/codex/mcp), [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp), [OpenCode MCP documentation](https://opencode.ai/v2/docs/mcp-servers), [Antigravity MCP documentation](https://www.antigravity.google/docs/mcp), [Devin MCP documentation](https://docs.devin.ai/work-with-devin/mcp), [Zed MCP documentation](https://zed.dev/docs/ai/mcp), and [ZCode MCP documentation](https://zcode.z.ai/en/docs/mcp-services).
