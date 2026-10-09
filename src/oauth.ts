import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidScopeError,
  InvalidTargetError,
  InvalidTokenError,
  TooManyRequestsError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { Config } from "./config.js";
import { requestContext } from "./request-context.js";
import { teletypeRequest } from "./teletype-api.js";
import { decodeProjectDetails } from "./api-contract.js";
import { RequestLimiter } from "./request-limiter.js";
import { OAuthStore } from "./oauth-store.js";
import { consentPage } from "./oauth-page.js";

const ACCESS_SECONDS = 3600;
const CLIENT_SECONDS = 30 * 24 * 3600;
const MAX_ENTRIES = 1000;
const MAX_ACCESS_TOKENS = 8000;
const SCOPES = ["read", "write", "offline_access"];
const now = () => Math.floor(Date.now() / 1000);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const secret = () => randomBytes(32).toString("base64url");
const consentFields = z.object({
  request_id: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  action: z.enum(["connect", "cancel"]),
  api_token: z.string().max(2048).optional(),
  allow_write: z.enum(["yes", ""]).optional(),
});

class ProjectOAuthProvider implements OAuthServerProvider {
  private readonly store: OAuthStore;
  private readonly refreshKey: Buffer;
  readonly resource: URL;
  readonly issuer: URL;
  readonly clientsStore: OAuthRegisteredClientsStore;

  constructor(private readonly cfg: Config) {
    if (!cfg.oauth) throw new Error("OAuth configuration is missing.");
    this.issuer = new URL(cfg.publicBaseUrl);
    this.resource = new URL("/mcp", this.issuer);
    this.store = new OAuthStore(
      cfg.oauth.databasePath,
      cfg.oauth.encryptionKey,
      this.resource.href,
    );
    this.refreshKey = createHmac("sha256", Buffer.from(cfg.oauth.encryptionKey, "hex"))
      .update("teletype-oauth-refresh-v1:" + this.resource.href)
      .digest();
    this.clientsStore = {
      getClient: (id) => this.store.get("client", id),
      registerClient: (metadata) =>
        this.store.transaction(() => {
          if (this.store.count("client") >= MAX_ENTRIES)
            throw new TooManyRequestsError("OAuth client capacity reached.");
          if (
            metadata.redirect_uris.length > 10 ||
            metadata.redirect_uris.some((value) => !validRedirect(value))
          ) {
            throw new InvalidClientMetadataError(
              "Redirects require HTTPS or loopback HTTP without fragments or credentials.",
            );
          }
          if (JSON.stringify(metadata).length > 4096)
            throw new InvalidClientMetadataError("Client metadata is too large.");
          if (metadata.scope?.split(" ").some((scope) => !SCOPES.includes(scope)))
            throw new InvalidClientMetadataError("Unsupported scope.");
          const client = { ...metadata, client_id: randomUUID(), client_id_issued_at: now() };
          this.store.put("client", client.client_id, client, now() + CLIENT_SECONDS);
          return client;
        }),
    };
  }

  close(): void {
    this.store.close();
  }

  private checkResource(resource?: URL): void {
    if (resource && resource.href !== this.resource.href)
      throw new InvalidTargetError("The token is restricted to the Teletype MCP endpoint.");
  }

  authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Parameters<OAuthServerProvider["authorize"]>[2],
  ): Promise<void> {
    this.checkResource(params.resource);
    if ((params.state?.length ?? 0) > 2048 || params.redirectUri.length > 2048)
      throw new InvalidGrantError("Authorization parameters are too large.");
    const scopes = params.scopes?.length ? [...new Set(params.scopes)] : ["read"];
    if (
      !scopes.includes("read") ||
      scopes.some((scope) => !SCOPES.includes(scope)) ||
      (this.cfg.readOnly && scopes.includes("write"))
    ) {
      throw new InvalidScopeError(
        "Request read, optionally write and offline_access. A read-only deployment cannot grant write.",
      );
    }
    if (!/^[A-Za-z0-9_-]{43}$/.test(params.codeChallenge))
      throw new InvalidGrantError("A valid S256 PKCE challenge is required.");
    const id = secret();
    const cookie = secret();
    this.store.transaction(() => {
      if (this.store.count("consent") >= MAX_ENTRIES)
        throw new TooManyRequestsError("OAuth consent capacity reached.");
      this.store.put(
        "consent",
        hash(id),
        {
          clientId: client.client_id,
          redirectUri: params.redirectUri,
          challenge: params.codeChallenge,
          state: params.state,
          scopes,
          cookieHash: hash(cookie),
          expiresAt: now() + 600,
        },
        now() + 600,
      );
    });
    res.cookie(cookieName(id), cookie, {
      httpOnly: true,
      secure: this.issuer.protocol === "https:",
      sameSite: "strict",
      path: "/oauth/consent",
      maxAge: 600_000,
    });
    res.set({
      "Cache-Control": "no-store",
      "Referrer-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; form-action 'self' ${new URL(params.redirectUri).origin}; frame-ancestors 'none'; base-uri 'none'`,
    });
    const savedLocale = res.req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("teletype_oauth_locale="))
      ?.slice("teletype_oauth_locale=".length);
    const locale =
      savedLocale === "ru" || savedLocale === "en"
        ? savedLocale
        : res.req.acceptsLanguages("en", "ru") === "ru"
          ? "ru"
          : "en";
    res
      .type("html")
      .send(
        consentPage(
          client.client_name || "",
          new URL(params.redirectUri).origin,
          id,
          scopes,
          locale,
        ),
      );
    return Promise.resolve();
  }

  async completeConsent(req: Request, res: Response): Promise<void> {
    if (req.headers.origin !== this.issuer.origin) {
      res.status(403).json({ error: "consent_origin_invalid" });
      return;
    }
    const input: unknown = req.body;
    const fields = consentFields.safeParse(input);
    if (!fields.success) {
      res.status(400).json({ error: "invalid_consent_request" });
      return;
    }
    const id = fields.data.request_id;
    const cookie = (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(cookieName(id) + "="))
      ?.slice(cookieName(id).length + 1);
    const consent = this.store.transaction(() => {
      const item = this.store.get("consent", hash(id));
      if (!item || !cookie || hash(cookie) !== item.cookieHash) return undefined;
      this.store.remove("consent", hash(id));
      return item;
    });
    if (!consent) {
      res.status(400).json({
        error: "consent_expired_or_invalid",
        message: "Restart the connection from your MCP client.",
      });
      return;
    }
    res.clearCookie(cookieName(id), { path: "/oauth/consent" });
    res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    const redirect = new URL(consent.redirectUri);
    if (consent.state !== undefined) redirect.searchParams.set("state", consent.state);
    if (fields.data.action !== "connect") {
      redirect.searchParams.set("error", "access_denied");
      res.redirect(303, redirect.href);
      return;
    }
    const apiToken = fields.data.api_token?.trim() ?? "";
    if (!apiToken || apiToken.length > 2048) {
      res.status(400).json({ error: "project_token_required" });
      return;
    }
    try {
      await requestContext.run(
        {
          authToken: apiToken,
          allowLocalFiles: false,
          allowedFileRoots: [],
          apiBase: this.cfg.apiBase,
          projectUrl: this.cfg.projectUrl,
          requestTimeoutMs: this.cfg.requestTimeoutMs,
          maxResponseBytes: this.cfg.maxResponseBytes,
          maxUploadBytes: this.cfg.maxUploadBytes,
          requestId: randomUUID(),
          logLevel: this.cfg.logLevel,
        },
        () => teletypeRequest("/project/details", { decode: decodeProjectDetails }),
      );
    } catch {
      res.status(401).json({
        error: "project_token_not_verified",
        message: "Check the project token and Public API access, then restart the connection.",
      });
      return;
    }
    if (fields.data.allow_write !== "yes")
      consent.scopes = consent.scopes.filter((scope) => scope !== "write");
    const grantId = randomUUID();
    const code = secret();
    this.store.transaction(() => {
      if (!this.store.get("client", consent.clientId))
        throw new InvalidGrantError("OAuth client expired.");
      if (this.store.count("grant") >= MAX_ENTRIES)
        throw new TooManyRequestsError("OAuth connection capacity reached.");
      const expiresAt = now() + 60;
      this.store.put(
        "grant",
        grantId,
        { clientId: consent.clientId, apiToken, scopes: consent.scopes, expiresAt },
        expiresAt,
      );
      this.store.put(
        "code",
        hash(code),
        { consent, grantId, expiresAt: now() + 60 },
        now() + 60,
        grantId,
      );
    });
    redirect.searchParams.set("code", code);
    res.redirect(303, redirect.href);
  }

  private code(client: OAuthClientInformationFull, code: string) {
    const item = this.store.get("code", hash(code));
    if (item?.consent.clientId !== client.client_id)
      throw new InvalidGrantError("Authorization code is invalid or expired.");
    return item;
  }

  challengeForAuthorizationCode(client: OAuthClientInformationFull, code: string): Promise<string> {
    return Promise.resolve(this.code(client, code).consent.challenge);
  }

  exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    code: string,
    _verifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    this.checkResource(resource);
    return Promise.resolve(
      this.store.transaction(() => {
        const item = this.code(client, code);
        if (redirectUri !== undefined && redirectUri !== item.consent.redirectUri)
          throw new InvalidGrantError("Redirect URI differs from the authorized redirect.");
        this.store.remove("code", hash(code));
        return this.issueTokens(item.grantId);
      }),
    );
  }

  private issueTokens(grantId: string): OAuthTokens {
    const grant = this.store.get("grant", grantId);
    if (!grant) throw new InvalidGrantError("OAuth connection is expired.");
    if (this.store.count("access") >= MAX_ACCESS_TOKENS)
      throw new TooManyRequestsError("OAuth refresh capacity reached.");
    const access = secret();
    const expiresIn = ACCESS_SECONDS;
    // Zero expiry keeps approved renewable grants until they are revoked.
    grant.expiresAt = grant.scopes.includes("offline_access") ? 0 : now() + expiresIn;
    this.store.put(
      "access",
      hash(access),
      { grantId, expiresAt: now() + expiresIn },
      now() + expiresIn,
      grantId,
    );
    let refresh: string | undefined;
    grant.currentRefresh = undefined;
    if (grant.scopes.includes("offline_access")) {
      const value = grantId + "." + secret();
      refresh = value + "." + this.refreshSignature(value);
      grant.currentRefresh = hash(refresh);
    }
    this.store.put("grant", grantId, grant, grant.expiresAt);
    this.syncClientLifetime(grant.clientId, grant.expiresAt === 0);
    return {
      access_token: access,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: refresh,
      scope: grant.scopes.join(" "),
    };
  }

  private refreshSignature(value: string): string {
    return createHmac("sha256", this.refreshKey).update(value).digest("base64url");
  }

  private refreshGrantId(token: string): string | undefined {
    const match = /^([a-f0-9-]{36}\.[A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/.exec(token);
    if (!match?.[1] || !match[2]) return undefined;
    if (!timingSafeEqual(Buffer.from(match[2]), Buffer.from(this.refreshSignature(match[1]))))
      return undefined;
    return match[1].slice(0, 36);
  }

  private syncClientLifetime(clientId: string, persistent = false): void {
    const client = this.store.get("client", clientId);
    if (!client) throw new InvalidGrantError("OAuth client expired.");
    this.store.put(
      "client",
      clientId,
      client,
      persistent || this.store.hasPersistentGrant(clientId) ? 0 : now() + CLIENT_SECONDS,
    );
  }

  private revokeGrant(grantId: string): void {
    const grant = this.store.get("grant", grantId);
    this.store.revokeGrant(grantId);
    if (grant && this.store.get("client", grant.clientId)) this.syncClientLifetime(grant.clientId);
  }

  exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refresh: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    this.checkResource(resource);
    const digest = hash(refresh);
    const result = this.store.transaction(() => {
      const grantId = this.refreshGrantId(refresh);
      const grant = grantId && this.store.get("grant", grantId);
      if (!grantId || !grant || grant.clientId !== client.client_id)
        throw new InvalidGrantError("Refresh token is invalid or expired.");
      if (grant.currentRefresh !== digest) {
        this.revokeGrant(grantId);
        return undefined;
      }
      if (
        scopes?.some((scope) => !grant.scopes.includes(scope)) ||
        (scopes && !scopes.includes("read"))
      )
        throw new InvalidScopeError("Refresh cannot expand access or remove read.");
      if (scopes) grant.scopes = [...new Set(scopes)];
      this.store.put("grant", grantId, grant, grant.expiresAt);
      return this.issueTokens(grantId);
    });
    if (!result) throw new InvalidGrantError("Refresh token was reused. Restart the connection.");
    return Promise.resolve(result);
  }

  verifyAccessToken(token: string): Promise<AuthInfo> {
    const access = this.store.get("access", hash(token));
    const grant = access && this.store.get("grant", access.grantId);
    if (!access || !grant || !this.store.get("client", grant.clientId))
      throw new InvalidTokenError("Access token is invalid or expired.");
    return Promise.resolve({
      token,
      clientId: grant.clientId,
      scopes: grant.scopes,
      expiresAt: access.expiresAt,
      resource: this.resource,
      extra: { apiToken: grant.apiToken },
    });
  }

  revokeToken(
    client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    const digest = hash(request.token);
    this.store.transaction(() => {
      const grantId =
        this.store.get("access", digest)?.grantId ?? this.refreshGrantId(request.token);
      if (grantId && this.store.get("grant", grantId)?.clientId === client.client_id)
        this.revokeGrant(grantId);
    });
    return Promise.resolve();
  }
}

function validRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

const cookieName = (id: string) => "teletype_oauth_" + hash(id).slice(0, 16);

export function mountProjectOAuth(app: Express, cfg: Config): OAuthServerProvider | undefined {
  if (!cfg.oauth) return undefined;
  const provider = new ProjectOAuthProvider(cfg);
  app.use(
    "/oauth/assets",
    express.static(fileURLToPath(new URL("../plugin/assets/", import.meta.url)), {
      dotfiles: "deny",
      index: false,
      redirect: false,
      maxAge: "1d",
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );
  app.once("close", () => {
    provider.close();
  });
  const limiter = new RequestLimiter(cfg.maxConcurrentRequests, cfg.maxConcurrentPerToken);
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: provider.issuer,
      resourceServerUrl: provider.resource,
      resourceName: "Teletype",
      clientRegistrationOptions: { clientSecretExpirySeconds: 0 },
      scopesSupported: cfg.readOnly ? ["read", "offline_access"] : SCOPES,
      serviceDocumentationUrl: new URL("https://github.com/Teletype-App/teletype-mcp-server"),
    }),
  );
  app.post("/oauth/consent", express.urlencoded({ extended: false, limit: "8kb" }), (req, res) => {
    const release = limiter.acquire(hash(req.ip || "unknown"));
    if (!release) {
      res.set("Retry-After", "1").status(429).json({ error: "oauth_busy" });
      return;
    }
    void provider
      .completeConsent(req, res)
      .catch(() => {
        if (!res.headersSent) res.status(500).json({ error: "oauth_consent_failed" });
      })
      .finally(release);
  });
  return provider;
}
