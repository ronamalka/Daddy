"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function WeakPasswordBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const weakPassword = (session?.user as { weakPassword?: boolean } | undefined)?.weakPassword;

  if (!weakPassword || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3" role="alert" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-800 text-sm">
          <span className="font-medium">⚠️ הסיסמה שלך חלשה.</span>
          <span>מומלץ לעדכן אותה כדי לשמור על אבטחת החשבון.</span>
          <Link
            href="/reset-password"
            className="underline font-medium hover:text-amber-900"
          >
            עדכן סיסמה
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 text-lg leading-none"
          aria-label="סגור התראה"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
