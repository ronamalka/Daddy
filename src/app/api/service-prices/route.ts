import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/service-prices", { user });
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/service-prices", {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
