"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowClockwise, Lock } from "@phosphor-icons/react";
import { VisitWindowFields, visitWindowToIso, type VisitWindowValue } from "@/components/visit-window-fields";

interface PreviousOrder {
  id: string;
  title: string | null;
  price: number;
  laborPrice: number | null;
  materialsEstimate: number | null;
  buyerSuppliesMaterials: boolean | null;
  seller: { id: string; name: string; avatar: string | null };
}

export default function RebookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    }>
      <RebookContent />
    </Suspense>
  );
}

function RebookContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("seller") || "";
  const fromOrderId = searchParams.get("from") || "";

  const [loading, setLoading] = useState(true);
  const [prevOrder, setPrevOrder] = useState<PreviousOrder | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [materialsEstimate, setMaterialsEstimate] = useState("");
  const [buyerSuppliesMaterials, setBuyerSuppliesMaterials] = useState(true);
  const [visitWindow, setVisitWindow] = useState<VisitWindowValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fromOrderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${fromOrderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setPrevOrder({
            id: data.id,
            title: data.gig?.title || data.title || null,
            price: data.price,
            laborPrice: data.laborPrice ?? null,
            materialsEstimate: data.materialsEstimate ?? null,
            buyerSuppliesMaterials: data.buyerSuppliesMaterials ?? true,
            seller: data.seller || { id: sellerId, name: "בעל מקצוע", avatar: null },
          });
          setTitle(data.gig?.title || data.title || "");
          if (data.laborPrice != null) {
            setLaborPrice(String(data.laborPrice));
          } else {
            setLaborPrice(String(data.price));
          }
          if (data.materialsEstimate != null && data.materialsEstimate > 0) {
            setMaterialsEstimate(String(data.materialsEstimate));
          }
          setBuyerSuppliesMaterials(data.buyerSuppliesMaterials ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fromOrderId, sellerId]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי להזמין שוב.</p>
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

  const sellerName = prevOrder?.seller?.name || "בעל מקצוע";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !laborPrice || !visitWindow?.date) return;

    setSubmitting(true);
    setError("");

    const { slotStart, slotEnd } = visitWindowToIso(visitWindow);
    const matEst = materialsEstimate ? Number(materialsEstimate) : null;

    try {
      const res = await fetch("/api/orders/rebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          title: title.trim(),
          description: description.trim() || undefined,
          laborPrice: Number(laborPrice),
          materialsEstimate: matEst,
          buyerSuppliesMaterials,
          slotStart,
          slotEnd,
          previousOrderId: fromOrderId || undefined,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        router.push(`/orders/${order.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "לא הצלחנו ליצור את ההזמנה");
      }
    } catch {
      setError("לא הצלחנו ליצור את ההזמנה");
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)]">
            <ArrowClockwise className="h-5 w-5 text-[rgb(var(--color-primary))]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">הזמן שוב</h1>
            <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
              הזמנה חדשה מ{sellerName}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <h2 className="mb-4 text-[16px] font-bold text-[rgb(var(--color-text))]">פרטי העבודה</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                כותרת השירות
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: תיקון ברז, צביעת קיר..."
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                תיאור (לא חובה)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="פרטים נוספים על העבודה..."
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <h2 className="mb-4 text-[16px] font-bold text-[rgb(var(--color-text))]">תמחור</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                עלות עבודה (₪)
              </label>
              <input
                type="number"
                required
                min={1}
                value={laborPrice}
                onChange={(e) => setLaborPrice(e.target.value)}
                placeholder="מחיר העבודה"
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                הערכת חומרים (₪, לא חובה)
              </label>
              <input
                type="number"
                min={0}
                value={materialsEstimate}
                onChange={(e) => setMaterialsEstimate(e.target.value)}
                placeholder="עלות חומרים משוערת"
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={buyerSuppliesMaterials}
                onChange={(e) => setBuyerSuppliesMaterials(e.target.checked)}
                className="h-5 w-5 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
              />
              <span className="text-[14px] text-[rgb(var(--color-text))]">אני מספק את החומרים</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <h2 className="mb-4 text-[16px] font-bold text-[rgb(var(--color-text))]">חלון ביקור</h2>
          <VisitWindowFields value={visitWindow} onChange={setVisitWindow} />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.05)] px-5 py-4 text-[14px] text-[rgb(var(--color-error))]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !laborPrice || !visitWindow?.date}
          className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "שולח הזמנה..." : "שלח הזמנה"}
        </button>
      </form>
    </div>
  );
}
