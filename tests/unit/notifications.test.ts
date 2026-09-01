import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  USERS_SERVICE: "http://users.test",
  GIGS_SERVICE: "http://gigs.test",
  ORDERS_SERVICE: "http://orders.test",
  CHAT_SERVICE: "http://chat.test",
}));

import { auth } from "@/lib/auth";
import { proxyRequest } from "@/lib/gateway";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { POST as markRead } from "@/app/api/notifications/mark-read/route";

const mockedAuth = vi.mocked(auth);
const mockedProxy = vi.mocked(proxyRequest);
const user = { id: "seller-1", email: "avi@example.com", name: "Avi", role: "SELLER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/notifications", () => {
  it("merges persisted nearby-request alerts with order and chat items", async () => {
    mockedAuth.mockResolvedValue({ user } as never);
    mockedProxy.mockImplementation(async (url: string, path: string) => {
      if (url === "http://orders.test") {
        return {
          data: [
            {
              id: "ord-1",
              sellerId: "seller-1",
              buyerId: "buyer-1",
              status: "PENDING",
              price: 200,
              createdAt: "2026-08-31T10:00:00.000Z",
            },
          ],
          status: 200,
        };
      }
      if (url === "http://chat.test") {
        return { data: [], status: 200 };
      }
      if (url === "http://gigs.test") {
        return { data: null, status: 404 };
      }
      if (url === "http://users.test" && path === "/notifications") {
        return {
          data: [
            {
              id: "n-1",
              type: "NEW_NEARBY_REQUEST",
              title: "בקשה חדשה באזור שלך",
              message: "תליית טלוויזיה בחולון",
              href: "/requests/req-1",
              createdAt: "2026-08-31T11:00:00.000Z",
              readAt: null,
            },
          ],
          status: 200,
        };
      }
      return { data: null, status: 404 };
    });

    const res = await getNotifications();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toMatchObject({
      id: "n-1",
      type: "NEW_NEARBY_REQUEST",
      href: "/requests/req-1",
      read: false,
    });
    expect(body.some((n: { type: string }) => n.type === "NEW_ORDER")).toBe(true);
  });

  it("returns 401 when signed out", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await getNotifications();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/notifications/mark-read", () => {
  it("proxies ids to the users service", async () => {
    mockedAuth.mockResolvedValue({ user } as never);
    mockedProxy.mockResolvedValue({ data: { ok: true }, status: 200 });
    const res = await markRead(
      new Request("http://localhost/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["n-1"] }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockedProxy).toHaveBeenCalledWith("http://users.test", "/notifications/mark-read", {
      method: "POST",
      body: { ids: ["n-1"] },
      user,
    });
  });
});
