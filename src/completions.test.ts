import { describe, expect, it } from "vitest";
import { handleComplete } from "./completions.js";

describe("MCP Completions", () => {
  it("provides limit completions for triage-inbox prompt", async () => {
    const res = await handleComplete({
      ref: { type: "ref/prompt", name: "triage-inbox" },
      argument: { name: "limit", value: "1" },
    });
    expect(res.completion.values).toContain("10");
  });

  it("provides component completions for escalate-issue prompt", async () => {
    const res = await handleComplete({
      ref: { type: "ref/prompt", name: "escalate-issue" },
      argument: { name: "component", value: "Payment" },
    });
    expect(res.completion.values).toContain("Payment");
  });

  it("provides instruction suggestions for draft-reply prompt", async () => {
    const res = await handleComplete({
      ref: { type: "ref/prompt", name: "draft-reply" },
      argument: { name: "instructions", value: "discount" },
    });
    expect(res.completion.values).toContain("Offer 10% discount");
  });

  it("completes resource URIs by prefix, including templates", async () => {
    const res = await handleComplete({
      ref: { type: "ref/resource", uri: "teletype://workspace/metadata" },
      argument: { name: "uri", value: "teletype://dialogs/" },
    });
    expect(res.completion.values).toEqual([
      "teletype://dialogs/unanswered",
      "teletype://dialogs/{dialogId}",
    ]);
    expect(res.completion.hasMore).toBe(false);
  });

  it("returns the full resource list for an empty prefix", async () => {
    const res = await handleComplete({
      ref: { type: "ref/resource", uri: "teletype://workspace/metadata" },
      argument: { name: "uri", value: "" },
    });
    expect(res.completion.values).toContain("teletype://workspace/metadata");
    expect(res.completion.values).toContain("teletype://project/status");
    expect(res.completion.values).toContain("teletype://clients/{clientId}");
    expect(res.completion.total).toBe(5);
  });

  it("returns empty values for unknown prompt or arguments", async () => {
    const res = await handleComplete({
      ref: { type: "ref/prompt", name: "unknown-prompt" },
      argument: { name: "unknown-arg", value: "abc" },
    });
    expect(res.completion.values).toEqual([]);
  });
});
