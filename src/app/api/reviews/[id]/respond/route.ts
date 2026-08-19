import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/reviews/${id}/respond`, {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
