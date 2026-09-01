import { getRedis } from "./redis";

/** Deletes every Redis session id for this user. Returns how many keys were removed. */
export async function revokeSessionsForUser(userId: string): Promise<number> {
  const redis = getRedis();
  const pattern = `session_jti:${userId}:*`;
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

  return deletedCount;
}
