"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setName(data.name || "");
          setBio(data.bio || "");
          setPhone(data.phone || "");
          setCity(data.city || "");
          setAvatar(data.avatar || "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio: bio || null, phone: phone || null, city: city || null, avatar: avatar || null }),
    });
    if (res.ok) {
      router.push("/profile");
    }
    setSaving(false);
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
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">עיר</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="תל אביב" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">טלפון</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">ביו</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="ספר על עצמך..." className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">קישור לתמונת פרופיל</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </form>
    </div>
  );
}
