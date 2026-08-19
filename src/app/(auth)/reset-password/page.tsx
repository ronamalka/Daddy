"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }

    fetch("/api/password-reset?action=validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setTokenValid(res.ok);
        setValidating(false);
      })
      .catch(() => {
        setTokenValid(false);
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/password-reset?action=reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "שגיאה באיפוס הסיסמה");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("שגיאה באיפוס הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[16px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  if (validating) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-8 w-8 animate-spin text-[rgb(var(--color-primary))]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-[14px] text-[rgb(var(--color-text-secondary))]">מאמת קישור...</p>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-error),0.1)]">
          <svg className="h-8 w-8 text-[rgb(var(--color-error))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
          קישור לא תקין
        </h1>
        <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))]">
          הקישור פג תוקף או כבר נוצל. בקש קישור חדש.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-xl bg-[rgb(var(--color-primary))] px-8 py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98]"
        >
          בקש קישור חדש
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-success),0.1)]">
          <svg className="h-8 w-8 text-[rgb(var(--color-success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
          הסיסמה עודכנה!
        </h1>
        <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))]">
          הסיסמה שלך שונתה בהצלחה. עכשיו אפשר להתחבר.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-[rgb(var(--color-primary))] px-8 py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98]"
        >
          התחבר
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
        בחר סיסמה חדשה
      </h1>
      <p className="mb-6 text-center text-[14px] text-[rgb(var(--color-text-secondary))]">
        הזן סיסמה חדשה לחשבון שלך
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-error))]">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
            סיסמה חדשה
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
            אימות סיסמה
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="הזן את הסיסמה שוב"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מעדכן...
            </span>
          ) : (
            "עדכן סיסמה"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:hidden">
        <h2
          className="text-3xl font-extrabold tracking-[-0.02em] bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-light)) 50%, rgb(var(--color-accent)) 100%)" }}
        >
          אבאל׳ה
        </h2>
      </div>

      <div className="rounded-2xl bg-[rgb(var(--color-surface))] p-8 shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
        <Suspense fallback={
          <div className="text-center py-12">
            <svg className="mx-auto h-8 w-8 animate-spin text-[rgb(var(--color-primary))]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
