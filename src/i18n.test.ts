import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("MCP language", () => {
  it("keeps catalog keys aligned and formats messages with parameters", async () => {
    const [{ enMessages }, { ruMessages }, { t }] = await Promise.all([
      import("./locales/en/index.js"),
      import("./locales/ru/index.js"),
      import("./i18n.js"),
    ]);

    expect(Object.keys(ruMessages).sort()).toEqual(Object.keys(enMessages).sort());
    vi.stubEnv("TELETYPE_MCP_LOCALE", "en");
    expect(t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: "Sales" })).toBe(
      "Channel 'Sales' was not uniquely found.",
    );
    vi.stubEnv("TELETYPE_MCP_LOCALE", "ru");
    expect(t("messaging.sendReplyToClient.channelWasNotUniquelyFound", { channel: "Sales" })).toBe(
      "Канал 'Sales' не найден однозначно.",
    );
  });

  it("uses English for tool metadata and errors by default", async () => {
    vi.stubEnv("TELETYPE_MCP_LOCALE", undefined);
    const { TOOL_CATALOG } = await import("./tool-catalog.js");
    const { sendReplyToClient } = await import("./messaging-tools.js");

    expect(TOOL_CATALOG[0].description).toContain("Find Teletype conversations");
    const result = await sendReplyToClient({ confirm: true, create_dialog_only: true });
    expect(result.content[0]?.text).toContain("Creating a conversation requires");
    expect(result.structuredContent).toHaveProperty("error");
  });

  it("uses Russian when configured while preserving result field names", async () => {
    vi.stubEnv("TELETYPE_MCP_LOCALE", "ru");
    const { TOOL_CATALOG } = await import("./tool-catalog.js");
    const { sendReplyToClient } = await import("./messaging-tools.js");

    expect(TOOL_CATALOG[0].description).toContain("Поиск диалогов");
    const result = await sendReplyToClient({ confirm: true, create_dialog_only: true });
    expect(result.content[0]?.text).toContain("Для создания нового диалога");
    expect(result.structuredContent).toHaveProperty("error");
  });

  it("keeps user-visible strings free of em dashes and semicolons", async () => {
    const [{ enMessages }, { ruMessages }] = await Promise.all([
      import("./locales/en/index.js"),
      import("./locales/ru/index.js"),
    ]);
    const offenders: string[] = [];
    for (const [locale, messages] of [
      ["en", enMessages],
      ["ru", ruMessages],
    ] as const) {
      for (const [key, value] of Object.entries(messages) as [string, unknown][]) {
        const text: string =
          typeof value === "function" ? (value as (args: object) => string)({}) : String(value);
        // The numeric range dash (10–30 seconds) is an en dash and stays legal.
        const withRangesMasked = text.replaceAll(/10–30/g, "");
        if (withRangesMasked.includes("—") || withRangesMasked.includes(";")) {
          offenders.push(`${locale}:${key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
