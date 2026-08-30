import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  exists: vi.fn(),
  sadd: vi.fn(),
  srem: vi.fn(),
  smembers: vi.fn(),
  lpush: vi.fn(),
  ltrim: vi.fn(),
  lrange: vi.fn(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockRedis,
}));

import {
  checkLockout,
  recordFailedAttempt,
  resetAttempts,
  adminUnlockAccount,
  getLockedAccounts,
  getRecentLockoutEvents,
} from "@/lib/account-lockout";

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.set.mockResolvedValue("OK");
  mockRedis.del.mockResolvedValue(1);
  mockRedis.incr.mockResolvedValue(1);
  mockRedis.expire.mockResolvedValue(1);
  mockRedis.ttl.mockResolvedValue(-2);
  mockRedis.exists.mockResolvedValue(0);
  mockRedis.sadd.mockResolvedValue(1);
  mockRedis.srem.mockResolvedValue(1);
  mockRedis.smembers.mockResolvedValue([]);
  mockRedis.lpush.mockResolvedValue(1);
  mockRedis.ltrim.mockResolvedValue("OK");
  mockRedis.lrange.mockResolvedValue([]);
});

describe("checkLockout", () => {
  it("allows login when no lockout state exists", async () => {
    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: true });
  });

  it("blocks hard-locked accounts", async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key.includes("hard:")) return Promise.resolve("1");
      return Promise.resolve(null);
    });

    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: false, reason: "hard_locked" });
  });

  it("blocks soft-locked accounts with retryAfter", async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockImplementation((key: string) => {
      if (key.includes("soft:")) return Promise.resolve(600);
      return Promise.resolve(-2);
    });

    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: false, reason: "soft_locked", retryAfter: 600 });
  });

  it("delays login when attempts are between 5 and 10 with active cooldown", async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key.includes("hard:")) return Promise.resolve(null);
      if (key === "login_attempts:user@example.com") return Promise.resolve("7");
      return Promise.resolve(null);
    });
    mockRedis.ttl.mockImplementation((key: string) => {
      if (key.includes("soft:")) return Promise.resolve(-2);
      if (key.includes("delay:")) return Promise.resolve(20);
      return Promise.resolve(-2);
    });

    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: false, reason: "delayed", retryAfter: 20 });
  });

  it("allows login when attempts are between 5 and 10 but delay expired", async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key.includes("hard:")) return Promise.resolve(null);
      if (key === "login_attempts:user@example.com") return Promise.resolve("7");
      return Promise.resolve(null);
    });
    mockRedis.ttl.mockImplementation((key: string) => {
      if (key.includes("soft:")) return Promise.resolve(-2);
      if (key.includes("delay:")) return Promise.resolve(-2);
      return Promise.resolve(-2);
    });

    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: true });
  });

  it("allows login when attempts are below delay threshold", async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key.includes("hard:")) return Promise.resolve(null);
      if (key === "login_attempts:user@example.com") return Promise.resolve("3");
      return Promise.resolve(null);
    });

    const result = await checkLockout("user@example.com");
    expect(result).toEqual({ allowed: true });
  });

  it("normalizes email to lowercase", async () => {
    await checkLockout("User@EXAMPLE.COM");
    expect(mockRedis.get).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com")
    );
  });

  it("trims whitespace from email", async () => {
    await checkLockout("  user@example.com  ");
    expect(mockRedis.get).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com")
    );
  });

  it("checks hard lock before soft lock", async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key.includes("hard:")) return Promise.resolve("1");
      return Promise.resolve(null);
    });
    mockRedis.ttl.mockResolvedValue(600);

    const result = await checkLockout("user@example.com");
    expect(result.allowed).toBe(false);
    expect((result as { reason: string }).reason).toBe("hard_locked");
  });
});

describe("recordFailedAttempt", () => {
  it("increments attempt counter and sets TTL", async () => {
    mockRedis.incr.mockResolvedValue(1);

    const attempts = await recordFailedAttempt("user@example.com");
    expect(attempts).toBe(1);
    expect(mockRedis.incr).toHaveBeenCalledWith("login_attempts:user@example.com");
    expect(mockRedis.expire).toHaveBeenCalledWith("login_attempts:user@example.com", 3600);
  });

  it("sets delay cooldown at 5 attempts", async () => {
    mockRedis.incr.mockResolvedValue(5);

    await recordFailedAttempt("user@example.com");
    expect(mockRedis.set).toHaveBeenCalledWith(
      "login_attempts:delay:user@example.com",
      "1",
      "EX",
      30
    );
  });

  it("sets delay cooldown between 5 and 10 attempts", async () => {
    mockRedis.incr.mockResolvedValue(8);

    await recordFailedAttempt("user@example.com");
    expect(mockRedis.set).toHaveBeenCalledWith(
      "login_attempts:delay:user@example.com",
      "1",
      "EX",
      30
    );
  });

  it("soft-locks account at 10 attempts", async () => {
    mockRedis.incr.mockResolvedValue(10);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await recordFailedAttempt("user@example.com");

    expect(mockRedis.set).toHaveBeenCalledWith(
      "account_locked:soft:user@example.com",
      "1",
      "EX",
      900
    );
    expect(mockRedis.sadd).toHaveBeenCalledWith("locked_accounts", "user@example.com");
    warnSpy.mockRestore();
  });

  it("hard-locks account at 20 attempts", async () => {
    mockRedis.incr.mockResolvedValue(20);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await recordFailedAttempt("user@example.com");

    expect(mockRedis.set).toHaveBeenCalledWith(
      "account_locked:hard:user@example.com",
      "1"
    );
    expect(mockRedis.sadd).toHaveBeenCalledWith("locked_accounts", "user@example.com");
    warnSpy.mockRestore();
  });

  it("tracks lockout event on soft lock", async () => {
    mockRedis.incr.mockResolvedValue(10);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await recordFailedAttempt("user@example.com");

    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining("lockout_event:"),
      expect.stringContaining('"lockType":"soft_locked"'),
      "EX",
      604800
    );
    expect(mockRedis.lpush).toHaveBeenCalledWith(
      "lockout_events_log",
      expect.stringContaining('"soft_locked"')
    );
    expect(mockRedis.ltrim).toHaveBeenCalledWith("lockout_events_log", 0, 499);
    warnSpy.mockRestore();
  });

  it("tracks lockout event on hard lock", async () => {
    mockRedis.incr.mockResolvedValue(20);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await recordFailedAttempt("user@example.com");

    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining("lockout_event:"),
      expect.stringContaining('"lockType":"hard_locked"'),
      "EX",
      604800
    );
    warnSpy.mockRestore();
  });

  it("does not set lock below threshold", async () => {
    mockRedis.incr.mockResolvedValue(3);

    await recordFailedAttempt("user@example.com");

    const setCalls = mockRedis.set.mock.calls;
    const lockCalls = setCalls.filter((c: string[]) =>
      c[0].includes("account_locked:") || c[0].includes("delay:")
    );
    expect(lockCalls).toHaveLength(0);
  });

  it("normalizes email before recording", async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt("USER@Example.COM");
    expect(mockRedis.incr).toHaveBeenCalledWith("login_attempts:user@example.com");
  });
});

describe("resetAttempts", () => {
  it("deletes attempt counter, delay, and soft lock keys", async () => {
    await resetAttempts("user@example.com");

    expect(mockRedis.del).toHaveBeenCalledWith(
      "login_attempts:user@example.com",
      "login_attempts:delay:user@example.com",
      "account_locked:soft:user@example.com"
    );
  });

  it("does not delete hard lock", async () => {
    await resetAttempts("user@example.com");

    const delCall = mockRedis.del.mock.calls[0];
    expect(delCall).not.toContain("account_locked:hard:user@example.com");
  });

  it("normalizes email", async () => {
    await resetAttempts("  USER@Example.COM  ");

    expect(mockRedis.del).toHaveBeenCalledWith(
      "login_attempts:user@example.com",
      "login_attempts:delay:user@example.com",
      "account_locked:soft:user@example.com"
    );
  });
});

describe("adminUnlockAccount", () => {
  it("deletes all lockout keys including hard lock", async () => {
    mockRedis.del.mockResolvedValue(4);

    const result = await adminUnlockAccount("user@example.com");

    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith(
      "login_attempts:user@example.com",
      "login_attempts:delay:user@example.com",
      "account_locked:soft:user@example.com",
      "account_locked:hard:user@example.com"
    );
  });

  it("removes from locked accounts set", async () => {
    mockRedis.del.mockResolvedValue(1);

    await adminUnlockAccount("user@example.com");
    expect(mockRedis.srem).toHaveBeenCalledWith("locked_accounts", "user@example.com");
  });

  it("returns false when nothing was deleted", async () => {
    mockRedis.del.mockResolvedValue(0);

    const result = await adminUnlockAccount("user@example.com");
    expect(result).toBe(false);
  });
});

describe("getLockedAccounts", () => {
  it("returns empty array when no accounts are locked", async () => {
    mockRedis.smembers.mockResolvedValue([]);

    const result = await getLockedAccounts();
    expect(result).toEqual([]);
  });

  it("returns hard-locked accounts", async () => {
    const eventData = JSON.stringify({
      email: "user@example.com",
      lockType: "hard_locked",
      attempts: 20,
      lockedAt: "2026-01-01T00:00:00.000Z",
    });

    mockRedis.smembers.mockResolvedValue(["user@example.com"]);
    mockRedis.get.mockResolvedValue(eventData);
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-2);

    const result = await getLockedAccounts();
    expect(result).toEqual([
      {
        email: "user@example.com",
        lockType: "hard_locked",
        attempts: 20,
        lockedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("returns soft-locked accounts", async () => {
    const eventData = JSON.stringify({
      email: "user@example.com",
      lockType: "soft_locked",
      attempts: 10,
      lockedAt: "2026-01-01T00:00:00.000Z",
    });

    mockRedis.smembers.mockResolvedValue(["user@example.com"]);
    mockRedis.get.mockResolvedValue(eventData);
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.ttl.mockResolvedValue(500);

    const result = await getLockedAccounts();
    expect(result).toEqual([
      {
        email: "user@example.com",
        lockType: "soft_locked",
        attempts: 10,
        lockedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("cleans up stale entries with no event data", async () => {
    mockRedis.smembers.mockResolvedValue(["stale@example.com"]);
    mockRedis.get.mockResolvedValue(null);

    const result = await getLockedAccounts();
    expect(result).toEqual([]);
    expect(mockRedis.srem).toHaveBeenCalledWith("locked_accounts", "stale@example.com");
  });

  it("cleans up entries that are no longer locked", async () => {
    const eventData = JSON.stringify({
      email: "user@example.com",
      lockType: "soft_locked",
      attempts: 10,
      lockedAt: "2026-01-01T00:00:00.000Z",
    });

    mockRedis.smembers.mockResolvedValue(["user@example.com"]);
    mockRedis.get.mockResolvedValue(eventData);
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.ttl.mockResolvedValue(-2);

    const result = await getLockedAccounts();
    expect(result).toEqual([]);
    expect(mockRedis.srem).toHaveBeenCalledWith("locked_accounts", "user@example.com");
  });
});

describe("getRecentLockoutEvents", () => {
  it("returns empty array when no events exist", async () => {
    mockRedis.lrange.mockResolvedValue([]);

    const result = await getRecentLockoutEvents();
    expect(result).toEqual([]);
  });

  it("parses and returns lockout events", async () => {
    const event1 = JSON.stringify({
      email: "user1@example.com",
      lockType: "soft_locked",
      attempts: 10,
      lockedAt: "2026-01-01T00:00:00.000Z",
    });
    const event2 = JSON.stringify({
      email: "user2@example.com",
      lockType: "hard_locked",
      attempts: 20,
      lockedAt: "2026-01-01T01:00:00.000Z",
    });

    mockRedis.lrange.mockResolvedValue([event1, event2]);

    const result = await getRecentLockoutEvents();
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe("user1@example.com");
    expect(result[1].lockType).toBe("hard_locked");
  });

  it("respects limit parameter", async () => {
    await getRecentLockoutEvents(10);
    expect(mockRedis.lrange).toHaveBeenCalledWith("lockout_events_log", 0, 9);
  });

  it("defaults to limit of 50", async () => {
    await getRecentLockoutEvents();
    expect(mockRedis.lrange).toHaveBeenCalledWith("lockout_events_log", 0, 49);
  });
});

describe("lockout flow integration", () => {
  it("full escalation: delay -> soft lock -> hard lock", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockRedis.incr.mockResolvedValue(5);
    await recordFailedAttempt("user@example.com");
    let delayCalls = mockRedis.set.mock.calls.filter((c: string[]) => c[0].includes("delay:"));
    expect(delayCalls).toHaveLength(1);

    vi.clearAllMocks();
    mockRedis.incr.mockResolvedValue(10);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.lpush.mockResolvedValue(1);
    mockRedis.ltrim.mockResolvedValue("OK");
    await recordFailedAttempt("user@example.com");
    let softLockCalls = mockRedis.set.mock.calls.filter((c: string[]) => c[0].includes("soft:"));
    expect(softLockCalls).toHaveLength(1);

    vi.clearAllMocks();
    mockRedis.incr.mockResolvedValue(20);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.lpush.mockResolvedValue(1);
    mockRedis.ltrim.mockResolvedValue("OK");
    await recordFailedAttempt("user@example.com");
    let hardLockCalls = mockRedis.set.mock.calls.filter((c: string[]) => c[0].includes("hard:"));
    expect(hardLockCalls).toHaveLength(1);

    warnSpy.mockRestore();
  });
});
