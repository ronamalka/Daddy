"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";

/** Shows a form to request a password reset email. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const formLoadedAtRef = useRef(Date.now());
  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

  /** Sends a password-reset email to the address the user typed. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/password-reset?action=request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken, _hp_field: "", _formLoadedAt: formLoadedAtRef.current }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "שגיאה בשליחת הבקשה");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("שגיאה בשליחת הבקשה");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[16px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

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
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-success),0.1)]">
              <svg className="h-8 w-8 text-[rgb(var(--color-success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
              שלחנו לך מכתב אבהי
            </h1>
            <p className="mb-6 text-[14px] text-[rgb(var(--color-text-secondary))] leading-relaxed">
              אם יש חשבון עם <strong dir="ltr">{email}</strong>, קישור לאיפוס כבר בדרך. תבדוק גם בספאם — לפעמים הוא מתחבא שם.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-[rgb(var(--color-primary))] px-8 py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98]"
            >
              חזרה להתחברות
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-center text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
              אבא לא שוכח. אבל אם כן...
            </h1>
            <p className="mb-6 text-center text-[14px] text-[rgb(var(--color-text-secondary))]">
              קורה לכולם. תכתוב את האימייל ונשלח קישור מהיר לאיפוס
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
                <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">
                  אימייל
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
                <label htmlFor="hp-forgot">Leave empty</label>
                <input id="hp-forgot" type="text" name="_hp_field" tabIndex={-1} autoComplete="off" />
              </div>
              <TurnstileWidget onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />
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
                    שולח...
                  </span>
                ) : (
                  "שלח קישור איפוס"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-[14px] font-semibold text-[rgb(var(--color-primary))] transition-colors hover:text-[rgb(var(--color-primary-hover))]"
              >
                חזרה להתחברות
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
