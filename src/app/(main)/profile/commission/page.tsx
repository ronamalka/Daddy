"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Trophy, ArrowRight, CheckCircle } from "@phosphor-icons/react";

interface CommissionData {
  tier: string;
  rate: number;
  label: string;
  completedOrders90d: number;
  nextTier: string | null;
  ordersToNextTier: number;
}

const TIER_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
  STANDARD: {
    color: "rgb(var(--color-text-secondary))",
    bg: "rgba(var(--color-text-secondary), 0.1)",
    icon: "1",
  },
  SILVER: {
    color: "rgb(var(--color-primary-light))",
    bg: "rgba(var(--color-primary-light), 0.1)",
    icon: "2",
  },
  GOLD: {
    color: "rgb(var(--color-warning))",
    bg: "rgba(var(--color-warning), 0.15)",
    icon: "3",
  },
  PLATINUM: {
    color: "rgb(var(--color-success))",
    bg: "rgba(var(--color-success), 0.1)",
    icon: "4",
  },
};

const ALL_TIERS = [
  { key: "STANDARD", label: "רגיל", rate: 15, range: "1-5" },
  { key: "SILVER", label: "כסף", rate: 12, range: "6-15" },
  { key: "GOLD", label: "זהב", rate: 10, range: "16-30" },
  { key: "PLATINUM", label: "פלטינה", rate: 8, range: "31+" },
];

export default function CommissionPage() {
  const { data: session } = useSession();
  const [commission, setCommission] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/sellers/${session.user.id}/commission`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error(body?.error || "Failed to load commission data");
        }
        return r.json();
      })
      .then(setCommission)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">
          התחבר כדי לצפות בעמלות.
        </p>
      </div>
    );
  }

  if (session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">
          עמוד זה זמין למוכרים בלבד.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[rgb(var(--color-border-light))]" />
          <div className="h-48 rounded-2xl bg-[rgb(var(--color-border-light))]" />
          <div className="h-32 rounded-2xl bg-[rgb(var(--color-border-light))]" />
        </div>
      </div>
    );
  }

  if (error || !commission) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-[16px] text-[rgb(var(--color-error))]">
          {error || "Failed to load commission data"}
        </p>
      </div>
    );
  }

  const style = TIER_STYLES[commission.tier] || TIER_STYLES.STANDARD;
  const currentTierIdx = ALL_TIERS.findIndex((t) => t.key === commission.tier);
  const currentTierMeta = ALL_TIERS[currentTierIdx];
  const nextTierMeta = commission.nextTier
    ? ALL_TIERS.find((t) => t.key === commission.nextTier)
    : null;

  // Calculate progress bar for next tier
  let progressPercent = 100;
  if (nextTierMeta && currentTierMeta) {
    const currentMin = currentTierIdx > 0 ? ALL_TIERS[currentTierIdx].rate : 0;
    const nextMin = ALL_TIERS[currentTierIdx + 1]
      ? parseInt(ALL_TIERS[currentTierIdx + 1].range)
      : commission.completedOrders90d;
    const currentRangeStart = parseInt(currentTierMeta.range);
    const total = nextMin - currentRangeStart;
    const progress = commission.completedOrders90d - currentRangeStart;
    progressPercent = total > 0 ? Math.min(100, Math.max(0, (progress / total) * 100)) : 100;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))] mb-6">
        עמלות ודרגות
      </h1>

      {/* Current Tier Card */}
      <div
        className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-md"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: style.bg }}
          >
            <Trophy className="h-8 w-8" style={{ color: style.color }} weight="fill" />
          </div>
          <div>
            <p className="text-[14px] text-[rgb(var(--color-text-muted))]">הדרגה שלך</p>
            <p className="text-[28px] font-bold" style={{ color: style.color }}>
              {commission.label}
            </p>
          </div>
          <div className="mr-auto text-left">
            <p className="text-[14px] text-[rgb(var(--color-text-muted))]">עמלה</p>
            <p className="text-[32px] font-bold text-[rgb(var(--color-primary))]">
              {Math.round(commission.rate * 100)}%
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
            <p className="text-[28px] font-bold text-[rgb(var(--color-accent))]">
              {commission.completedOrders90d}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">
              הזמנות ב-90 יום
            </p>
          </div>
          <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
            <p className="text-[28px] font-bold text-[rgb(var(--color-success))]">
              {commission.nextTier
                ? commission.ordersToNextTier
                : "--"}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">
              {commission.nextTier ? "הזמנות לדרגה הבאה" : "הדרגה הגבוהה ביותר!"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTierMeta && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">
                {commission.completedOrders90d} הזמנות מתוך{" "}
                {parseInt(nextTierMeta.range)} לדרגת {nextTierMeta.label}
              </span>
              <ArrowRight className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />
            </div>
            <div className="h-3 rounded-full bg-[rgb(var(--color-border-light))] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: style.color,
                }}
              />
            </div>
          </div>
        )}

        {!nextTierMeta && (
          <div className="flex items-center gap-2 rounded-xl bg-[rgba(var(--color-success),0.1)] p-3">
            <CheckCircle
              className="h-5 w-5 text-[rgb(var(--color-success))]"
              weight="fill"
            />
            <span className="text-[14px] font-medium text-[rgb(var(--color-success))]">
              הגעת לדרגה הגבוהה ביותר! נהנה מעמלה מינימלית.
            </span>
          </div>
        )}
      </div>

      {/* Tier Comparison Table */}
      <div className="mt-6 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-md">
        <h2 className="text-[18px] font-bold text-[rgb(var(--color-text))] mb-4">
          טבלת דרגות
        </h2>
        <div className="space-y-3">
          {ALL_TIERS.map((t) => {
            const isCurrent = t.key === commission.tier;
            const tierStyle = TIER_STYLES[t.key] || TIER_STYLES.STANDARD;
            return (
              <div
                key={t.key}
                className={`flex items-center justify-between rounded-xl p-4 border transition-all ${
                  isCurrent
                    ? "border-2 shadow-sm"
                    : "border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))]"
                }`}
                style={
                  isCurrent
                    ? {
                        borderColor: tierStyle.color,
                        backgroundColor: tierStyle.bg,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isCurrent ? tierStyle.color : tierStyle.bg }}
                  >
                    <Trophy
                      className="h-5 w-5"
                      weight="fill"
                      style={{ color: isCurrent ? "#fff" : tierStyle.color }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[15px] font-semibold"
                      style={{ color: isCurrent ? tierStyle.color : "rgb(var(--color-text))" }}
                    >
                      {t.label}
                      {isCurrent && (
                        <span className="mr-2 text-[12px] font-normal text-[rgb(var(--color-text-muted))]">
                          (הדרגה הנוכחית)
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-[rgb(var(--color-text-muted))]">
                      {t.range} הזמנות ב-90 יום
                    </p>
                  </div>
                </div>
                <p
                  className="text-[20px] font-bold"
                  style={{ color: isCurrent ? tierStyle.color : "rgb(var(--color-text-secondary))" }}
                >
                  {t.rate}%
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
