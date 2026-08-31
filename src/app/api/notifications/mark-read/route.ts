import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Marks persisted in-app notifications as read for the signed-in user. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/notifications/mark-read", {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data ?? { ok: true }, { status: status >= 400 ? status : 200 });
}
