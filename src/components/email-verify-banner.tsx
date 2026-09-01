"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

/** Shows a persistent banner for signed-in users whose email is not verified. */
export function EmailVerifyBanner() {
  const { data: session, update } = useSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const emailVerified = session?.user?.isEmailVerified;

  // Don't show for unauthenticated users or those already verified
  if (!session?.user || emailVerified) return null;

  async function handleResend() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/email/send-verification", { method: "POST" });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "שליחת האימייל נכשלה");
      }
    } catch {
      setError("שליחת האימייל נכשלה");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3" role="alert" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-blue-800 text-sm">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">אמת את כתובת האימייל שלך</span>
          {sent ? (
            <span className="text-green-700">אימייל אימות נשלח! בדוק את תיבת הדואר.</span>
          ) : error ? (
            <span className="text-red-700">{error}</span>
          ) : (
            <span>כדי ליהנות מכל האפשרויות באבאל׳ה.</span>
          )}
        </div>
        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? "שולח..." : "שלח אימייל אימות"}
          </button>
        )}
      </div>
    </div>
  );
}
