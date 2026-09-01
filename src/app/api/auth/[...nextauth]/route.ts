import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { isCredentialAuthPath } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-redis";

/** Handles NextAuth GET requests (session, csrf, providers). */
export const { GET } = handlers;

/**
 * Wraps the NextAuth POST handler with Redis-based rate limiting
 * for credential-guessing paths (login callback, signin).
 * Non-credential POSTs (signout, csrf) pass through without the
 * Redis check since they are not brute-force targets.
 */
export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isCredentialAuthPath(pathname, "POST")) {
    const limited = await enforceRateLimit(request, "auth-login", 10, 60);
    if (limited) return limited;
  }

  return handlers.POST(request);
}
