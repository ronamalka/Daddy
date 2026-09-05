import { getRedis } from "./redis";

const JTI_PREFIX = "session_jti:";

/**
 * Deletes every Redis session JTI for a user.
 * If `keepJti` is provided, that single JTI is preserved (so the
 * caller's current session stays alive).
 * Returns how many keys were removed.
 */
export async function revokeSessionsForUser(
  userId: string,
  keepJti?: string
): Promise<number> {
  const redis = getRedis();
  const pattern = `${JTI_PREFIX}${userId}:*`;
  const keepKey = keepJti ? `${JTI_PREFIX}${userId}:${keepJti}` : null;
  let cursor = "0";
  let deletedCount = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    const toDelete = keepKey ? keys.filter((k) => k !== keepKey) : keys;
    if (toDelete.length > 0) {
      await redis.del(...toDelete);
      deletedCount += toDelete.length;
    }
  } while (cursor !== "0");

  return deletedCount;
}

/**
 * Checks whether a specific JTI is still valid (exists in Redis).
 * Returns `true` if the session is valid, `false` if it has been revoked.
 */
export async function isSessionValid(userId: string, jti: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const exists = await redis.exists(`${JTI_PREFIX}${userId}:${jti}`);
    return exists === 1;
  } catch {
    // Fail-open: if Redis is unreachable, allow the request so a Redis
    // outage does not lock every user out.
    return true;
  }
}
