import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Returns a seller's commission tier, rate, and progress to next tier. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Seller can only see their own; admin can see any
  const isOwn = session.user.id === id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwn && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, `/sellers/${id}/commission`, {
    user: session.user as { id: string; email: string; name: string; role: string },
  });

  return NextResponse.json(data, { status });
}
