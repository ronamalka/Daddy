"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock, MapPin, Package, CurrencyDollar, Star, User, Envelope, Shield, CalendarBlank } from "@phosphor-icons/react";
import { ProfileProgress } from "@/components/profile-progress";
import type { ProfileReadinessResponse } from "@/lib/seller-ready";

interface Stats {
  totalOrders: number;
  reviewsReceived: number;
  avgRating: number;
  gigsCount: number;
  favoritesCount: number;
  reviewsGiven: number;
}

/** Shows the user's profile overview and account details. */
export default function ProfilePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [readiness, setReadiness] = useState<ProfileReadinessResponse | null>(null);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    if (session?.user?.role === "SELLER") {
      fetch("/api/profile/readiness")
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.percent === "number") setReadiness(data);
        })
        .catch(() => {});
    }
  }, [session?.user?.role]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בפרופיל.</p>
      </div>
    );
  }

  const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
    BUYER: { label: "קונה", bg: "bg-[rgba(var(--color-accent),0.15)]", text: "text-[rgb(var(--color-success))]" },
    SELLER: { label: "מוכר", bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]" },
    ADMIN: { label: "מנהל", bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  };

  const roleStyle = ROLE_LABELS[session.user.role] || ROLE_LABELS.BUYER;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
        <div className="relative h-36" style={{ background: "linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-light)) 50%, rgb(var(--color-accent)) 100%)" }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />
          </div>
        </div>

        <div className="relative px-8 pb-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[rgb(var(--color-surface))] bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-4xl font-bold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
              {session.user.name[0]}
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:text-left sm:pb-1 flex-1">
              <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">{session.user.name}</h1>
              <p className="mt-0.5 text-[14px] text-[rgb(var(--color-text-secondary))]">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0 sm:mb-2">
              <span className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                {roleStyle.label}
              </span>
              <Link
                href="/profile/edit"
                className="rounded-full border border-[rgb(var(--color-border))] px-4 py-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all"
              >
                ערוך
              </Link>
              <Link
                href="/profile/service-areas"
                className="rounded-full border border-[rgb(var(--color-border))] px-4 py-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent))] transition-all flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                אזורי שירות
              </Link>
              <Link
                href="/profile/services"
                className="rounded-full border border-[rgb(var(--color-border))] px-4 py-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all flex items-center gap-1.5"
              >
                <Package className="h-3.5 w-3.5" />
                שירותים
              </Link>
              <Link
                href="/profile/prices"
                className="rounded-full border border-[rgb(var(--color-border))] px-4 py-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-accent-yellow))] hover:text-[rgb(var(--color-warning))] transition-all flex items-center gap-1.5"
              >
                <CurrencyDollar className="h-3.5 w-3.5" />
                מחירון
              </Link>
              {session.user.role === "SELLER" && (
                <Link
                  href="/profile/availability"
                  className="rounded-full border border-[rgb(var(--color-border))] px-4 py-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all flex items-center gap-1.5"
                >
                  <CalendarBlank className="h-3.5 w-3.5" />
                  זמינות
                </Link>
              )}
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

          {readiness && (
            <div className="mt-6">
              <ProfileProgress readiness={readiness} variant="compact" />
            </div>
          )}

          {/* Dynamic Stats Grid */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <p className="text-[24px] font-bold text-[rgb(var(--color-primary))]">{stats?.totalOrders ?? "..."}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">הזמנות</p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <p className="text-[24px] font-bold text-[rgb(var(--color-accent))]">{stats?.reviewsReceived ?? "..."}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">ביקורות</p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                {stats?.avgRating ? (
                  <>
                    <Star className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
                    <p className="text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">{stats.avgRating}</p>
                  </>
                ) : (
                  <p className="text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">--</p>
                )}
              </div>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">דירוג</p>
            </div>
          </div>

          {stats && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
                <p className="text-[24px] font-bold text-[rgb(var(--color-primary-light))]">{stats.gigsCount}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">שירותים</p>
              </div>
              <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
                <p className="text-[24px] font-bold text-[rgb(var(--color-error))]">{stats.favoritesCount}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">מועדפים</p>
              </div>
              <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
                <p className="text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">{stats.reviewsGiven}</p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">ביקורות שנתנתי</p>
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="mt-6 rounded-xl border border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))] p-5">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))] mb-4">פרטי חשבון</h2>
            <div className="space-y-4">
              <AccountRow icon="user" label="שם מלא" value={session.user.name} />
              <div className="h-px bg-[rgb(var(--color-border-light))]" />
              <AccountRow icon="email" label="אימייל" value={session.user.email} />
              <div className="h-px bg-[rgb(var(--color-border-light))]" />
              <AccountRow icon="shield" label="תפקיד" value={roleStyle.label} />
              <div className="h-px bg-[rgb(var(--color-border-light))]" />
              <div className="flex items-center justify-between gap-3">
                <AccountRow icon="shield" label="סיסמה" value="••••••••" />
                <Link
                  href="/profile/password"
                  className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]"
                >
                  עדכן
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shows one labeled row of account information. */
function AccountRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const IconComponent = icon === "user" ? User : icon === "email" ? Envelope : Shield;
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-[rgba(var(--color-primary),0.1)] p-2">
        <IconComponent className="h-4 w-4 text-[rgb(var(--color-primary))]" />
      </div>
      <div>
        <p className="text-[12px] text-[rgb(var(--color-text-muted))]">{label}</p>
        <p className="text-[14px] font-medium text-[rgb(var(--color-text))]">{value}</p>
      </div>
    </div>
  );
}
