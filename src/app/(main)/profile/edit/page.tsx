"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LocationPicker } from "@/components/location-picker";

/** Shows the form to edit the user's profile. */
export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cityCode, setCityCode] = useState<number | undefined>(undefined);
  const [districtCode, setDistrictCode] = useState<number | undefined>(undefined);
  const [avatar, setAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [payoutBankAccount, setPayoutBankAccount] = useState("");
  const [payoutBankBranch, setPayoutBankBranch] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setName(data.name || "");
          setBio(data.bio || "");
          setPhone(data.phone || "");
          setCity(data.city || "");
          setCityCode(data.cityCode ?? undefined);
          setDistrictCode(data.districtCode ?? undefined);
          setAvatar(data.avatar || "");
          setPayoutBankAccount(data.payoutBankAccount || "");
          setPayoutBankBranch(data.payoutBankBranch || "");
          setPayoutAccountNumber(data.payoutAccountNumber || "");
        }
        setLoading(false);
      });
  }, []);

  if (!session) {
    return <div className="flex items-center justify-center py-20"><p className="text-[rgb(var(--color-text-secondary))]">התחבר כדי לערוך את הפרופיל.</p></div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" /></div>;
  }

  /** Updates city, cityCode, and districtCode when a location is picked. */
  const handleLocationChange = useCallback((val: { cityCode: number; cityName: string; districtCode: number; districtName: string }) => {
    setCity(val.cityName);
    setCityCode(val.cityCode);
    setDistrictCode(val.districtCode);
  }, []);

  /** Saves the user's profile details. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio: bio || null,
          phone: phone || null,
          city: city || null,
          cityCode: cityCode ?? null,
          districtCode: districtCode ?? null,
          avatar: avatar || null,
          payoutBankAccount: payoutBankAccount || null,
          payoutBankBranch: payoutBankBranch || null,
          payoutAccountNumber: payoutAccountNumber || null,
        }),
      });
      if (res.ok) {
        router.push("/profile");
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "לא הצלחנו לשמור את השינויים");
      }
    } catch {
      setError("לא הצלחנו לשמור את השינויים");
    }
    setSaving(false);
  }

  /** Uploads a file to /api/upload and sets the avatar URL. */
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.files?.[0]?.url) {
          setAvatar(data.files[0].url);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setAvatarError((data as { error?: string }).error || "העלאה נכשלה");
      }
    } catch {
      setAvatarError("העלאה נכשלה");
    }
    setAvatarUploading(false);
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">עריכת פרופיל</h1>
      <p className="mb-8 text-[14px] text-[rgb(var(--color-text-secondary))]">עדכן את הפרטים האישיים שלך</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 space-y-5">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">שם מלא</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <LocationPicker
            mode="single"
            label="עיר"
            value={cityCode ? { cityCode, cityName: city, districtCode } : undefined}
            onChange={handleLocationChange}
          />
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">טלפון</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">ביו</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="ספר על עצמך..." className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תמונת פרופיל</label>
            <div className="flex items-center gap-4">
              {avatar && (
                <img
                  src={avatar}
                  alt="תמונת פרופיל"
                  className="h-16 w-16 rounded-full object-cover border-2 border-[rgb(var(--color-border))]"
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={avatarUploading}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`inline-block cursor-pointer rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] ${avatarUploading ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {avatarUploading ? "מעלה..." : "העלה תמונה"}
                </label>
                {avatarError && (
                  <p className="mt-1.5 text-[12px] text-[rgb(var(--color-error))]">{avatarError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {session.user.role === "SELLER" && (
          <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-1">פרטי חשבון בנק</h2>
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">לקבלת תשלומים עתידיים. הפרטים נשמרים מוצפנים.</p>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">שם הבנק</label>
              <input value={payoutBankAccount} onChange={(e) => setPayoutBankAccount(e.target.value)} placeholder="לדוגמה: לאומי, פועלים..." className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">מספר סניף</label>
              <input value={payoutBankBranch} onChange={(e) => setPayoutBankBranch(e.target.value)} placeholder="מספר סניף" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">מספר חשבון</label>
              <input value={payoutAccountNumber} onChange={(e) => setPayoutAccountNumber(e.target.value)} placeholder="מספר חשבון" className={inputClass} />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-[13px] font-medium text-[rgb(var(--color-error))]">{error}</p>
        )}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </form>
    </div>
  );
}
