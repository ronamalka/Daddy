"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock, MapPin, Package, CurrencyDollar, Star, User, Envelope, Shield, CalendarBlank, CreditCard, Bell, ShieldCheck, House, Receipt, Crown, ChartLineUp } from "@phosphor-icons/react";
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
      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-md">
        <div className="relative h-36 bg-primary">
        </div>

        <div className="relative px-6 pb-8">
          {/* Avatar overlapping the header */}
          <div className="flex justify-center sm:justify-end -mt-12">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[rgb(var(--color-surface))] bg-primary text-3xl font-bold text-white shadow-md">
              {session.user.name[0]}
            </div>
          </div>

          {/* Profile info — fully below the blue header */}
          <div className="mt-3 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-center sm:text-right min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-[22px] font-bold text-[rgb(var(--color-text))] truncate">{session.user.name}</h1>
                <span className={`shrink-0 rounded-full px-3 py-0.5 text-[12px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                  {roleStyle.label}
                </span>
              </div>
              <p className="mt-0.5 text-[14px] text-[rgb(var(--color-text-secondary))] truncate">{session.user.email}</p>
            </div>
            <Link
              href="/profile/edit"
              className="shrink-0 rounded-lg border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all"
            >
              ערוך פרופיל
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-5 -mx-6 px-6">
            <div className="flex flex-wrap justify-center gap-1">
              <NavLink href="/profile/addresses" icon={<House className="h-4 w-4" />} label="כתובות" />
              <NavLink href="/profile/verification" icon={<ShieldCheck className="h-4 w-4" />} label="אימותים" />
              <NavLink href="/profile/notifications" icon={<Bell className="h-4 w-4" />} label="התראות" />
              {session.user.role === "SELLER" && (
                <>
                  <NavLink href="/profile/services" icon={<Package className="h-4 w-4" />} label="שירותים" />
                  <NavLink href="/profile/prices" icon={<CurrencyDollar className="h-4 w-4" />} label="מחירון" />
                  <NavLink href="/profile/payments" icon={<CreditCard className="h-4 w-4" />} label="תשלומים" />
                  <NavLink href="/profile/service-areas" icon={<MapPin className="h-4 w-4" />} label="אזורי שירות" />
                  <NavLink href="/profile/availability" icon={<CalendarBlank className="h-4 w-4" />} label="זמינות" />
                  <NavLink href="/profile/gigs" icon={<Package className="h-4 w-4" />} label="החבילות שלי" />
                  <NavLink href="/profile/tax" icon={<Receipt className="h-4 w-4" />} label="פרופיל עסקי" />
                  <NavLink href="/profile/subscription" icon={<Crown className="h-4 w-4" />} label="מנוי פרימיום" />
                  <NavLink href="/profile/commission" icon={<ChartLineUp className="h-4 w-4" />} label="עמלות ודרגות" />
                </>
              )}
            </div>
          </nav>

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
                    <p className="text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">{stats.avgRating}/10</p>
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
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">ביקורות שנתתי</p>
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
                <AccountRow
                  icon="shield"
                  label="סיסמה"
                  value={session.user.hasPassword === false ? "התחברות עם Google" : "••••••••"}
                />
                {session.user.hasPassword !== false && (
                  <Link
                    href="/profile/password"
                    className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]"
                  >
                    עדכן
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.08)] hover:text-[rgb(var(--color-primary))] transition-all whitespace-nowrap"
    >
      {icon}
      {label}
    </Link>
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
