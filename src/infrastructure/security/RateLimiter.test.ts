import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlidingWindowRateLimiter } from "./RateLimiter";

describe("SlidingWindowRateLimiter", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the rate limit", () => {
    const limiter = new SlidingWindowRateLimiter(3, 1000);

    const r1 = limiter.isAllowed("clientA");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.isAllowed("clientA");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.isAllowed("clientA");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request should be blocked
    const r4 = limiter.isAllowed("clientA");
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetMs).toBeGreaterThan(0);
  });

  it("sweeps only when the configured interval has elapsed", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(200).mockReturnValueOnce(200);
    const limiter = new SlidingWindowRateLimiter(3, 100);
    expect(limiter.isAllowed("first").allowed).toBe(true);
    expect(limiter.isAllowed("second").allowed).toBe(true);
    now.mockRestore();
  });

  it("resets limits when window slides or reset is called", () => {
    const limiter = new SlidingWindowRateLimiter(2, 500);
    limiter.isAllowed("c1");
    limiter.isAllowed("c1");
    expect(limiter.isAllowed("c1").allowed).toBe(false);

    limiter.reset("c1");
    expect(limiter.isAllowed("c1").allowed).toBe(true);

    limiter.reset(); // reset all
    expect(limiter.isAllowed("c1").allowed).toBe(true);
    limiter.reset("missing-client");
  });

  it("sweeps expired clients and caps new client keys", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const limiter = new SlidingWindowRateLimiter(1, 100);
    limiter.isAllowed("expired");
    vi.advanceTimersByTime(101);
    expect(limiter.isAllowed("fresh").allowed).toBe(true);
    expect(limiter.isAllowed("another-fresh").allowed).toBe(true);
    limiter.reset();

    const capped = new SlidingWindowRateLimiter(1, 100);
    for (let i = 0; i < 10_000; i++) capped.isAllowed(`client-${i}`);
    expect(capped.isAllowed("new-client")).toEqual({ allowed: false, remaining: 0, resetMs: 100 });
  });
});
