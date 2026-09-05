import { NextRequest, NextResponse } from "next/server";
import {
  RATE_LIMIT_WINDOW_MS,
  clientIpFromHeaders,
  rateLimitKey,
  resolveRateLimitTier,
} from "@/lib/rate-limit";
import { checkRateLimit as redisRateLimit } from "@/lib/rate-limit-redis";

const RATE_LIMIT_WINDOW_SECONDS = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

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

/**
 * Checks the Redis-backed rate limit for this request.
 *
 * Uses the same tier-based limits (auth, write, public, default) and
 * per-IP+session key scheme as before, but backed by Redis so counters
 * are shared across all pods.
 *
 * On Redis failure the request is allowed through (fail-open) so a
 * Redis outage does not block legitimate users.
 */
async function applyRateLimit(
  request: NextRequest,
  pathname: string
): Promise<{ blocked: NextResponse | null; limit: number; remaining: number }> {
  const method = request.method;
  const tier = resolveRateLimitTier(pathname, method);
  const ip = getClientIp(request);
  const key = `mw:${rateLimitKey(ip, getSessionToken(request), tier.limit)}`;

  const result = await redisRateLimit(key, tier.limit, RATE_LIMIT_WINDOW_SECONDS);

  if (!result.allowed) {
    console.warn(
      `[rate-limit] ${ip} exceeded ${tier.limit} req/min on ${method} ${pathname}`
    );
    const blocked = new NextResponse(
      JSON.stringify({ error: "Too many requests. Try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSeconds),
          "X-RateLimit-Limit": String(tier.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
    return { blocked, limit: tier.limit, remaining: 0 };
  }

  return {
    blocked: null,
    limit: tier.limit,
    remaining: Math.max(0, tier.limit - result.current),
  };
}

// --- CSP Nonce ---

/** Generates a random base64 nonce for Content-Security-Policy. */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/** Builds a CSP header string with the given nonce and strict-dynamic. */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://analytics.aballeh.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://accounts.google.com https://challenges.cloudflare.com https://analytics.aballeh.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
  ].join("; ");
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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Non-API routes: generate CSP nonce, set security headers, seed CSRF cookie
  if (!isApi) {
    const nonce = generateNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set("Content-Security-Policy", buildCsp(nonce));
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

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

  // Rate limiting (Redis-backed, shared across all pods)
  const { blocked, limit, remaining } = await applyRateLimit(request, pathname);
  if (blocked) return blocked;

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
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

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
