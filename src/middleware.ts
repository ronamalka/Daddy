import { NextRequest, NextResponse } from "next/server";

// --- Rate Limiting ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;

const RATE_LIMIT_AUTH = parseInt(process.env.RATE_LIMIT_AUTH || "10", 10);
const RATE_LIMIT_POST = parseInt(process.env.RATE_LIMIT_POST || "30", 10);
const RATE_LIMIT_DEFAULT = parseInt(process.env.RATE_LIMIT_DEFAULT || "120", 10);

const TIERS: { match: (path: string, method: string) => boolean; limit: number }[] = [
  {
    match: (path) =>
      path.startsWith("/api/auth") ||
      path.startsWith("/api/register") ||
      path.startsWith("/api/password-reset"),
    limit: RATE_LIMIT_AUTH,
  },
  {
    match: (_path, method) => method === "POST",
    limit: RATE_LIMIT_POST,
  },
  {
    match: () => true,
    limit: RATE_LIMIT_DEFAULT,
  },
];

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkRateLimit(request: NextRequest, pathname: string): NextResponse | null {
  const method = request.method;
  const tier = TIERS.find((t) => t.match(pathname, method));
  if (!tier) return null;

  const ip = getClientIp(request);
  const key = `${ip}:${tier.limit}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > tier.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    console.warn(
      `[rate-limit] ${ip} exceeded ${tier.limit} req/min on ${method} ${pathname}`
    );
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(tier.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

function setRateLimitHeaders(response: NextResponse, request: NextRequest, pathname: string) {
  const method = request.method;
  const tier = TIERS.find((t) => t.match(pathname, method));
  if (!tier) return;

  const ip = getClientIp(request);
  const key = `${ip}:${tier.limit}`;
  const entry = store.get(key);
  if (entry) {
    response.headers.set("X-RateLimit-Limit", String(tier.limit));
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, tier.limit - entry.count)));
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

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT.some((prefix) => pathname.startsWith(prefix));
}

// --- Main Middleware ---

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
