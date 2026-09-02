"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Prohibit, ShieldWarning, Eye, Warning, ChatCircleDots } from "@phosphor-icons/react";

interface Violation {
  id: string;
  senderId: string;
  receiverId: string;
  orderId: string | null;
  content: string;
  pattern: string;
  reason: string;
  dismissed: boolean;
  warned: boolean;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "dismissed" | "warned";

const PATTERN_LABELS: Record<string, string> = {
  phone_number: "מספר טלפון",
  email_address: "כתובת אימייל",
  messenger_app: "אפליקציית הודעות",
  payment_app: "אפליקציית תשלום",
  contact_phrase: "ביטוי קשר",
  external_url: "קישור חיצוני",
  obfuscated_digits: "ספרות מוסתרות",
};

function statusLabel(v: Violation): string {
  if (v.dismissed) return "בוטל";
  if (v.warned) return "הוזהר";
  return "ממתין";
}

function statusBadgeClass(v: Violation): string {
  if (v.dismissed)
    return "bg-[rgba(var(--color-text-muted),0.1)] text-[rgb(var(--color-text-muted))]";
  if (v.warned)
    return "bg-[rgba(var(--color-accent-yellow),0.15)] text-[rgb(var(--color-accent-yellow))]";
  return "bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]";
}

/** Admin page for reviewing blocked chat messages. */
export default function ChatModerationPage() {
  const { data: session } = useSession();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`/api/admin/chat-violations?${params}`);
      const data = await res.json();
      setViolations(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch {
      setViolations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, offset]);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    fetchViolations();
  }, [session, fetchViolations]);

  const handleAction = async (id: string, action: "dismiss" | "warn") => {
    const res = await fetch(`/api/admin/chat-violations/${id}/${action}`, {
      method: "POST",
    });
    if (res.ok) {
      const updated: Violation = await res.json();
      setViolations((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updated } : v)),
      );
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Prohibit className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">
          הגישה נדחתה
        </p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">
          אתה צריך הרשאות מנהל כדי לצפות בדף הזה
        </p>
      </div>
    );
  }

  if (loading && violations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  const todayViolations = violations.filter((v) => {
    const today = new Date();
    const created = new Date(v.createdAt);
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  }).length;

  const repeatOffenders = new Set(
    violations
      .filter((v) => !v.dismissed)
      .map((v) => v.senderId),
  );
  const repeatCount = [...repeatOffenders].filter((senderId) =>
    violations.filter((v) => v.senderId === senderId && !v.dismissed).length > 1,
  ).length;

  const hasMore = offset + limit < total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <ShieldWarning className="h-8 w-8 text-[rgb(var(--color-primary))]" />
          <div>
            <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
              ניהול צ׳אט
            </h1>
            <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
              הודעות שנחסמו בגלל ניסיון להחלפת פרטי קשר
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-2">
            <ChatCircleDots className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
              סה״כ הפרות
            </p>
          </div>
          <p className="text-[28px] font-bold text-[rgb(var(--color-text))]">{total}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" />
            <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
              היום
            </p>
          </div>
          <p className="text-[28px] font-bold text-[rgb(var(--color-text))]">
            {todayViolations}
          </p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-2">
            <Prohibit className="h-5 w-5 text-[rgb(var(--color-error))]" />
            <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
              עבריינים חוזרים
            </p>
          </div>
          <p className="text-[28px] font-bold text-[rgb(var(--color-text))]">
            {repeatCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "dismissed", "warned"] as StatusFilter[]).map(
          (f) => {
            const labels: Record<StatusFilter, string> = {
              all: "הכל",
              pending: "ממתין",
              dismissed: "בוטל",
              warned: "הוזהר",
            };
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setOffset(0);
                }}
                className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                  filter === f
                    ? "bg-[rgb(var(--color-primary))] text-white"
                    : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-border-light))]"
                }`}
              >
                {labels[f]}
              </button>
            );
          },
        )}
      </div>

      {/* Violations table */}
      <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))]">
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  תאריך
                </th>
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  שולח
                </th>
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  תוכן
                </th>
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  סוג
                </th>
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  סטטוס
                </th>
                <th className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-light))]">
              {violations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-[14px] text-[rgb(var(--color-text-muted))]"
                  >
                    אין הפרות
                  </td>
                </tr>
              ) : (
                violations.map((v) => (
                  <tr
                    key={v.id}
                    className="transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
                  >
                    <td className="px-5 py-4 text-[13px] text-[rgb(var(--color-text-secondary))] whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[rgb(var(--color-text))]">
                      <span className="font-mono text-[12px]">
                        {v.senderId.slice(0, 8)}...
                      </span>
                    </td>
                    <td
                      className="max-w-[300px] truncate px-5 py-4 text-[13px] text-[rgb(var(--color-text))]"
                      title={v.content}
                    >
                      {v.content.length > 80
                        ? v.content.slice(0, 80) + "..."
                        : v.content}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-primary))]">
                        {PATTERN_LABELS[v.pattern] ?? v.pattern}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(v)}`}
                      >
                        {statusLabel(v)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {!v.dismissed && (
                          <button
                            onClick={() => handleAction(v.id, "dismiss")}
                            title="סימון כחיובי שגוי"
                            className="rounded-lg p-1.5 text-[rgb(var(--color-text-muted))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {!v.warned && !v.dismissed && (
                          <button
                            onClick={() => handleAction(v.id, "warn")}
                            title="שליחת אזהרה למשתמש"
                            className="rounded-lg p-1.5 text-[rgb(var(--color-accent-yellow))] transition-colors hover:bg-[rgba(var(--color-accent-yellow),0.1)]"
                          >
                            <Warning className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-[rgb(var(--color-border-light))] px-5 py-3">
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">
              {offset + 1}–{Math.min(offset + limit, total)} מתוך {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[rgb(var(--color-primary))] transition-colors hover:bg-[rgba(var(--color-primary),0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                הקודם
              </button>
              <button
                disabled={!hasMore}
                onClick={() => setOffset(offset + limit)}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[rgb(var(--color-primary))] transition-colors hover:bg-[rgba(var(--color-primary),0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
