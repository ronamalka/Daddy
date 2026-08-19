"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("אימייל או סיסמה שגויים");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/" });
  }

  const isLoading = loading || googleLoading;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:hidden">
        <h2
          className="text-3xl font-extrabold tracking-[-0.02em] bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}
        >
          אבאל׳ה
        </h2>
      </div>

      <div className="rounded-[16px] bg-[#FFFFFF] p-8 shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
        <h1 className="mb-2 text-center text-[24px] font-bold tracking-[-0.01em] text-[#2D3436]">
          ברוך הבא חזרה
        </h1>
        <p className="mb-6 text-center text-[14px] text-[#636E72]">
          התחבר כדי להמשיך לחשבון שלך
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-[#E17055]/10 px-4 py-3 text-[14px] text-[#E17055]">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] py-3.5 text-[16px] font-medium text-[#2D3436] transition-all hover:bg-[#F0F0F5] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          המשך עם Google
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8ECF1]" />
          <span className="text-[13px] text-[#B2BEC3]">או</span>
          <div className="h-px flex-1 bg-[#E8ECF1]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              dir="ltr"
              className="w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[16px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="הזן את הסיסמה שלך"
              className="w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[16px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[12px] bg-[#6C5CE7] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.08)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_8px_32px_rgba(108,92,231,0.12)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                מתחבר...
              </span>
            ) : (
              "התחבר"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-[#636E72]">
            עדיין לא חבר?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#6C5CE7] transition-colors hover:text-[#5A4BD1]"
            >
              הצטרף עכשיו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
