import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Approves or rejects identity/license verification for a user. Admins only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.type || !body?.decision) {
    return NextResponse.json({ error: "Missing type or decision" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, `/admin/verifications/${userId}/review`, {
    method: "POST",
    body: { type: body.type, decision: body.decision },
    user,
  });
  return NextResponse.json(data, { status });
}
