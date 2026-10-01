import { t } from "./i18n.js";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { basename, extname, isAbsolute, relative } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import {
  canReadLocalFiles,
  resolveAllowedFileRoots,
  resolveApiBase,
  resolveAuthToken,
  resolveRequestLimits,
  resolveRequestSignal,
} from "./request-context.js";

const apiEnvelopeSchema = z.looseObject({ success: z.boolean() });

function parseApiEnvelope(text: string): z.infer<typeof apiEnvelopeSchema> {
  return apiEnvelopeSchema.parse(JSON.parse(text) as unknown);
}

async function readApiEnvelope(
  response: Response,
  operation: "request" | "upload",
): Promise<z.infer<typeof apiEnvelopeSchema>> {
  const text = await readBoundedResponse(response);
  try {
    return parseApiEnvelope(text);
  } catch {
    const action = operation === "upload" ? t("api.readApiEnvelope.duringFileUpload") : "";
    throw new TeletypeApiError(
      t("api.readApiEnvelope.teletypeReturnedInvalidJSONHTTP", {
        action: action,
        status: response.status,
      }),
      response.status >= 500,
      response.status,
    );
  }
}

function apiErrorMessages(errors: unknown): string {
  if (!Array.isArray(errors)) return "";
  return errors
    .map((error: unknown) => {
      if (typeof error === "string") return error;
      if (error && typeof error === "object" && "message" in error) {
        const message = error.message;
        if (typeof message === "string") return message;
      }
      return JSON.stringify(error);
    })
    .filter(Boolean)
    .join("; ");
}

async function readBoundedResponse(response: Response): Promise<string> {
  const { maxResponseBytes } = resolveRequestLimits();
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxResponseBytes) {
    throw new TeletypeApiError(t("api.readBoundedResponse.teletypeAPIResponseExceedsAllowed"));
  }
  if (!response.body) return "";

  const reader = response.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxResponseBytes) {
      await reader.cancel();
      throw new TeletypeApiError(t("api.readBoundedResponse.teletypeAPIResponseExceedsAllowed"));
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export class TeletypeApiError extends Error {
  constructor(
    public llmMessage: string,
    public retryable = false,
    public readonly status?: number,
  ) {
    super(llmMessage);
  }
}

type HttpMethod = "GET" | "POST";

interface RequestOptions<T> {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | string[] | undefined | null>;
  body?: Record<string, unknown>;
  bodyType?: "form" | "json";
  decode?: (value: unknown) => T;
}

const projectRateLimitQueues = new Map<string, Promise<void>>();
const projectRateLimitLastRequest = new Map<string, number>();

async function waitForSharedProjectRateLimit(path: string): Promise<void> {
  if (path !== "/project/balance" && path !== "/project/operators") return;
  const key = createHash("sha256").update(resolveAuthToken()).digest("hex");
  const previous = projectRateLimitQueues.get(key) ?? Promise.resolve();
  let release = (): void => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  projectRateLimitQueues.set(key, queued);
  const signal = resolveRequestSignal();
  try {
    await waitOrAbort(previous, signal);
    signal?.throwIfAborted();
    const delay = Math.max(0, 2_000 - (Date.now() - (projectRateLimitLastRequest.get(key) || 0)));
    if (delay > 0) await sleep(delay, undefined, { signal });
    projectRateLimitLastRequest.set(key, Date.now());
  } finally {
    release();
    const cleanup = setTimeout(() => {
      if (projectRateLimitQueues.get(key) === queued) {
        projectRateLimitQueues.delete(key);
        projectRateLimitLastRequest.delete(key);
      }
    }, 10_000);
    cleanup.unref();
  }
}

function waitOrAbort<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new Error(t("api.waitOrAbort.requestCancelled")),
      );
    };
    signal.addEventListener("abort", onAbort, { once: true });
    void promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

function requestTimeoutSignal(): AbortSignal {
  const timeout = AbortSignal.timeout(resolveRequestLimits().timeoutMs);
  const cancelled = resolveRequestSignal();
  return cancelled ? AbortSignal.any([timeout, cancelled]) : timeout;
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds >= 0) return Math.min(seconds, 300);
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    const diffSec = Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
    return Math.min(diffSec, 300);
  }
  return undefined;
}

// Transient GET failures (5xx, network drops) back off quickly: 500ms, then 1s, capped at 3s.
// An explicit Retry-After header from the server wins over the default curve.
function transientBackoffMs(retryAfterSeconds: number | undefined, attempt: number): number {
  return Math.min((retryAfterSeconds ?? 0.5 * Math.pow(2, attempt)) * 1000, 3000);
}

function formValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

export async function teletypeRequest<T = unknown>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const { method = "GET", query, body, bodyType = "form" } = options;

  const url = new URL(`${resolveApiBase()}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(`${k}[]`, item);
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const authToken = resolveAuthToken();
  const headers: Record<string, string> = {
    "X-Auth-Token": authToken,
    Accept: "application/json",
    "Cache-Control": "no-cache",
  };

  let bodyPayload: string | undefined;
  if (body) {
    if (bodyType === "json") {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(body);
    } else {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(body)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          const keyName = k.endsWith("[]") ? k : `${k}[]`;
          for (const item of v) {
            params.append(keyName, String(item));
          }
        } else {
          params.append(k, formValue(v));
        }
      }
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      bodyPayload = params.toString();
    }
  }

  const maxRetries = method === "GET" ? 2 : 0;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let response: Response;
    let sent = false;
    try {
      await waitForSharedProjectRateLimit(path);
      sent = true;
      response = await fetch(url.toString(), {
        method,
        headers,
        body: bodyPayload,
        signal: requestTimeoutSignal(),
      });
    } catch (e: unknown) {
      if (resolveRequestSignal()?.aborted) {
        throw new TeletypeApiError(
          sent && method === "POST"
            ? t("api.teletypeRequest.requestWasCancelledWriteBegan")
            : t("api.waitOrAbort.requestCancelled"),
          false,
        );
      }
      // A dropped connection is worth one more attempt on reads. Writes never retry:
      // the request may already have taken effect on the server.
      if (method === "GET" && attempt < maxRetries) {
        await sleep(transientBackoffMs(undefined, attempt), undefined, {
          signal: resolveRequestSignal(),
        });
        continue;
      }
      const msg = e instanceof Error ? e.message : t("api.teletypeRequest.unknownNetworkError");
      throw new TeletypeApiError(
        method === "GET"
          ? t("api.teletypeRequest.networkErrorWhenRequestingTeletype", { path: path, msg: msg })
          : t("api.teletypeRequest.communicationTeletypeWasInterruptedWhile", { path: path }),
        method === "GET",
      );
    }

    if (response.status === 401) {
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeAPIUnauthorizedHTTP401", { path: path }),
        false,
        response.status,
      );
    }
    if (response.status === 403) {
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeAPIForbiddenHTTP403", { path: path }),
        false,
        response.status,
      );
    }
    if (response.status === 404) {
      throw new TeletypeApiError(
        t("api.teletypeRequest.resourceNotFoundTeletypeHTTP", { path: path }),
        false,
        response.status,
      );
    }

    const isHttp429 = response.status === 429;
    const retryAfterHeader = parseRetryAfter(response.headers.get("retry-after"));

    if (isHttp429) {
      if (attempt < maxRetries) {
        const delayMs = Math.min((retryAfterHeader ?? Math.pow(2, attempt)) * 1000, 3000);
        await sleep(delayMs, undefined, { signal: resolveRequestSignal() });
        continue;
      }
      const waitSec = retryAfterHeader ?? 60;
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeRateLimitReachedHTTP", { waitSec: waitSec }),
        true,
        response.status,
      );
    }

    if (response.status >= 500) {
      if (attempt < maxRetries) {
        await sleep(transientBackoffMs(retryAfterHeader, attempt), undefined, {
          signal: resolveRequestSignal(),
        });
        continue;
      }
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeServerInternalErrorHTTP", { status: response.status }),
        true,
        response.status,
      );
    }

    const json = await readApiEnvelope(response, "request");

    if (!json.success) {
      const rawErrors = json.errors;
      const isRateLimitPayload =
        json.errorType === "TooManyRequestsException" ||
        json.errorsType === "TooManyRequestsException" ||
        (Array.isArray(rawErrors) &&
          rawErrors.some(
            (e: unknown) =>
              (e as { code?: number })?.code === 429 ||
              (typeof e === "string" && e.toLowerCase().includes("rate limit")),
          ));

      if (isRateLimitPayload) {
        if (attempt < maxRetries) {
          const delayMs = Math.min((retryAfterHeader ?? Math.pow(2, attempt)) * 1000, 3000);
          await sleep(delayMs, undefined, { signal: resolveRequestSignal() });
          continue;
        }
        const waitSec = retryAfterHeader ?? 60;
        throw new TeletypeApiError(
          t("api.teletypeRequest.teletypeRateLimitReachedTooManyRequestsException", {
            waitSec: waitSec,
          }),
          true,
          response.status,
        );
      }

      let messages = apiErrorMessages(rawErrors);
      if (!messages && typeof json.message === "string") messages = json.message;
      if (!messages && typeof json.error === "string") messages = json.error;
      const details = messages || t("api.teletypeRequest.noDescription");
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeAPIReturnedErrorCheck", { details: details }),
        false,
      );
    }

    if (options.decode) {
      try {
        return options.decode(json.data);
      } catch {
        throw new TeletypeApiError(
          t("api.teletypeRequest.teletypeAPIReturnedUnexpectedData", { path: path }),
        );
      }
    }
    return json.data as T;
  }

  throw new TeletypeApiError(t("api.teletypeRequest.requestFailedRepeatedAttempts"), true);
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".json": "application/json",
  ".xml": "application/xml",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
};

function guessMimeType(filename: string): string {
  return MIME_BY_EXT[extname(filename).toLowerCase()] || "application/octet-stream";
}

interface UploadOptions<T> {
  fields?: Record<string, string | number | boolean | undefined | null>;
  filePath: string;
  fileFieldName?: string;
  decode?: (value: unknown) => T;
}

export async function teletypeUploadRequest<T = unknown>(
  path: string,
  options: UploadOptions<T>,
): Promise<T> {
  const { fields = {}, filePath, fileFieldName = "file" } = options;

  if (!canReadLocalFiles()) {
    throw new TeletypeApiError(t("api.teletypeUploadRequest.attachmentPathIsDisabledUse"), false);
  }

  const canonicalPath = await realpath(filePath).catch(() => undefined);
  const canonicalRoots = await Promise.all(
    resolveAllowedFileRoots().map((root) => realpath(root).catch(() => undefined)),
  );
  const isAllowedPath = (path: string) =>
    canonicalRoots.some((root) => {
      if (!root) return false;
      const pathFromRoot = relative(root, path);
      return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
    });
  if (!canonicalPath || !isAllowedPath(canonicalPath)) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.fileIsOutsideTELETYPEALLOWED", { filePath: filePath }),
      false,
    );
  }

  const { maxUploadBytes } = resolveRequestLimits();
  const fileHandle = await open(
    canonicalPath,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0),
  ).catch(() => undefined);
  if (!fileHandle) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.fileWasNotFoundOr", { filePath: filePath }),
      false,
    );
  }
  let fileBuffer: Buffer;
  try {
    if (process.platform === "linux") {
      const openedPath = await realpath(`/proc/self/fd/${fileHandle.fd}`).catch(() => undefined);
      if (!openedPath || !isAllowedPath(openedPath)) {
        throw new TeletypeApiError(
          t("api.teletypeUploadRequest.fileIsOutsideTELETYPEALLOWED", { filePath: filePath }),
          false,
        );
      }
    }
    const fileStats = await fileHandle.stat();
    if (!fileStats.isFile()) {
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.fileWasNotFoundOr", { filePath: filePath }),
        false,
      );
    }
    if (fileStats.size > maxUploadBytes) {
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.fileExceedsLocalLimitBytes", {
          maxUploadBytes: maxUploadBytes,
        }),
        false,
      );
    }
    try {
      fileBuffer = await fileHandle.readFile({ signal: resolveRequestSignal() });
    } catch (e: unknown) {
      if (resolveRequestSignal()?.aborted) throw e;
      const msg = e instanceof Error ? e.message : t("api.teletypeUploadRequest.readingError");
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.couldNotReadFileCheck", { filePath: filePath, msg: msg }),
        false,
      );
    }
    if (fileBuffer.length > maxUploadBytes) {
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.fileExceedsLocalLimitBytes", {
          maxUploadBytes: maxUploadBytes,
        }),
        false,
      );
    }
  } finally {
    await fileHandle.close();
  }

  const filename = basename(canonicalPath);
  const mimeType = guessMimeType(filename);

  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    formData.append(k, String(v));
  }
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  formData.append(fileFieldName, blob, filename);

  const authToken = resolveAuthToken();
  const headers: Record<string, string> = {
    "X-Auth-Token": authToken,
    Accept: "application/json, text/plain, */*",
    "Cache-Control": "no-cache",
    // fetch must add Content-Type so the header includes the generated multipart boundary.
  };

  const url = new URL(`${resolveApiBase()}${path}`);
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: formData,
      signal: requestTimeoutSignal(),
    });
  } catch (e: unknown) {
    if (resolveRequestSignal()?.aborted) {
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.uploadCancelledTransferBeganOutcome"),
        false,
      );
    }
    const msg = e instanceof Error ? e.message : t("api.teletypeRequest.unknownNetworkError");
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.connectionTeletypeFailedDuringFile", { path: path, msg: msg }),
      false,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.accessTeletypeAPIIsDenied", { status: response.status }),
      false,
      response.status,
    );
  }
  if (response.status === 404) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.endpointNotFoundHTTP404", { path: path }),
      false,
      response.status,
    );
  }
  if (response.status === 413) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.fileIsTooLargeChannel", { filename: filename }),
      false,
      response.status,
    );
  }
  if (response.status === 415) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.fileTypeIsNotSupported", { mimeType: mimeType }),
      false,
      response.status,
    );
  }
  if (response.status === 429) {
    const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
    const waitSec = retryAfter ?? 60;
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.requestLimitTeletypeHTTP429", { waitSec: waitSec }),
      true,
      response.status,
    );
  }
  if (response.status >= 500) {
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.teletypeServerErrorDuringFile", { status: response.status }),
      true,
      response.status,
    );
  }

  const json = await readApiEnvelope(response, "upload");

  if (!json.success) {
    const rawErrors = json.errors;
    const isRateLimitPayload =
      json.errorType === "TooManyRequestsException" ||
      json.errorsType === "TooManyRequestsException" ||
      (Array.isArray(rawErrors) &&
        rawErrors.some((e: unknown) => (e as { code?: number })?.code === 429));
    if (isRateLimitPayload) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
      const waitSec = retryAfter ?? 60;
      throw new TeletypeApiError(
        t("api.teletypeUploadRequest.teletypeRateLimitReachedDuring", { waitSec: waitSec }),
        true,
      );
    }
    const messages = apiErrorMessages(rawErrors) || t("api.teletypeRequest.noDescription");
    throw new TeletypeApiError(
      t("api.teletypeUploadRequest.teletypeAPIReturnedErrorWhile", {
        filename: filename,
        messages: messages,
      }),
      false,
    );
  }

  if (options.decode) {
    try {
      return options.decode(json.data);
    } catch {
      throw new TeletypeApiError(
        t("api.teletypeRequest.teletypeAPIReturnedUnexpectedData", { path: path }),
      );
    }
  }
  return json.data as T;
}
