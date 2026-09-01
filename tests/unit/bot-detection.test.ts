import { describe, it, expect } from "vitest";
import { detectBot } from "../../src/lib/bot-detection";

function makeHeaders(overrides: Record<string, string> = {}): Headers {
  const defaults: Record<string, string> = {
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "accept": "text/html,application/json",
    "accept-language": "he-IL,he;q=0.9,en-US;q=0.8",
  };
  return new Headers({ ...defaults, ...overrides });
}

describe("detectBot", () => {
  it("returns isBot=false for legitimate requests", () => {
    const result = detectBot({
      headers: makeHeaders(),
    });
    expect(result.isBot).toBe(false);
  });

  it("detects honeypot filled", () => {
    const result = detectBot({
      honeypot: "spam-content",
      headers: makeHeaders(),
    });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("honeypot_filled");
  });

  it("allows empty honeypot", () => {
    const result = detectBot({
      honeypot: "",
      headers: makeHeaders(),
    });
    expect(result.isBot).toBe(false);
  });

  it("detects too-fast submission", () => {
    const result = detectBot({
      formLoadedAt: Date.now() - 500,
      headers: makeHeaders(),
    });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("submission_too_fast");
  });

  it("allows normal submission time", () => {
    const result = detectBot({
      formLoadedAt: Date.now() - 10000,
      headers: makeHeaders(),
    });
    expect(result.isBot).toBe(false);
  });

  it("detects missing user-agent", () => {
    const headers = new Headers({
      "accept": "text/html",
      "accept-language": "he-IL",
    });
    const result = detectBot({ headers });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("missing_user_agent");
  });

  it("detects very short user-agent", () => {
    const result = detectBot({
      headers: makeHeaders({ "user-agent": "curl" }),
    });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("missing_user_agent");
  });

  it("detects missing accept header", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "accept-language": "he-IL",
    });
    const result = detectBot({ headers });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("missing_accept_header");
  });

  it("detects missing accept-language header", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "accept": "text/html",
    });
    const result = detectBot({ headers });
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe("missing_accept_language");
  });

  it("checks honeypot before timing", () => {
    const result = detectBot({
      honeypot: "spam",
      formLoadedAt: Date.now() - 100000,
      headers: makeHeaders(),
    });
    expect(result.reason).toBe("honeypot_filled");
  });
});
