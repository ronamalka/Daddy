"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Stats {
  totalOrders: number;
  reviewsReceived: number;
  avgRating: number;
  gigsCount: number;
  favoritesCount: number;
  reviewsGiven: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[#F0EEFF] p-4 mb-4">
          <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-[16px] text-[#636E72]">התחבר כדי לצפות בפרופיל.</p>
      </div>
    );
  }

  const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
    BUYER: { label: "קונה", bg: "bg-[#00D2D3]/15", text: "text-[#00B894]" },
    SELLER: { label: "מוכר", bg: "bg-[#6C5CE7]/10", text: "text-[#6C5CE7]" },
    ADMIN: { label: "מנהל", bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]" },
  };

  const roleStyle = ROLE_LABELS[session.user.role] || ROLE_LABELS.BUYER;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
        <div className="relative h-36" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />
          </div>
        </div>

        <div className="relative px-8 pb-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#FFFFFF] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-4xl font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
              {session.user.name[0]}
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:text-left sm:pb-1 flex-1">
              <h1 className="text-[24px] font-bold text-[#2D3436]">{session.user.name}</h1>
              <p className="mt-0.5 text-[14px] text-[#636E72]">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0 sm:mb-2">
              <span className={`rounded-[9999px] px-4 py-1.5 text-[13px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                {roleStyle.label}
              </span>
              <Link
                href="/profile/edit"
                className="rounded-[9999px] border border-[#E8ECF1] px-4 py-1.5 text-[13px] font-semibold text-[#636E72] hover:border-[#6C5CE7] hover:text-[#6C5CE7] transition-all"
              >
                ערוך
              </Link>
              <Link
                href="/profile/service-areas"
                className="rounded-[9999px] border border-[#E8ECF1] px-4 py-1.5 text-[13px] font-semibold text-[#636E72] hover:border-[#00D2D3] hover:text-[#00D2D3] transition-all flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                אזורי שירות
              </Link>
              <Link
                href="/profile/services"
                className="rounded-[9999px] border border-[#E8ECF1] px-4 py-1.5 text-[13px] font-semibold text-[#636E72] hover:border-[#6C5CE7] hover:text-[#6C5CE7] transition-all flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-3.13M15.58 15.17l5.1-3.13m-14.26.49l4.5 2.76a2.25 2.25 0 002.26 0l4.5-2.76a2.25 2.25 0 001.12-1.95V8.06a2.25 2.25 0 00-1.12-1.95l-4.5-2.76a2.25 2.25 0 00-2.26 0l-4.5 2.76A2.25 2.25 0 003.75 8.06v4.12a2.25 2.25 0 001.12 1.95z" />
                </svg>
                שירותים
              </Link>
              <Link
                href="/profile/prices"
                className="rounded-[9999px] border border-[#E8ECF1] px-4 py-1.5 text-[13px] font-semibold text-[#636E72] hover:border-[#FECA57] hover:text-[#F0932B] transition-all flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                מחירון
              </Link>
              {session.user.role === "SELLER" && (
                <Link
                  href="/profile/gigs"
                  className="rounded-[9999px] border border-[#E8ECF1] px-4 py-1.5 text-[13px] font-semibold text-[#636E72] hover:border-[#6C5CE7] hover:text-[#6C5CE7] transition-all flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  השירותים שלי
                </Link>
              )}
            </div>
          </div>

          {/* Dynamic Stats Grid */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#6C5CE7]">{stats?.totalOrders ?? "..."}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">הזמנות</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#00D2D3]">{stats?.reviewsReceived ?? "..."}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">ביקורות</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                {stats?.avgRating ? (
                  <>
                    <svg className="h-5 w-5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    <p className="text-[24px] font-bold text-[#FECA57]">{stats.avgRating}</p>
                  </>
                ) : (
                  <p className="text-[24px] font-bold text-[#FECA57]">--</p>
                )}
              </div>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">דירוג</p>
            </div>
          </div>

          {stats && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
                <p className="text-[24px] font-bold text-[#A29BFE]">{stats.gigsCount}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">שירותים</p>
              </div>
              <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
                <p className="text-[24px] font-bold text-[#FF6B6B]">{stats.favoritesCount}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">מועדפים</p>
              </div>
              <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
                <p className="text-[24px] font-bold text-[#FECA57]">{stats.reviewsGiven}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">ביקורות שנתנתי</p>
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="mt-6 rounded-[12px] border border-[#F1F3F8] bg-[#FAFBFF] p-5">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3] mb-4">פרטי חשבון</h2>
            <div className="space-y-4">
              <AccountRow icon="user" label="שם מלא" value={session.user.name} />
              <div className="h-px bg-[#F1F3F8]" />
              <AccountRow icon="email" label="אימייל" value={session.user.email} />
              <div className="h-px bg-[#F1F3F8]" />
              <AccountRow icon="shield" label="תפקיד" value={roleStyle.label} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const icons: Record<string, string> = {
    user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    email: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  };
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-[8px] bg-[#F0EEFF] p-2">
        <svg className="h-4 w-4 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
        </svg>
      </div>
      <div>
        <p className="text-[12px] text-[#B2BEC3]">{label}</p>
        <p className="text-[14px] font-medium text-[#2D3436]">{value}</p>
      </div>
    </div>
  );
}
