# Teletype support plugin

![Teletype](assets/logo.svg)

Connect your AI assistant to [Teletype](https://teletype.app) customer support. Find unanswered conversations, read customer history, draft and send replies, add notes, escalate issues, and prepare shift handovers. The plugin includes the `teletype-support` skill and five support commands. You need a Teletype project with Public API access and its project token.

## Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add Teletype-App/teletype-mcp-server
/plugin install teletype@teletype-mcp-server
```

Enable the plugin and enter the **Teletype Public API token** in its configuration dialog. The field is required and marked sensitive. Claude stores it in its secure credential store and substitutes it into the hosted server's authentication header. Use an up-to-date Claude Code version with `userConfig` support. Check the connection in `/mcp`.

The commands are `/teletype:triage-inbox`, `/teletype:draft-reply`, `/teletype:client-summary`, `/teletype:escalate-issue`, and `/teletype:shift-handover`. You can also ask for a support task in plain language.

## Cursor

The Cursor manifest is `.cursor-plugin/plugin.json`. For a marketplace installation, set `TELETYPE_API_TOKEN` in the plugin's **Plugins → Configure** dashboard. It connects to the hosted Teletype MCP server and includes the shared skill and commands. Check the MCP connection after configuration.

## Codex and Agent Plugins

The portable `plugin.json` and `mcp.json` add the skill and a local stdio server. The launcher runs `npx -y teletype-mcp-server@0.1.1 --stdio`. It downloads the pinned npm package and starts it locally. See the [Codex setup guide](https://github.com/Teletype-App/teletype-mcp-server/blob/main/docs/CLIENTS.md#codex) for client configuration and installation.

## Kiro Powers

Import this directory as an Agent Plugin in Kiro. The portable manifest starts the local stdio server and loads the shared support skill. Set `TELETYPE_API_TOKEN` in the Kiro process environment before starting it. The pinned npm version must be published. See [Kiro installation](https://kiro.dev/docs/powers/installation/) and the [client guide](https://github.com/Teletype-App/teletype-mcp-server/blob/main/docs/CLIENTS.md#kiro).

## What the plugin accesses

Claude and Cursor send the configured token, tool arguments, and conversation operations to `https://mcp.teletype.app/mcp`. The hosted server forwards Public API requests to Teletype. The local stdio server calls the Teletype Public API directly. Customer profiles and message history returned by tools become available to your AI client. Message tools can send the text and attachments you select to customers. Project tools can change workspace settings.

Write tools require `confirm: true`. Reply and template tools support `dry_run: true` for previews. Follow the skill's confirmation rules before sending messages or changing customer records. The confirmation flag is a guard against accidental calls, and the client still needs to enforce user consent. For restricted local access, configure the server with `--read-only` or selected `--toolsets` as described in the [client guide](https://github.com/Teletype-App/teletype-mcp-server/blob/main/docs/CLIENTS.md).

Start with: “Find unanswered Teletype conversations and summarize the three most urgent. Do not send replies.”

## Support and privacy

- [Client setup and troubleshooting](https://github.com/Teletype-App/teletype-mcp-server/blob/main/docs/CLIENTS.md)
- [Teletype help center](https://help.teletype.app)
- [Report a bug](https://github.com/Teletype-App/teletype-mcp-server/issues)
- [Teletype privacy policy](https://teletype.app/android/policy.html)
- Security reports: `p@teletype.app`

The plugin code is licensed under [MIT](LICENSE). Brand assets come from the [official Teletype website](assets/README.md).
