import { getRedis } from "./redis";

const PREFIX = "login_attempts:";
const LOCKOUT_PREFIX = "account_locked:";

const DELAY_THRESHOLD = 5;
const SOFT_LOCK_THRESHOLD = 10;
const HARD_LOCK_THRESHOLD = 20;

const DELAY_SECONDS = 30;
const SOFT_LOCK_SECONDS = 15 * 60;
const ATTEMPTS_TTL = 60 * 60;

export type LockoutStatus =
  | { allowed: true }
  | { allowed: false; reason: "delayed"; retryAfter: number }
  | { allowed: false; reason: "soft_locked"; retryAfter: number }
  | { allowed: false; reason: "hard_locked" };

export async function checkLockout(email: string): Promise<LockoutStatus> {
  const redis = getRedis();
  const key = normalizeKey(email);

  const hardLock = await redis.get(`${LOCKOUT_PREFIX}hard:${key}`);
  if (hardLock) {
    return { allowed: false, reason: "hard_locked" };
  }

  const softLockTtl = await redis.ttl(`${LOCKOUT_PREFIX}soft:${key}`);
  if (softLockTtl > 0) {
    return { allowed: false, reason: "soft_locked", retryAfter: softLockTtl };
  }

  const attempts = parseInt(await redis.get(`${PREFIX}${key}`) || "0", 10);

  if (attempts >= DELAY_THRESHOLD && attempts < SOFT_LOCK_THRESHOLD) {
    const delayCooldown = await redis.ttl(`${PREFIX}delay:${key}`);
    if (delayCooldown > 0) {
      return { allowed: false, reason: "delayed", retryAfter: delayCooldown };
    }
  }

  return { allowed: true };
}

export async function recordFailedAttempt(email: string): Promise<number> {
  const redis = getRedis();
  const key = normalizeKey(email);
  const attemptsKey = `${PREFIX}${key}`;

  const attempts = await redis.incr(attemptsKey);
  await redis.expire(attemptsKey, ATTEMPTS_TTL);

  if (attempts >= HARD_LOCK_THRESHOLD) {
    await redis.set(`${LOCKOUT_PREFIX}hard:${key}`, "1");
    console.warn(`[lockout] Account hard-locked: ${email} (${attempts} attempts)`);
  } else if (attempts >= SOFT_LOCK_THRESHOLD) {
    await redis.set(`${LOCKOUT_PREFIX}soft:${key}`, "1", "EX", SOFT_LOCK_SECONDS);
    console.warn(`[lockout] Account soft-locked for ${SOFT_LOCK_SECONDS}s: ${email} (${attempts} attempts)`);
  } else if (attempts >= DELAY_THRESHOLD) {
    await redis.set(`${PREFIX}delay:${key}`, "1", "EX", DELAY_SECONDS);
  }

  return attempts;
}

export async function resetAttempts(email: string): Promise<void> {
  const redis = getRedis();
  const key = normalizeKey(email);
  await redis.del(
    `${PREFIX}${key}`,
    `${PREFIX}delay:${key}`,
    `${LOCKOUT_PREFIX}soft:${key}`
  );
}

function normalizeKey(email: string): string {
  return email.toLowerCase().trim();
}
