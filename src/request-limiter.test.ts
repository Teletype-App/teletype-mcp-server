import { describe, expect, it } from "vitest";
import { RequestLimiter } from "./request-limiter.js";

describe("RequestLimiter", () => {
  it("enforces the per-key limit and releases capacity", () => {
    const limiter = new RequestLimiter(3, 1);
    const release = limiter.acquire("client-a");

    expect(release).toBeTypeOf("function");
    expect(limiter.acquire("client-a")).toBeUndefined();
    expect(limiter.acquire("client-b")).toBeTypeOf("function");

    release?.();
    release?.();
    expect(limiter.acquire("client-a")).toBeTypeOf("function");
  });

  it("enforces the global limit", () => {
    const limiter = new RequestLimiter(2, 2);

    expect(limiter.acquire("client-a")).toBeTypeOf("function");
    expect(limiter.acquire("client-b")).toBeTypeOf("function");
    expect(limiter.acquire("client-c")).toBeUndefined();
  });

  it("keeps the remaining slot occupied when one of two same-key requests finishes", () => {
    const limiter = new RequestLimiter(3, 2);
    const releaseFirst = limiter.acquire("client-a");
    const releaseSecond = limiter.acquire("client-a");
    if (!releaseFirst || !releaseSecond) throw new Error("Expected two available slots");

    releaseFirst();
    releaseFirst();
    expect(limiter.acquire("client-a")).toBeTypeOf("function");
    expect(limiter.acquire("client-a")).toBeUndefined();
    expect(limiter.acquire("client-b")).toBeTypeOf("function");
    expect(limiter.acquire("client-c")).toBeUndefined();

    releaseSecond();
    expect(limiter.acquire("client-a")).toBeTypeOf("function");
  });

  it("removes counters for released keys so short-lived clients do not accumulate", () => {
    const limiter = new RequestLimiter(1, 1);
    for (let index = 0; index < 100; index += 1) {
      const release = limiter.acquire(`client-${index}`);
      if (!release) throw new Error("Expected an available slot");
      release();
    }
    const counters = (limiter as unknown as { activeByKey: Map<string, number> }).activeByKey;
    expect(counters.size).toBe(0);
  });
});
