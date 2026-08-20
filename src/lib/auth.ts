import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import { checkLockout, recordFailedAttempt, resetAttempts } from "./account-lockout";
import { getRedis } from "./redis";
import { logSecurityEvent } from "./security-logger";

const USERS_SERVICE = process.env.USERS_SERVICE_URL || "http://localhost:4001";

const SESSION_MAX_AGE = 24 * 60 * 60;
const ROTATION_WINDOW = SESSION_MAX_AGE * 0.25;
const JTI_PREFIX = "session_jti:";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const lockout = await checkLockout(email);
        if (!lockout.allowed) {
          logSecurityEvent("login_lockout", {
            email,
            outcome: "blocked",
            metadata: { reason: lockout.reason },
          });
          return null;
        }

        const res = await fetch(`${USERS_SERVICE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const attempts = await recordFailedAttempt(email);
          logSecurityEvent("login_failure", {
            email,
            outcome: "failure",
            metadata: { attempts },
          });
          return null;
        }

        await resetAttempts(email);
        const user = await res.json();
        logSecurityEvent("login_success", {
          email,
          userId: user.id,
          outcome: "success",
        });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const res = await fetch(`${USERS_SERVICE}/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            avatar: user.image,
          }),
        });

        if (!res.ok) return false;

        const dbUser = await res.json();
        user.id = dbUser.id;
        (user as { role?: string }).role = dbUser.role;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
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
        } catch {}
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
        } catch {}
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
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
