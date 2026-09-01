"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** Tax profile form for sellers to set up invoice details. */
export default function TaxProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [osekType, setOsekType] = useState<string>("");
  const [osekNumber, setOsekNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setOsekType(data.osekType || "");
          setOsekNumber(data.osekNumber || "");
          setLegalName(data.legalName || "");
          setBusinessAddress(data.businessAddress || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[rgb(var(--color-text-secondary))]">התחבר כדי לערוך את הפרופיל העסקי.</p>
      </div>
    );
  }

  if (session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">רק בעלי מקצוע יכולים להגדיר פרופיל עסקי.</p>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    if (!osekType) {
      setError("יש לבחור סוג עוסק");
      setSaving(false);
      return;
    }

    if (!legalName.trim()) {
      setError("יש למלא שם עסק / שם מלא");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          osekType,
          osekNumber: osekNumber || null,
          legalName: legalName.trim(),
          businessAddress: businessAddress.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "לא הצלחנו לשמור את הפרטים");
      }
    } catch {
      setError("לא הצלחנו לשמור את הפרטים");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
        פרופיל עסקי
      </h1>
      <p className="mb-8 text-[14px] text-[rgb(var(--color-text-secondary))]">
        הגדר את פרטי העסק שלך להנפקת חשבוניות מס
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 space-y-5">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
              סוג עוסק
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOsekType("patur")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-[14px] font-semibold transition-all ${
                  osekType === "patur"
                    ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]"
                    : "border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary-light))]"
                }`}
              >
                עוסק פטור
              </button>
              <button
                type="button"
                onClick={() => setOsekType("murshe")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-[14px] font-semibold transition-all ${
                  osekType === "murshe"
                    ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]"
                    : "border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary-light))]"
                }`}
              >
                עוסק מורשה
              </button>
            </div>
            {osekType === "murshe" && (
              <p className="mt-2 text-[12px] text-[rgb(var(--color-text-muted))]">
                עוסק מורשה - מע״מ 18% יתווסף לחשבונית
              </p>
            )}
            {osekType === "patur" && (
              <p className="mt-2 text-[12px] text-[rgb(var(--color-text-muted))]">
                עוסק פטור - ללא מע״מ
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
              מספר עוסק
            </label>
            <input
              value={osekNumber}
              onChange={(e) => setOsekNumber(e.target.value)}
              placeholder="מספר עוסק מורשה / פטור"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
              שם עסק / שם מלא <span className="text-[rgb(var(--color-error))]">*</span>
            </label>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="השם שיופיע בחשבונית"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
              כתובת עסק
            </label>
            <input
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="כתובת שתופיע בחשבונית"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-[13px] font-medium text-[rgb(var(--color-error))]">
            {error}
          </p>
        )}

        {success && (
          <p className="text-[13px] font-medium text-[rgb(var(--color-success))]">
            הפרטים נשמרו בהצלחה
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "שומר..." : "שמור פרטים"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-xl border border-[rgb(var(--color-border))] px-6 py-4 text-[15px] font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
          >
            חזור
          </button>
        </div>
      </form>
    </div>
  );
}
