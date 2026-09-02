"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";

/** Landing page for the email verification link. */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-[rgb(var(--color-surface))] p-8 shadow-md text-center">
        <div className="h-6 w-48 mx-auto rounded bg-[rgb(var(--color-border))] animate-pulse mb-4" />
        <div className="h-4 w-64 mx-auto rounded bg-[rgb(var(--color-border))] animate-pulse" />
      </div>
    </div>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { update } = useSession();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("קישור אימות לא תקין.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/email/verify?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (res.ok && data.verified) {
          setStatus("success");
          setMessage("כתובת האימייל אומתה בהצלחה!");
          // Update the session so the banner disappears
          await update({ isEmailVerified: true });
        } else {
          setStatus("error");
          setMessage(data.error || "הקישור לא תקין או שפג תוקפו.");
        }
      } catch {
        setStatus("error");
        setMessage("אירעה שגיאה. נסה שוב מאוחר יותר.");
      }
    }

    verify();
  }, [token, update]);

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-[rgb(var(--color-surface))] p-8 shadow-md text-center">
        {status === "loading" && (
          <>
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 animate-spin text-[rgb(var(--color-primary))]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[rgb(var(--color-text))]">מאמת את האימייל...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-[rgb(var(--color-text))]">{message}</h1>
            <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))]">
              עכשיו אפשר ליהנות מכל האפשרויות באבאל׳ה.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-[rgb(var(--color-primary))] px-8 py-3 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))]"
            >
              לדף הבית
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-[rgb(var(--color-text))]">{message}</h1>
            <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))]">
              אם הקישור פג תוקף, אפשר לבקש אימייל אימות חדש מהגדרות הפרופיל.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl border border-[rgb(var(--color-border))] px-8 py-3 text-[16px] font-semibold text-[rgb(var(--color-text-secondary))] transition-all hover:bg-[rgb(var(--color-surface-elevated))]"
            >
              לדף הבית
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
