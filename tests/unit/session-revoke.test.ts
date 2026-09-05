import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = {
  scan: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockRedis,
}));

import { revokeSessionsForUser, isSessionValid } from "@/lib/session-revoke";

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.scan.mockResolvedValue(["0", []]);
  mockRedis.del.mockResolvedValue(0);
  mockRedis.exists.mockResolvedValue(0);
});

describe("revokeSessionsForUser", () => {
  it("returns 0 when user has no active sessions", async () => {
    mockRedis.scan.mockResolvedValue(["0", []]);

    const count = await revokeSessionsForUser("user-1");
    expect(count).toBe(0);
    expect(mockRedis.scan).toHaveBeenCalledWith(
      "0",
      "MATCH",
      "session_jti:user-1:*",
      "COUNT",
      100
    );
  });

  it("deletes all session keys for a user", async () => {
    mockRedis.scan.mockResolvedValue([
      "0",
      ["session_jti:user-1:jti-a", "session_jti:user-1:jti-b"],
    ]);
    mockRedis.del.mockResolvedValue(2);

    const count = await revokeSessionsForUser("user-1");
    expect(count).toBe(2);
    expect(mockRedis.del).toHaveBeenCalledWith(
      "session_jti:user-1:jti-a",
      "session_jti:user-1:jti-b"
    );
  });

  it("paginates through multiple scan pages", async () => {
    mockRedis.scan
      .mockResolvedValueOnce(["42", ["session_jti:user-1:jti-a"]])
      .mockResolvedValueOnce(["0", ["session_jti:user-1:jti-b"]]);
    mockRedis.del.mockResolvedValue(1);

    const count = await revokeSessionsForUser("user-1");
    expect(count).toBe(2);
    expect(mockRedis.scan).toHaveBeenCalledTimes(2);
    expect(mockRedis.del).toHaveBeenCalledTimes(2);
  });

  it("preserves the specified JTI when keepJti is provided", async () => {
    mockRedis.scan.mockResolvedValue([
      "0",
      [
        "session_jti:user-1:keep-me",
        "session_jti:user-1:revoke-me",
        "session_jti:user-1:revoke-too",
      ],
    ]);
    mockRedis.del.mockResolvedValue(2);

    const count = await revokeSessionsForUser("user-1", "keep-me");
    expect(count).toBe(2);
    expect(mockRedis.del).toHaveBeenCalledWith(
      "session_jti:user-1:revoke-me",
      "session_jti:user-1:revoke-too"
    );
  });

  it("returns 0 when only the keepJti key exists", async () => {
    mockRedis.scan.mockResolvedValue([
      "0",
      ["session_jti:user-1:keep-me"],
    ]);

    const count = await revokeSessionsForUser("user-1", "keep-me");
    expect(count).toBe(0);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe("isSessionValid", () => {
  it("returns true when the JTI key exists in Redis", async () => {
    mockRedis.exists.mockResolvedValue(1);

    const valid = await isSessionValid("user-1", "jti-abc");
    expect(valid).toBe(true);
    expect(mockRedis.exists).toHaveBeenCalledWith("session_jti:user-1:jti-abc");
  });

  it("returns false when the JTI key does not exist", async () => {
    mockRedis.exists.mockResolvedValue(0);

    const valid = await isSessionValid("user-1", "jti-revoked");
    expect(valid).toBe(false);
  });

  it("fails open when Redis is unreachable", async () => {
    mockRedis.exists.mockRejectedValue(new Error("Connection refused"));

    const valid = await isSessionValid("user-1", "jti-abc");
    expect(valid).toBe(true);
  });
});
