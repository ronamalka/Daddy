import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  USERS_SERVICE: "http://users.test",
}));

import { auth } from "@/lib/auth";
import { proxyRequest } from "@/lib/gateway";
import { POST as becomeSeller } from "@/app/api/profile/become-seller/route";
import { GET as getReadiness } from "@/app/api/profile/readiness/route";

const mockedAuth = vi.mocked(auth);
const mockedProxy = vi.mocked(proxyRequest);
const user = { id: "cluser1", email: "avi@example.com", name: "Avi", role: "BUYER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/profile/become-seller", () => {
  it("returns 401 when signed out", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await becomeSeller(
      new Request("http://localhost/api/profile/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ independentContractor: true }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("requires independent-contractor confirmation", async () => {
    mockedAuth.mockResolvedValue({ user } as never);
    const res = await becomeSeller(
      new Request("http://localhost/api/profile/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ independentContractor: false }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockedProxy).not.toHaveBeenCalled();
  });

  it("proxies a confirmed upgrade", async () => {
    mockedAuth.mockResolvedValue({ user } as never);
    mockedProxy.mockResolvedValue({ data: { id: user.id, role: "SELLER" }, status: 200 });
    const res = await becomeSeller(
      new Request("http://localhost/api/profile/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ independentContractor: true }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://users.test",
      "/profile/become-seller",
      expect.objectContaining({ method: "POST", body: { independentContractor: true } })
    );
  });
});

describe("GET /api/profile/readiness", () => {
  it("returns 401 when signed out", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await getReadiness();
    expect(res.status).toBe(401);
  });

  it("proxies checklist progress", async () => {
    mockedAuth.mockResolvedValue({ user } as never);
    mockedProxy.mockResolvedValue({
      data: { role: "SELLER", complete: false, percent: 40, completedCount: 2, total: 5, items: {} },
      status: 200,
    });
    const res = await getReadiness();
    expect(res.status).toBe(200);
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://users.test",
      "/profile/readiness",
      expect.objectContaining({ user })
    );
  });
});
