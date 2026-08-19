import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/admin/users", { user });
  return NextResponse.json(data, { status });
}
