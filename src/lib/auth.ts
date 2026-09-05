/**
 * NextAuth config: Google (authorization-code / web-server flow) and email/password login,
 * account lockout, and JWT sessions tracked in Redis.
 *
 * Google identity uses Auth.js to talk to Google's OAuth 2.0 endpoints:
 * https://developers.google.com/identity/protocols/oauth2/web-server
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import { cookies } from "next/headers";
import { checkLockout, recordFailedAttempt, resetAttempts } from "./account-lockout";
import { getRedis } from "./redis";
import { isSessionValid } from "./session-revoke";
import { logSecurityEvent } from "./security-logger";
import { isPasswordWeak } from "./password-policy";
import { verifyTurnstileToken } from "./turnstile";
import { OAUTH_INTENT_COOKIE, parseOauthRole } from "./oauth-intent";
import { logger } from "./logger";
import "./auth-types";

const authLogger = logger.child({ module: "auth" });

const USERS_SERVICE = process.env.USERS_SERVICE_URL || "http://localhost:4001";

const SESSION_MAX_AGE = 24 * 60 * 60;
const ROTATION_WINDOW = SESSION_MAX_AGE * 0.25;
const JTI_PREFIX = "session_jti:";

class GoogleAccountError extends CredentialsSignin {
  code = "google_account";
}

/** Reads the buyer/seller choice from the cookie set before redirecting to Google. */
async function readOauthRole(): Promise<"BUYER" | "SELLER"> {
  try {
    const store = await cookies();
    const role = parseOauthRole(store.get(OAUTH_INTENT_COOKIE)?.value);
    try {
      store.delete(OAUTH_INTENT_COOKIE);
    } catch (err) {
      authLogger.warn({ err, cookie: OAUTH_INTENT_COOKIE }, "Failed to delete OAuth intent cookie (best-effort)");
    }
    return role;
  } catch (err) {
    authLogger.warn({ err }, "Failed to read OAuth role cookie, defaulting to BUYER");
    return "BUYER";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const turnstileToken = credentials?.turnstileToken as string | undefined;
        if (!email || !password) return null;

        if (turnstileToken) {
          const valid = await verifyTurnstileToken(turnstileToken);
          if (!valid) return null;
        } else if (process.env.TURNSTILE_SECRET_KEY) {
          return null;
        }

        try {
          const lockout = await checkLockout(email);
          if (!lockout.allowed) {
            logSecurityEvent("login_lockout", {
              email,
              outcome: "blocked",
              metadata: { reason: lockout.reason },
            });
            return null;
          }
        } catch (err) {
          authLogger.error({ err, email, operation: "lockout_check" }, "Lockout check failed, continuing login");
        }

        const res = await fetch(`${USERS_SERVICE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { code?: string } | null;
          if (body?.code === "GOOGLE_ACCOUNT") {
            throw new GoogleAccountError();
          }
          try {
            const attempts = await recordFailedAttempt(email);
            logSecurityEvent("login_failure", {
              email,
              outcome: "failure",
              metadata: { attempts },
            });
          } catch (err) {
            authLogger.error({ err, email, operation: "record_failed_attempt" }, "Failed to record lockout attempt");
            logSecurityEvent("login_failure", { email, outcome: "failure" });
          }
          return null;
        }

        try {
          await resetAttempts(email);
        } catch (err) {
          authLogger.error({ err, email, operation: "reset_attempts" }, "Failed to reset lockout attempts after login");
        }
        const user = await res.json();
        logSecurityEvent("login_success", {
          email,
          userId: user.id,
          outcome: "success",
        });
        const weakPassword = isPasswordWeak(password);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          weakPassword,
          hasPassword: true,
          isEmailVerified: user.emailVerified ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const role = await readOauthRole();
        const res = await fetch(`${USERS_SERVICE}/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            avatar: user.image,
            role,
          }),
        });

        if (!res.ok) {
          logSecurityEvent("login_failure", {
            email: user.email ?? undefined,
            outcome: "failure",
            metadata: { provider: "google", status: res.status },
          });
          return false;
        }

        const dbUser = await res.json();
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.hasPassword = Boolean(dbUser.hasPassword);
        user.isEmailVerified = dbUser.emailVerified ?? true;
        logSecurityEvent("login_success", {
          email: dbUser.email,
          userId: dbUser.id,
          outcome: "success",
          metadata: { provider: "google" },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.weakPassword = user.weakPassword || false;
        token.hasPassword = user.hasPassword !== false;
        token.isEmailVerified = user.isEmailVerified ?? false;
        token.jti = crypto.randomUUID();
        token.iat = Math.floor(Date.now() / 1000);

        try {
          const redis = getRedis();
          await redis.set(
            `${JTI_PREFIX}${token.id}:${token.jti}`,
            "1",
            "EX",
            SESSION_MAX_AGE
          );
        } catch (err) {
          authLogger.error(
            { err, userId: token.id, operation: "session_jti_store" },
            "Redis failed to store session JTI on login"
          );
        }
      }

      if (trigger === "update" && session) {
        const update = session as { weakPassword?: boolean; role?: string; isEmailVerified?: boolean };
        if (typeof update.weakPassword === "boolean") {
          token.weakPassword = update.weakPassword;
        }
        if (update.role === "SELLER") {
          token.role = "SELLER";
        }
        if (typeof update.isEmailVerified === "boolean") {
          token.isEmailVerified = update.isEmailVerified;
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const issuedAt = (token.iat as number) || now;
      const elapsed = now - issuedAt;

      if (elapsed > SESSION_MAX_AGE - ROTATION_WINDOW) {
        const oldJti = token.jti as string;
        token.jti = crypto.randomUUID();
        token.iat = now;

        try {
          const redis = getRedis();
          if (oldJti && token.id) {
            await redis.del(`${JTI_PREFIX}${token.id}:${oldJti}`);
          }
          await redis.set(
            `${JTI_PREFIX}${token.id}:${token.jti}`,
            "1",
            "EX",
            SESSION_MAX_AGE
          );
        } catch (err) {
          authLogger.error(
            { err, userId: token.id, operation: "session_jti_rotate" },
            "Redis failed during JTI rotation"
          );
        }
      }

      // Validate the JTI still exists in Redis (revoke-all deletes them).
      // Skip on initial sign-in (user is set) since we just created the key.
      if (!user && token.id && token.jti) {
        const valid = await isSessionValid(
          token.id as string,
          token.jti as string
        );
        if (!valid) {
          logSecurityEvent("session_revoked", {
            userId: token.id as string,
            outcome: "blocked",
            metadata: { jti: token.jti as string },
          });
          return null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.weakPassword = token.weakPassword || false;
        session.user.hasPassword = token.hasPassword !== false;
        session.user.isEmailVerified = token.isEmailVerified ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
