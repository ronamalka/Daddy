import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "./redis";
import { clientIpFromHeaders } from "./rate-limit";

const RATE_LIMIT_PREFIX = "rl:";

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  retryAfterSeconds: number;
}

/**
 * Checks a Redis-backed rate limit using INCR + EXPIRE.
 * This works across all pods in the cluster, unlike the in-memory
 * Map in middleware.ts which is per-process.
 *
 * On Redis failure the request is allowed through (fail-open)
 * so a Redis outage does not block legitimate users.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    const redisKey = `${RATE_LIMIT_PREFIX}${key}`;

    const current = await redis.incr(redisKey);

    // Set expiry only on the first increment so the window
    // starts from the first request, not from a later one.
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);

    if (current > maxAttempts) {
      return {
        allowed: false,
        current,
        limit: maxAttempts,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return {
      allowed: true,
      current,
      limit: maxAttempts,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    // Fail-open: if Redis is down, allow the request.
    // The per-pod in-memory limiter in middleware.ts still provides
    // some protection.
    console.warn("[rate-limit-redis] Redis check failed, allowing request:", err);
    return {
      allowed: true,
      current: 0,
      limit: maxAttempts,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Builds a rate-limit key from the client IP and route identifier.
 * Uses the first IP from x-forwarded-for or x-real-ip.
 */
export function rateLimitKeyFromRequest(
  request: NextRequest,
  route: string
): string {
  const ip = clientIpFromHeaders(request.headers);
  return `${route}:${ip}`;
}

/**
 * Convenience: checks Redis rate limit and returns a 429 NextResponse
 * if the limit is exceeded, or null if the request is allowed.
 */
export async function enforceRateLimit(
  request: NextRequest,
  route: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "test") return null;

  const key = rateLimitKeyFromRequest(request, route);
  const result = await checkRateLimit(key, maxAttempts, windowSeconds);

  if (!result.allowed) {
    const ip = clientIpFromHeaders(request.headers);
    console.warn(
      `[rate-limit-redis] ${ip} exceeded ${maxAttempts} requests in ${windowSeconds}s on ${route}`
    );
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
