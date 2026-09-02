"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarBlank, CheckCircle, XCircle, Clock, Lock, Warning, ArrowLeft } from "@phosphor-icons/react";

interface MaintenanceVisit {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  report: string | null;
  photos: string[];
}

interface MaintenancePlan {
  id: string;
  planType: string;
  priceMonthly: number;
  status: string;
  nextVisitAt: string | null;
  startedAt: string;
  cancelledAt: string | null;
  visits: MaintenanceVisit[];
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "פעיל", bg: "bg-[rgba(var(--color-success),0.1)]", text: "text-[rgb(var(--color-success))]" },
  PAUSED: { label: "מושהה", bg: "bg-[rgba(var(--color-accent-yellow),0.1)]", text: "text-[rgb(var(--color-warning))]" },
  CANCELLED: { label: "בוטל", bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  EXPIRED: { label: "פג תוקף", bg: "bg-[rgba(var(--color-text-muted),0.1)]", text: "text-[rgb(var(--color-text-muted))]" },
};

const VISIT_STATUS: Record<string, { label: string; Icon: typeof CheckCircle }> = {
  SCHEDULED: { label: "מתוכנן", Icon: Clock },
  CONFIRMED: { label: "מאושר", Icon: CalendarBlank },
  COMPLETED: { label: "הושלם", Icon: CheckCircle },
  MISSED: { label: "הוחמץ", Icon: Warning },
  CANCELLED: { label: "בוטל", Icon: XCircle },
};

/** Shows the buyer's maintenance plan status, upcoming and past visits. */
export default function ProfileMaintenancePage() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/maintenance")
      .then((r) => {
        if (r.status === 404) return null;
        return r.json();
      })
      .then((data) => {
        if (data && data.id) setPlan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  async function handleCancel() {
    if (!confirm("האם אתה בטוח שברצונך לבטל את תוכנית התחזוקה?")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/maintenance/cancel", { method: "POST" });
      if (res.ok) {
        const updated = await fetch("/api/maintenance").then((r) => {
          if (r.status === 404) return null;
          return r.json();
        });
        if (updated && updated.id) setPlan(updated);
        else setPlan((prev) => prev ? { ...prev, status: "CANCELLED", cancelledAt: new Date().toISOString() } : null);
      }
    } catch {
      /* silent */
    } finally {
      setCancelling(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בתוכנית התחזוקה.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4 inline-block">
          <CalendarBlank className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))] mb-2">אין תוכנית תחזוקה</h1>
        <p className="text-[14px] text-[rgb(var(--color-text-secondary))] mb-6">עדיין לא נרשמת לתוכנית תחזוקה.</p>
        <Link
          href="/maintenance"
          className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))]"
        >
          <ArrowLeft className="h-4 w-4" />
          צפה בתוכניות
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_MAP[plan.status] || STATUS_MAP.ACTIVE;
  const upcomingVisits = plan.visits.filter((v) => v.status === "SCHEDULED" || v.status === "CONFIRMED");
  const pastVisits = plan.visits.filter((v) => v.status === "COMPLETED" || v.status === "MISSED" || v.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-[28px] font-bold text-[rgb(var(--color-text))] mb-6">תוכנית התחזוקה שלי</h1>

      {/* Plan status card */}
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-[rgb(var(--color-text))]">
              תוכנית {plan.planType === "BASIC" ? "בסיסית" : plan.planType}
            </h2>
            <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">{plan.priceMonthly}₪/חודש</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-3">
            <p className="text-[12px] text-[rgb(var(--color-text-muted))] mb-1">תאריך הצטרפות</p>
            <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
              {new Date(plan.startedAt).toLocaleDateString("he-IL")}
            </p>
          </div>
          <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-3">
            <p className="text-[12px] text-[rgb(var(--color-text-muted))] mb-1">ביקור הבא</p>
            <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
              {plan.nextVisitAt
                ? new Date(plan.nextVisitAt).toLocaleDateString("he-IL")
                : "לא נקבע"}
            </p>
          </div>
        </div>

        {plan.status === "ACTIVE" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full rounded-xl border border-[rgb(var(--color-error))] py-3 text-[14px] font-semibold text-[rgb(var(--color-error))] transition-all hover:bg-[rgba(var(--color-error),0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? "מבטל..." : "בטל תוכנית"}
          </button>
        )}

        {plan.status === "CANCELLED" && plan.cancelledAt && (
          <div className="rounded-xl bg-[rgba(var(--color-error),0.05)] border border-[rgba(var(--color-error),0.15)] p-3 text-center">
            <p className="text-[13px] text-[rgb(var(--color-error))]">
              בוטל ב-{new Date(plan.cancelledAt).toLocaleDateString("he-IL")}
            </p>
          </div>
        )}
      </div>

      {/* Upcoming visits */}
      {upcomingVisits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-3">ביקורים קרובים</h3>
          <div className="space-y-3">
            {upcomingVisits.map((visit) => {
              const vs = VISIT_STATUS[visit.status] || VISIT_STATUS.SCHEDULED;
              return (
                <div
                  key={visit.id}
                  className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 flex items-center gap-4"
                >
                  <div className="rounded-lg bg-[rgba(var(--color-primary),0.1)] p-2">
                    <vs.Icon className="h-5 w-5 text-[rgb(var(--color-primary))]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
                      {new Date(visit.scheduledAt).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p className="text-[12px] text-[rgb(var(--color-text-muted))]">{vs.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visit history */}
      {pastVisits.length > 0 && (
        <div>
          <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-3">היסטוריית ביקורים</h3>
          <div className="space-y-3">
            {pastVisits.map((visit) => {
              const vs = VISIT_STATUS[visit.status] || VISIT_STATUS.COMPLETED;
              const isCompleted = visit.status === "COMPLETED";
              return (
                <div
                  key={visit.id}
                  className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`rounded-lg p-2 ${isCompleted ? "bg-[rgba(var(--color-success),0.1)]" : "bg-[rgba(var(--color-error),0.1)]"}`}>
                      <vs.Icon className={`h-5 w-5 ${isCompleted ? "text-[rgb(var(--color-success))]" : "text-[rgb(var(--color-error))]"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
                        {new Date(visit.scheduledAt).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-[12px] text-[rgb(var(--color-text-muted))]">{vs.label}</p>
                    </div>
                  </div>
                  {visit.report && (
                    <div className="mr-12 rounded-lg bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-3 mt-2">
                      <p className="text-[13px] text-[rgb(var(--color-text-secondary))] leading-relaxed">{visit.report}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
