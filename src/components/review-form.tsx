"use client";

import { useState } from "react";
import { Star, Handshake, Clock, Coins } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const CRITERIA = [
  { key: "ratingQuality", label: "איכות", icon: <Star className="h-4 w-4" />, desc: "איכות העבודה והתוצאה הסופית" },
  { key: "ratingAttitude", label: "יחס", icon: <Handshake className="h-4 w-4" />, desc: "גישה, אדיבות ותקשורת" },
  { key: "ratingTimeliness", label: "זמנים", icon: <Clock className="h-4 w-4" />, desc: "עמידה בזמנים ודייקנות" },
  { key: "ratingPrice", label: "מחיר", icon: <Coins className="h-4 w-4" />, desc: "תמורה הוגנת למחיר ששולם" },
] as const;

interface ReviewFormProps {
  orderId: string;
  sellerName: string;
  onSubmitted: () => void;
}

export function ReviewForm({ orderId, sellerName, onSubmitted }: ReviewFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    ratingQuality: 0,
    ratingAttitude: 0,
    ratingTimeliness: 0,
    ratingPrice: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allRated = Object.values(ratings).every((v) => v > 0);
  const avg = allRated
    ? (Object.values(ratings).reduce((s, v) => s + v, 0) / 4).toFixed(1)
    : null;

  async function handleSubmit() {
    if (!allRated || !comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, ...ratings }),
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "שגיאה בשליחת חוות הדעת");
      }
    } catch {
      setError("שגיאה, נסה שנית");
    }
    setSubmitting(false);
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
      <h3 className="text-[18px] font-bold text-[rgb(var(--color-text))] mb-1">דרג את {sellerName}</h3>
      <p className="text-[13px] text-[rgb(var(--color-text-muted))] mb-5">לחץ על הציון המתאים בכל קריטריון (1-10)</p>

      <div className="space-y-5">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[rgb(var(--color-primary))]">{c.icon}</span>
              <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{c.label}</span>
              <span className="text-[12px] text-[rgb(var(--color-text-muted))]">— {c.desc}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((prev) => ({ ...prev, [c.key]: n }))}
                  className={cn(
                    "h-9 w-9 rounded-lg text-[13px] font-semibold transition-all",
                    ratings[c.key] === n
                      ? "bg-[rgb(var(--color-primary))] text-white shadow-[0_2px_8px_rgba(var(--color-primary),0.3)]"
                      : ratings[c.key] > 0 && n <= ratings[c.key]
                      ? "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]"
                      : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-muted))] hover:bg-[rgba(var(--color-primary),0.1)] hover:text-[rgb(var(--color-primary))]"
                  )}
                >
                  {n}
                </button>
              ))}
              {ratings[c.key] > 0 && (
                <span className="flex items-center px-2 text-[14px] font-bold text-[rgb(var(--color-primary))]">{ratings[c.key]}/10</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {avg && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[rgba(var(--color-primary),0.1)] to-[rgba(var(--color-accent),0.1)] p-4">
          <div className="text-[28px] font-bold text-[rgb(var(--color-primary))]">{avg}</div>
          <div>
            <p className="text-[13px] font-semibold text-[rgb(var(--color-text))]">ציון כללי</p>
            <p className="text-[11px] text-[rgb(var(--color-text-muted))]">ממוצע של כל הקריטריונים</p>
          </div>
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ספר על החוויה שלך — מה היה טוב, מה אפשר לשפר..."
        rows={4}
        className="mt-5 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none resize-none"
      />

      {error && <p className="mt-2 text-[13px] text-[rgb(var(--color-error))]">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !allRated || !comment.trim()}
          className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
        >
          {submitting ? "שולח..." : "שלח חוות דעת"}
        </button>
        {!allRated && <span className="text-[12px] text-[rgb(var(--color-text-muted))]">דרג את כל הקריטריונים</span>}
      </div>
    </div>
  );
}
