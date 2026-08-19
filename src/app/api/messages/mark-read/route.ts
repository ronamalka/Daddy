import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/messages/mark-read", {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
