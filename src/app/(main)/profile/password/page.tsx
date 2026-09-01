"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordStrength } from "@/components/password-strength";

/** Shows the form to change the user's password. */
export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[16px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[rgb(var(--color-text-secondary))]">התחבר כדי לעדכן את הסיסמה.</p>
      </div>
    );
  }

  if (session.user.hasPassword === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
          אין סיסמה לעדכן
        </h1>
        <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
          החשבון הזה מתחבר עם Google. אין סיסמה מקומית.
        </p>
      </div>
    );
  }

  /** Updates the password after checking the new one. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      setError("הסיסמה חייבת להכיל אות גדולה, אות קטנה, ספרה ותו מיוחד");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const details = Array.isArray(data?.details) ? data.details.join(". ") : "";
        setError(details || data?.error || "שגיאה בעדכון הסיסמה");
        setLoading(false);
        return;
      }

      await update({ weakPassword: false });
      setSuccess(true);
    } catch {
      setError("שגיאה בעדכון הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-success),0.1)]">
          <svg className="h-8 w-8 text-[rgb(var(--color-success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
          הסיסמה עודכנה!
        </h1>
        <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))]">
          הסיסמה שלך שונתה בהצלחה. החשבון מאובטח יותר עכשיו.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-block rounded-xl bg-[rgb(var(--color-primary))] px-8 py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98]"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
        עדכון סיסמה
      </h1>
      <p className="mb-8 text-[14px] text-[rgb(var(--color-text-secondary))]">
        בחר סיסמה חזקה עם אות גדולה, אות קטנה, ספרה ותו מיוחד.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-error))]"
        >
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 space-y-5">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
              סיסמה נוכחית
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              placeholder="הסיסמה הנוכחית שלך"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
              סיסמה חדשה
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <PasswordStrength password={password} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
              אימות סיסמה
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="הזן את הסיסמה שוב"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
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
    </div>
  );
}
