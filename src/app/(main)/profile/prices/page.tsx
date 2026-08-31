"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getServiceBySlug, ALL_SERVICES } from "@/lib/services";
import { userServiceSlugs } from "@/lib/user-services";
import { Check } from "@phosphor-icons/react";
import { CategoryIcon } from "@/components/ui/category-icon";

interface PriceEntry {
  serviceSlug: string;
  price: number;
  description: string;
}

/** Shows the form to set prices for each offered service. */
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
        const svcList = userServiceSlugs(services);
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

  /** Updates the price or description for one listed service. */
  function updatePrice(slug: string, field: "price" | "description", value: string) {
    setPrices((prev) =>
      prev.map((p) =>
        p.serviceSlug === slug
          ? { ...p, [field]: field === "price" ? Number(value) || 0 : value }
          : p
      )
    );
  }

  /** Saves the seller's service prices. */
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
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל מחירון.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">המחירון שלי</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">הגדר מחירים לשירותים שאתה מציע</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg))] transition-all"
        >
          חזרה
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : userServices.length === 0 ? (
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 text-center">
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))] mb-2">עדיין לא בחרת שירותים</p>
          <p className="text-[14px] text-[rgb(var(--color-text-muted))] mb-4">קודם בחר את השירותים שאתה מציע, אחר כך הוסף מחירים</p>
          <button
            onClick={() => router.push("/profile/services")}
            className="rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))]"
          >
            בחר שירותים
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <div className="px-6 py-4 bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border-light))] rounded-t-xl">
            <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">
              הגדר מחיר לכל שירות. שירותים ללא מחיר לא יופיעו במחירון הפומבי שלך.
            </p>
          </div>

          <div className="divide-y divide-[rgb(var(--color-border-light))]">
            {prices.map((entry) => {
              const svc = getServiceBySlug(entry.serviceSlug);
              const svcDef = ALL_SERVICES.find((s) => s.slug === entry.serviceSlug);
              return (
                <div key={entry.serviceSlug} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    {svcDef && <CategoryIcon slug={svcDef.category} className="h-4 w-4 text-[rgb(var(--color-primary))]" />}
                    <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
                      {svc?.nameHe || entry.serviceSlug}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
                      <span className="px-3 text-[14px] text-[rgb(var(--color-text-muted))]">₪</span>
                      <input
                        type="number"
                        value={entry.price || ""}
                        onChange={(e) => updatePrice(entry.serviceSlug, "price", e.target.value)}
                        placeholder="0"
                        className="w-24 rounded-r-xl bg-transparent py-2.5 text-[14px] font-medium text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={entry.description}
                      onChange={(e) => updatePrice(entry.serviceSlug, "description", e.target.value)}
                      placeholder="פירוט (אופציונלי) — למשל: כולל חומרים"
                      className="flex-1 min-w-[200px] rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-2.5 text-[13px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-[rgb(var(--color-border-light))] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמור מחירון"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-[rgb(var(--color-success))]">
                <Check className="h-4 w-4" />
                נשמר. אבא היה מתגאה.
              </span>
            )}
            {error && <span className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
