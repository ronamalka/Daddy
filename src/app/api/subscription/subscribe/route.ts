import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Subscribes the signed-in seller to Premium. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine for subscribe
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/subscription/subscribe", {
    method: "POST",
    body,
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}
