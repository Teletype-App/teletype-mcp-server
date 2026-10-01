import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requestContext, type RequestContext } from "./request-context.js";
import { decodeIdPage } from "./api-contract.js";
import { teletypeRequest, teletypeUploadRequest } from "./teletype-api.js";

// Retry backoff sleeps are replaced with immediate resolution: vitest fake
// timers cannot intercept the Node timers/promises binding.
vi.mock("node:timers/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:timers/promises")>();
  const setTimeout = ((_delay: number, value?: unknown) =>
    Promise.resolve(value)) as unknown as typeof actual.setTimeout;
  return { ...actual, setTimeout };
});

const context: RequestContext = {
  authToken: "test-token",
  allowLocalFiles: false,
  allowedFileRoots: [],
  apiBase: "https://example.test/api",
  projectUrl: "teletype.app",
  requestTimeoutMs: 1000,
  maxResponseBytes: 1000,
  maxUploadBytes: 1000,
  requestId: "api-contract-test",
  logLevel: "error",
};

afterEach(() => vi.unstubAllGlobals());

describe("Teletype API response boundary", () => {
  it("uploads allowed files but rejects symlinks outside the allowed root before contacting the API", async () => {
    const directory = await mkdtemp(join(tmpdir(), "teletype-upload-"));
    try {
      const allowedRoot = join(directory, "allowed");
      await mkdir(allowedRoot);
      const allowedFile = join(allowedRoot, "receipt.txt");
      const outsideFile = join(directory, "private.txt");
      const escapedLink = join(allowedRoot, "private-link.txt");
      await writeFile(allowedFile, "receipt");
      await writeFile(outsideFile, "private");
      await symlink(outsideFile, escapedLink);

      const fetchMock = vi.fn((_url: string, init: RequestInit) => {
        expect(init.method).toBe("POST");
        expect((init.headers as Record<string, string>)["X-Auth-Token"]).toBe("test-token");
        expect(init.body).toBeInstanceOf(FormData);
        expect((init.body as FormData).get("file")).toBeInstanceOf(Blob);
        return Promise.resolve(Response.json({ success: true, data: { id: "uploaded" } }));
      });
      vi.stubGlobal("fetch", fetchMock);
      const uploadContext = { ...context, allowLocalFiles: true, allowedFileRoots: [allowedRoot] };

      await expect(
        requestContext.run(uploadContext, () =>
          teletypeUploadRequest("/upload", { filePath: allowedFile }),
        ),
      ).resolves.toEqual({ id: "uploaded" });
      expect(fetchMock).toHaveBeenCalledOnce();

      await expect(
        requestContext.run(uploadContext, () =>
          teletypeUploadRequest("/upload", { filePath: escapedLink }),
        ),
      ).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("returns data from a valid success envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: true, data: { id: "42" } })),
    );

    const data = await requestContext.run(context, () => teletypeRequest<{ id: string }>("/test"));

    expect(data).toEqual({ id: "42" });
  });

  it("rejects JSON without a boolean success field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: "true", data: {} })));

    await expect(requestContext.run(context, () => teletypeRequest("/test"))).rejects.toThrow(
      /invalid JSON/,
    );
  });

  it("reports an oversized response as a size error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ success: true, data: {} }, { headers: { "content-length": "2000" } }),
        ),
    );

    await expect(requestContext.run(context, () => teletypeRequest("/test"))).rejects.toThrow(
      /exceeds the allowed size/,
    );
  });

  it("rejects malformed paged data before a tool can read it", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ success: true, data: { items: [{ name: "No ID" }] } })),
    );

    await expect(
      requestContext.run(context, () => teletypeRequest("/test", { decode: decodeIdPage })),
    ).rejects.toThrow(/unexpected data format/);
  });

  it("reports string errors without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: false, errors: ["bad request"] })),
    );

    await expect(requestContext.run(context, () => teletypeRequest("/test"))).rejects.toThrow(
      /bad request/,
    );
  });

  it("passes MCP cancellation to the upstream request", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener(
          "abort",
          () => {
            reject(
              init.signal?.reason instanceof Error ? init.signal.reason : new Error("aborted"),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const pending = requestContext.run({ ...context, signal: controller.signal }, () =>
      teletypeRequest("/test"),
    );
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });
    controller.abort(new Error("cancelled by client"));
    await expect(pending).rejects.toThrow("Request cancelled.");
  });

  it("does not retry a write after a network failure", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("connection closed"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      requestContext.run(context, () => teletypeRequest("/send", { method: "POST", body: {} })),
    ).rejects.toThrow(/result is unknown/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("retries a transient 5xx on GET and succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { ok: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await requestContext.run(context, () => teletypeRequest<{ ok: number }>("/test"));

    expect(data).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a dropped connection on GET", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockResolvedValueOnce(Response.json({ success: true, data: { ok: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await requestContext.run(context, () => teletypeRequest<{ ok: number }>("/test"));

    expect(data).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces an internal error after exhausting GET retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestContext.run(context, () => teletypeRequest("/test"))).rejects.toThrow(
      /internal error/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry a write after a 5xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestContext.run(context, () => teletypeRequest("/send", { method: "POST", body: {} })),
    ).rejects.toThrow(/internal error/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not retry a GET after a client abort", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener(
          "abort",
          () => {
            reject(
              init.signal?.reason instanceof Error ? init.signal.reason : new Error("aborted"),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const pending = requestContext.run({ ...context, signal: controller.signal }, () =>
      teletypeRequest("/test"),
    );
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });
    controller.abort(new Error("cancelled by client"));
    await expect(pending).rejects.toThrow("Request cancelled.");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
