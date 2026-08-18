"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
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
            disabled={loading}
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
