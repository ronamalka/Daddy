import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

/**
 * Helper that fetches the CSRF token and associated cookies (authjs csrf-token,
 * callback-url) from the NextAuth CSRF endpoint.  Returns the token string and
 * a `Cookie` header value that can be forwarded on subsequent requests.
 */
async function fetchCsrf(): Promise<{ csrfToken: string; cookieHeader: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  expect(res.status).toBe(200);
  const data = (await res.json()) as { csrfToken: string };
  expect(data.csrfToken).toBeTruthy();

  const rawCookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = rawCookies
    .map((c) => c.split(";")[0])
    .join("; ");

  return { csrfToken: data.csrfToken, cookieHeader };
}

/**
 * Performs the NextAuth credential callback and returns the response + any
 * session cookie that was set.
 */
async function loginWithCredentials(
  email: string,
  password: string,
  csrf?: { csrfToken: string; cookieHeader: string }
) {
  const { csrfToken, cookieHeader } = csrf ?? (await fetchCsrf());

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
    }).toString(),
    redirect: "manual",
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const sessionCookie = setCookies.find(
    (c) =>
      c.startsWith("authjs.session-token=") ||
      c.startsWith("__Secure-authjs.session-token=")
  );
  const location = res.headers.get("location") ?? "";

  return { status: res.status, location, sessionCookie, setCookies };
}

describe("System Tests — Auth API", () => {
  describe("CSRF Token Endpoint", () => {
    it("returns a CSRF token with expected cookies", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/csrf`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as { csrfToken: string };
      expect(data.csrfToken).toBeTruthy();
      expect(typeof data.csrfToken).toBe("string");
      expect(data.csrfToken.length).toBeGreaterThan(10);

      const setCookies = res.headers.getSetCookie?.() ?? [];
      const hasAuthJsCsrf = setCookies.some((c) =>
        c.includes("authjs.csrf-token")
      );
      expect(hasAuthJsCsrf).toBe(true);
    });

    it("returns a fresh token on each call", async () => {
      const { csrfToken: token1 } = await fetchCsrf();
      const { csrfToken: token2 } = await fetchCsrf();
      expect(token1).not.toBe(token2);
    });
  });

  describe("Auth Providers Endpoint", () => {
    it("lists available providers including credentials", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/providers`);
      expect(res.status).toBe(200);

      const providers = (await res.json()) as Record<
        string,
        { id: string; name: string; type: string }
      >;
      expect(providers).toHaveProperty("credentials");
      expect(providers.credentials.type).toBe("credentials");
    });

    it("lists google as a provider", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/providers`);
      const providers = (await res.json()) as Record<
        string,
        { id: string; name: string; type: string }
      >;
      expect(providers).toHaveProperty("google");
      expect(providers.google.type).toBe("oidc");
    });
  });

  describe("Credential Login Flow", () => {
    it("successful login sets a session cookie and redirects home", async () => {
      const result = await loginWithCredentials(
        "admin@daddy.com",
        "password123"
      );

      expect(result.status).toBe(302);
      expect(result.location).not.toContain("error=");
      expect(result.sessionCookie).toBeTruthy();
    });

    it("wrong password redirects with CredentialsSignin error", async () => {
      const result = await loginWithCredentials(
        "admin@daddy.com",
        "definitely-wrong-password"
      );

      expect(result.status).toBe(302);
      expect(result.location).toContain("error=CredentialsSignin");
      expect(result.sessionCookie).toBeUndefined();
    });

    it("non-existent user redirects with CredentialsSignin error", async () => {
      const result = await loginWithCredentials(
        "does-not-exist@example.com",
        "somepassword"
      );

      expect(result.status).toBe(302);
      expect(result.location).toContain("error=CredentialsSignin");
      expect(result.sessionCookie).toBeUndefined();
    });

    it("missing CSRF token causes MissingCSRF error", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=admin@daddy.com&password=password123",
        redirect: "manual",
      });

      expect(res.status).toBe(302);
      expect(res.headers.get("location") ?? "").toContain("MissingCSRF");
    });
  });

  describe("Session API", () => {
    it("returns empty session for unauthenticated request", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/session`);
      expect(res.status).toBe(200);
      const session = await res.json();
      expect(session).toEqual({});
    });

    it("returns user data after successful login", async () => {
      const csrf = await fetchCsrf();
      const login = await loginWithCredentials(
        "admin@daddy.com",
        "password123",
        csrf
      );
      expect(login.sessionCookie).toBeTruthy();

      const allCookies = login.setCookies
        .map((c) => c.split(";")[0])
        .concat(csrf.cookieHeader.split("; ").filter(Boolean))
        .join("; ");

      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: allCookies },
      });
      expect(sessionRes.status).toBe(200);
      const session = (await sessionRes.json()) as {
        user?: { id: string; email: string; role: string };
      };
      expect(session.user).toBeDefined();
      expect(session.user?.email).toBe("admin@daddy.com");
      expect(session.user?.id).toBeTruthy();
      expect(session.user?.role).toBe("ADMIN");
    });
  });

  describe("Google OAuth Initiation", () => {
    it("signin/google endpoint exists and returns a redirect", async () => {
      const csrf = await fetchCsrf();
      const res = await fetch(`${BASE_URL}/api/auth/signin/google`, {
        headers: { Cookie: csrf.cookieHeader },
        redirect: "manual",
      });

      expect(res.status).toBe(302);
      const location = res.headers.get("location") ?? "";
      // In CI the Google client ID is a test value, so Auth.js may redirect to
      // /api/auth/error?error=Configuration or to accounts.google.com.
      // Both are valid — the important thing is the endpoint exists and responds.
      expect(
        location.includes("accounts.google.com") ||
          location.includes("/api/auth/error")
      ).toBe(true);
    });
  });

  describe("Auth Rate Limiting", () => {
    it("rate limit headers are present on auth requests", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/csrf`);
      expect(res.headers.get("x-ratelimit-limit")).toBeTruthy();
      expect(res.headers.get("x-ratelimit-remaining")).toBeTruthy();
    });
  });

  describe("CSRF Protection on Mutations", () => {
    it("rejects POST to protected endpoint without CSRF token", async () => {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          email: "test@test.com",
          password: "Test1234!",
          role: "BUYER",
        }),
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("CSRF");
    });
  });

  describe("Registration", () => {
    let csrfToken: string;
    let cookieHeader: string;

    beforeAll(async () => {
      const csrf = await fetchCsrf();
      csrfToken = csrf.csrfToken;
      cookieHeader = csrf.cookieHeader;

      const res = await fetch(BASE_URL);
      const setCookies = res.headers.getSetCookie?.() ?? [];
      const middlewareCsrf = setCookies.find((c) => c.startsWith("csrf_token="));
      if (middlewareCsrf) {
        const token = middlewareCsrf.split("=")[1].split(";")[0];
        csrfToken = token;
        cookieHeader = [cookieHeader, `csrf_token=${token}`]
          .filter(Boolean)
          .join("; ");
      }
    });

    it("rejects registration with missing fields", async () => {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects weak passwords", async () => {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          name: "Test",
          email: `weak-pw-${Date.now()}@test.com`,
          password: "12",
          role: "BUYER",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects duplicate emails", async () => {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          name: "Dup",
          email: "admin@daddy.com",
          password: "Test1234!",
          role: "BUYER",
        }),
      });
      expect([400, 409]).toContain(res.status);
    });
  });
});
