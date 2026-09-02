"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Prohibit, Wrench, UserCirclePlus } from "@phosphor-icons/react";

interface MaintenanceVisit {
  id: string;
  scheduledAt: string;
  status: string;
}

interface MaintenancePlan {
  id: string;
  buyerId: string;
  sellerId: string | null;
  planType: string;
  priceMonthly: number;
  status: string;
  nextVisitAt: string | null;
  createdAt: string;
  visits: MaintenanceVisit[];
}

interface PlansResponse {
  plans: MaintenancePlan[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "פעיל", bg: "bg-[rgba(var(--color-success),0.1)]", text: "text-[rgb(var(--color-success))]" },
  PAUSED: { label: "מושהה", bg: "bg-[rgba(var(--color-accent-yellow),0.1)]", text: "text-[rgb(var(--color-warning))]" },
  CANCELLED: { label: "בוטל", bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  EXPIRED: { label: "פג תוקף", bg: "bg-[rgba(var(--color-text-muted),0.1)]", text: "text-[rgb(var(--color-text-muted))]" },
};

/** Admin page for managing all maintenance plans. */
export default function AdminMaintenancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [sellerInput, setSellerInput] = useState("");

  const loadPlans = useCallback(async (statusFilter: string) => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/maintenance/admin${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    loadPlans(filter);
  }, [session, filter, loadPlans]);

  async function handleAssign(planId: string) {
    if (!sellerInput.trim()) return;
    try {
      const res = await fetch(`/api/maintenance/admin/${planId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: sellerInput.trim() }),
      });
      if (res.ok) {
        setAssigningId(null);
        setSellerInput("");
        loadPlans(filter);
      }
    } catch {
      /* silent */
    }
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Prohibit className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">הגישה נדחתה</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">אתה צריך הרשאות מנהל כדי לצפות בדף הזה</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[rgb(var(--color-text))] flex items-center gap-3">
            <Wrench className="h-7 w-7 text-[rgb(var(--color-primary))]" />
            ניהול תוכניות תחזוקה
          </h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            {data ? `${data.total} תוכניות` : "טוען..."}
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))]"
        >
          <option value="">כל הסטטוסים</option>
          <option value="ACTIVE">פעיל</option>
          <option value="PAUSED">מושהה</option>
          <option value="CANCELLED">בוטל</option>
          <option value="EXPIRED">פג תוקף</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-sm)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))]">
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">קונה</th>
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">בעל מקצוע</th>
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">תוכנית</th>
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">סטטוס</th>
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">ביקור הבא</th>
                  <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border-light))]">
                {data?.plans?.map((plan) => {
                  const badge = STATUS_BADGE[plan.status] || STATUS_BADGE.ACTIVE;
                  return (
                    <tr key={plan.id} className="transition-colors hover:bg-[rgb(var(--color-surface-elevated))]">
                      <td className="px-6 py-4 text-[14px] font-medium text-[rgb(var(--color-text))]">
                        <span className="font-mono text-[12px]">{plan.buyerId.slice(0, 12)}...</span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text-secondary))]">
                        {plan.sellerId ? (
                          <span className="font-mono text-[12px]">{plan.sellerId.slice(0, 12)}...</span>
                        ) : (
                          <span className="text-[12px] text-[rgb(var(--color-text-muted))]">לא משויך</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text))]">
                        {plan.planType === "BASIC" ? "בסיסית" : plan.planType} - {plan.priceMonthly}₪
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text-secondary))]">
                        {plan.nextVisitAt
                          ? new Date(plan.nextVisitAt).toLocaleDateString("he-IL")
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {assigningId === plan.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sellerInput}
                              onChange={(e) => setSellerInput(e.target.value)}
                              placeholder="מזהה בעל מקצוע"
                              className="w-36 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-2 py-1.5 text-[12px] text-[rgb(var(--color-text))]"
                            />
                            <button
                              onClick={() => handleAssign(plan.id)}
                              className="rounded-lg bg-[rgb(var(--color-primary))] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))]"
                            >
                              שמור
                            </button>
                            <button
                              onClick={() => { setAssigningId(null); setSellerInput(""); }}
                              className="text-[12px] font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                            >
                              ביטול
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAssigningId(plan.id); setSellerInput(plan.sellerId || ""); }}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[rgb(var(--color-primary))] hover:underline"
                          >
                            <UserCirclePlus className="h-4 w-4" />
                            {plan.sellerId ? "שנה שיוך" : "שייך בעל מקצוע"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!data?.plans || data.plans.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-[rgb(var(--color-text-muted))]">
                      לא נמצאו תוכניות תחזוקה
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
