import { parseLocale } from "./i18n.js";
import { parseToolsetList, type ToolsetName } from "./tool-policy.js";

export interface Config {
  transport: "http" | "stdio";
  port: number;
  host: string;
  publicBaseUrl: string;
  allowedOrigins: string[];
  apiToken?: string;
  apiBase: string;
  projectUrl: string;
  requestTimeoutMs: number;
  maxResponseBytes: number;
  maxUploadBytes: number;
  maxConcurrentRequests: number;
  maxConcurrentPerToken: number;
  enableLocalUploads: boolean;
  allowedFileRoots: string[];
  logLevel: "debug" | "info" | "warn" | "error";
  readOnly: boolean;
  toolsets: ToolsetName[] | null;
  oauth?: { databasePath: string; encryptionKey: string };
}

function integer(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function origin(value: string): string {
  const parsed = new URL(value);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(`Origin must not contain a path, query or fragment: ${value}`);
  }
  return parsed.origin;
}

function httpUrl(value: string, name: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} must use http or https.`);
  }
  return value.replace(/\/$/, "");
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  parseLocale(env.TELETYPE_MCP_LOCALE);
  const transport = env.TRANSPORT === "stdio" ? "stdio" : "http";
  const publicBaseUrl = env.PUBLIC_BASE_URL || "http://127.0.0.1:4311";
  const configuredOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([origin(publicBaseUrl), ...configuredOrigins.map(origin)])];
  let oauth: Config["oauth"];
  if (env.OAUTH_ENABLED === "true") {
    const issuer = new URL(publicBaseUrl);
    if (
      issuer.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(issuer.hostname)
    ) {
      throw new Error("OAuth requires HTTPS, except on a loopback host.");
    }
    if (issuer.username || issuer.password) {
      throw new Error("OAuth public URL must not contain credentials.");
    }
    const encryptionKey = env.OAUTH_ENCRYPTION_KEY;
    if (!env.OAUTH_DB_PATH || !encryptionKey || !/^[a-f0-9]{64}$/i.test(encryptionKey)) {
      throw new Error("OAuth requires OAUTH_DB_PATH and a 64-character hex OAUTH_ENCRYPTION_KEY.");
    }
    oauth = { databasePath: env.OAUTH_DB_PATH, encryptionKey };
  }
  const projectUrl = env.TELETYPE_PROJECT_URL || "teletype.app";
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(projectUrl)) {
    throw new Error("TELETYPE_PROJECT_URL must be a hostname with an optional port.");
  }

  const cfg: Config = {
    transport,
    port: integer(env.PORT, 4311, "PORT"),
    host: env.HOST || "127.0.0.1",
    publicBaseUrl,
    oauth,
    allowedOrigins,
    apiToken: env.TELETYPE_API_TOKEN?.trim() || undefined,
    apiBase: httpUrl(
      env.TELETYPE_API_BASE || "https://api.teletype.app/public/api/v1",
      "TELETYPE_API_BASE",
    ),
    projectUrl,
    requestTimeoutMs: integer(env.REQUEST_TIMEOUT_MS, 15_000, "REQUEST_TIMEOUT_MS"),
    maxResponseBytes: integer(env.MAX_RESPONSE_BYTES, 5_000_000, "MAX_RESPONSE_BYTES"),
    maxUploadBytes: integer(env.MAX_UPLOAD_BYTES, 20_000_000, "MAX_UPLOAD_BYTES"),
    maxConcurrentRequests: integer(env.MAX_CONCURRENT_REQUESTS, 32, "MAX_CONCURRENT_REQUESTS"),
    maxConcurrentPerToken: integer(env.MAX_CONCURRENT_PER_TOKEN, 4, "MAX_CONCURRENT_PER_TOKEN"),
    enableLocalUploads: env.ENABLE_LOCAL_UPLOADS === "true",
    allowedFileRoots: (env.TELETYPE_ALLOWED_FILE_ROOTS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    logLevel:
      env.LOG_LEVEL === "debug" || env.LOG_LEVEL === "warn" || env.LOG_LEVEL === "error"
        ? env.LOG_LEVEL
        : "info",
    readOnly: env.TELETYPE_MCP_READ_ONLY === "true",
    toolsets: parseToolsetList(env.TELETYPE_MCP_TOOLSETS),
  };

  if (transport === "stdio" && !cfg.apiToken) {
    throw new Error("stdio transport requires TELETYPE_API_TOKEN.");
  }
  if (cfg.enableLocalUploads && cfg.allowedFileRoots.length === 0) {
    throw new Error("ENABLE_LOCAL_UPLOADS requires TELETYPE_ALLOWED_FILE_ROOTS.");
  }
  if (cfg.maxConcurrentPerToken > cfg.maxConcurrentRequests) {
    throw new Error("MAX_CONCURRENT_PER_TOKEN must not exceed MAX_CONCURRENT_REQUESTS.");
  }
  return cfg;
}
