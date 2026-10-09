English | [Русский](ru/OAUTH.md)

# OAuth for self-hosted HTTP servers

The public hosted endpoint at `https://mcp.teletype.app/mcp` has OAuth disabled and requires the project token in `X-Teletype-Api-Token`. This guide covers enabling OAuth on your own server.

OAuth is optional and disabled by default. It adds a browser connection flow over existing Teletype Public API project tokens. It does not require an OAuth provider in Teletype. A user opens the connection page from their MCP client, enters their project token, and approves access. The server verifies that token through Teletype before issuing separate OAuth credentials to the client.

The connection page supports English and Russian. It uses the browser's language until the user selects a language, then remembers that choice in a cookie. Switching languages preserves the entered token and permissions. The “Where to get a token” link opens [Teletype Public API settings](https://panel.teletype.app/settings/public-api) in a new tab.

## Enable OAuth

Use Node.js 22.13+ or 24.x. Node.js 20 continues to support stdio and HTTP with project-token headers, but cannot run this SQLite-backed OAuth provider.

Set these variables in the server's private environment:

```dotenv
OAUTH_ENABLED=true
PUBLIC_BASE_URL=https://your-mcp-domain.example
OAUTH_DB_PATH=/var/lib/teletype-mcp/oauth.sqlite
OAUTH_ENCRYPTION_KEY=<64-character hex key>
```

Generate the key once with `openssl rand -hex 32` and keep it in your secret storage. Reuse it after restarts. `PUBLIC_BASE_URL` must be the public HTTPS origin. HTTP is allowed only on loopback for local development. Route `/mcp`, `/authorize`, `/oauth/consent`, `/oauth/assets/*`, `/token`, `/register`, `/revoke`, and `/.well-known/*` through the reverse proxy.

The database directory must be writable by the server user and persist between deployments. The Docker image prepares `/data` for its `node` user. Mount a named volume at `/data` and set `OAUTH_DB_PATH=/data/oauth.sqlite`. For a bind mount, give the host directory to that same user. The SQLite file belongs on a local disk. This setup suits a single host. Replicas on different machines require a shared database implementation.

The existing `X-Teletype-Api-Token` connection remains available. OAuth clients use `Authorization: Bearer <OAuth access token>`. A Teletype project token is never a valid OAuth bearer token. Do not send both authentication methods in one request.

## Permissions and lifetime

Clients discover the protected resource at `/.well-known/oauth-protected-resource/mcp` and the authorization server at `/.well-known/oauth-authorization-server`. Registration, authorization code exchange with PKCE S256, refresh, and revocation use the OAuth endpoints above.

| Scope | Access |
| --- | --- |
| `read` | Read project data. Required for every connection |
| `write` | Write tools and marking conversations as seen. Granted only when the user checks the permission box |
| `offline_access` | Renew access automatically until the connection is revoked |

Access tokens last up to one hour. With `offline_access`, the client can obtain new access tokens without asking the user to reconnect. The approved connection has no fixed expiration date. Without `offline_access`, the connection expires after one hour. Refresh tokens rotate on every use. Reusing an old refresh token revokes that entire connection. Refresh can reduce permissions, but cannot add them.

Client registrations supporting renewable connections remain valid. Client secrets have no separate expiration date. Registrations without renewable connections expire after 30 days. Revoking one connection does not interrupt the client's other connections.

Server-wide read-only mode and toolset restrictions remain effective for OAuth connections. The existing `confirm: true` requirement on write tools still applies. OAuth permissions do not replace user approval for a specific action.

## Storage and recovery

SQLite stores client registrations, pending consent, one-time codes, connections, and token digests. Record payloads, including project tokens, are encrypted with AES-256-GCM. Access tokens, codes, and browser secrets use SHA-256 digests. Each connection stores only its current refresh-token digest. A server-generated HMAC authenticates the connection identifier in each refresh token, so replay detection does not require storing the entire token history. The client receives OAuth credentials, never the original Teletype project token.

Code consumption, refresh rotation, and revocation run in short SQLite transactions. Expired records are rejected on reads and removed during database writes. The database file is created with owner-only permissions. SQLite files are excluded from Git and Docker build context.

Back up the database while the server is stopped, and back up the encryption key separately. Restore both with the same public origin. A wrong key or different origin prevents startup. Changing the key is not a rotation mechanism. Deleting the database invalidates all OAuth connections and requires users to reconnect. To revoke one connection, use the client's OAuth disconnect action that calls `/revoke`. Revoking the project token in Teletype also prevents further Public API operations for every connection using it.

A revoked connection is removed immediately. Expired connections are removed during the next database write. Request bodies and credentials are not logged by the OAuth handlers. Configure reverse-proxy logs to avoid recording form bodies and authorization headers.
