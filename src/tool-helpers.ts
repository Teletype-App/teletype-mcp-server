import { t } from "./i18n.js";
import { resolveProjectUrl } from "./request-context.js";
import type { ToolResult } from "./types.js";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function textArg(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function jsonResult(data: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

// The admin panel prefers the latest session ID; older responses expose an external appeal ID.
export function getAppealId(d: {
  lastSessionId?: string;
  appealExternalId?: string | number;
  id?: string;
}): string | undefined {
  if (d.lastSessionId) return d.lastSessionId;
  if (
    d.appealExternalId !== undefined &&
    d.appealExternalId !== null &&
    d.appealExternalId !== ""
  ) {
    return String(d.appealExternalId);
  }
  return d.id;
}

export function buildDialogUrl(
  domain: string | undefined,
  appealId: string | undefined,
): string | undefined {
  if (!domain || !appealId) return undefined;
  return `https://${domain}.${resolveProjectUrl()}/conversations/all/all?appealId=${encodeURIComponent(appealId)}`;
}

export function buildMessageUrl(
  domain: string | undefined,
  appealId: string | undefined,
  position: number | undefined,
): string | undefined {
  const base = buildDialogUrl(domain, appealId);
  if (!base) return undefined;
  if (position === undefined || position === null) return base;
  return `${base}&position=${encodeURIComponent(String(position))}`;
}

export function errorResult(message: string, hint?: string): ToolResult {
  const text = hint ? t("helpers.errorResult.hint", { message: message, hint: hint }) : message;
  return {
    content: [{ type: "text", text }],
    structuredContent: { error: message, hint: hint || null },
    isError: true,
  };
}
