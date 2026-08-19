"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, X } from "lucide-react";

const CATEGORIES = [
  { id: "home-maintenance", name: "תיקונים ותחזוקת הבית" },
  { id: "car-transport", name: "רכב ותחבורה" },
  { id: "negotiation-bureaucracy", name: "מיקוח ובירוקרטיה" },
  { id: "garden-yard", name: "גינון, חצר וארגון" },
  { id: "consulting-training", name: "ייעוץ, הדרכה וסיוע אישי" },
  { id: "moving-lifting", name: "הובלות ושינוע" },
  { id: "tech-support", name: "טכנולוגיה ומחשבים" },
];

const TIERS = ["BASIC", "STANDARD", "PREMIUM"] as const;

const TIER_COLORS: Record<string, { gradient: string; label: string }> = {
  BASIC: { gradient: "from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]", label: "חבילת בסיס" },
  STANDARD: { gradient: "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]", label: "הכי פופולרי" },
  PREMIUM: { gradient: "from-[rgb(var(--color-accent-yellow))] to-[rgb(var(--color-error))]", label: "שירות מלא" },
};

interface TierData { title: string; description: string; price: string; deliveryDays: string; revisions: string; }
interface FaqData { question: string; answer: string; }
interface RequirementData { question: string; required: boolean; }

export default function CreateGigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [tiers, setTiers] = useState<Record<string, TierData>>({
    BASIC: { title: "Basic", description: "", price: "", deliveryDays: "", revisions: "1" },
    STANDARD: { title: "Standard", description: "", price: "", deliveryDays: "", revisions: "2" },
    PREMIUM: { title: "Premium", description: "", price: "", deliveryDays: "", revisions: "3" },
  });
  const [faqs, setFaqs] = useState<FaqData[]>([]);
  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  if (!session || session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Ban className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">גישה למוכרים בלבד</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">רק מוכרים יכולים ליצור שירותים</p>
      </div>
    );
  }

  function updateTier(tier: string, field: keyof TierData, value: string) {
    setTiers((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  }

  function getValidTiers() {
    return TIERS.filter((t) => tiers[t].price).map((t) => ({
      tier: t, title: tiers[t].title, description: tiers[t].description,
      price: parseFloat(tiers[t].price), deliveryDays: parseInt(tiers[t].deliveryDays) || 1,
      revisions: parseInt(tiers[t].revisions) || 1,
    }));
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !description || !categoryId) { setError("מלא את כל השדות החובה"); return; }
    const tierData = getValidTiers();
    if (tierData.length === 0) { setError("נדרשת לפחות חבילת מחיר אחת"); return; }
    setShowPreview(true);
  }

  async function handlePublish() {
    setLoading(true);
    setError("");

    const tierData = getValidTiers();

    const res = await fetch("/api/gigs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, image: image || null, categoryId,
        tiers: tierData,
        faqs: faqs.filter((f) => f.question && f.answer),
        requirements: requirements.filter((r) => r.question),
      }),
    });

    if (res.ok) {
      const gig = await res.json();
      router.push(`/gigs/${gig.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "יצירת השירות נכשלה");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">צור שירות חדש</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">מלא את הפרטים כדי לפרסם את השירות שלך</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3">
          <p className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</p>
        </div>
      )}

      <form onSubmit={handlePreview} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">מידע בסיסי</h2>
          <div className="space-y-5">
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">כותרת השירות</label><input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="אני אעשה משהו מדהים" className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">קטגוריה</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}><option value="">בחר קטגוריה</option>{CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תיאור</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} placeholder="תאר את השירות שלך בפירוט..." className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">קישור לתמונה <span className="font-normal text-[rgb(var(--color-text-muted))] text-[13px]">(אופציונלי)</span></label><input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className={inputClass} /></div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">חבילות מחיר</h2>
          <div className="space-y-4">
            {TIERS.map((tier) => {
              const colors = TIER_COLORS[tier];
              return (
                <div key={tier} className="relative overflow-hidden rounded-xl border border-[rgb(var(--color-border))] p-5">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />
                  <div className="mb-4"><h3 className="text-[14px] font-bold text-[rgb(var(--color-text))]">{tier}</h3><p className="text-[12px] text-[rgb(var(--color-text-muted))]">{colors.label}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="שם החבילה" value={tiers[tier].title} onChange={(e) => updateTier(tier, "title", e.target.value)} className={inputClass} />
                    <input type="number" placeholder="מחיר (₪)" value={tiers[tier].price} onChange={(e) => updateTier(tier, "price", e.target.value)} className={inputClass} />
                    <input type="number" placeholder="ימי אספקה" value={tiers[tier].deliveryDays} onChange={(e) => updateTier(tier, "deliveryDays", e.target.value)} className={inputClass} />
                    <input type="number" placeholder="תיקונים" value={tiers[tier].revisions} onChange={(e) => updateTier(tier, "revisions", e.target.value)} className={inputClass} />
                    <textarea placeholder="מה כלול בחבילה הזו..." value={tiers[tier].description} onChange={(e) => updateTier(tier, "description", e.target.value)} className={`col-span-2 ${inputClass}`} rows={2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">שאלות נפוצות <span className="font-normal text-[rgb(var(--color-text-muted))] text-[13px]">(אופציונלי)</span></h2>
            <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline">+ הוסף שאלה</button>
          </div>
          {faqs.length === 0 && <p className="text-[13px] text-[rgb(var(--color-text-muted))]">הוסף שאלות נפוצות כדי לעזור לקונים להבין את השירות</p>}
          {faqs.map((faq, i) => (
            <div key={i} className="mb-3 flex gap-3">
              <div className="flex-1 space-y-2">
                <input placeholder="שאלה" value={faq.question} onChange={(e) => { const n = [...faqs]; n[i].question = e.target.value; setFaqs(n); }} className={inputClass} />
                <input placeholder="תשובה" value={faq.answer} onChange={(e) => { const n = [...faqs]; n[i].answer = e.target.value; setFaqs(n); }} className={inputClass} />
              </div>
              <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-[rgb(var(--color-error))] hover:text-[rgb(var(--color-error))] self-start mt-3">
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">דרישות מהקונה <span className="font-normal text-[rgb(var(--color-text-muted))] text-[13px]">(אופציונלי)</span></h2>
            <button type="button" onClick={() => setRequirements([...requirements, { question: "", required: true }])} className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline">+ הוסף דרישה</button>
          </div>
          {requirements.length === 0 && <p className="text-[13px] text-[rgb(var(--color-text-muted))]">הגדר מה אתה צריך מהקונה כדי להתחיל לעבוד</p>}
          {requirements.map((req, i) => (
            <div key={i} className="mb-3 flex items-center gap-3">
              <input placeholder="מה אתה צריך מהקונה?" value={req.question} onChange={(e) => { const n = [...requirements]; n[i].question = e.target.value; setRequirements(n); }} className={`flex-1 ${inputClass}`} />
              <label className="flex items-center gap-1.5 text-[13px] text-[rgb(var(--color-text-secondary))] whitespace-nowrap">
                <input type="checkbox" checked={req.required} onChange={(e) => { const n = [...requirements]; n[i].required = e.target.checked; setRequirements(n); }} className="accent-[rgb(var(--color-primary))]" />
                חובה
              </label>
              <button type="button" onClick={() => setRequirements(requirements.filter((_, j) => j !== i))} className="text-[rgb(var(--color-error))] hover:text-[rgb(var(--color-error))]">
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] hover:shadow-[0_6px_20px_rgba(var(--color-primary),0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
          {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />מפרסם...</span> : "פרסם שירות"}
        </button>
      </form>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 pb-12">
          <div className="w-full max-w-3xl rounded-[16px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[16px] border-b border-[#E8ECF1] bg-white px-6 py-4">
              <h2 className="text-[18px] font-bold text-[#2D3436]">תצוגה מקדימה</h2>
              <button onClick={() => setShowPreview(false)} className="rounded-[8px] border border-[#E8ECF1] px-4 py-2 text-[13px] font-medium text-[#636E72] hover:bg-[#FAFBFF]">
                חזור לעריכה
              </button>
            </div>

            <div className="p-6 space-y-6">
              {image && (
                <img src={image} alt={title} className="w-full h-56 rounded-[12px] object-cover" />
              )}

              <div>
                <h1 className="text-[24px] font-bold text-[#2D3436]">{title}</h1>
                {categoryId && (
                  <span className="mt-2 inline-block rounded-[9999px] bg-[#6C5CE7]/10 px-3 py-1 text-[12px] font-medium text-[#6C5CE7]">
                    {CATEGORIES.find((c) => c.id === categoryId)?.name}
                  </span>
                )}
                <p className="mt-3 text-[14px] leading-relaxed text-[#636E72] whitespace-pre-wrap">{description}</p>
              </div>

              <div>
                <h3 className="mb-3 text-[16px] font-bold text-[#2D3436]">חבילות מחיר</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {getValidTiers().map((t) => {
                    const colors = TIER_COLORS[t.tier];
                    return (
                      <div key={t.tier} className="relative overflow-hidden rounded-[12px] border border-[#E8ECF1] p-4">
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />
                        <p className="text-[12px] font-semibold text-[#B2BEC3]">{colors.label}</p>
                        <p className="text-[14px] font-bold text-[#2D3436]">{t.title}</p>
                        <p className="mt-2 text-[20px] font-bold text-[#6C5CE7]">₪{t.price}</p>
                        <div className="mt-2 space-y-1 text-[12px] text-[#636E72]">
                          <p>אספקה: {t.deliveryDays} ימים</p>
                          <p>תיקונים: {t.revisions}</p>
                        </div>
                        {t.description && <p className="mt-2 text-[12px] text-[#636E72]">{t.description}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {faqs.filter((f) => f.question && f.answer).length > 0 && (
                <div>
                  <h3 className="mb-3 text-[16px] font-bold text-[#2D3436]">שאלות נפוצות</h3>
                  <div className="space-y-3">
                    {faqs.filter((f) => f.question && f.answer).map((faq, i) => (
                      <div key={i} className="rounded-[12px] bg-[#FAFBFF] p-4">
                        <p className="text-[14px] font-semibold text-[#2D3436]">{faq.question}</p>
                        <p className="mt-1 text-[13px] text-[#636E72]">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {requirements.filter((r) => r.question).length > 0 && (
                <div>
                  <h3 className="mb-3 text-[16px] font-bold text-[#2D3436]">דרישות מהקונה</h3>
                  <div className="space-y-2">
                    {requirements.filter((r) => r.question).map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-[14px] text-[#636E72]">
                        <span className="text-[#6C5CE7]">•</span>
                        {req.question}
                        {req.required && <span className="text-[11px] text-[#E17055]">(חובה)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center gap-3 rounded-b-[16px] border-t border-[#E8ECF1] bg-white px-6 py-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-[12px] border border-[#E8ECF1] py-3 text-[14px] font-semibold text-[#636E72] hover:bg-[#FAFBFF] transition-all"
              >
                חזור לעריכה
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 rounded-[12px] bg-[#6C5CE7] py-3 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    מפרסם...
                  </span>
                ) : "פרסם שירות"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
