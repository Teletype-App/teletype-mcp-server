English | [Русский](ru/SECURITY.md)

# Security

Report vulnerabilities privately to [Teletype's Public API contact](https://teletype.app/help/api/) at [p@teletype.app](mailto:p@teletype.app). Do not publish them in an issue. Include affected versions, reproduction steps, and the possible impact.

By default, HTTP requires `X-Teletype-Api-Token` on every MCP request and passes it to Teletype. Use HTTPS for remote access and treat the project token as full project access. Teletype checks its validity when an API operation runs.

OAuth is disabled on the public hosted endpoint. If you explicitly enable [OAuth](OAUTH.md) on your own server, it verifies the project token during consent, stores it encrypted in SQLite, and gives the client separate bearer credentials with read/write permissions. OAuth credentials are restricted to this server's `/mcp` resource. Read-only OAuth access disables writes even if the deployment enables them. Server restrictions and explicit write confirmation still apply. Refresh-token reuse revokes the connection. Keep the database and its encryption key private and back them up separately.

Local file uploads through `attachment_path` are available only in stdio mode.
