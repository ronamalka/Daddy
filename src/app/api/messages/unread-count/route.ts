import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, "/messages/unread-count", { user });
  return NextResponse.json(data, { status });
}
