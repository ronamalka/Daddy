"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LocationPicker } from "@/components/location-picker";
import { Check } from "lucide-react";

interface ServiceAreaEntry {
  districtCode: number;
  districtName: string;
  cityCode?: number;
  cityName?: string;
}

export default function ServiceAreasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [areas, setAreas] = useState<ServiceAreaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/service-areas")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAreas(data.map((a: ServiceAreaEntry & { id?: string }) => ({
            districtCode: a.districtCode,
            districtName: a.districtName,
            cityCode: a.cityCode,
            cityName: a.cityName,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/service-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas }),
      });
      if (res.ok) {
        const savedData = await res.json();
        setAreas(
          (savedData as (ServiceAreaEntry & { id?: string })[]).map((a) => ({
            districtCode: a.districtCode,
            districtName: a.districtName,
            cityCode: a.cityCode,
            cityName: a.cityName,
          }))
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError((errData as { error?: string }).error || "שגיאה בשמירה");
      }
    } catch {
      setError("שגיאה בשמירה, נסה שנית");
    }
    setSaving(false);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל אזורי שירות.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">אזורי שירות</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            {session.user.role === "SELLER"
              ? "בחר את האזורים והערים בהם אתה נותן שירות"
              : "בחר את האזור שלך כדי למצוא אבאל׳ות קרובים"}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-all"
        >
          חזרה
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : (
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <LocationPicker
            mode="multi"
            areas={areas}
            onAreasChange={setAreas}
          />

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמור שינויים"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-[rgb(var(--color-success))]">
                <Check className="h-4 w-4" />
                נשמר בהצלחה
              </span>
            )}
            {error && (
              <span className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
