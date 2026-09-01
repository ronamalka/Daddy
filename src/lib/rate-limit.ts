export const RATE_LIMIT_WINDOW_MS = 60_000;

export const RATE_LIMIT_AUTH = parsePositiveInt(process.env.RATE_LIMIT_AUTH, 10);
export const RATE_LIMIT_POST = parsePositiveInt(process.env.RATE_LIMIT_POST, 30);
export const RATE_LIMIT_PUBLIC = parsePositiveInt(process.env.RATE_LIMIT_PUBLIC, 30);
export const RATE_LIMIT_DEFAULT = parsePositiveInt(process.env.RATE_LIMIT_DEFAULT, 120);

/** Parses a positive integer from an env string, or uses the fallback. */
function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export type RateLimitTierName = "auth" | "write" | "public" | "default";

export interface RateLimitTier {
  name: RateLimitTierName;
  limit: number;
}

/**
 * Tight auth limits apply only to credential-guessing surfaces.
 * NextAuth hits /api/auth/session and /api/auth/csrf on every page load;
 * those must not share the 10/min login bucket.
 */
export function isCredentialAuthPath(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/register") || pathname.startsWith("/api/password-reset")) {
    return true;
  }

  if (!pathname.startsWith("/api/auth")) {
    return false;
  }

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return false;
  }

  if (
    pathname.includes("/session") ||
    pathname.includes("/csrf") ||
    pathname.includes("/providers") ||
    pathname.includes("/signout")
  ) {
    return false;
  }

  return true;
}

/** Tight public GET budget for scrapeable teasers (no session required). */
export function isPublicTeaserPath(pathname: string, method: string): boolean {
  return method === "GET" && pathname === "/api/service-requests/teaser";
}

/** Picks the auth, write, public, or default request limit for this path and method. */
export function resolveRateLimitTier(pathname: string, method: string): RateLimitTier {
  if (isCredentialAuthPath(pathname, method)) {
    return { name: "auth", limit: RATE_LIMIT_AUTH };
  }

  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    return { name: "write", limit: RATE_LIMIT_POST };
  }

  if (isPublicTeaserPath(pathname, method)) {
    return { name: "public", limit: RATE_LIMIT_PUBLIC };
  }

  return { name: "default", limit: RATE_LIMIT_DEFAULT };
}

/** Reads the client IP from x-forwarded-for or x-real-ip. */
export function clientIpFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/** Builds a rate-limit key from IP, a short session id, and the limit. */
export function rateLimitKey(ip: string, sessionToken: string | undefined, limit: number): string {
  const sessionSuffix = sessionToken ? `:s${sessionToken.slice(0, 8)}` : "";
  return `${ip}${sessionSuffix}:${limit}`;
}
