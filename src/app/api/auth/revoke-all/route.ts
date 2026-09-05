import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSessionsForUser } from "@/lib/session-revoke";
import { logSecurityEvent, extractClientInfo } from "@/lib/security-logger";
import { enforceRateLimit } from "@/lib/rate-limit-redis";

/**
 * POST /api/auth/revoke-all
 *
 * Signs the current user out of every device by deleting all Redis
 * session JTIs.  Pass `{ "keepCurrent": true }` in the JSON body to
 * preserve the session that made the request (requires `currentJti`).
 */
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "revoke-all", 5, 60);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse optional body: { keepCurrent?: boolean, currentJti?: string }
  let keepJti: string | undefined;
  let keepCurrent = false;
  try {
    const body = await request.json();
    if (body?.keepCurrent === true) {
      keepCurrent = true;
      if (typeof body?.currentJti === "string" && body.currentJti.length > 0) {
        keepJti = body.currentJti;
      }
    }
  } catch {
    // No body or invalid JSON is fine -- revoke everything.
  }

  const { ip, userAgent } = extractClientInfo(request);

  try {
    const deletedCount = await revokeSessionsForUser(session.user.id, keepJti);

    logSecurityEvent("session_revoked", {
      userId: session.user.id,
      outcome: "success",
      ip,
      userAgent,
      metadata: { revokedCount: deletedCount, keepCurrent },
    });

    return NextResponse.json({ revoked: deletedCount });
  } catch (err) {
    logSecurityEvent("session_revoked", {
      userId: session.user.id,
      outcome: "failure",
      ip,
      userAgent,
      metadata: { error: err instanceof Error ? err.message : "unknown" },
    });

    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}
