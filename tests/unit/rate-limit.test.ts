import { describe, it, expect } from "vitest";
import {
  isCredentialAuthPath,
  resolveRateLimitTier,
  clientIpFromHeaders,
  rateLimitKey,
  RATE_LIMIT_AUTH,
  RATE_LIMIT_POST,
  RATE_LIMIT_DEFAULT,
} from "@/lib/rate-limit";

describe("isCredentialAuthPath", () => {
  it("does not treat NextAuth session polling as login brute-force", () => {
    expect(isCredentialAuthPath("/api/auth/session", "GET")).toBe(false);
    expect(isCredentialAuthPath("/api/auth/csrf", "GET")).toBe(false);
    expect(isCredentialAuthPath("/api/auth/providers", "GET")).toBe(false);
  });

  it("rate-limits credential callback POSTs", () => {
    expect(isCredentialAuthPath("/api/auth/callback/credentials", "POST")).toBe(true);
    expect(isCredentialAuthPath("/api/auth/signin", "POST")).toBe(true);
  });

  it("does not put signout in the tight auth bucket", () => {
    expect(isCredentialAuthPath("/api/auth/signout", "POST")).toBe(false);
  });

  it("rate-limits register and password-reset", () => {
    expect(isCredentialAuthPath("/api/register", "POST")).toBe(true);
    expect(isCredentialAuthPath("/api/password-reset", "POST")).toBe(true);
  });
});

describe("resolveRateLimitTier", () => {
  it("gives session GETs the default read budget, not 10/min", () => {
    const tier = resolveRateLimitTier("/api/auth/session", "GET");
    expect(tier.name).toBe("default");
    expect(tier.limit).toBe(RATE_LIMIT_DEFAULT);
    expect(tier.limit).toBeGreaterThan(RATE_LIMIT_AUTH);
  });

  it("gives login POSTs the auth budget", () => {
    const tier = resolveRateLimitTier("/api/auth/callback/credentials", "POST");
    expect(tier.name).toBe("auth");
    expect(tier.limit).toBe(RATE_LIMIT_AUTH);
  });

  it("gives generic POST the write budget", () => {
    const tier = resolveRateLimitTier("/api/orders/ord-1/messages", "POST");
    expect(tier.name).toBe("write");
    expect(tier.limit).toBe(RATE_LIMIT_POST);
  });
});

describe("clientIpFromHeaders", () => {
  it("uses the first x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientIpFromHeaders(headers)).toBe("198.51.100.7");
  });
});

describe("rateLimitKey", () => {
  it("keeps unauthenticated clients on the same IP bucket", () => {
    expect(rateLimitKey("1.1.1.1", undefined, 10)).toBe("1.1.1.1:10");
  });

  it("separates authenticated sessions so two testers on one NAT do not share write budget", () => {
    const a = rateLimitKey("1.1.1.1", "aaaaaaaabbbbbbbb", 30);
    const b = rateLimitKey("1.1.1.1", "ccccccccdddddddd", 30);
    expect(a).not.toBe(b);
  });
});
