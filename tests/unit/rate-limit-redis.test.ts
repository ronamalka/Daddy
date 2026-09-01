import { describe, it, expect, vi, beforeEach } from "vitest";

let incrCount = 0;
const mockRedis = {
  incr: vi.fn().mockImplementation(() => {
    incrCount += 1;
    return Promise.resolve(incrCount);
  }),
  expire: vi.fn().mockResolvedValue(1),
  ttl: vi.fn().mockResolvedValue(55),
  on: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockRedis,
}));

import { checkRateLimit } from "@/lib/rate-limit-redis";

describe("checkRateLimit (Redis)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    incrCount = 0;
  });

  it("allows requests under the limit", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);
    expect(result.limit).toBe(10);
    expect(mockRedis.incr).toHaveBeenCalledWith("rl:test:1.2.3.4");
  });

  it("sets EXPIRE only on the first request (count === 1)", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);

    await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(mockRedis.expire).toHaveBeenCalledWith("rl:test:1.2.3.4", 60);
  });

  it("does not set EXPIRE on subsequent requests", async () => {
    mockRedis.incr.mockResolvedValueOnce(5);

    await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it("rejects requests over the limit", async () => {
    mockRedis.incr.mockResolvedValueOnce(11);
    mockRedis.ttl.mockResolvedValueOnce(42);

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(11);
    expect(result.retryAfterSeconds).toBe(42);
  });

  it("rejects at exactly limit + 1", async () => {
    mockRedis.incr.mockResolvedValueOnce(11);
    mockRedis.ttl.mockResolvedValueOnce(30);

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(false);
  });

  it("allows at exactly the limit", async () => {
    mockRedis.incr.mockResolvedValueOnce(10);

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(true);
  });

  it("fails open when Redis throws", async () => {
    mockRedis.incr.mockRejectedValueOnce(new Error("Connection refused"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[rate-limit-redis]"),
      expect.any(Error)
    );

    warnSpy.mockRestore();
  });

  it("uses windowSeconds as retryAfter when TTL is negative", async () => {
    mockRedis.incr.mockResolvedValueOnce(11);
    mockRedis.ttl.mockResolvedValueOnce(-1);

    const result = await checkRateLimit("test:1.2.3.4", 10, 60);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(60);
  });
});
