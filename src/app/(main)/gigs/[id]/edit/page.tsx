"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { X } from "@phosphor-icons/react";
import { categoriesFromPricedServices, canonicalizeCategorySlug, getServicesByCategory, type ServiceCategory } from "@/lib/services";

const TIERS = ["BASIC", "STANDARD", "PREMIUM"] as const;

interface TierData { title: string; description: string; price: string; deliveryDays: string; revisions: string; }
interface FaqData { question: string; answer: string; }
interface RequirementData { question: string; required: boolean; }

/** Shows the form to edit an existing gig. */
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
  const [catalogCategories, setCatalogCategories] = useState<ServiceCategory[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    fetch(`/api/gigs/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((gig) => {
        if (session?.user?.id && gig.sellerId && gig.sellerId !== session.user.id) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        setTitle(gig.title);
        setDescription(gig.description);
        setCategoryId(canonicalizeCategorySlug(gig.category?.slug) || gig.category?.slug || "");
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
      })
      .catch(() => {
        setError("לא ניתן לטעון את פרטי השירות");
        setLoading(false);
      });
  }, [params.id, session?.user?.id]);

  useEffect(() => {
    fetch("/api/service-prices")
      .then((r) => r.json())
      .then((prices) => {
        const slugs = Array.isArray(prices) ? prices.map((p: { serviceSlug: string }) => p.serviceSlug) : [];
        setCatalogCategories(categoriesFromPricedServices(slugs));
      })
      .catch(() => setCatalogCategories([]));
  }, []);

  if (!session || session.user.role !== "SELLER") {
    return <div className="flex items-center justify-center py-20"><p className="text-[rgb(var(--color-text-secondary))]">גישה למוכרים בלבד</p></div>;
  }

  if (unauthorized) {
    return <div className="flex items-center justify-center py-20"><p className="text-[rgb(var(--color-text-secondary))]">אין לך הרשאה לערוך שירות זה</p></div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" /></div>;
  }

  /** Updates one field on a price package. */
  function updateTier(tier: string, field: keyof TierData, value: string) {
    setTiers((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError("");
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.files?.[0]?.url) {
          setImage(data.files[0].url);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setImageError((data as { error?: string }).error || "העלאת התמונה נכשלה");
      }
    } catch {
      setImageError("העלאת התמונה נכשלה");
    }
    setImageUploading(false);
  }

  /** Saves the edited gig details. */
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

    try {
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
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "עדכון השירות נכשל");
        setSaving(false);
      }
    } catch {
      setError("לא הצלחנו לשמור. נסה שוב.");
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">עריכת חבילה</h1>
      <p className="mb-8 text-[14px] text-[rgb(var(--color-text-secondary))]">אפשר לבחור רק קטגוריה שמופיעה במחירון שלך</p>

      {error && (
        <div className="mb-6 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3 text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">מידע בסיסי</h2>
          <div className="space-y-5">
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">כותרת</label><input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} /></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">קטגוריה</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}><option value="">בחר קטגוריה מהמחירון</option>{(() => {
              const options = [...catalogCategories];
              if (categoryId && !options.some((c) => c.slug === categoryId)) {
                const current = getServicesByCategory(categoryId);
                if (current) options.unshift(current);
              }
              return options.map((c) => <option key={c.slug} value={c.slug}>{c.nameHe}</option>);
            })()}</select></div>
            <div><label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תיאור</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className={inputClass} /></div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תמונת שירות</label>
              <div className="flex items-center gap-4">
                {image && (
                  <img src={image} alt="תמונת שירות" className="h-16 w-16 rounded-xl object-cover border border-[rgb(var(--color-border))]" />
                )}
                <div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" id="gig-image-upload" disabled={imageUploading} />
                  <label htmlFor="gig-image-upload" className={`inline-block cursor-pointer rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] ${imageUploading ? "opacity-40 cursor-not-allowed" : ""}`}>
                    {imageUploading ? "מעלה..." : image ? "החלף תמונה" : "העלה תמונה"}
                  </label>
                  {imageError && <p className="mt-1.5 text-[12px] text-[rgb(var(--color-error))]">{imageError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">חבילות מחיר</h2>
          <div className="space-y-4">
            {TIERS.map((tier) => (
              <div key={tier} className="rounded-xl border border-[rgb(var(--color-border))] p-5">
                <h3 className="mb-3 text-[14px] font-bold text-[rgb(var(--color-text))]">{tier}</h3>
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
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">שאלות נפוצות</h2>
            <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline">+ הוסף שאלה</button>
          </div>
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
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">דרישות מהקונה</h2>
            <button type="button" onClick={() => setRequirements([...requirements, { question: "", required: true }])} className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline">+ הוסף דרישה</button>
          </div>
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

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </form>
    </div>
  );
}
