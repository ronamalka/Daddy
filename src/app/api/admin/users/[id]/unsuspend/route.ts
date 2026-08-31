import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { logSecurityEvent, extractClientInfo } from "@/lib/security-logger";

/** Clears a suspension so the user can sign in again. Admins only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, `/admin/users/${id}/unsuspend`, {
    method: "POST",
    body: {},
    user,
  });

  if (status >= 200 && status < 300) {
    logSecurityEvent("admin_action", {
      userId: user.id,
      outcome: "success",
      ...extractClientInfo(request),
      metadata: { action: "unsuspend_user", targetUserId: id },
    });
  }

  return NextResponse.json(data, { status });
}
