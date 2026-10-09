import { createHash, randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import type { Config } from "./config.js";
import { requestContext } from "./request-context.js";
import { buildServer } from "./server.js";
import { log } from "./log.js";
import { RequestLimiter } from "./request-limiter.js";
import { SERVER_VERSION } from "./version.js";
import { mountProjectOAuth } from "./oauth.js";
import { landingPage } from "./landing-page.js";

const API_TOKEN_HEADER = "x-teletype-api-token";

export function createHttpApp(cfg: Config): express.Express {
  const app = express();
  const limiter = new RequestLimiter(cfg.maxConcurrentRequests, cfg.maxConcurrentPerToken);
  const nodeMcpHandler = toNodeHandler(
    createMcpHandler(() => buildServer(), {
      legacy: "stateless",
      responseMode: "json",
    }),
    {
      onerror: (error) => {
        log("error", "mcp_adapter_failed", { error: error.message });
      },
    },
  );
  app.disable("x-powered-by");
  app.use(
    "/assets",
    express.static(fileURLToPath(new URL("../plugin/assets/", import.meta.url)), {
      dotfiles: "deny",
      index: false,
      redirect: false,
      maxAge: "1d",
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    }),
  );
  app.get("/", (req, res) => {
    const savedLocale = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("teletype_oauth_locale="))
      ?.slice("teletype_oauth_locale=".length);
    const locale =
      savedLocale === "ru" || savedLocale === "en"
        ? savedLocale
        : req.acceptsLanguages("en", "ru") === "ru"
          ? "ru"
          : "en";
    res
      .set({
        "Cache-Control": "no-store",
        "Content-Language": locale,
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      })
      .type("html")
      .send(landingPage(cfg.publicBaseUrl, locale));
  });
  app.use(express.json({ limit: "1mb", strict: true }));
  const oauth = mountProjectOAuth(app, cfg);

  app.get(["/healthz", "/health", "/live"], (_req, res) => {
    res.json({ ok: true, service: "teletype-mcp-server", version: SERVER_VERSION });
  });

  app.all("/mcp", (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && !cfg.allowedOrigins.includes(normalizeOrigin(requestOrigin))) {
      res.status(403).json({ error: "origin_not_allowed" });
      return;
    }
    if (req.method !== "POST") {
      res.set("Allow", "POST").status(405).json({ error: "method_not_allowed" });
      return;
    }
    next();
  });

  const handleMcpRequest = async (req: Request, res: Response): Promise<void> => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    res.set("X-Request-Id", requestId);
    let token = String(req.headers[API_TOKEN_HEADER] ?? "").trim();
    let oauthReadOnly: boolean | undefined;
    const challenge = () => {
      if (oauth)
        res.set(
          "WWW-Authenticate",
          `Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource/mcp", cfg.publicBaseUrl).href}"`,
        );
    };
    if (oauth && req.headers.authorization) {
      if (token) {
        res.status(400).json({ error: "multiple_authentication_methods" });
        return;
      }
      try {
        const bearer = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(req.headers.authorization)?.[1];
        if (!bearer) throw new Error("Invalid bearer token.");
        const info = await oauth.verifyAccessToken(bearer);
        if (typeof info.extra?.apiToken !== "string")
          throw new Error("Missing project credential.");
        token = info.extra.apiToken;
        oauthReadOnly = !info.scopes.includes("write");
      } catch {
        challenge();
        res.status(401).json({ error: "invalid_oauth_token" });
        return;
      }
    }
    if (!token) {
      challenge();
      res.status(401).json({
        error: "teletype_api_token_required",
        message: `Pass the Public API token in ${API_TOKEN_HEADER}.`,
      });
      return;
    }

    const limiterKey = createHash("sha256").update(token).digest("hex");
    const release = limiter.acquire(limiterKey);
    if (!release) {
      res.set("Retry-After", "1").status(429).json({ error: "too_many_concurrent_requests" });
      return;
    }

    try {
      await requestContext.run(
        {
          authToken: token,
          allowLocalFiles: false,
          allowedFileRoots: [],
          apiBase: cfg.apiBase,
          projectUrl: cfg.projectUrl,
          requestTimeoutMs: cfg.requestTimeoutMs,
          maxResponseBytes: cfg.maxResponseBytes,
          maxUploadBytes: cfg.maxUploadBytes,
          requestId,
          logLevel: cfg.logLevel,
          toolPolicy: {
            readOnly: cfg.readOnly || oauthReadOnly === true,
            toolsets: cfg.toolsets,
          },
        },
        () => nodeMcpHandler(req, res, req.body),
      );
    } catch (error) {
      log("error", "mcp_request_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) res.status(500).json({ error: "mcp_handler_failed" });
    } finally {
      release();
      const body: unknown = req.body;
      const requestMethod =
        body && typeof body === "object" && "method" in body ? body.method : undefined;
      log("info", "mcp_request_completed", {
        method: requestMethod,
        status: res.statusCode,
        duration_ms: Math.round(performance.now() - startedAt),
      });
    }
  };
  app.post("/mcp", (req: Request, res: Response) => {
    void handleMcpRequest(req, res).catch((error: unknown) => {
      log("error", "mcp_request_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) res.status(500).json({ error: "mcp_handler_failed" });
    });
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const status = (error as { status?: number }).status === 413 ? 413 : 400;
    res.status(status).json({ error: status === 413 ? "payload_too_large" : "invalid_json" });
  });
  return app;
}

export async function startHttpServer(cfg: Config): Promise<HttpServer> {
  const app = createHttpApp(cfg);
  const listener = await new Promise<HttpServer>((resolve, reject) => {
    const server = app.listen(cfg.port, cfg.host, (error?: Error) => {
      if (error) reject(error);
      else resolve(server);
    });
    server.once("close", () => app.emit("close"));
    server.once("error", reject);
  }).catch((error: unknown) => {
    app.emit("close");
    throw error;
  });
  log("info", "http_server_started", { host: cfg.host, port: cfg.port });
  return listener;
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}
