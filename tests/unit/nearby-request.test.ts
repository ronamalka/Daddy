import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  USERS_SERVICE: "http://users.test",
}));

import { proxyRequest } from "@/lib/gateway";
import { notifyNearbySellers } from "@/lib/nearby-request";

const mockedProxy = vi.mocked(proxyRequest);
const user = { id: "buyer-1", email: "a@b.com", name: "Avi", role: "BUYER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notifyNearbySellers", () => {
  it("does nothing when create did not return an id", async () => {
    await expect(notifyNearbySellers(user, {})).resolves.toEqual({ notified: 0 });
    expect(mockedProxy).not.toHaveBeenCalled();
  });

  it("posts NEW_NEARBY_REQUEST match input to the users service", async () => {
    mockedProxy.mockResolvedValue({ data: { notified: 3 }, status: 200 });
    const result = await notifyNearbySellers(user, {
      id: "req-1",
      title: "הרכבת ארון",
      serviceSlug: "furniture-assembly",
      cityCode: 6600,
      cityName: "חולון",
      districtCode: 4,
      districtName: "המרכז",
    });
    expect(result).toEqual({ notified: 3 });
    expect(mockedProxy).toHaveBeenCalledWith("http://users.test", "/notifications/nearby-request", {
      method: "POST",
      body: expect.objectContaining({
        requestId: "req-1",
        buyerId: "buyer-1",
        serviceSlug: "furniture-assembly",
        cityCode: 6600,
      }),
      user,
    });
  });

  it("does not throw when matching fails", async () => {
    mockedProxy.mockResolvedValue({ data: null, status: 502 });
    await expect(
      notifyNearbySellers(user, { id: "req-1", title: "x", buyerId: "buyer-1" })
    ).resolves.toEqual({ notified: 0 });
  });
});
