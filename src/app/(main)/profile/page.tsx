"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

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
        {/* Gradient Header */}
        <div
          className="relative h-36"
          style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}
        >
          {/* Decorative shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="relative px-8 pb-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar */}
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#FFFFFF] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-4xl font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
              {session.user.name[0]}
            </div>

            {/* Info */}
            <div className="mt-4 text-center sm:mt-0 sm:text-left sm:pb-1 flex-1">
              <h1 className="text-[24px] font-bold text-[#2D3436]">{session.user.name}</h1>
              <p className="mt-0.5 text-[14px] text-[#636E72]">{session.user.email}</p>
            </div>

            {/* Role Badge */}
            <span className={`mt-3 sm:mt-0 sm:mb-2 rounded-[9999px] px-4 py-1.5 text-[13px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
              {roleStyle.label}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#6C5CE7]">0</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">הזמנות</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#00D2D3]">0</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">ביקורות</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#FECA57]">--</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">דירוג</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="mt-6 rounded-[12px] border border-[#F1F3F8] bg-[#FAFBFF] p-5">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3] mb-4">פרטי חשבון</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] bg-[#F0EEFF] p-2">
                    <svg className="h-4 w-4 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#B2BEC3]">שם מלא</p>
                    <p className="text-[14px] font-medium text-[#2D3436]">{session.user.name}</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-[#F1F3F8]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] bg-[#F0EEFF] p-2">
                    <svg className="h-4 w-4 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#B2BEC3]">אימייל</p>
                    <p className="text-[14px] font-medium text-[#2D3436]">{session.user.email}</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-[#F1F3F8]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] bg-[#F0EEFF] p-2">
                    <svg className="h-4 w-4 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#B2BEC3]">תפקיד</p>
                    <p className="text-[14px] font-medium text-[#2D3436]">{session.user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
