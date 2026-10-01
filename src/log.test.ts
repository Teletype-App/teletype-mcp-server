import { describe, expect, it } from "vitest";
import { sanitizeLogValue } from "./log.js";

describe("sanitizeLogValue", () => {
  it("redacts sensitive keys regardless of value", () => {
    expect(sanitizeLogValue("secret-token-123", "token")).toBe("[REDACTED]");
    expect(sanitizeLogValue("super-secret", "password")).toBe("[REDACTED]");
    expect(sanitizeLogValue("auth-token", "authorization")).toBe("[REDACTED]");
    expect(sanitizeLogValue("api-key-val", "api_key")).toBe("[REDACTED]");
    expect(sanitizeLogValue("secret-credential", "credential")).toBe("[REDACTED]");
  });

  it("masks Bearer tokens and query tokens within strings", () => {
    const raw = "Error calling https://api.teletype.app?token=secret123 with Bearer abc.def.ghi";
    const sanitized = sanitizeLogValue(raw) as string;
    expect(sanitized).not.toContain("secret123");
    expect(sanitized).not.toContain("abc.def.ghi");
    expect(sanitized).toContain("Bearer [REDACTED]");
    expect(sanitized).toContain("token=[REDACTED]");
  });

  it("recursively sanitizes nested objects and strips message body/content", () => {
    const input = {
      user_id: 123,
      auth: "secret",
      nested: {
        text: "Private message text",
        body: "Payload body",
        error_msg: "failed with Bearer xyz999",
      },
      tags: ["support", "vip"],
    };
    const sanitized = sanitizeLogValue(input) as Record<string, unknown>;
    expect(sanitized.user_id).toBe(123);
    expect(sanitized.auth).toBeUndefined();
    expect((sanitized.nested as Record<string, unknown>).text).toBeUndefined();
    expect((sanitized.nested as Record<string, unknown>).body).toBeUndefined();
    expect((sanitized.nested as Record<string, unknown>).error_msg).toBe(
      "failed with Bearer [REDACTED]",
    );
    expect(sanitized.tags).toEqual(["support", "vip"]);
  });
});
