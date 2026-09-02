import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE } from "@/lib/gateway";

/** Marks that a user has been warned about a chat violation. Admins only. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, `/violations/${id}/warn`, {
    method: "POST",
    user,
  });
  return NextResponse.json(data, { status });
}
