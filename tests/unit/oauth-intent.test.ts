import { describe, it, expect } from "vitest";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  OAUTH_INTENT_COOKIE,
  oauthIntentCookie,
  parseOauthRole,
} from "@/lib/oauth-intent";

describe("parseOauthRole", () => {
  it("accepts SELLER", () => {
    expect(parseOauthRole("SELLER")).toBe("SELLER");
  });

  it("defaults anything else to BUYER", () => {
    expect(parseOauthRole("BUYER")).toBe("BUYER");
    expect(parseOauthRole("ADMIN")).toBe("BUYER");
    expect(parseOauthRole("")).toBe("BUYER");
    expect(parseOauthRole(undefined)).toBe("BUYER");
  });
});

describe("oauthIntentCookie", () => {
  it("writes a SameSite=Lax cookie with a safe role", () => {
    expect(oauthIntentCookie("SELLER")).toBe(
      `${OAUTH_INTENT_COOKIE}=SELLER; Path=/; Max-Age=600; SameSite=Lax`
    );
    expect(oauthIntentCookie("ADMIN")).toContain("=BUYER;");
  });
});

describe("Google redirect path", () => {
  it("matches the Auth.js Google callback", () => {
    expect(GOOGLE_OAUTH_CALLBACK_PATH).toBe("/api/auth/callback/google");
  });
});
