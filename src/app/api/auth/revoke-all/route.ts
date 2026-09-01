import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSessionsForUser } from "@/lib/session-revoke";

/** Signs the current user out of all sessions by deleting their Redis session keys. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedCount = await revokeSessionsForUser(session.user.id);
    return NextResponse.json({ revoked: deletedCount });
  } catch {
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}
