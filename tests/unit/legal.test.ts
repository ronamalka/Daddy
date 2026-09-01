import { describe, it, expect } from "vitest";
import {
  LEGAL_CONTACTS,
  isConsentExpired,
  parseCookieConsent,
  type CookieConsentState,
} from "@/lib/legal";

describe("legal contacts", () => {
  it("publishes the aballeh.com mailboxes", () => {
    expect(LEGAL_CONTACTS).toEqual({
      legal: "legal@aballeh.com",
      privacy: "privacy@aballeh.com",
      abuse: "abuse@aballeh.com",
      accessibility: "accessibility@aballeh.com",
      support: "support@aballeh.com",
    });
  });
});

describe("cookie consent parsing", () => {
  it("returns null for empty input", () => {
    expect(parseCookieConsent(null)).toBeNull();
    expect(parseCookieConsent("")).toBeNull();
    expect(parseCookieConsent("not-json")).toBeNull();
  });

  it("accepts a valid stored choice", () => {
    const state: CookieConsentState = {
      choice: "rejected",
      analytics: false,
      marketing: false,
      ts: Date.now(),
      version: 1,
    };
    expect(parseCookieConsent(JSON.stringify(state))).toEqual(state);
  });

  it("expires consent after 12 months", () => {
    const old: CookieConsentState = {
      choice: "accepted",
      analytics: true,
      marketing: false,
      ts: Date.now() - 400 * 24 * 60 * 60 * 1000,
      version: 1,
    };
    expect(isConsentExpired(old)).toBe(true);
    expect(parseCookieConsent(JSON.stringify(old))).toBeNull();
  });
});
