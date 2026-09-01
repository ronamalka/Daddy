import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  USERS_SERVICE: "http://users.test",
  GIGS_SERVICE: "http://gigs.test",
  ORDERS_SERVICE: "http://orders.test",
}));

import { proxyRequest } from "@/lib/gateway";
import { resolveAllowedGigCategory } from "@/lib/gig-category";

const mockedProxy = vi.mocked(proxyRequest);
const seller = { id: "s1", email: "s@test.com", name: "יוסי", role: "SELLER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveAllowedGigCategory", () => {
  it("accepts a local category the daddy already prices", async () => {
    mockedProxy.mockResolvedValueOnce({
      data: [{ serviceSlug: "furniture-assembly", price: 200 }],
      status: 200,
    });

    await expect(resolveAllowedGigCategory(seller, "assembly-and-installation")).resolves.toEqual({
      slug: "assembly-and-installation",
    });
  });

  it("maps a leftover Fiverr slug onto the local catalog", async () => {
    mockedProxy.mockResolvedValueOnce({
      data: [{ serviceSlug: "car-test", price: 150 }],
      status: 200,
    });

    await expect(resolveAllowedGigCategory(seller, "car-transport")).resolves.toEqual({
      slug: "car-and-errands",
    });
  });

  it("rejects a category that is not on the price list", async () => {
    mockedProxy.mockResolvedValueOnce({
      data: [{ serviceSlug: "furniture-assembly", price: 200 }],
      status: 200,
    });

    await expect(resolveAllowedGigCategory(seller, "events-and-family")).resolves.toMatchObject({
      status: 400,
    });
  });

  it("lets an existing package keep its current category", async () => {
    mockedProxy.mockImplementation(async (_url, path) => {
      if (path === "/service-prices") {
        return { data: [{ serviceSlug: "furniture-assembly", price: 200 }], status: 200 };
      }
      if (path === "/gigs/gig-1") {
        return { data: { category: { slug: "home-maintenance" } }, status: 200 };
      }
      return { data: null, status: 404 };
    });

    await expect(resolveAllowedGigCategory(seller, "home-maintenance", "gig-1")).resolves.toEqual({
      slug: "home-maintenance",
    });
  });
});
