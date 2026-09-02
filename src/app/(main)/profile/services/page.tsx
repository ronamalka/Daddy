"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ServicePicker } from "@/components/service-picker";
import { Check } from "@phosphor-icons/react";
import { getServiceBySlug } from "@/lib/services";
import { parseUserServiceList } from "@/lib/user-services";

/** Shows the form to pick which services the user offers and mute request alerts per service. */
export default function ProfileServicesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user-services")
      .then((r) => r.json())
      .then((data) => {
        const rows = parseUserServiceList(data);
        setServices(rows.map((row) => row.serviceSlug));
        setMuted(Object.fromEntries(rows.map((row) => [row.serviceSlug, row.alertsMuted])));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /** Saves the list of services this seller offers and per-service request-alert mutes. */
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/user-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: services.map((slug) => ({
            serviceSlug: slug,
            alertsMuted: muted[slug] ?? false,
          })),
        }),
      });
      if (res.ok) {
        const savedData = parseUserServiceList(await res.json());
        setServices(savedData.map((row) => row.serviceSlug));
        setMuted(Object.fromEntries(savedData.map((row) => [row.serviceSlug, row.alertsMuted])));
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
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל שירותים.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">השירותים שלי</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">בחר את השירותים שאתה מציע ללקוחות</p>
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
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <ServicePicker selected={services} onChange={setServices} />

          {services.length > 0 && (
            <div className="mt-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-4">
              <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">התראות על בקשות באזור</p>
              <p className="mt-1 text-[12px] text-[rgb(var(--color-text-secondary))]">
                כשקונה מפרסם עבודה בשירות ובאזור שלך, תקבל התראה באפליקציה. אפשר לכבות לכל שירות בנפרד.
              </p>
              <div className="mt-3 divide-y divide-[rgb(var(--color-border-light))]">
                {services.map((slug) => {
                  const label = getServiceBySlug(slug)?.nameHe || slug;
                  return (
                    <label key={slug} className="flex items-start gap-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!(muted[slug] ?? false)}
                        onChange={(e) => setMuted((prev) => ({ ...prev, [slug]: !e.target.checked }))}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-[13px] font-medium text-[rgb(var(--color-text))]">{label}</span>
                        <span className="block text-[12px] text-[rgb(var(--color-text-muted))]">
                          {muted[slug] ? "התראות כבויות" : "התראות פעילות"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
                מעולה. השירותים עודכנו.
              </span>
            )}
            {error && <span className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</span>}

            {services.length > 0 && (
              <span className="ms-auto text-[13px] text-[rgb(var(--color-primary))] font-medium">{services.length} שירותים נבחרו</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
