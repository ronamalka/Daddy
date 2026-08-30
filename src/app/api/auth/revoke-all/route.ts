import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis";

/** Signs the current user out of all sessions by deleting their Redis session keys. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const redis = getRedis();
    const pattern = `session_jti:${session.user.id}:*`;
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== "0");

    return NextResponse.json({ revoked: deletedCount });
  } catch {
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}
