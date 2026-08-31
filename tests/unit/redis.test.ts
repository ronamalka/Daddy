import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInstance = {
  on: vi.fn().mockReturnThis(),
  connect: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

const MockRedis = vi.fn(function (this: typeof mockInstance) {
  Object.assign(this, mockInstance);
}) as unknown as typeof import("ioredis").default;

vi.mock("ioredis", () => ({
  default: MockRedis,
}));

describe("Redis Client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates a Redis instance with correct options", async () => {
    const { getRedis } = await import("@/lib/redis");

    const client = getRedis();
    expect(client).toBeDefined();
    expect(MockRedis).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 1500,
      })
    );
  });

  it("returns the same instance on subsequent calls", async () => {
    const { getRedis } = await import("@/lib/redis");

    const client1 = getRedis();
    const client2 = getRedis();
    expect(client1).toBe(client2);
  });

  it("registers error handler", async () => {
    const { getRedis } = await import("@/lib/redis");

    const client = getRedis();
    expect(client.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("error handler logs to console.error", async () => {
    const { getRedis } = await import("@/lib/redis");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const client = getRedis();
    const onCalls = (client.on as ReturnType<typeof vi.fn>).mock.calls;
    const errorCall = onCalls.find((c: unknown[]) => c[0] === "error");
    const errorHandler = errorCall?.[1] as (err: Error) => void;

    errorHandler(new Error("Connection refused"));
    expect(errorSpy).toHaveBeenCalledWith(
      "[redis] Connection error:",
      "Connection refused"
    );

    errorSpy.mockRestore();
  });
});
