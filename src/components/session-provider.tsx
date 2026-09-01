"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/** Wraps the app so pages can read the current NextAuth session. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  );
}
