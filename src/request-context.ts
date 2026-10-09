import { AsyncLocalStorage } from "node:async_hooks";
import type { ToolPolicy } from "./tool-policy.js";

export interface RequestContext {
  authToken: string;
  allowLocalFiles: boolean;
  allowedFileRoots: string[];
  apiBase: string;
  projectUrl: string;
  requestTimeoutMs: number;
  maxResponseBytes: number;
  maxUploadBytes: number;
  requestId: string;
  logLevel: "debug" | "info" | "warn" | "error";
  signal?: AbortSignal;
  toolPolicy?: ToolPolicy;
}

export function resolveLogContext(): Pick<RequestContext, "requestId" | "logLevel"> {
  const context = requestContext.getStore();
  const configuredLevel = process.env.LOG_LEVEL;
  return {
    requestId: context?.requestId ?? "startup",
    logLevel:
      context?.logLevel ??
      (configuredLevel === "debug" || configuredLevel === "warn" || configuredLevel === "error"
        ? configuredLevel
        : "info"),
  };
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function resolveRequestSignal(): AbortSignal | undefined {
  return requestContext.getStore()?.signal;
}

export function resolveAuthToken(): string {
  const token = requestContext.getStore()?.authToken ?? process.env.TELETYPE_API_TOKEN;
  if (!token?.trim()) {
    throw new Error("Teletype API token is not configured.");
  }
  return token.trim();
}

export function canReadLocalFiles(): boolean {
  return requestContext.getStore()?.allowLocalFiles ?? process.env.ENABLE_LOCAL_UPLOADS === "true";
}

export function resolveAllowedFileRoots(): string[] {
  return (
    requestContext.getStore()?.allowedFileRoots ??
    (process.env.TELETYPE_ALLOWED_FILE_ROOTS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function resolveApiBase(): string {
  return (
    requestContext.getStore()?.apiBase ??
    (process.env.TELETYPE_API_BASE || "https://api.teletype.app/public/api/v1").replace(/\/$/, "")
  );
}

export function resolveProjectUrl(): string {
  return (
    requestContext.getStore()?.projectUrl ?? process.env.TELETYPE_PROJECT_URL ?? "teletype.app"
  );
}

export function resolveRequestLimits(): {
  timeoutMs: number;
  maxResponseBytes: number;
  maxUploadBytes: number;
} {
  const context = requestContext.getStore();
  return {
    timeoutMs: context?.requestTimeoutMs ?? (Number(process.env.REQUEST_TIMEOUT_MS) || 15_000),
    maxResponseBytes:
      context?.maxResponseBytes ?? (Number(process.env.MAX_RESPONSE_BYTES) || 5_000_000),
    maxUploadBytes: context?.maxUploadBytes ?? (Number(process.env.MAX_UPLOAD_BYTES) || 20_000_000),
  };
}
