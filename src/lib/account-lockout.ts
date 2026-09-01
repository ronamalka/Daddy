import { getRedis } from "./redis";

const PREFIX = "login_attempts:";
const LOCKOUT_PREFIX = "account_locked:";
const LOCKOUT_EVENT_PREFIX = "lockout_event:";
const LOCKED_ACCOUNTS_SET = "locked_accounts";

const DELAY_THRESHOLD = 5;
const SOFT_LOCK_THRESHOLD = 10;
const HARD_LOCK_THRESHOLD = 20;

const DELAY_SECONDS = 30;
const SOFT_LOCK_SECONDS = 15 * 60;
const ATTEMPTS_TTL = 60 * 60;
const LOCKOUT_EVENT_TTL = 7 * 24 * 60 * 60;

export type LockoutStatus =
  | { allowed: true }
  | { allowed: false; reason: "delayed"; retryAfter: number }
  | { allowed: false; reason: "soft_locked"; retryAfter: number }
  | { allowed: false; reason: "hard_locked" };

/** Checks if this email may try to log in. Returns allowed, delayed, or locked. */
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

/** Adds one failed login for this email and may delay or lock the account. Returns the new attempt count. */
export async function recordFailedAttempt(email: string): Promise<number> {
  const redis = getRedis();
  const key = normalizeKey(email);
  const attemptsKey = `${PREFIX}${key}`;

  const attempts = await redis.incr(attemptsKey);
  await redis.expire(attemptsKey, ATTEMPTS_TTL);

  if (attempts >= HARD_LOCK_THRESHOLD) {
    await redis.set(`${LOCKOUT_PREFIX}hard:${key}`, "1");
    await trackLockoutEvent(redis, key, email, "hard_locked", attempts);
    console.warn(`[lockout] Account hard-locked: ${email} (${attempts} attempts)`);
  } else if (attempts >= SOFT_LOCK_THRESHOLD) {
    await redis.set(`${LOCKOUT_PREFIX}soft:${key}`, "1", "EX", SOFT_LOCK_SECONDS);
    await trackLockoutEvent(redis, key, email, "soft_locked", attempts);
    console.warn(`[lockout] Account soft-locked for ${SOFT_LOCK_SECONDS}s: ${email} (${attempts} attempts)`);
  } else if (attempts >= DELAY_THRESHOLD) {
    await redis.set(`${PREFIX}delay:${key}`, "1", "EX", DELAY_SECONDS);
  }

  return attempts;
}

/** Clears failed-login counts and a soft lock after a successful login. */
export async function resetAttempts(email: string): Promise<void> {
  const redis = getRedis();
  const key = normalizeKey(email);
  await redis.del(
    `${PREFIX}${key}`,
    `${PREFIX}delay:${key}`,
    `${LOCKOUT_PREFIX}soft:${key}`
  );
}

/** Removes all lockout keys for this email. Returns true if anything was deleted. */
export async function adminUnlockAccount(email: string): Promise<boolean> {
  const redis = getRedis();
  const key = normalizeKey(email);
  const deleted = await redis.del(
    `${PREFIX}${key}`,
    `${PREFIX}delay:${key}`,
    `${LOCKOUT_PREFIX}soft:${key}`,
    `${LOCKOUT_PREFIX}hard:${key}`
  );
  await redis.srem(LOCKED_ACCOUNTS_SET, key);
  return deleted > 0;
}

export interface LockedAccountInfo {
  email: string;
  lockType: "soft_locked" | "hard_locked";
  attempts: number;
  lockedAt: string;
}

/** Lists accounts that are currently soft-locked or hard-locked. */
export async function getLockedAccounts(): Promise<LockedAccountInfo[]> {
  const redis = getRedis();
  const members = await redis.smembers(LOCKED_ACCOUNTS_SET);
  const accounts: LockedAccountInfo[] = [];

  for (const key of members) {
    const eventData = await redis.get(`${LOCKOUT_EVENT_PREFIX}${key}`);
    if (!eventData) {
      await redis.srem(LOCKED_ACCOUNTS_SET, key);
      continue;
    }
    const isHardLocked = await redis.exists(`${LOCKOUT_PREFIX}hard:${key}`);
    const isSoftLocked = (await redis.ttl(`${LOCKOUT_PREFIX}soft:${key}`)) > 0;

    if (!isHardLocked && !isSoftLocked) {
      await redis.srem(LOCKED_ACCOUNTS_SET, key);
      continue;
    }

    const parsed = JSON.parse(eventData);
    accounts.push({
      email: parsed.email,
      lockType: isHardLocked ? "hard_locked" : "soft_locked",
      attempts: parsed.attempts,
      lockedAt: parsed.lockedAt,
    });
  }

  return accounts;
}

export interface LockoutEvent {
  email: string;
  lockType: string;
  attempts: number;
  lockedAt: string;
}

/** Returns recent lockout events, newest first, up to the given limit. */
export async function getRecentLockoutEvents(limit = 50): Promise<LockoutEvent[]> {
  const redis = getRedis();
  const events = await redis.lrange("lockout_events_log", 0, limit - 1);
  return events.map((e) => JSON.parse(e));
}

/** Saves a lockout event in Redis and adds the email to the locked-accounts set. */
async function trackLockoutEvent(
  redis: ReturnType<typeof getRedis>,
  key: string,
  email: string,
  lockType: string,
  attempts: number
): Promise<void> {
  const event = { email, lockType, attempts, lockedAt: new Date().toISOString() };
  await redis.set(`${LOCKOUT_EVENT_PREFIX}${key}`, JSON.stringify(event), "EX", LOCKOUT_EVENT_TTL);
  await redis.sadd(LOCKED_ACCOUNTS_SET, key);
  await redis.lpush("lockout_events_log", JSON.stringify(event));
  await redis.ltrim("lockout_events_log", 0, 499);
}

/** Lowercases and trims an email so lockout keys match. */
function normalizeKey(email: string): string {
  return email.toLowerCase().trim();
}
