import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
}

describe("System Tests — Public API", () => {
  describe("GET /api/gigs", () => {
    it("returns 200 with an array", async () => {
      const { status, body } = await fetchApi("/api/gigs");
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns gigs with expected shape", async () => {
      const { body } = await fetchApi("/api/gigs");
      if (body.length > 0) {
        const gig = body[0];
        expect(gig).toHaveProperty("id");
        expect(gig).toHaveProperty("title");
        expect(gig).toHaveProperty("seller");
        expect(gig).toHaveProperty("category");
        expect(gig).toHaveProperty("tiers");
        expect(gig).toHaveProperty("avgRating");
        expect(gig).toHaveProperty("reviewCount");
      }
    });

    it("filters by category", async () => {
      const { status, body } = await fetchApi("/api/gigs?category=home-maintenance");
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      for (const gig of body) {
        expect(gig.category.slug).toBe("home-maintenance");
      }
    });

    it("handles search parameter", async () => {
      const { status } = await fetchApi("/api/gigs?search=logo");
      expect(status).toBe(200);
    });

    it("handles non-existent category gracefully", async () => {
      const { status, body } = await fetchApi("/api/gigs?category=nonexistent");
      expect(status).toBe(200);
      expect(body).toEqual([]);
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
      }
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
          password: "password123",
        }),
      });
      expect(status).toBe(409);
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
          tiers: [{ tier: "BASIC", title: "Basic", description: "", price: 10, deliveryDays: 3, revisions: 1 }],
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
});

describe("System Tests — Health & Pages", () => {
  it("homepage returns 200", async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);
  });

  it("login page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    expect(res.status).toBe(200);
  });

  it("register page returns 200", async () => {
    const res = await fetch(`${BASE_URL}/register`);
    expect(res.status).toBe(200);
  });

  it("auth CSRF endpoint works", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/csrf`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("csrfToken");
  });
});
