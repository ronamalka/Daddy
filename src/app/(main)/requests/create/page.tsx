"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { DISTRICTS } from "@/lib/districts";
import { UserCircle } from "lucide-react";

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.2)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4 inline-block">
          <UserCircle className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">צריך להתחבר</h2>
        <p className="mt-2 text-[14px] text-[rgb(var(--color-text-secondary))]">כדי לפרסם בקשת שירות, צריך קודם להתחבר או להירשם</p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white">
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

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[rgb(var(--color-text))]">פרסם בקשת שירות</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
          ספר מה אתה צריך ואבאל׳ות מנוסים ייצרו איתך קשר עם הצעות
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3">
          <p className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">מה אתה צריך?</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">כותרת הבקשה</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="לדוגמה: צריך עזרה בהרכבת ארון מאיקאה"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תיאור מפורט</label>
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

        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">פרטים נוספים <span className="font-normal text-[rgb(var(--color-text-muted))] text-[13px]">(אופציונלי)</span></h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">סוג שירות</label>
              <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputClass}>
                <option value="">בחר שירות (אופציונלי)</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.slug} label={cat.nameHe}>
                    {cat.services.map((svc) => (
                      <option key={svc.slug} value={svc.slug}>{svc.nameHe}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">אזור</label>
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
          className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] hover:shadow-[0_6px_20px_rgba(var(--color-primary),0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
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
