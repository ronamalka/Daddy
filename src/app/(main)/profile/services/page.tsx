"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ServicePicker } from "@/components/service-picker";

export default function ProfileServicesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user-services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
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
      const res = await fetch("/api/user-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      if (res.ok) {
        const savedData = await res.json();
        setServices(savedData);
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
        <p className="text-[16px] text-[#636E72]">התחבר כדי לנהל שירותים.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#2D3436]">השירותים שלי</h1>
          <p className="mt-1 text-[14px] text-[#636E72]">בחר את השירותים שאתה מציע ללקוחות</p>
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
      ) : (
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <ServicePicker selected={services} onChange={setServices} />

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1] disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמור שינויים"}
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

            {services.length > 0 && (
              <span className="ms-auto text-[13px] text-[#6C5CE7] font-medium">{services.length} שירותים נבחרו</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
