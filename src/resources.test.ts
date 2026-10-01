import { afterEach, describe, expect, it, vi } from "vitest";
import { handleReadResource, RESOURCE_DEFINITIONS, RESOURCE_TEMPLATES } from "./resources.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("MCP Resources", () => {
  it("defines standard resources with URIs and descriptions", () => {
    const uris = RESOURCE_DEFINITIONS.map((r) => r.uri);
    expect(uris).toEqual(
      expect.arrayContaining([
        "teletype://workspace/metadata",
        "teletype://project/status",
        "teletype://dialogs/unanswered",
      ]),
    );
  });

  it("defines resource templates for dynamic dialog and client access", () => {
    const templates = RESOURCE_TEMPLATES.map((t) => t.uriTemplate);
    expect(templates).toEqual(
      expect.arrayContaining(["teletype://dialogs/{dialogId}", "teletype://clients/{clientId}"]),
    );
  });

  it("throws descriptive error when an unknown resource URI is requested", async () => {
    await expect(handleReadResource("teletype://unknown/resource")).rejects.toThrow(
      /Unknown resource 'teletype:\/\/unknown\/resource'/,
    );
  });

  it("localizes resource names for the active locale", async () => {
    vi.stubEnv("TELETYPE_MCP_LOCALE", "ru");
    vi.resetModules();
    const { RESOURCE_DEFINITIONS: ruDefs, RESOURCE_TEMPLATES: ruTemplates } =
      await import("./resources.js");
    expect(ruDefs.map((r) => r.name)).toEqual([
      "Метаданные проекта Teletype",
      "Статус проекта Teletype",
      "Неотвеченные диалоги Teletype",
    ]);
    expect(ruTemplates.map((tpl) => tpl.name)).toEqual([
      "Переписка диалога Teletype",
      "Профиль клиента Teletype",
    ]);
  });
});
