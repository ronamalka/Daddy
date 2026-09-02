import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Returns the signed-in seller's subscription status. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/subscription", {
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}
