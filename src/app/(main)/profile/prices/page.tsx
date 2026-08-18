"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getServiceBySlug, ALL_SERVICES } from "@/lib/services";

interface PriceEntry {
  serviceSlug: string;
  price: number;
  description: string;
}

export default function ProfilePricesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userServices, setUserServices] = useState<string[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/user-services").then((r) => r.json()),
      fetch("/api/service-prices").then((r) => r.json()),
    ])
      .then(([services, existingPrices]) => {
        const svcList: string[] = Array.isArray(services) ? services : [];
        setUserServices(svcList);

        const priceMap = new Map<string, PriceEntry>();
        if (Array.isArray(existingPrices)) {
          for (const p of existingPrices) {
            priceMap.set(p.serviceSlug, {
              serviceSlug: p.serviceSlug,
              price: p.price,
              description: p.description || "",
            });
          }
        }

        const merged = svcList.map((slug) =>
          priceMap.get(slug) || { serviceSlug: slug, price: 0, description: "" }
        );
        setPrices(merged);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function updatePrice(slug: string, field: "price" | "description", value: string) {
    setPrices((prev) =>
      prev.map((p) =>
        p.serviceSlug === slug
          ? { ...p, [field]: field === "price" ? Number(value) || 0 : value }
          : p
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/service-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: prices.filter((p) => p.price > 0) }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "שגיאה בשמירה");
      }
    } catch {
      setError("שגיאה בשמירה, נסה שנית");
    }
    setSaving(false);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[#636E72]">התחבר כדי לנהל מחירון.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#2D3436]">המחירון שלי</h1>
          <p className="mt-1 text-[14px] text-[#636E72]">הגדר מחירים לשירותים שאתה מציע</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-[12px] border border-[#E8ECF1] px-4 py-2 text-[13px] font-medium text-[#636E72] hover:bg-[#FAFBFF] transition-all"
        >
          חזרה
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
        </div>
      ) : userServices.length === 0 ? (
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-8 text-center">
          <p className="text-[16px] font-medium text-[#2D3436] mb-2">עדיין לא בחרת שירותים</p>
          <p className="text-[14px] text-[#B2BEC3] mb-4">קודם בחר את השירותים שאתה מציע, אחר כך הוסף מחירים</p>
          <button
            onClick={() => router.push("/profile/services")}
            className="rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A4BD1]"
          >
            בחר שירותים
          </button>
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <div className="px-6 py-4 bg-[#FAFBFF] border-b border-[#F1F3F8] rounded-t-[16px]">
            <p className="text-[13px] text-[#636E72]">
              הגדר מחיר לכל שירות. שירותים ללא מחיר לא יופיעו במחירון הפומבי שלך.
            </p>
          </div>

          <div className="divide-y divide-[#F1F3F8]">
            {prices.map((entry) => {
              const svc = getServiceBySlug(entry.serviceSlug);
              const svcDef = ALL_SERVICES.find((s) => s.slug === entry.serviceSlug);
              return (
                <div key={entry.serviceSlug} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    {svcDef && <span className="text-[16px]">{svcDef.categoryIcon}</span>}
                    <span className="text-[14px] font-semibold text-[#2D3436]">
                      {svc?.nameHe || entry.serviceSlug}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF]">
                      <span className="px-3 text-[14px] text-[#B2BEC3]">₪</span>
                      <input
                        type="number"
                        value={entry.price || ""}
                        onChange={(e) => updatePrice(entry.serviceSlug, "price", e.target.value)}
                        placeholder="0"
                        className="w-24 rounded-r-[12px] bg-transparent py-2.5 text-[14px] font-medium text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={entry.description}
                      onChange={(e) => updatePrice(entry.serviceSlug, "description", e.target.value)}
                      placeholder="פירוט (אופציונלי) — למשל: כולל חומרים"
                      className="flex-1 min-w-[200px] rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-2.5 text-[13px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-[#F1F3F8] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1] disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמור מחירון"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#00B894]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                נשמר בהצלחה
              </span>
            )}
            {error && <span className="text-[14px] font-medium text-[#FF6B6B]">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
