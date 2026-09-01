"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "@phosphor-icons/react";

interface Preferences {
  notifyWhatsapp: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  marketingConsent: boolean;
}

/** Notification preferences page. */
export default function NotificationPreferencesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [prefs, setPrefs] = useState<Preferences>({
    notifyWhatsapp: true,
    notifySms: false,
    notifyEmail: true,
    marketingConsent: false,
  });

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.notifyWhatsapp === "boolean") {
          setPrefs({
            notifyWhatsapp: data.notifyWhatsapp,
            notifySms: data.notifySms,
            notifyEmail: data.notifyEmail,
            marketingConsent: data.marketingConsent,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל הגדרות התראות.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          notifyWhatsapp: data.notifyWhatsapp,
          notifySms: data.notifySms,
          notifyEmail: data.notifyEmail,
          marketingConsent: data.marketingConsent,
        });
        setSuccess("ההגדרות נשמרו בהצלחה");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "לא הצלחנו לשמור את השינויים");
      }
    } catch {
      setError("לא הצלחנו לשמור את השינויים");
    }
    setSaving(false);
  }

  function toggle(key: keyof Preferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => router.push("/profile")}
        className="mb-6 flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לפרופיל
      </button>

      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
        הגדרות התראות
      </h1>
      <p className="mb-8 text-[14px] text-[rgb(var(--color-text-secondary))]">
        בחר איך תרצה לקבל עדכונים על הזמנות ופניות חדשות
      </p>

      <div className="space-y-6">
        {/* Transactional notifications */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 space-y-5">
          <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))] mb-4">
            התראות עסקאות
          </h2>

          <ToggleRow
            label="ווטסאפ"
            description="קבל התראות על הזמנות ופניות חדשות דרך ווטסאפ"
            checked={prefs.notifyWhatsapp}
            onChange={() => toggle("notifyWhatsapp")}
          />

          <div className="h-px bg-[rgb(var(--color-border-light))]" />

          <ToggleRow
            label="SMS"
            description="קבל התראות דרך הודעות טקסט"
            checked={prefs.notifySms}
            onChange={() => toggle("notifySms")}
          />

          <div className="h-px bg-[rgb(var(--color-border-light))]" />

          <ToggleRow
            label="אימייל"
            description="קבל התראות על הזמנות ופניות דרך דואר אלקטרוני"
            checked={prefs.notifyEmail}
            onChange={() => toggle("notifyEmail")}
          />
        </div>

        {/* Marketing consent */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))] mb-4">
            דיוור שיווקי
          </h2>

          <ToggleRow
            label="הסכמה לדיוור שיווקי"
            description="אני מסכים/ה לקבל הודעות שיווקיות, מבצעים ועדכונים. ניתן לבטל בכל עת בהתאם לתיקון 13 לחוק התקשורת."
            checked={prefs.marketingConsent}
            onChange={() => toggle("marketingConsent")}
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] font-medium text-[rgb(var(--color-error))]">
            {error}
          </p>
        )}

        {success && (
          <p className="text-[13px] font-medium text-[rgb(var(--color-success))]">
            {success}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
      </div>
    </div>
  );
}

/** A toggle switch row with label and description. */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-[14px] font-medium text-[rgb(var(--color-text))]">{label}</p>
        <p className="mt-0.5 text-[12px] text-[rgb(var(--color-text-muted))]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.4)] ${
          checked ? "bg-[rgb(var(--color-primary))]" : "bg-[rgb(var(--color-border))]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-1 ${
            checked ? "mr-1 translate-x-0" : "mr-6 translate-x-0"
          }`}
          style={{ marginInlineStart: checked ? "calc(100% - 1.5rem)" : "0.25rem", marginTop: "0.25rem" }}
        />
      </button>
    </div>
  );
}
