import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { z } from "zod";

const checkSchema = z.object({ code: z.string().length(6) });

/** Validates the OTP code and marks the phone as verified. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קוד אימות חייב להיות 6 ספרות" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/verify/phone/check", {
    method: "POST",
    body: parsed.data,
    user,
  });
  return NextResponse.json(data, { status });
}
