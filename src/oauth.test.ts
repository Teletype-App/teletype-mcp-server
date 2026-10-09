import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { loadConfig, type Config } from "./config.js";
import { createHttpApp } from "./http.js";
import { startFakeTeletypeApi, type FakeTeletypeApi } from "./test-support/fake-teletype-api.js";

const issuer = "https://mcp.example.test";
const resource = issuer + "/mcp";
const callback = "https://client.example.test/callback";

describe.skipIf(Number(process.versions.node.split(".")[0]) < 22)("project OAuth over HTTP", () => {
  let directory: string;
  let api: FakeTeletypeApi;
  let cfg: Config;
  const apps = new Set<Express>();

  function app(config = cfg): Express {
    const instance = createHttpApp(config);
    apps.add(instance);
    return instance;
  }
  function close(instance: Express): void {
    instance.emit("close");
    apps.delete(instance);
  }

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "teletype-oauth-"));
    api = await startFakeTeletypeApi();
    cfg = loadConfig({
      PUBLIC_BASE_URL: issuer,
      TELETYPE_API_BASE: api.baseUrl,
      OAUTH_ENABLED: "true",
      OAUTH_DB_PATH: join(directory, "oauth.sqlite"),
      OAUTH_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
      LOG_LEVEL: "error",
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const instance of apps) close(instance);
    await api.close();
    rmSync(directory, { recursive: true, force: true });
  });

  async function register(instance: Express, authMethod = "none") {
    const response = await request(instance)
      .post("/register")
      .send({
        client_name: "Support assistant",
        redirect_uris: [callback],
        token_endpoint_auth_method: authMethod,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      });
    expect(response.status).toBe(201);
    return JSON.parse(response.text) as OAuthClientInformationFull;
  }

  async function begin(
    instance: Express,
    scopes = "read offline_access",
    existingClient?: OAuthClientInformationFull,
  ) {
    const client = existingClient ?? (await register(instance));
    const verifier = randomBytes(32).toString("base64url");
    const parameters = {
      client_id: client.client_id,
      redirect_uri: callback,
      response_type: "code",
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      state: "connection-state",
      scope: scopes,
      resource,
    };
    const page = await request(instance).get("/authorize").query(parameters);
    expect(page.status).toBe(200);
    const requestId = /name="request_id" value="([^"]+)"/.exec(page.text)?.[1];
    expect(requestId).toBeTruthy();
    const cookieHeader: unknown = page.headers["set-cookie"];
    const cookies = Array.isArray(cookieHeader)
      ? cookieHeader.filter((value): value is string => typeof value === "string")
      : typeof cookieHeader === "string"
        ? [cookieHeader]
        : [];
    return { client, verifier, parameters, requestId, cookies };
  }

  async function code(
    instance: Express,
    options: {
      token?: string;
      write?: boolean;
      scopes?: string;
      client?: OAuthClientInformationFull;
    } = {},
  ) {
    const authorization = await begin(instance, options.scopes, options.client);
    const response = await request(instance)
      .post("/oauth/consent")
      .set("Origin", issuer)
      .set("Cookie", authorization.cookies)
      .type("form")
      .send({
        request_id: authorization.requestId,
        action: "connect",
        api_token: options.token ?? "private-project-token",
        allow_write: options.write ? "yes" : "",
      });
    expect(response.status).toBe(303);
    const location = response.get("Location");
    if (!location) throw new Error("Missing OAuth redirect.");
    const redirect = new URL(location);
    expect(redirect.searchParams.get("state")).toBe("connection-state");
    expect(redirect.searchParams.get("code")).toBeTruthy();
    expect(redirect.href).not.toContain(options.token ?? "private-project-token");
    const authCode = redirect.searchParams.get("code");
    if (!authCode) throw new Error("Missing authorization code.");
    return { ...authorization, code: authCode };
  }

  function exchange(
    instance: Express,
    authorization: Awaited<ReturnType<typeof code>>,
    overrides = {},
  ) {
    return request(instance)
      .post("/token")
      .type("form")
      .send({
        client_id: authorization.client.client_id,
        client_secret: authorization.client.client_secret,
        grant_type: "authorization_code",
        code: authorization.code,
        code_verifier: authorization.verifier,
        redirect_uri: callback,
        resource,
        ...overrides,
      });
  }

  async function connect(instance: Express, options: Parameters<typeof code>[1] = {}) {
    const authorization = await code(instance, options);
    const response = await exchange(instance, authorization);
    expect(response.status).toBe(200);
    return { ...authorization, tokens: JSON.parse(response.text) as OAuthTokens };
  }

  function mcp(
    instance: Express,
    token: string,
    method = "tools/list",
    params: Record<string, unknown> = {},
  ) {
    const call = request(instance)
      .post("/mcp")
      .set("Authorization", "Bearer " + token)
      .set("Accept", "application/json, text/event-stream")
      .set("MCP-Protocol-Version", "2026-07-28")
      .set("Mcp-Method", method);
    if (typeof params.name === "string") call.set("Mcp-Name", params.name);
    return call.send({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientInfo": { name: "oauth-test", version: "1" },
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    });
  }

  function refresh(
    instance: Express,
    connection: Awaited<ReturnType<typeof connect>>,
    token = connection.tokens.refresh_token,
  ) {
    if (!token) throw new Error("Missing refresh token.");
    return request(instance).post("/token").type("form").send({
      client_id: connection.client.client_id,
      client_secret: connection.client.client_secret,
      grant_type: "refresh_token",
      refresh_token: token,
      resource,
    });
  }

  it("advertises a usable OAuth discovery path when authentication is missing", async () => {
    const instance = app();
    const unauthenticated = await request(instance).post("/mcp").send({});
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.get("WWW-Authenticate")).toContain(
      issuer + "/.well-known/oauth-protected-resource/mcp",
    );
    const metadata = await request(instance).get("/.well-known/oauth-protected-resource/mcp");
    expect(metadata.status).toBe(200);
    expect(JSON.parse(metadata.text)).toMatchObject({
      resource,
      authorization_servers: [issuer + "/"],
    });
    const authorization = await request(instance).get("/.well-known/oauth-authorization-server");
    expect(authorization.status).toBe(200);
    expect(JSON.parse(authorization.text)).toMatchObject({
      issuer: issuer + "/",
      authorization_endpoint: issuer + "/authorize",
      token_endpoint: issuer + "/token",
      registration_endpoint: issuer + "/register",
      code_challenge_methods_supported: ["S256"],
    });
  });

  it.each([
    { language: "ru-RU, en;q=0.8", cookie: "", expected: "ru" },
    { language: "en-US, ru;q=0.5", cookie: "", expected: "en" },
    { language: "fr-FR", cookie: "", expected: "en" },
    { language: "ru;q=0, en;q=0.5", cookie: "", expected: "en" },
    { language: "", cookie: "", expected: "en" },
    { language: "en", cookie: "teletype_oauth_locale=ru", expected: "ru" },
    { language: "ru", cookie: "other=value; teletype_oauth_locale=en", expected: "en" },
    { language: "ru", cookie: "teletype_oauth_locale=unsupported", expected: "ru" },
  ])(
    "chooses consent language from browser or preference: $language / $cookie",
    async ({ language, cookie, expected }) => {
      const instance = app();
      const { parameters } = await begin(instance);
      const page = await request(instance)
        .get("/authorize")
        .query(parameters)
        .set("Accept-Language", language)
        .set("Cookie", cookie);
      expect(page.status).toBe(200);
      expect(/<html lang="([^"]+)"/.exec(page.text)?.[1]).toBe(expected);
    },
  );

  it("allows the consent POST and registered callback under browser security policy", async () => {
    const instance = app();
    const { parameters } = await begin(instance);
    const page = await request(instance).get("/authorize").query(parameters);
    expect(page.get("Referrer-Policy")).toBe("same-origin");
    const formAction = /(?:^|;)\s*form-action\s+([^;]+)/
      .exec(page.get("Content-Security-Policy") ?? "")?.[1]
      ?.trim()
      .split(/\s+/);
    expect(formAction).toEqual(expect.arrayContaining(["'self'", new URL(callback).origin]));
  });

  it("restores a connection after restart and forwards only its original project credential", async () => {
    const first = app();
    const connection = await connect(first);
    close(first);
    const restarted = app();
    const response = await mcp(restarted, connection.tokens.access_token, "tools/call", {
      name: "list_workspace_metadata",
      arguments: { resource: "tags" },
    });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toHaveProperty("result.structuredContent.tags");
    expect(api.state.calls.map((call) => call.token)).toEqual([
      "private-project-token",
      "private-project-token",
    ]);
    expect(
      readFileSync(join(directory, "oauth.sqlite")).includes(Buffer.from("private-project-token")),
    ).toBe(false);
    expect(
      readFileSync(join(directory, "oauth.sqlite")).includes(
        Buffer.from(connection.tokens.access_token),
      ),
    ).toBe(false);
  });

  it("enforces read-only access even when the client requested writes but the user declined", async () => {
    const instance = app();
    const connection = await connect(instance, { scopes: "read write offline_access" });
    expect(connection.tokens.scope).toBe("read offline_access");
    const tools = await mcp(instance, connection.tokens.access_token);
    const listed = JSON.parse(tools.text) as { result: { tools: { name: string }[] } };
    expect(listed.result.tools.some((tool) => tool.name === "send_reply_to_client")).toBe(false);
    const forbidden = await mcp(instance, connection.tokens.access_token, "tools/call", {
      name: "send_reply_to_client",
      arguments: { recipient_dialog_id: "dialog-open", text: "must not send", confirm: true },
    });
    expect(JSON.parse(forbidden.text)).toHaveProperty("error");
    const read = await mcp(instance, connection.tokens.access_token, "tools/call", {
      name: "read_conversation_thread",
      arguments: { dialog_id: "dialog-open", mark_seen: true, confirm: true },
    });
    expect(read.status).toBe(200);
    expect(api.state.seenDialogs).toEqual([]);
    expect(api.state.sentMessages).toEqual([]);
  });

  it("uses write access only when explicitly approved and isolates projects", async () => {
    const instance = app();
    const writer = await connect(instance, {
      token: "project-writer",
      scopes: "read write",
      write: true,
    });
    const reader = await connect(instance, { token: "project-reader" });
    const written = await mcp(instance, writer.tokens.access_token, "tools/call", {
      name: "send_reply_to_client",
      arguments: { recipient_dialog_id: "dialog-open", text: "Approved reply", confirm: true },
    });
    expect(written.status).toBe(200);
    expect(api.state.sentMessages).toContainEqual(
      expect.objectContaining({ text: "Approved reply" }),
    );
    const read = await mcp(instance, reader.tokens.access_token, "tools/call", {
      name: "list_workspace_metadata",
      arguments: { resource: "tags" },
    });
    expect(read.status).toBe(200);
    const writes = api.state.calls.filter((call) => call.method === "POST");
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.every((call) => call.token === "project-writer")).toBe(true);
    expect(api.state.calls.at(-1)?.token).toBe("project-reader");
  });

  it.each([
    {
      label: "cross-origin submission",
      origin: "https://evil.example",
      withCookie: true,
      status: 403,
    },
    { label: "missing browser cookie", origin: issuer, withCookie: false, status: 400 },
  ])("rejects $label before contacting Teletype", async ({ origin, withCookie, status }) => {
    const instance = app();
    const authorization = await begin(instance);
    const submission = request(instance).post("/oauth/consent").set("Origin", origin);
    if (withCookie) submission.set("Cookie", authorization.cookies);
    const response = await submission.type("form").send({
      request_id: authorization.requestId,
      action: "connect",
      api_token: "must-not-reach-upstream",
    });
    expect(response.status).toBe(status);
    expect(api.state.calls).toEqual([]);
  });

  it("does not issue credentials when the project token fails upstream verification", async () => {
    const instance = app();
    const authorization = await begin(instance);
    api.failNext("/project/details", 401);
    const response = await request(instance)
      .post("/oauth/consent")
      .set("Origin", issuer)
      .set("Cookie", authorization.cookies)
      .type("form")
      .send({
        request_id: authorization.requestId,
        action: "connect",
        api_token: "invalid-token",
      });
    expect(response.status).toBe(401);
    expect(response.get("Location")).toBeUndefined();
    expect(response.text).not.toContain("invalid-token");
  });

  it("checks PKCE and binds single-use codes to the resource and redirect", async () => {
    const instance = app();
    const authorization = await code(instance);
    for (const overrides of [
      { code_verifier: randomBytes(32).toString("base64url") },
      { resource: "https://another.example/mcp" },
      { redirect_uri: "https://evil.example/callback" },
    ]) {
      expect((await exchange(instance, authorization, overrides)).status).toBe(400);
    }
    expect((await exchange(instance, authorization)).status).toBe(200);
    expect((await exchange(instance, authorization)).status).toBe(400);
  });

  it("consumes a code only once across two independent SQLite connections", async () => {
    const first = app();
    const authorization = await code(first);
    const second = app();
    const responses = await Promise.all([
      exchange(first, authorization),
      exchange(second, authorization),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
  });

  it("rotates refresh tokens and revokes the family when an old token is replayed", async () => {
    const instance = app();
    const connection = await connect(instance);
    const refreshed = await refresh(instance, connection);
    expect(refreshed.status).toBe(200);
    const tokens = JSON.parse(refreshed.text) as OAuthTokens;
    expect(tokens.refresh_token).not.toBe(connection.tokens.refresh_token);
    expect((await mcp(instance, tokens.access_token)).status).toBe(200);
    const currentRefresh = tokens.refresh_token;
    if (!currentRefresh) throw new Error("Missing rotated refresh token.");
    const tampered = currentRefresh.slice(0, -1) + (currentRefresh.endsWith("A") ? "B" : "A");
    for (const invalidToken of [tampered, currentRefresh + "\n"]) {
      expect((await refresh(instance, connection, invalidToken)).status).toBe(400);
      expect((await mcp(instance, tokens.access_token)).status).toBe(200);
    }
    const stranger = await register(instance);
    expect(
      (await refresh(instance, { ...connection, client: stranger }, currentRefresh)).status,
    ).toBe(400);
    expect((await mcp(instance, tokens.access_token)).status).toBe(200);
    expect((await refresh(instance, connection)).status).toBe(400);
    expect((await mcp(instance, tokens.access_token)).status).toBe(401);
  });

  it("allows only the owning client to revoke a connection", async () => {
    const instance = app();
    const connection = await connect(instance);
    const stranger = await register(instance);
    for (const [clientId, expected] of [
      [stranger.client_id, 200],
      [connection.client.client_id, 401],
    ] as const) {
      const revoked = await request(instance).post("/revoke").type("form").send({
        client_id: clientId,
        token: connection.tokens.refresh_token,
      });
      expect(revoked.status).toBe(200);
      expect((await mcp(instance, connection.tokens.access_token)).status).toBe(expected);
    }
  });

  it.each(["read", "read offline_access"])("expires hourly access for %s", async (scopes) => {
    const instance = app();
    const connection = await connect(instance, { scopes });
    const time = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(time + 3601 * 1000);
    expect((await mcp(instance, connection.tokens.access_token)).status).toBe(401);
    if (scopes.includes("offline_access")) {
      expect((await refresh(instance, connection)).status).toBe(200);
    } else {
      expect(connection.tokens.refresh_token).toBeUndefined();
    }
  });

  it.each(["none", "client_secret_post"])(
    "keeps renewable connections across weeks, client age, and restarts until revoked (%s)",
    async (authMethod) => {
      let instance = app();
      const client = await register(instance, authMethod);
      const connection = await connect(instance, { client });
      const started = Date.now();
      const clock = vi.spyOn(Date, "now");
      let tokens = connection.tokens;
      for (const days of [8, 31, 400]) {
        close(instance);
        clock.mockReturnValue(started + days * 24 * 3600 * 1000);
        instance = app();
        const response = await refresh(instance, connection, tokens.refresh_token);
        expect(response.status, response.text).toBe(200);
        tokens = JSON.parse(response.text) as OAuthTokens;
        expect(tokens.expires_in).toBe(3600);
        expect((await mcp(instance, tokens.access_token)).status).toBe(200);
      }
      const revoked = await request(instance).post("/revoke").type("form").send({
        client_id: connection.client.client_id,
        client_secret: connection.client.client_secret,
        token: tokens.refresh_token,
      });
      expect(revoked.status).toBe(200);
      expect((await mcp(instance, tokens.access_token)).status).toBe(401);
      expect((await refresh(instance, connection, tokens.refresh_token)).status).toBe(400);
    },
  );

  it("keeps a client's other connection usable after one connection is revoked", async () => {
    const instance = app();
    const first = await connect(instance);
    const second = await connect(instance, { client: first.client, token: "another-project" });
    await request(instance)
      .post("/revoke")
      .type("form")
      .send({
        client_id: first.client.client_id,
        token: first.tokens.refresh_token,
      })
      .expect(200);
    const time = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(time + 31 * 24 * 3600 * 1000);
    const response = await refresh(instance, second);
    expect(response.status).toBe(200);
    const tokens = JSON.parse(response.text) as OAuthTokens;
    expect((await mcp(instance, tokens.access_token)).status).toBe(200);
    await request(instance)
      .post("/revoke")
      .type("form")
      .send({
        client_id: second.client.client_id,
        token: tokens.refresh_token,
      })
      .expect(200);
    clock.mockReturnValue(time + 62 * 24 * 3600 * 1000);
    const obsoleteClient = await request(instance).get("/authorize").query(second.parameters);
    expect(obsoleteClient.status).toBe(400);
    expect(JSON.parse(obsoleteClient.text)).toMatchObject({ error: "invalid_client" });
  });

  it("fails closed on a wrong database key without destroying existing connections", async () => {
    const first = app();
    const connection = await connect(first);
    close(first);
    const settings = cfg.oauth;
    if (!settings) throw new Error("Missing OAuth settings.");
    expect(() =>
      app({ ...cfg, oauth: { ...settings, encryptionKey: randomBytes(32).toString("hex") } }),
    ).toThrow(/encryption key/);
    expect(() => app({ ...cfg, publicBaseUrl: "https://other.example.test" })).toThrow(
      /public URL/,
    );
    expect((await mcp(app(), connection.tokens.access_token)).status).toBe(200);
  });
});
