English | [Русский](ru/SECURITY.md)

# Security

Report vulnerabilities privately to [Teletype's Public API contact](https://teletype.app/help/api/) at [p@teletype.app](mailto:p@teletype.app). Do not publish them in an issue. Include affected versions, reproduction steps, and the possible impact.

The HTTP transport requires `X-Teletype-Api-Token` on every MCP request and passes it to Teletype. There are no separate MCP users or scopes. Use HTTPS for remote access and treat the token as full project access. The server checks that a token was supplied, then Teletype checks whether it is valid when an API operation runs.

Local file uploads through `attachment_path` are available only in stdio mode.
