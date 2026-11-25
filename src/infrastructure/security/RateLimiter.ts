export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();
  private lastSweep = 0;

  constructor(
    private maxRequests: number = 30,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {}

  isAllowed(clientId: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    // Bound memory use from one-off client identifiers in long-lived processes.
    if (now - this.lastSweep > this.windowMs) {
      for (const [key, values] of this.requests) {
        if (values.length === 0 || now - values[values.length - 1] >= this.windowMs) this.requests.delete(key);
      }
      this.lastSweep = now;
    }
    if (!this.requests.has(clientId) && this.requests.size >= 10_000) {
      return { allowed: false, remaining: 0, resetMs: this.windowMs };
    }
    const timestamps = this.requests.get(clientId) || [];

    // Filter out timestamps outside current window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldest = validTimestamps[0];
      const resetMs = Math.max(0, this.windowMs - (now - oldest));
      this.requests.set(clientId, validTimestamps);
      return { allowed: false, remaining: 0, resetMs };
    }

    validTimestamps.push(now);
    this.requests.set(clientId, validTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length,
      resetMs: this.windowMs,
    };
  }

  reset(clientId?: string): void {
    if (clientId) {
      this.requests.delete(clientId);
    } else {
      this.requests.clear();
    }
  }
}
