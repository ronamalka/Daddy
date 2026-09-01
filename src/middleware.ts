import { NextRequest, NextResponse } from "next/server";
import {
  RATE_LIMIT_WINDOW_MS,
  clientIpFromHeaders,
  rateLimitKey,
  resolveRateLimitTier,
} from "@/lib/rate-limit";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * WARNING: This in-memory store is per-process. In Kubernetes with multiple
 * pods, each pod tracks its own counters, so the effective rate limit is
 * multiplied by the replica count. This is acceptable as a first line of
 * defence, but critical auth paths (login, register, password-reset) also
 * enforce a Redis-backed limit at the route handler level that works across
 * all pods. See src/lib/rate-limit-redis.ts.
 */
const store = new Map<string, RateLimitEntry>();

/** Drops expired in-memory rate-limit entries every minute. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

/** Returns the client IP from request headers. */
function getClientIp(request: NextRequest): string {
  return clientIpFromHeaders(request.headers);
}

/** Reads the Auth.js session cookie if present. */
function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value
  );
}

/** Builds the in-memory rate-limit key and the request limit for this path. */
function limitStoreKey(request: NextRequest, pathname: string): { key: string; limit: number } {
  const method = request.method;
  const tier = resolveRateLimitTier(pathname, method);
  const ip = getClientIp(request);
  const key = rateLimitKey(ip, getSessionToken(request), tier.limit);
  return { key, limit: tier.limit };
}

/** Counts this request. Returns a 429 response if over the limit, otherwise null. */
function checkRateLimit(request: NextRequest, pathname: string): NextResponse | null {
  const { key, limit } = limitStoreKey(request, pathname);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const ip = getClientIp(request);
    console.warn(
      `[rate-limit] ${ip} exceeded ${limit} req/min on ${request.method} ${pathname}`
    );
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

/** Adds remaining-request headers onto the response. */
function setRateLimitHeaders(response: NextResponse, request: NextRequest, pathname: string) {
  const { key, limit } = limitStoreKey(request, pathname);
  const entry = store.get(key);
  if (entry) {
    response.headers.set("X-RateLimit-Limit", String(limit));
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  }
}

// --- CSRF Protection (Double-Submit Cookie) ---

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_EXEMPT = [
  "/api/auth",
];

/** Creates a random hex CSRF token. */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns true if this path skips CSRF checks. */
function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT.some((prefix) => pathname.startsWith(prefix));
}

// --- Main Middleware ---

/** Rate-limits API routes, checks CSRF on writes, and sets the CSRF cookie. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Non-API routes: only seed the CSRF cookie
  if (!isApi) {
    if (request.cookies.get(CSRF_COOKIE)) {
      return NextResponse.next();
    }
    const response = NextResponse.next();
    response.cookies.set(CSRF_COOKIE, generateToken(), {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  }

  // Rate limiting
  const rateLimited = checkRateLimit(request, pathname);
  if (rateLimited) return rateLimited;

  // CSRF validation for mutations
  if (MUTATION_METHODS.has(request.method) && !isCsrfExempt(pathname)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
    const headerToken = request.headers.get(CSRF_HEADER);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      console.warn(
        `[csrf] Rejected ${request.method} ${pathname} from ${getClientIp(request)}`
      );
      return new NextResponse(
        JSON.stringify({ error: "Invalid or missing CSRF token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const response = NextResponse.next();
  setRateLimitHeaders(response, request, pathname);

  // Set CSRF cookie if missing
  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateToken(), {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|logo.jpeg).*)"],
};
