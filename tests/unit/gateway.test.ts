import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

describe("proxyRequest", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("makes GET request with correct URL", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ test: true }) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const { proxyRequest } = await import("../../src/lib/gateway");
    await proxyRequest("http://localhost:4001", "/test-path");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:4001/test-path",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("includes Content-Type header", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const { proxyRequest } = await import("../../src/lib/gateway");
    await proxyRequest("http://localhost:4001", "/test");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("includes x-user header when user is provided", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const user = { id: "u1", email: "test@test.com", name: "Test", role: "BUYER" };
    const { proxyRequest } = await import("../../src/lib/gateway");
    await proxyRequest("http://localhost:4001", "/test", { user });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-user": JSON.stringify(user),
        }),
      })
    );
  });

  it("sends body as JSON for POST requests", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const body = { name: "test", value: 42 };
    const { proxyRequest } = await import("../../src/lib/gateway");
    await proxyRequest("http://localhost:4001", "/test", {
      method: "POST",
      body,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      })
    );
  });

  it("does not send body for GET requests even if provided", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const { proxyRequest } = await import("../../src/lib/gateway");
    await proxyRequest("http://localhost:4001", "/test", {
      method: "GET",
      body: { shouldNotAppear: true },
    });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callArgs.body).toBeUndefined();
  });

  it("returns data and status", async () => {
    const responseData = { id: "123", name: "test" };
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const { proxyRequest } = await import("../../src/lib/gateway");
    const result = await proxyRequest("http://localhost:4001", "/test");

    expect(result.data).toEqual(responseData);
    expect(result.status).toBe(200);
  });

  it("returns error status correctly", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const { proxyRequest } = await import("../../src/lib/gateway");
    const result = await proxyRequest("http://localhost:4001", "/missing");

    expect(result.status).toBe(404);
    expect(result.data.error).toBe("Not found");
  });
});

describe("Service URLs", () => {
  it("exports service URL constants", async () => {
    const gateway = await import("../../src/lib/gateway");
    expect(gateway.USERS_SERVICE).toBeDefined();
    expect(gateway.GIGS_SERVICE).toBeDefined();
    expect(gateway.ORDERS_SERVICE).toBeDefined();
    expect(gateway.REQUESTS_SERVICE).toBeDefined();
    expect(gateway.CHAT_SERVICE).toBeDefined();
  });

  it("defaults to localhost URLs", async () => {
    const gateway = await import("../../src/lib/gateway");
    expect(gateway.USERS_SERVICE).toContain("localhost");
    expect(gateway.GIGS_SERVICE).toContain("localhost");
    expect(gateway.ORDERS_SERVICE).toContain("localhost");
    expect(gateway.REQUESTS_SERVICE).toContain("localhost");
    expect(gateway.CHAT_SERVICE).toContain("localhost");
    expect(gateway.CHAT_SERVICE).toContain("4005");
  });
});
