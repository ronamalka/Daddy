"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

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

interface TierData { title: string; description: string; price: string; deliveryDays: string; revisions: string; }
interface FaqData { question: string; answer: string; }
interface RequirementData { question: string; required: boolean; }

export default function EditGigPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [tiers, setTiers] = useState<Record<string, TierData>>({
    BASIC: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
    STANDARD: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
    PREMIUM: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
  });
  const [faqs, setFaqs] = useState<FaqData[]>([]);
  const [requirements, setRequirements] = useState<RequirementData[]>([]);

  useEffect(() => {
    fetch(`/api/gigs/${params.id}`)
      .then((r) => r.json())
      .then((gig) => {
        setTitle(gig.title);
        setDescription(gig.description);
        setCategoryId(gig.category?.id || gig.categoryId);
        setImage(gig.image || "");
        const t: Record<string, TierData> = {
          BASIC: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
          STANDARD: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
          PREMIUM: { title: "", description: "", price: "", deliveryDays: "", revisions: "" },
        };
        for (const tier of gig.tiers || []) {
          t[tier.tier] = {
            title: tier.title,
            description: tier.description,
            price: String(tier.price),
            deliveryDays: String(tier.deliveryDays),
            revisions: String(tier.revisions),
          };
        }
        setTiers(t);
        setFaqs(gig.faqs?.map((f: { question: string; answer: string }) => ({ question: f.question, answer: f.answer })) || []);
        setRequirements(gig.requirements?.map((r: { question: string; required: boolean }) => ({ question: r.question, required: r.required })) || []);
        setLoading(false);
      });
  }, [params.id]);

  if (!session || session.user.role !== "SELLER") {
    return <div className="flex items-center justify-center py-20"><p className="text-[#636E72]">גישה למוכרים בלבד</p></div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" /></div>;
  }

  function updateTier(tier: string, field: keyof TierData, value: string) {
    setTiers((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const tierData = TIERS.filter((t) => tiers[t].price).map((t) => ({
      tier: t, title: tiers[t].title, description: tiers[t].description,
      price: parseFloat(tiers[t].price), deliveryDays: parseInt(tiers[t].deliveryDays) || 1,
      revisions: parseInt(tiers[t].revisions) || 1,
    }));

    if (tierData.length === 0) { setError("נדרשת לפחות חבילת מחיר אחת"); setSaving(false); return; }

    const res = await fetch(`/api/gigs/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, image: image || null, categoryId,
        tiers: tierData,
        faqs: faqs.filter((f) => f.question && f.answer),
        requirements: requirements.filter((r) => r.question),
      }),
    });

    if (res.ok) {
      router.push(`/gigs/${params.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "עדכון השירות נכשל");
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">עריכת שירות</h1>
      <p className="mb-8 text-[14px] text-[#636E72]">עדכן את פרטי השירות שלך</p>

      {error && (
        <div className="mb-6 rounded-[12px] bg-[#E17055]/10 px-4 py-3 text-[14px] font-medium text-[#E17055]">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">מידע בסיסי</h2>
          <div className="space-y-5">
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">כותרת</label><input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">קטגוריה</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}><option value="">בחר קטגוריה</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">תיאור</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[#636E72]">קישור לתמונה</label><input value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} /></div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <h2 className="mb-5 text-[16px] font-bold text-[#2D3436]">חבילות מחיר</h2>
          <div className="space-y-4">
            {TIERS.map((tier) => (
              <div key={tier} className="rounded-[12px] border border-[#E8ECF1] p-5">
                <h3 className="mb-3 text-[14px] font-bold text-[#2D3436]">{tier}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="שם" value={tiers[tier].title} onChange={(e) => updateTier(tier, "title", e.target.value)} className={inputClass} />
                  <input type="number" placeholder="מחיר (₪)" value={tiers[tier].price} onChange={(e) => updateTier(tier, "price", e.target.value)} className={inputClass} />
                  <input type="number" placeholder="ימי אספקה" value={tiers[tier].deliveryDays} onChange={(e) => updateTier(tier, "deliveryDays", e.target.value)} className={inputClass} />
                  <input type="number" placeholder="תיקונים" value={tiers[tier].revisions} onChange={(e) => updateTier(tier, "revisions", e.target.value)} className={inputClass} />
                  <textarea placeholder="תיאור" value={tiers[tier].description} onChange={(e) => updateTier(tier, "description", e.target.value)} className={`col-span-2 ${inputClass}`} rows={2} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#2D3436]">שאלות נפוצות</h2>
            <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[13px] font-semibold text-[#6C5CE7] hover:underline">+ הוסף שאלה</button>
          </div>
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
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#2D3436]">דרישות מהקונה</h2>
            <button type="button" onClick={() => setRequirements([...requirements, { question: "", required: true }])} className="text-[13px] font-semibold text-[#6C5CE7] hover:underline">+ הוסף דרישה</button>
          </div>
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

        <button type="submit" disabled={saving} className="w-full rounded-[12px] bg-[#6C5CE7] py-4 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </form>
    </div>
  );
}
