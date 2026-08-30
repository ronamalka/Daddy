import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  USERS_SERVICE: "http://users.test",
  GIGS_SERVICE: "http://gigs.test",
  ORDERS_SERVICE: "http://orders.test",
}));

import { proxyRequest } from "@/lib/gateway";
import { GET } from "@/app/api/sellers/[id]/route";

const mockedProxy = vi.mocked(proxyRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/sellers/:id", () => {
  it("attaches reviewer names when gigs only return userId", async () => {
    mockedProxy.mockImplementation(async (url: string, path: string) => {
      if (url === "http://users.test" && path === "/sellers/seed-user-seller1") {
        return {
          data: { id: "seed-user-seller1", name: "יוסי הגולדן", city: "תל אביב" },
          status: 200,
        };
      }
      if (url === "http://users.test" && path === "/sellers/seed-user-buyer1") {
        return {
          data: { id: "seed-user-buyer1", name: "דנה לקוחה", city: "חיפה" },
          status: 200,
        };
      }
      if (url === "http://gigs.test") {
        return {
          data: [
            {
              id: "gig1",
              reviews: [
                {
                  id: "rev1",
                  rating: 9,
                  comment: "מעולה",
                  userId: "seed-user-buyer1",
                  createdAt: "2026-01-01T00:00:00.000Z",
                },
              ],
            },
          ],
          status: 200,
        };
      }
      if (url === "http://orders.test") {
        return { data: { completedOrders: 3 }, status: 200 };
      }
      return { data: null, status: 404 };
    });

    const res = await GET(new Request("http://localhost/api/sellers/seed-user-seller1"), {
      params: Promise.resolve({ id: "seed-user-seller1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.allReviews).toHaveLength(1);
    expect(body.allReviews[0].user).toEqual({
      id: "seed-user-buyer1",
      name: "דנה לקוחה",
      city: "חיפה",
    });
  });

  it("falls back to a placeholder reviewer when the user lookup misses", async () => {
    mockedProxy.mockImplementation(async (url: string, path: string) => {
      if (url === "http://users.test" && path === "/sellers/seed-user-seller1") {
        return {
          data: { id: "seed-user-seller1", name: "יוסי הגולדן" },
          status: 200,
        };
      }
      if (url === "http://gigs.test") {
        return {
          data: [
            {
              id: "gig1",
              reviews: [{ id: "rev1", rating: 8, comment: "טוב", userId: "gone" }],
            },
          ],
          status: 200,
        };
      }
      if (url === "http://orders.test") {
        return { data: { completedOrders: 0 }, status: 200 };
      }
      return { data: { error: "Seller not found" }, status: 404 };
    });

    const res = await GET(new Request("http://localhost/api/sellers/seed-user-seller1"), {
      params: Promise.resolve({ id: "seed-user-seller1" }),
    });
    const body = await res.json();
    expect(body.allReviews[0].user.name).toBe("משתמש");
  });
});
