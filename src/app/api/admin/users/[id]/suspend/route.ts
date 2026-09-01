import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { revokeSessionsForUser } from "@/lib/session-revoke";
import { logSecurityEvent, extractClientInfo } from "@/lib/security-logger";

const suspendSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

/** Suspends a user and revokes their sessions. Admins only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await validateBody(request, suspendSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, `/admin/users/${id}/suspend`, {
    method: "POST",
    body: result.data,
    user,
  });

  if (status >= 200 && status < 300) {
    try {
      await revokeSessionsForUser(id);
    } catch (err) {
      console.error("[admin] failed to revoke sessions after suspend:", err);
    }
    logSecurityEvent("admin_action", {
      userId: user.id,
      outcome: "success",
      ...extractClientInfo(request),
      metadata: { action: "suspend_user", targetUserId: id },
    });
  }

  return NextResponse.json(data, { status });
}
