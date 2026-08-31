import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  GIGS_SERVICE: "http://gigs.test",
  ORDERS_SERVICE: "http://orders.test",
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { proxyRequest } from "@/lib/gateway";
import { POST } from "@/app/api/orders/[id]/review/route";

const mockedAuth = vi.mocked(auth);
const mockedProxy = vi.mocked(proxyRequest);
const buyer = { id: "seed-user-buyer1", email: "buyer@daddy.com", name: "דנה", role: "BUYER" };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.TURNSTILE_SECRET_KEY;
  mockedAuth.mockResolvedValue({ user: buyer } as never);
});

function reviewRequest(orderId: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/orders/${orderId}/review`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Playwright)",
      accept: "application/json",
      "accept-language": "he",
    },
    body: JSON.stringify({
      _hp_field: "",
      _formLoadedAt: Date.now() - 5000,
      ...body,
    }),
  });
}

describe("POST /api/orders/:id/review", () => {
  it("sends sellerId and a null gigId for a completed local job", async () => {
    mockedProxy.mockImplementation(async (url: string, path: string, opts?: { method?: string; body?: unknown }) => {
      if (url === "http://orders.test") {
        return {
          data: {
            id: "ord-23",
            buyerId: buyer.id,
            sellerId: "seed-user-seller1",
            gigId: null,
            jobType: "LOCAL_REQUEST",
            status: "COMPLETED",
          },
          status: 200,
        };
      }
      if (url === "http://gigs.test" && path === "/reviews" && opts?.method === "POST") {
        return { data: { id: "rev-local", ...(opts.body as object) }, status: 201 };
      }
      return { data: null, status: 404 };
    });

    const res = await POST(
      reviewRequest("ord-23", {
        comment: "השידה יציבה והגיע בזמן",
        ratingAttitude: 9,
        ratingTimeliness: 10,
        ratingPrice: 8,
        ratingQuality: 9,
      }) as never,
      { params: Promise.resolve({ id: "ord-23" }) }
    );

    expect(res.status).toBe(201);
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://gigs.test",
      "/reviews",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          orderId: "ord-23",
          gigId: null,
          sellerId: "seed-user-seller1",
          rating: 9,
          ratingAttitude: 9,
          ratingTimeliness: 10,
          ratingPrice: 8,
          ratingQuality: 9,
        }),
      })
    );
  });

  it("rejects a 1–5 leftover score on the 1–10 contract", async () => {
    mockedProxy.mockResolvedValue({
      data: {
        id: "ord-1",
        buyerId: buyer.id,
        sellerId: "seed-user-seller1",
        gigId: "seed-gig-ikea",
        status: "COMPLETED",
      },
      status: 200,
    });

    const res = await POST(
      reviewRequest("ord-1", {
        comment: "ok",
        ratingAttitude: 5,
        ratingTimeliness: 5,
        ratingPrice: 5,
        ratingQuality: 11,
      }) as never,
      { params: Promise.resolve({ id: "ord-1" }) }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/1 and 10/);
  });
});
