import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryCache } from "./MemoryCache";

describe("MemoryCache", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("sets, gets, checks, and clears values", () => {
    const cache = new MemoryCache<string>(1000);
    cache.set("key1", "val1");

    expect(cache.has("key1")).toBe(true);
    expect(cache.get("key1")).toBe("val1");
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.has("key1")).toBe(false);
    expect(cache.get("key1")).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it("expires keys based on TTL", () => {
    vi.useFakeTimers();
    const cache = new MemoryCache<number>(500);

    cache.set("num", 42, 500);
    expect(cache.get("num")).toBe(42);

    vi.advanceTimersByTime(600);
    expect(cache.has("num")).toBe(false);
    expect(cache.get("num")).toBeNull();
    expect(cache.size()).toBe(0);

    // Test size() directly purging expired keys
    cache.set("fresh", 100, 5000);
    cache.set("expiredSoon", 200, 100);
    vi.advanceTimersByTime(200);
    expect(cache.size()).toBe(1);

    vi.useRealTimers();
  });
});
