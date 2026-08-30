import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLockout } from "@/lib/account-lockout";

const schema = z.object({
  email: z.string().email().max(254),
});

/** Checks whether an email is locked out from signing in, and how long until retry. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const status = await checkLockout(result.data.email);

  if (status.allowed) {
    return NextResponse.json({ locked: false });
  }

  const response: Record<string, unknown> = {
    locked: true,
    reason: status.reason,
  };

  if ("retryAfter" in status) {
    response.retryAfter = status.retryAfter;
  }

  return NextResponse.json(response);
}
