import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "../../src/lib/turnstile";

describe("verifyTurnstileToken", () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret || "";
    vi.unstubAllGlobals();
  });

  it("returns true when no secret is set in non-production", async () => {
    process.env.TURNSTILE_SECRET_KEY = "";
    const result = await verifyTurnstileToken("test-token");
    expect(result).toBe(true);
  });

  it("calls Cloudflare API with correct parameters", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("test-token", "1.2.3.4");
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns false when Cloudflare rejects the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("bad-token");
    expect(result).toBe(false);
  });

  it("returns false when fetch fails", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("test-token");
    expect(result).toBe(false);
  });

  it("returns false when HTTP response is not ok", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("test-token");
    expect(result).toBe(false);
  });
});
