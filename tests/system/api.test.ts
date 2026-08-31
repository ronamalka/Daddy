import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let csrfToken = "";

beforeAll(async () => {
  const res = await fetch(`${BASE_URL}/`);
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/csrf_token=([^;]+)/);
  csrfToken = match?.[1] || "";
});

async function fetchApi(path: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (csrfToken && options?.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method)) {
    headers["x-csrf-token"] = csrfToken;
    headers["cookie"] = `csrf_token=${csrfToken}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
}

describe("System Tests — Public API", () => {
  describe("GET /api/gigs", () => {
    it("returns 200 with gigs and total", async () => {
      const { status, body } = await fetchApi("/api/gigs");
      expect(status).toBe(200);
      expect(body).toHaveProperty("gigs");
      expect(body).toHaveProperty("total");
      expect(Array.isArray(body.gigs)).toBe(true);
    });

    it("returns gigs with expected shape", async () => {
      const { body } = await fetchApi("/api/gigs");
      if (body.gigs.length > 0) {
        const gig = body.gigs[0];
        expect(gig).toHaveProperty("id");
        expect(gig).toHaveProperty("title");
        expect(gig).toHaveProperty("seller");
        expect(gig.seller).toHaveProperty("id");
        expect(gig.seller).toHaveProperty("name");
      }
    });

    it("filters by category", async () => {
      const { status, body } = await fetchApi(
        "/api/gigs?category=home-maintenance"
      );
      expect(status).toBe(200);
      expect(Array.isArray(body.gigs)).toBe(true);
    });

    it("handles search parameter", async () => {
      const { status } = await fetchApi("/api/gigs?search=הרכבה");
      expect(status).toBe(200);
    });

    it("handles non-existent category gracefully", async () => {
      const { status, body } = await fetchApi(
        "/api/gigs?category=nonexistent"
      );
      expect(status).toBe(200);
      expect(body.gigs).toEqual([]);
    });

    it("handles pagination parameters", async () => {
      const { status, body } = await fetchApi("/api/gigs?limit=2&offset=0");
      expect(status).toBe(200);
      expect(body).toHaveProperty("hasMore");
    });

    it("handles district filter", async () => {
      const { status, body } = await fetchApi("/api/gigs?district=תל אביב");
      expect(status).toBe(200);
      expect(Array.isArray(body.gigs)).toBe(true);
    });
  });

  describe("GET /api/gigs/:id", () => {
    it("returns 404 for non-existent gig", async () => {
      const { status } = await fetchApi("/api/gigs/nonexistent-id-12345");
      expect(status).toBe(404);
    });

    it("returns gig detail for valid seed gig", async () => {
      const { status, body } = await fetchApi("/api/gigs/seed-gig-ikea");
      if (status === 200) {
        expect(body).toHaveProperty("title");
        expect(body).toHaveProperty("seller");
        expect(body).toHaveProperty("tiers");
        expect(body.tiers.length).toBeGreaterThan(0);
        expect(body.seller).toHaveProperty("name");
        if (Array.isArray(body.reviews) && body.reviews.length > 0) {
          expect(body.reviews[0].user).toEqual(expect.objectContaining({ name: expect.any(String) }));
        }
      }
    });
  });

  describe("GET /api/featured-daddies", () => {
    it("returns 200 with array", async () => {
      const { status, body } = await fetchApi("/api/featured-daddies");
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns at most 6 featured sellers", async () => {
      const { body } = await fetchApi("/api/featured-daddies");
      expect(body.length).toBeLessThanOrEqual(6);
    });

    it("featured sellers have expected properties", async () => {
      const { body } = await fetchApi("/api/featured-daddies");
      if (body.length > 0) {
        const seller = body[0];
        expect(seller).toHaveProperty("id");
        expect(seller).toHaveProperty("name");
        expect(seller).toHaveProperty("reviewCount");
        expect(seller).toHaveProperty("avgRating");
        expect(seller).toHaveProperty("completedOrders");
      }
    });

    it("omits incomplete daddy profiles", async () => {
      const { status, body } = await fetchApi("/api/featured-daddies");
      expect(status).toBe(200);
      const ids = (body as { id: string }[]).map((s) => s.id);
      expect(ids).not.toContain("seed-user-incomplete");
    });
  });

  describe("GET /api/locations", () => {
    it("returns 200 with districts even if the government city list is down", async () => {
      const { status, body } = await fetchApi("/api/locations");
      expect(status).toBe(200);
      expect(Array.isArray(body.districts)).toBe(true);
      expect(body.districts.length).toBeGreaterThan(0);
      expect(Array.isArray(body.cities)).toBe(true);
    });
  });

  describe("GET /api/providers", () => {
    it("returns 200", async () => {
      const { status } = await fetchApi("/api/providers");
      expect(status).toBe(200);
    });

    it("omits incomplete daddy profiles", async () => {
      const { status, body } = await fetchApi("/api/providers");
      expect(status).toBe(200);
      const ids = (body as { id: string }[]).map((s) => s.id);
      expect(ids).not.toContain("seed-user-incomplete");
      expect(ids).toContain("seed-user-seller1");
    });
  });

  describe("GET /api/profile/readiness", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/profile/readiness");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/service-requests", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/service-requests");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/recent-reviews", () => {
    it("returns 200", async () => {
      const { status } = await fetchApi("/api/recent-reviews");
      expect(status).toBe(200);
    });
  });

  describe("GET /api/sellers/:id", () => {
    it("returns seller profile for valid seed seller", async () => {
      const { status, body } = await fetchApi("/api/sellers/seed-seller-1");
      if (status === 200) {
        expect(body).toHaveProperty("name");
        expect(body).toHaveProperty("gigs");
        expect(body).toHaveProperty("avgRating");
        expect(body).toHaveProperty("totalReviews");
        expect(body).toHaveProperty("completedOrders");
        expect(Array.isArray(body.gigs)).toBe(true);
      }
    });

    it("returns 404 for non-existent seller", async () => {
      const { status } = await fetchApi("/api/sellers/nonexistent-seller-xyz");
      expect(status).toBe(404);
    });
  });
});

describe("System Tests — Auth-Protected API", () => {
  describe("POST /api/register", () => {
    it("rejects registration with missing fields", async () => {
      const { status, body } = await fetchApi("/api/register", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("rejects registration with duplicate email", async () => {
      const { status } = await fetchApi("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Dup User",
          email: "admin@daddy.com",
          password: "Test@1234!",
          role: "BUYER",
        }),
      });
      expect([400, 409]).toContain(status);
    });

    it("handles registration with short password", async () => {
      const { status } = await fetchApi("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: `newuser-short-pw-${Date.now()}@test.com`,
          password: "12",
          role: "BUYER",
        }),
      });
      // Zod rejects password < 8 chars at gateway level
      expect(status).toBe(400);
    });
  });

  describe("GET /api/sellers/:id/availability", () => {
    it("returns 404 for an unknown seller", async () => {
      const { status } = await fetchApi("/api/sellers/does-not-exist/availability");
      expect([404, 502]).toContain(status);
    });
  });

  describe("GET /api/availability", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/availability");
      expect(status).toBe(401);
    });
  });

  describe("PUT /api/availability", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/availability", {
        method: "PUT",
        body: JSON.stringify({ acceptingJobs: true, weeklyHours: [], timeOff: [] }),
      });
      expect(status).toBe(401);
    });
  });

  describe("POST /api/service-requests/:id/accept", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/service-requests/req-1/accept", {
        method: "POST",
        body: JSON.stringify({ responseId: "quote-1" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/orders", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/orders");
      expect(status).toBe(401);
    });
  });

  describe("POST /api/orders", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/orders", {
        method: "POST",
        body: JSON.stringify({ gigId: "test", tier: "BASIC" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("POST /api/gigs (create)", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/gigs", {
        method: "POST",
        body: JSON.stringify({
          title: "Test",
          description: "Test",
          categoryId: "cat-1",
          tiers: [
            {
              tier: "BASIC",
              title: "Basic",
              description: "",
              price: 10,
              deliveryDays: 3,
              revisions: 1,
            },
          ],
        }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/profile", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/profile");
      expect(status).toBe(401);
    });
  });

  describe("PUT /api/profile", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("PUT /api/profile/password", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: "old", newPassword: "NewPass1!" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/favorites", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/favorites");
      expect(status).toBe(401);
    });
  });

  describe("POST /api/favorites", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ gigId: "gig-1" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/service-areas", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/service-areas");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/service-prices", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/service-prices");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/user-services", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/user-services");
      expect(status).toBe(401);
    });
  });

  describe("POST /api/messages", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/messages", {
        method: "POST",
        body: JSON.stringify({ content: "test" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/messages", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/messages");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/messages/conversations", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/messages/conversations");
      expect(status).toBe(401);
    });
  });

  describe("GET /api/messages/unread-count", () => {
    it("returns count 0 without auth (graceful fallback)", async () => {
      const { status, body } = await fetchApi("/api/messages/unread-count");
      expect(status).toBe(200);
      expect(body).toHaveProperty("count", 0);
    });
  });

  describe("POST /api/service-requests (create)", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/service-requests", {
        method: "POST",
        body: JSON.stringify({
          title: "Need help",
          description: "Details",
          categorySlug: "furniture-assembly",
        }),
      });
      expect(status).toBe(401);
    });
  });

  describe("GET /api/admin/stats", () => {
    it("rejects unauthenticated requests", async () => {
      const { status } = await fetchApi("/api/admin/stats");
      expect([401, 403]).toContain(status);
    });
  });

  describe("GET /api/admin/users", () => {
    it("rejects unauthenticated requests", async () => {
      const { status } = await fetchApi("/api/admin/users");
      expect([401, 403]).toContain(status);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/orders/some-order-id");
      expect(status).toBe(401);
    });
  });

  describe("PATCH /api/orders/:id", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/orders/some-order-id", {
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("POST /api/orders/:id/review", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/orders/some-order-id/review", {
        method: "POST",
        body: JSON.stringify({
          comment: "Great",
          ratingAttitude: 8,
          ratingTimeliness: 8,
          ratingPrice: 8,
          ratingQuality: 8,
        }),
      });
      expect(status).toBe(401);
    });
  });

  describe("POST /api/reviews/:id/flag", () => {
    it("returns 401 without auth", async () => {
      const { status } = await fetchApi("/api/reviews/some-review-id/flag", {
        method: "POST",
        body: JSON.stringify({ reason: "spam" }),
      });
      expect(status).toBe(401);
    });
  });

  describe("POST /api/password-reset", () => {
    it("rejects invalid action", async () => {
      const { status } = await fetchApi("/api/password-reset?action=invalid", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(status).toBe(400);
    });

    it("rejects missing action", async () => {
      const { status } = await fetchApi("/api/password-reset", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(status).toBe(400);
    });

    it("accepts valid request action", async () => {
      const { status } = await fetchApi(
        "/api/password-reset?action=request",
        {
          method: "POST",
          body: JSON.stringify({ email: "nonexistent@test.com" }),
        }
      );
      expect([200, 400, 404, 500]).toContain(status);
    });
  });
});

describe("System Tests — Health & Pages", () => {
  it("homepage returns 200", async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);
  });

  it("homepage returns HTML", async () => {
    const res = await fetch(BASE_URL);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });

  it("login page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    expect(res.status).toBe(200);
  });

  it("register page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/register`);
    expect(res.status).toBe(200);
  });

  it("gigs page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/gigs`);
    expect(res.status).toBe(200);
  });

  it("how-it-works page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/how-it-works`);
    expect(res.status).toBe(200);
  });

  it("about page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/about`);
    expect(res.status).toBe(200);
  });

  it("terms page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/terms`);
    expect(res.status).toBe(200);
  });

  it("privacy page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/privacy`);
    expect(res.status).toBe(200);
  });

  it("accessibility page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/accessibility`);
    expect(res.status).toBe(200);
  });

  it("become-a-daddy page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/become-a-daddy`);
    expect(res.status).toBe(200);
  });

  it("onboarding page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/onboarding`);
    expect(res.status).toBe(200);
  });

  it("forgot-password page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/forgot-password`);
    expect(res.status).toBe(200);
  });

  it("requests/create page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/requests/create`);
    expect(res.status).toBe(200);
  });

  it("auth CSRF endpoint works", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/csrf`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("csrfToken");
  });

  it("robots.txt is accessible", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    expect(res.status).toBe(200);
  });

  it("sitemap.xml is accessible", async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    expect(res.status).toBe(200);
  });

  it("manifest.webmanifest is accessible", async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status).toBe(200);
  });
});
