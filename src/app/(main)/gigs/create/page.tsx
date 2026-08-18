"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { id: "home-maintenance", name: "🔧 תיקונים ותחזוקת הבית" },
  { id: "car-transport", name: "🚗 רכב ותחבורה" },
  { id: "negotiation-bureaucracy", name: "📞 מיקוח ובירוקרטיה" },
  { id: "garden-yard", name: "🌿 גינון, חצר וארגון" },
  { id: "consulting-training", name: "🎓 ייעוץ, הדרכה וסיוע אישי" },
  { id: "moving-lifting", name: "📦 הובלות ושינוע" },
  { id: "tech-support", name: "💻 טכנולוגיה ומחשבים" },
];

const TIERS = ["BASIC", "STANDARD", "PREMIUM"] as const;

const TIER_COLORS: Record<string, { gradient: string; label: string }> = {
  BASIC: { gradient: "from-[#00D2D3] to-[#00B894]", label: "חבילת בסיס" },
  STANDARD: { gradient: "from-[#6C5CE7] to-[#A29BFE]", label: "הכי פופולרי" },
  PREMIUM: { gradient: "from-[#FECA57] to-[#FF6B6B]", label: "שירות מלא" },
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

  if (!session || session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[#E17055]/10 p-4 mb-4">
          <svg className="h-8 w-8 text-[#E17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-[16px] font-medium text-[#2D3436]">גישה למוכרים בלבד</p>
        <p className="mt-1 text-[14px] text-[#B2BEC3]">רק מוכרים יכולים ליצור שירותים</p>
      </div>
    );
  }

  function updateTier(tier: string, field: keyof TierData, value: string) {
    setTiers((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tierData = TIERS.filter((t) => tiers[t].price).map((t) => ({
      tier: t, title: tiers[t].title, description: tiers[t].description,
      price: parseFloat(tiers[t].price), deliveryDays: parseInt(tiers[t].deliveryDays) || 1,
      revisions: parseInt(tiers[t].revisions) || 1,
    }));

    if (tierData.length === 0) { setError("נדרשת לפחות חבילת מחיר אחת"); setLoading(false); return; }

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

  const inputClass = "w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">צור שירות חדש</h1>
        <p className="mt-1 text-[14px] text-[#636E72]">מלא את הפרטים כדי לפרסם את השירות שלך</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-[12px] bg-[#E17055]/10 px-4 py-3">
          <p className="text-[14px] font-medium text-[#E17055]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">מידע בסיסי</h2>
          <div className="space-y-5">
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">כותרת השירות</label><input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="אני אעשה משהו מדהים" className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">קטגוריה</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}><option value="">בחר קטגוריה</option>{CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">תיאור</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} placeholder="תאר את השירות שלך בפירוט..." className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">קישור לתמונה <span className="font-normal text-[#B2BEC3]">(אופציונלי)</span></label><input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className={inputClass} /></div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">חבילות מחיר</h2>
          <div className="space-y-4">
            {TIERS.map((tier) => {
              const colors = TIER_COLORS[tier];
              return (
                <div key={tier} className="relative overflow-hidden rounded-[12px] border border-[#E8ECF1] p-5">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />
                  <div className="mb-4"><h3 className="text-[14px] font-bold text-[#2D3436]">{tier}</h3><p className="text-[12px] text-[#B2BEC3]">{colors.label}</p></div>
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
        <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#2D3436]">שאלות נפוצות <span className="font-normal text-[#B2BEC3] text-[13px]">(אופציונלי)</span></h2>
            <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[13px] font-semibold text-[#6C5CE7] hover:underline">+ הוסף שאלה</button>
          </div>
          {faqs.length === 0 && <p className="text-[13px] text-[#B2BEC3]">הוסף שאלות נפוצות כדי לעזור לקונים להבין את השירות</p>}
          {faqs.map((faq, i) => (
            <div key={i} className="mb-3 flex gap-3">
              <div className="flex-1 space-y-2">
                <input placeholder="שאלה" value={faq.question} onChange={(e) => { const n = [...faqs]; n[i].question = e.target.value; setFaqs(n); }} className={inputClass} />
                <input placeholder="תשובה" value={faq.answer} onChange={(e) => { const n = [...faqs]; n[i].answer = e.target.value; setFaqs(n); }} className={inputClass} />
              </div>
              <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-[#E17055] hover:text-[#C0392B] self-start mt-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#2D3436]">דרישות מהקונה <span className="font-normal text-[#B2BEC3] text-[13px]">(אופציונלי)</span></h2>
            <button type="button" onClick={() => setRequirements([...requirements, { question: "", required: true }])} className="text-[13px] font-semibold text-[#6C5CE7] hover:underline">+ הוסף דרישה</button>
          </div>
          {requirements.length === 0 && <p className="text-[13px] text-[#B2BEC3]">הגדר מה אתה צריך מהקונה כדי להתחיל לעבוד</p>}
          {requirements.map((req, i) => (
            <div key={i} className="mb-3 flex items-center gap-3">
              <input placeholder="מה אתה צריך מהקונה?" value={req.question} onChange={(e) => { const n = [...requirements]; n[i].question = e.target.value; setRequirements(n); }} className={`flex-1 ${inputClass}`} />
              <label className="flex items-center gap-1.5 text-[13px] text-[#636E72] whitespace-nowrap">
                <input type="checkbox" checked={req.required} onChange={(e) => { const n = [...requirements]; n[i].required = e.target.checked; setRequirements(n); }} className="accent-[#6C5CE7]" />
                חובה
              </label>
              <button type="button" onClick={() => setRequirements(requirements.filter((_, j) => j !== i))} className="text-[#E17055] hover:text-[#C0392B]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-[12px] bg-[#6C5CE7] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_6px_20px_rgba(108,92,231,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
          {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />מפרסם...</span> : "פרסם שירות"}
        </button>
      </form>
    </div>
  );
}
