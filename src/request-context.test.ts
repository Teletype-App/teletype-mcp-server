import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canReadLocalFiles,
  requestContext,
  resolveAllowedFileRoots,
  resolveApiBase,
  resolveAuthToken,
  resolveLogContext,
  resolveProjectUrl,
  resolveRequestLimits,
  resolveRequestSignal,
  type RequestContext,
} from "./request-context.js";

const context: RequestContext = {
  authToken: " tenant-token ",
  allowLocalFiles: false,
  allowedFileRoots: ["/safe/uploads"],
  apiBase: "https://tenant.example/api",
  projectUrl: "tenant.example",
  requestTimeoutMs: 321,
  maxResponseBytes: 1_234,
  maxUploadBytes: 5_678,
  requestId: "request-tenant",
  logLevel: "debug",
};

describe("request context", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses safe defaults when no request or environment configuration is present", () => {
    for (const key of [
      "LOG_LEVEL",
      "TELETYPE_API_TOKEN",
      "ENABLE_LOCAL_UPLOADS",
      "TELETYPE_ALLOWED_FILE_ROOTS",
      "TELETYPE_API_BASE",
      "TELETYPE_PROJECT_URL",
      "REQUEST_TIMEOUT_MS",
      "MAX_RESPONSE_BYTES",
      "MAX_UPLOAD_BYTES",
    ]) {
      vi.stubEnv(key, undefined);
    }

    expect(resolveLogContext()).toEqual({ requestId: "startup", logLevel: "info" });
    expect(() => resolveAuthToken()).toThrow("Teletype API token is not configured.");
    expect(canReadLocalFiles()).toBe(false);
    expect(resolveAllowedFileRoots()).toEqual([]);
    expect(resolveApiBase()).toBe("https://api.teletype.app/public/api/v1");
    expect(resolveProjectUrl()).toBe("teletype.app");
    expect(resolveRequestLimits()).toEqual({
      timeoutMs: 15_000,
      maxResponseBytes: 5_000_000,
      maxUploadBytes: 20_000_000,
    });
  });

  it("normalizes environment values outside a request", () => {
    vi.stubEnv("LOG_LEVEL", "warn");
    vi.stubEnv("TELETYPE_API_TOKEN", "  env-token  ");
    vi.stubEnv("ENABLE_LOCAL_UPLOADS", "true");
    vi.stubEnv("TELETYPE_ALLOWED_FILE_ROOTS", " /first, ,/second ");
    vi.stubEnv("TELETYPE_API_BASE", "https://api.example/v1/");
    vi.stubEnv("TELETYPE_PROJECT_URL", "project.example");
    vi.stubEnv("REQUEST_TIMEOUT_MS", "111");
    vi.stubEnv("MAX_RESPONSE_BYTES", "222");
    vi.stubEnv("MAX_UPLOAD_BYTES", "333");

    expect(resolveLogContext()).toEqual({ requestId: "startup", logLevel: "warn" });
    expect(resolveAuthToken()).toBe("env-token");
    expect(canReadLocalFiles()).toBe(true);
    expect(resolveAllowedFileRoots()).toEqual(["/first", "/second"]);
    expect(resolveApiBase()).toBe("https://api.example/v1");
    expect(resolveProjectUrl()).toBe("project.example");
    expect(resolveRequestLimits()).toEqual({
      timeoutMs: 111,
      maxResponseBytes: 222,
      maxUploadBytes: 333,
    });
  });

  it("rejects a blank token and only enables local files for the exact true value", () => {
    vi.stubEnv("TELETYPE_API_TOKEN", "   ");
    vi.stubEnv("ENABLE_LOCAL_UPLOADS", "TRUE");
    vi.stubEnv("LOG_LEVEL", "trace");

    expect(() => resolveAuthToken()).toThrow("Teletype API token is not configured.");
    expect(canReadLocalFiles()).toBe(false);
    expect(resolveLogContext().logLevel).toBe("info");
  });

  it.each(["debug", "warn", "error"] as const)("accepts the %s environment log level", (level) => {
    vi.stubEnv("LOG_LEVEL", level);
    expect(resolveLogContext().logLevel).toBe(level);
  });

  it("uses request values before environment values, including false upload access", () => {
    vi.stubEnv("TELETYPE_API_TOKEN", "env-token");
    vi.stubEnv("ENABLE_LOCAL_UPLOADS", "true");
    vi.stubEnv("LOG_LEVEL", "error");
    vi.stubEnv("REQUEST_TIMEOUT_MS", "999");

    requestContext.run(context, () => {
      expect(resolveAuthToken()).toBe("tenant-token");
      expect(canReadLocalFiles()).toBe(false);
      expect(resolveAllowedFileRoots()).toEqual(["/safe/uploads"]);
      expect(resolveApiBase()).toBe("https://tenant.example/api");
      expect(resolveProjectUrl()).toBe("tenant.example");
      expect(resolveLogContext()).toEqual({ requestId: "request-tenant", logLevel: "debug" });
      expect(resolveRequestLimits()).toEqual({
        timeoutMs: 321,
        maxResponseBytes: 1_234,
        maxUploadBytes: 5_678,
      });
    });
    expect(resolveAuthToken()).toBe("env-token");
  });

  it("exposes the abort signal only within its request context", () => {
    const signal = new AbortController().signal;

    expect(resolveRequestSignal()).toBeUndefined();
    requestContext.run({ ...context, signal }, () => {
      expect(resolveRequestSignal()).toBe(signal);
    });
    expect(resolveRequestSignal()).toBeUndefined();
  });

  it("keeps concurrent asynchronous requests isolated", async () => {
    const requests = ["alpha", "beta"].map((name, index) =>
      requestContext.run(
        {
          ...context,
          authToken: `${name}-token`,
          requestId: name,
          allowedFileRoots: [`/${name}`],
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, index === 0 ? 10 : 1));
          return {
            token: resolveAuthToken(),
            log: resolveLogContext(),
            roots: resolveAllowedFileRoots(),
          };
        },
      ),
    );

    expect(await Promise.all(requests)).toEqual([
      { token: "alpha-token", log: { requestId: "alpha", logLevel: "debug" }, roots: ["/alpha"] },
      { token: "beta-token", log: { requestId: "beta", logLevel: "debug" }, roots: ["/beta"] },
    ]);
  });
});
