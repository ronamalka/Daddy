import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLockedAccounts, getRecentLockoutEvents, adminUnlockAccount } from "@/lib/account-lockout";
import { z } from "zod";
import { logSecurityEvent, extractClientInfo } from "@/lib/security-logger";

/** Returns locked accounts, or recent lockout events when `view=events`. Admins only. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "locked";

  if (view === "events") {
    const events = await getRecentLockoutEvents();
    return NextResponse.json({ events });
  }

  const accounts = await getLockedAccounts();
  return NextResponse.json({ accounts });
}

const unlockSchema = z.object({
  email: z.string().email().max(254),
}).strict();

/** Unlocks a user account by email. Admins only. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = unlockSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const unlocked = await adminUnlockAccount(result.data.email);
  const clientInfo = extractClientInfo(request);

  logSecurityEvent("admin_action", {
    userId: session?.user?.id,
    outcome: "success",
    ...clientInfo,
    metadata: {
      action: "unlock_account",
      targetEmail: result.data.email,
      wasLocked: unlocked,
    },
  });

  return NextResponse.json({ unlocked, email: result.data.email });
}
