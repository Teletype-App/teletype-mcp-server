import { resolveLogContext } from "./request-context.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const PRIORITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function sanitizeLogValue(val: unknown, key = ""): unknown {
  if (/token|authorization|auth|secret|password|credential|cookie|key/i.test(key)) {
    return "[REDACTED]";
  }
  if (typeof val === "string") {
    return val
      .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [REDACTED]")
      .replace(/([?&](?:token|api[_-]?key|auth|access[_-]?token)=)[^&\s]+/gi, "$1[REDACTED]")
      .replace(/(x-auth-token:\s*)[^\s,;]+/gi, "$1[REDACTED]");
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeLogValue(item, key));
  }
  if (val && typeof val === "object" && !(val instanceof Date) && !(val instanceof RegExp)) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (/token|authorization|auth|content|text|body|password|secret|credential|key/i.test(k)) {
        continue;
      }
      res[k] = sanitizeLogValue(v, k);
    }
    return res;
  }
  return val;
}

export function log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const context = resolveLogContext();
  if (PRIORITY[level] < PRIORITY[context.logLevel]) return;
  const safeFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (/token|authorization|content|text|body|password|secret/i.test(k)) continue;
    safeFields[k] = sanitizeLogValue(v, k);
  }
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: "teletype-mcp-server",
      event,
      request_id: context.requestId,
      ...safeFields,
    }),
  );
}
