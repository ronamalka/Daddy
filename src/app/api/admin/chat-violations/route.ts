import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE } from "@/lib/gateway";

/** Lists chat moderation violations. Admins only. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const path = `/violations${qs ? `?${qs}` : ""}`;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, path, { user });
  return NextResponse.json(data, { status });
}
