"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { DISTRICTS } from "@/lib/districts";

export default function CreateRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [districtCode, setDistrictCode] = useState("");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6C5CE7]/20 border-t-[#6C5CE7]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-full bg-[#6C5CE7]/10 p-4 mb-4 inline-block">
          <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
        </div>
        <h2 className="text-[20px] font-bold text-[#2D3436]">צריך להתחבר</h2>
        <p className="mt-2 text-[14px] text-[#636E72]">כדי לפרסם בקשת שירות, צריך קודם להתחבר או להירשם</p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-[#6C5CE7] px-6 py-3 text-[14px] font-bold text-white">
          הרשמה / התחברות
        </Link>
      </div>
    );
  }

  const districtName = districtCode ? DISTRICTS[Number(districtCode)] : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        serviceSlug: serviceSlug || undefined,
        districtCode: districtCode ? Number(districtCode) : undefined,
        districtName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/requests/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "שגיאה בשליחת הבקשה");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#2D3436]">פרסם בקשת שירות</h1>
        <p className="mt-1 text-[14px] text-[#636E72]">
          ספר מה אתה צריך ואבאל׳ות מנוסים ייצרו איתך קשר עם הצעות
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-[12px] bg-[#E17055]/10 px-4 py-3">
          <p className="text-[14px] font-medium text-[#E17055]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">מה אתה צריך?</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#636E72]">כותרת הבקשה</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="לדוגמה: צריך עזרה בהרכבת ארון מאיקאה"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#636E72]">תיאור מפורט</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="ספר בפירוט מה צריך לעשות, מתי, ואיפה. ככל שתפרט יותר, כך תקבל הצעות מדויקות יותר."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">פרטים נוספים <span className="font-normal text-[#B2BEC3] text-[13px]">(אופציונלי)</span></h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#636E72]">סוג שירות</label>
              <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputClass}>
                <option value="">בחר שירות (אופציונלי)</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.slug} label={`${cat.icon} ${cat.nameHe}`}>
                    {cat.services.map((svc) => (
                      <option key={svc.slug} value={svc.slug}>{svc.nameHe}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#636E72]">אזור</label>
              <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className={inputClass}>
                <option value="">בחר מחוז (אופציונלי)</option>
                {Object.entries(DISTRICTS).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[12px] bg-[#6C5CE7] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_6px_20px_rgba(108,92,231,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              שולח...
            </span>
          ) : "פרסם בקשה"}
        </button>
      </form>
    </div>
  );
}
