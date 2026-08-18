"use client";

import { useState } from "react";

const CRITERIA = [
  { key: "ratingQuality", label: "איכות", icon: "⭐", desc: "איכות העבודה והתוצאה הסופית" },
  { key: "ratingAttitude", label: "יחס", icon: "🤝", desc: "גישה, אדיבות ותקשורת" },
  { key: "ratingTimeliness", label: "זמנים", icon: "⏰", desc: "עמידה בזמנים ודייקנות" },
  { key: "ratingPrice", label: "מחיר", icon: "💰", desc: "תמורה הוגנת למחיר ששולם" },
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
    <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6">
      <h3 className="text-[18px] font-bold text-[#2D3436] mb-1">דרג את {sellerName}</h3>
      <p className="text-[13px] text-[#B2BEC3] mb-5">לחץ על הציון המתאים בכל קריטריון (1-10)</p>

      <div className="space-y-5">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[16px]">{c.icon}</span>
              <span className="text-[14px] font-semibold text-[#2D3436]">{c.label}</span>
              <span className="text-[12px] text-[#B2BEC3]">— {c.desc}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((prev) => ({ ...prev, [c.key]: n }))}
                  className={`h-9 w-9 rounded-[8px] text-[13px] font-semibold transition-all ${
                    ratings[c.key] === n
                      ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]"
                      : ratings[c.key] > 0 && n <= ratings[c.key]
                      ? "bg-[#F0EEFF] text-[#6C5CE7]"
                      : "bg-[#FAFBFF] text-[#B2BEC3] hover:bg-[#F0EEFF] hover:text-[#6C5CE7]"
                  }`}
                >
                  {n}
                </button>
              ))}
              {ratings[c.key] > 0 && (
                <span className="flex items-center px-2 text-[14px] font-bold text-[#6C5CE7]">{ratings[c.key]}/10</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {avg && (
        <div className="mt-5 flex items-center gap-3 rounded-[12px] bg-gradient-to-r from-[#6C5CE7]/10 to-[#00D2D3]/10 p-4">
          <div className="text-[28px] font-bold text-[#6C5CE7]">{avg}</div>
          <div>
            <p className="text-[13px] font-semibold text-[#2D3436]">ציון כללי</p>
            <p className="text-[11px] text-[#B2BEC3]">ממוצע של כל הקריטריונים</p>
          </div>
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ספר על החוויה שלך — מה היה טוב, מה אפשר לשפר..."
        rows={4}
        className="mt-5 w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none resize-none"
      />

      {error && <p className="mt-2 text-[13px] text-[#FF6B6B]">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !allRated || !comment.trim()}
          className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1] disabled:opacity-40"
        >
          {submitting ? "שולח..." : "שלח חוות דעת"}
        </button>
        {!allRated && <span className="text-[12px] text-[#B2BEC3]">דרג את כל הקריטריונים</span>}
      </div>
    </div>
  );
}
