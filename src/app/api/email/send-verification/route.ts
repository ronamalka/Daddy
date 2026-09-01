import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { enforceRateLimit } from "@/lib/rate-limit-redis";

/** Resends the email verification link for the signed-in user. */
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "send-verification", 5, 60);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/email/send-verification", {
    method: "POST",
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  });

  return NextResponse.json(data, { status });
}
