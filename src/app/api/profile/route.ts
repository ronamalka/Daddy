import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile", {
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile", {
    method: "PUT",
    body,
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}
