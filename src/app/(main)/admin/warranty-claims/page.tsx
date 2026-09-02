"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Prohibit, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";

interface WarrantyClaim {
  id: string;
  orderId: string;
  buyerId: string;
  description: string;
  photos: string[];
  status: string;
  resolution: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  order: {
    id: string;
    price: number;
    buyerId: string;
    sellerId: string;
    title: string | null;
    status: string;
  };
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  OPEN: { label: "פתוח", bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]" },
  UNDER_REVIEW: { label: "בבדיקה", bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]" },
  APPROVED_RESEND: { label: "שליחה מחדש", bg: "bg-[rgba(var(--color-success),0.15)]", text: "text-[rgb(var(--color-success))]" },
  APPROVED_REFUND: { label: "החזר כספי", bg: "bg-[rgba(var(--color-success),0.15)]", text: "text-[rgb(var(--color-success))]" },
  REJECTED: { label: "נדחה", bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  CLOSED: { label: "נסגר", bg: "bg-[rgba(var(--color-text-muted),0.1)]", text: "text-[rgb(var(--color-text-muted))]" },
};

const FILTER_OPTIONS = [
  { value: "", label: "הכל" },
  { value: "OPEN", label: "פתוח" },
  { value: "UNDER_REVIEW", label: "בבדיקה" },
  { value: "APPROVED_RESEND", label: "שליחה מחדש" },
  { value: "APPROVED_REFUND", label: "החזר כספי" },
  { value: "REJECTED", label: "נדחה" },
  { value: "CLOSED", label: "נסגר" },
];

const RESOLVE_ACTIONS = [
  { value: "APPROVED_RESEND", label: "אשר — שליחה מחדש" },
  { value: "APPROVED_REFUND", label: "אשר — החזר כספי" },
  { value: "REJECTED", label: "דחה" },
];

/** Admin page for managing warranty claims. */
export default function AdminWarrantyClaimsPage() {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Resolve dialog state
  const [resolveTarget, setResolveTarget] = useState<WarrantyClaim | null>(null);
  const [resolveAction, setResolveAction] = useState("");
  const [resolveResolution, setResolveResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  function fetchClaims(filter: string, off: number) {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filter) qs.set("status", filter);
    qs.set("limit", String(limit));
    qs.set("offset", String(off));
    fetch(`/api/admin/warranty-claims?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setClaims(data.claims || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setClaims([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    fetchClaims(statusFilter, offset);
  }, [session, statusFilter, offset]);

  async function handleResolve() {
    if (!resolveTarget || !resolveAction || !resolveResolution.trim()) return;
    setResolving(true);
    setResolveError("");
    try {
      const res = await fetch(`/api/admin/warranty-claims/${resolveTarget.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: resolveAction, resolution: resolveResolution.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error || "הפעולה נכשלה");
        setResolving(false);
        return;
      }
      setClaims((prev) =>
        prev.map((c) =>
          c.id === resolveTarget.id
            ? { ...c, status: data.status, resolution: data.resolution, resolvedAt: data.resolvedAt, resolvedBy: data.resolvedBy }
            : c
        )
      );
      setResolveTarget(null);
      setResolveAction("");
      setResolveResolution("");
    } catch {
      setResolveError("הפעולה נכשלה");
    }
    setResolving(false);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">תביעות אחריות</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">ניהול תביעות אחריות 30 יום</p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
        >
          חזרה ללוח בקרה
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setOffset(0); }}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
              statusFilter === opt.value
                ? "bg-[rgb(var(--color-primary))] text-white"
                : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ShieldCheck className="h-10 w-10 text-[rgb(var(--color-text-muted))] mb-3" />
          <p className="text-[16px] text-[rgb(var(--color-text-muted))]">אין תביעות אחריות</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[rgb(var(--color-warning))]" />
                <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">תביעות</h2>
                <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
                  {total}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))]">
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">תאריך</th>
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">הזמנה</th>
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">מחיר</th>
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">תיאור</th>
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">סטטוס</th>
                    <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--color-border-light))]">
                  {claims.map((claim) => {
                    const badge = STATUS_BADGE[claim.status] || STATUS_BADGE.OPEN;
                    return (
                      <tr key={claim.id} className="transition-colors hover:bg-[rgb(var(--color-surface-elevated))]">
                        <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text-secondary))]">
                          {new Date(claim.createdAt).toLocaleDateString("he-IL")}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/orders/${claim.orderId}`} className="text-[14px] font-semibold text-[rgb(var(--color-primary))] hover:underline">
                            {claim.order.title || claim.orderId.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-[14px] font-semibold text-[rgb(var(--color-text))]">
                          ₪{claim.order.price}
                        </td>
                        <td className="max-w-[200px] px-6 py-4 text-[13px] text-[rgb(var(--color-text-secondary))] truncate">
                          {claim.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(claim.status === "OPEN" || claim.status === "UNDER_REVIEW") && (
                            <button
                              onClick={() => setResolveTarget(claim)}
                              className="text-[12px] font-semibold text-[rgb(var(--color-primary))] hover:underline"
                            >
                              טפל
                            </button>
                          )}
                          {claim.resolution && (
                            <span className="text-[12px] text-[rgb(var(--color-text-muted))]">{claim.resolution}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] disabled:opacity-40 transition-colors"
              >
                הקודם
              </button>
              <span className="text-[13px] text-[rgb(var(--color-text-muted))]">
                {offset + 1}–{Math.min(offset + limit, total)} מתוך {total}
              </span>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
                className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] disabled:opacity-40 transition-colors"
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}

      {/* Resolve Dialog */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolveAction("");
            setResolveResolution("");
            setResolveError("");
          }
        }}
        labelledBy="resolve-warranty-title"
      >
        {resolveTarget && (
          <div className="pt-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-warning),0.15)]">
                <ShieldCheck className="h-5 w-5 text-[rgb(var(--color-warning))]" weight="fill" />
              </div>
              <div>
                <h3 id="resolve-warranty-title" className="text-[16px] font-bold text-[rgb(var(--color-text))]">
                  טיפול בתביעת אחריות
                </h3>
                <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">
                  {resolveTarget.order.title || resolveTarget.orderId.slice(0, 8)} · ₪{resolveTarget.order.price}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-[rgb(var(--color-surface-elevated))] p-3">
              <p className="text-[13px] text-[rgb(var(--color-text))]">{resolveTarget.description}</p>
            </div>

            <label className="mb-1.5 block text-[13px] font-semibold text-[rgb(var(--color-text))]">החלטה</label>
            <select
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
            >
              <option value="">בחר פעולה</option>
              {RESOLVE_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>

            <label className="mb-1.5 block text-[13px] font-semibold text-[rgb(var(--color-text))]">הסבר</label>
            <textarea
              value={resolveResolution}
              onChange={(e) => setResolveResolution(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="הסבר את ההחלטה..."
              className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)] resize-none"
            />

            {resolveError && (
              <p className="mb-3 text-[13px] text-[rgb(var(--color-error))]">{resolveError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleResolve}
                disabled={resolving || !resolveAction || !resolveResolution.trim()}
                className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resolving ? "שומר..." : "שמור"}
              </button>
              <button
                onClick={() => {
                  setResolveTarget(null);
                  setResolveAction("");
                  setResolveResolution("");
                  setResolveError("");
                }}
                className="rounded-xl border border-[rgb(var(--color-border))] px-5 py-2.5 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
