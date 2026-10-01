import { describe, expect, it } from "vitest";
import {
  decodeCustomFields,
  decodeDialogPage,
  decodeMessagePage,
  decodeSendMessage,
  decodeTemplateList,
} from "./api-contract.js";

describe("Public API compatibility boundary", () => {
  it("accepts the documented empty custom fields array and preserves populated fields", () => {
    expect(decodeCustomFields([])).toEqual({});
    expect(decodeCustomFields({ tier: "gold" })).toEqual({ tier: "gold" });
    expect(() => decodeCustomFields([{ tier: "gold" }])).toThrow();
  });

  it("keeps new fields and ignores malformed optional fields", () => {
    const result = decodeDialogPage({
      items: [{ id: "dialog-1", status: { future: true }, newApiField: "preserved" }],
      futurePageField: 42,
    });

    expect(result.items[0]?.id).toBe("dialog-1");
    expect(result.items[0]?.status).toBeUndefined();
    expect(result.items[0]?.newApiField).toBe("preserved");
    expect(result).toMatchObject({ futurePageField: 42 });
  });

  it("rejects missing message IDs before a tool reads them", () => {
    expect(() => decodeMessagePage({ items: [{ text: "hello" }] })).toThrow();
  });

  it("accepts additive send fields but rejects a missing message ID list", () => {
    expect(decodeSendMessage({ ids: ["message-1"], futureStatus: "queued" })).toMatchObject({
      ids: ["message-1"],
      futureStatus: "queued",
    });
    expect(() => decodeSendMessage({ futureStatus: "queued" })).toThrow();
  });

  it("keeps added template fields and rejects malformed consumed text", () => {
    expect(
      decodeTemplateList({
        withoutDirectories: { templates: [{ id: "one", text: "Hello", future: true }] },
      }).withoutDirectories?.templates?.[0],
    ).toMatchObject({ future: true });
    expect(() =>
      decodeTemplateList({
        withoutDirectories: { templates: [{ id: "one", text: 123 }] },
      }),
    ).toThrow();
  });
});
