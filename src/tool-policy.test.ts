import { describe, expect, it } from "vitest";
import { loadToolPolicy, parseToolsetList } from "./tool-policy.js";

describe("tool policy", () => {
  it("parses toolset lists with dedupe and rejects unknown names", () => {
    expect(parseToolsetList(undefined)).toBeNull();
    expect(parseToolsetList("")).toBeNull();
    expect(parseToolsetList("   ")).toBeNull();
    expect(parseToolsetList("conversations, admin")).toEqual(["conversations", "admin"]);
    expect(parseToolsetList("meta,meta")).toEqual(["meta"]);
    expect(() => parseToolsetList("nope")).toThrow(/Unknown toolset 'nope'/);
  });

  it("loads policy from env variables", () => {
    expect(loadToolPolicy({})).toEqual({ readOnly: false, toolsets: null });
    expect(
      loadToolPolicy({
        TELETYPE_MCP_READ_ONLY: "true",
        TELETYPE_MCP_TOOLSETS: "messaging",
      }),
    ).toEqual({ readOnly: true, toolsets: ["messaging"] });
    expect(loadToolPolicy({ TELETYPE_MCP_READ_ONLY: "1" })).toEqual({
      readOnly: false,
      toolsets: null,
    });
  });
});
