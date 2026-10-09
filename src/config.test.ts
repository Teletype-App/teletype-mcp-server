import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("binds HTTP to loopback and derives an allowed origin by default", () => {
    const config = loadConfig({});
    expect(config.host).toBe("127.0.0.1");
    expect(config.allowedOrigins).toEqual(["http://127.0.0.1:4311"]);
  });

  it("requires an API token for stdio", () => {
    expect(() => loadConfig({ TRANSPORT: "stdio" })).toThrow(/TELETYPE_API_TOKEN/);
  });

  it("rejects malformed numeric limits", () => {
    expect(() => loadConfig({ PORT: "all" })).toThrow(/PORT/);
  });

  it("rejects unsafe API protocols and malformed project hosts", () => {
    expect(() => loadConfig({ TELETYPE_API_BASE: "file:///tmp/api" })).toThrow(/http or https/);
    expect(() => loadConfig({ TELETYPE_PROJECT_URL: "https://teletype.app/path" })).toThrow(
      /hostname/,
    );
  });

  it("requires an allowlist when local uploads are enabled", () => {
    expect(() =>
      loadConfig({
        TRANSPORT: "stdio",
        TELETYPE_API_TOKEN: "token",
        ENABLE_LOCAL_UPLOADS: "true",
      }),
    ).toThrow(/TELETYPE_ALLOWED_FILE_ROOTS/);
  });

  it("requires the per-token concurrency limit not to exceed the global limit", () => {
    expect(() =>
      loadConfig({ MAX_CONCURRENT_REQUESTS: "2", MAX_CONCURRENT_PER_TOKEN: "3" }),
    ).toThrow(/MAX_CONCURRENT_PER_TOKEN/);
  });

  it("rejects unsupported MCP locales", () => {
    expect(() => loadConfig({ TELETYPE_MCP_LOCALE: "de" })).toThrow(/TELETYPE_MCP_LOCALE/);
  });

  it("parses read-only mode and toolsets from env", () => {
    const defaults = loadConfig({});
    expect(defaults.readOnly).toBe(false);
    expect(defaults.toolsets).toBeNull();

    const filtered = loadConfig({
      TELETYPE_MCP_READ_ONLY: "true",
      TELETYPE_MCP_TOOLSETS: "conversations, admin",
    });
    expect(filtered.readOnly).toBe(true);
    expect(filtered.toolsets).toEqual(["conversations", "admin"]);
  });

  it("rejects unknown toolset names at startup", () => {
    expect(() => loadConfig({ TELETYPE_MCP_TOOLSETS: "marketing" })).toThrow(
      /Unknown toolset 'marketing'/,
    );
  });

  it("keeps OAuth opt-in and requires a database and encryption key", () => {
    expect(loadConfig({}).oauth).toBeUndefined();
    expect(() => loadConfig({ OAUTH_ENABLED: "true" })).toThrow(/OAUTH_DB_PATH/);
    expect(() =>
      loadConfig({
        OAUTH_ENABLED: "true",
        OAUTH_DB_PATH: "/tmp/oauth.sqlite",
        OAUTH_ENCRYPTION_KEY: "short",
      }),
    ).toThrow(/OAUTH_ENCRYPTION_KEY/);
  });

  it("requires HTTPS for browser OAuth outside loopback", () => {
    expect(() =>
      loadConfig({
        OAUTH_ENABLED: "true",
        OAUTH_DB_PATH: "/tmp/oauth.sqlite",
        OAUTH_ENCRYPTION_KEY: "a".repeat(64),
        PUBLIC_BASE_URL: "http://mcp.example.test",
      }),
    ).toThrow(/HTTPS/);
  });
});
