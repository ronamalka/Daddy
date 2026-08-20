import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;

const TIERS: { match: (path: string, method: string) => boolean; limit: number }[] = [
  {
    match: (path) =>
      path.startsWith("/api/auth") ||
      path.startsWith("/api/register") ||
      path.startsWith("/api/password-reset"),
    limit: 10,
  },
  {
    match: (_path, method) => method === "POST",
    limit: 30,
  },
  {
    match: () => true,
    limit: 120,
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const method = request.method;
  const tier = TIERS.find((t) => t.match(pathname, method));
  if (!tier) return NextResponse.next();

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

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(tier.limit));
  response.headers.set("X-RateLimit-Remaining", String(tier.limit - entry.count));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
