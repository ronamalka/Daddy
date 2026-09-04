import { NextRequest, NextResponse } from "next/server";
import { checkBreachedPassword } from "@/lib/password-policy";
import { enforceRateLimit } from "@/lib/rate-limit-redis";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "check-password", 30, 60);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body?.password || typeof body.password !== "string") {
    return NextResponse.json({ breached: false });
  }

  const breached = await checkBreachedPassword(body.password);
  return NextResponse.json({ breached });
}
