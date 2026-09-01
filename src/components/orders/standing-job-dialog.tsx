"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { QuotePriceBreakdown } from "@/components/quote-price-breakdown";
import { SlotPicker, type SlotOption } from "@/components/slot-picker";
import {
  FREQUENCY_LABELS_HE,
  STANDING_FREQUENCIES,
  slotToWeekdayAndStart,
  type StandingFrequency,
} from "@/lib/standing-job";
import { getServiceBySlug } from "@/lib/services";

type PreviewOccurrence = {
  slotStart: string;
  slotEnd: string;
  label: string;
  bookable: boolean;
  reasonLabel: string | null;
};

type PreviewResponse = {
  title: string;
  price: {
    laborPrice: number;
    materialsEstimate: number | null;
    buyerSuppliesMaterials: boolean;
    price: number;
  };
  chargeNote: string;
  occurrences: PreviewOccurrence[];
  bookableCount: number;
  error?: string;
};

export type StandingServiceOption = {
  serviceSlug: string;
  nameHe?: string;
};

/** Dialog to preview and confirm a weekly, biweekly, or monthly standing job. */
export function StandingJobDialog({
  open,
  onOpenChange,
  sellerId,
  serviceSlug,
  services,
  firstSlot,
  sourceOrderId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  serviceSlug?: string;
  services?: StandingServiceOption[];
  firstSlot?: SlotOption | null;
  sourceOrderId?: string;
  title?: string;
}) {
  const router = useRouter();
  const [frequency, setFrequency] = useState<StandingFrequency>("WEEKLY");
  const [slug, setSlug] = useState(serviceSlug || services?.[0]?.serviceSlug || "");
  const [serviceOptions, setServiceOptions] = useState<StandingServiceOption[]>(services || []);
  const [pickedSlot, setPickedSlot] = useState<SlotOption | null>(firstSlot ?? null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const slot = firstSlot ?? pickedSlot;
  const slotIsFuture = Boolean(slot && new Date(slot.slotStart).getTime() > Date.now());

  /** Body shared by preview and create. Past completed slots only supply weekday and time. */
  function writeBody() {
    if (!slot || !slug) return null;
    const { weekday, startMin } = slotToWeekdayAndStart(new Date(slot.slotStart));
    return {
      sellerId,
      serviceSlug: slug,
      title,
      frequency,
      weekday,
      startMin,
      sourceOrderId,
      ...(slotIsFuture
        ? { firstSlotStart: slot.slotStart, firstSlotEnd: slot.slotEnd }
        : {}),
    };
  }

  useEffect(() => {
    if (open) {
      setFrequency("WEEKLY");
      setSlug(serviceSlug || services?.[0]?.serviceSlug || "");
      setServiceOptions(services || []);
      setPickedSlot(firstSlot ?? null);
      setPreview(null);
      setError("");
    }
  }, [open, serviceSlug, services, firstSlot]);

  useEffect(() => {
    if (!open || serviceSlug || (services && services.length > 0)) return;
    fetch(`/api/sellers/${sellerId}`)
      .then((res) => res.json())
      .then((data) => {
        const prices = Array.isArray(data?.servicePrices) ? data.servicePrices : [];
        const options: StandingServiceOption[] = prices.map((row: { serviceSlug: string }) => ({
          serviceSlug: row.serviceSlug,
          nameHe: getServiceBySlug(row.serviceSlug)?.nameHe,
        }));
        setServiceOptions(options);
        if (!slug && options[0]) setSlug(options[0].serviceSlug);
      })
      .catch(() => {});
  }, [open, sellerId, serviceSlug, services, slug]);

  useEffect(() => {
    if (!open || !slug || !slot) {
      setPreview(null);
      return;
    }
    const body = writeBody();
    if (!body) {
      setPreview(null);
      return;
    }
    setLoading(true);
    setError("");
    fetch("/api/standing-jobs/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setPreview(null);
          setError((data as { error?: string }).error || "לא הצלחנו לבנות תצוגה מקדימה");
          return;
        }
        setPreview(data as PreviewResponse);
      })
      .catch(() => setError("לא הצלחנו לבנות תצוגה מקדימה"))
      .finally(() => setLoading(false));
  }, [open, sellerId, slug, title, frequency, slot, sourceOrderId, slotIsFuture]);

  /** Confirms the schedule and creates per-visit orders. */
  async function confirm() {
    const body = writeBody();
    if (!body) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/standing-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok && data.id) {
      onOpenChange(false);
      router.push(`/standing-jobs/${data.id}`);
      return;
    }
    setError((data as { error?: string }).error || "לא הצלחנו לפתוח עבודה קבועה");
  }

  const serviceChoices = serviceOptions.length > 1 || (!serviceSlug && serviceOptions.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} labelledBy="standing-job-title" className="max-w-lg">
      <h2 id="standing-job-title" className="mb-1 pe-8 text-[18px] font-bold text-[rgb(var(--color-text))]">
        עבודה קבועה
      </h2>
      <p className="mb-4 text-[13px] text-[rgb(var(--color-text-secondary))]">
        אותו אבא, אותו שירות, חלון קבוע — בלי לפתוח בקשה חדשה בכל פעם.
      </p>

      {serviceChoices && (
        <label className="mb-3 block text-[13px] font-medium text-[rgb(var(--color-text))]">
          שירות
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-3 py-2 text-[14px]"
          >
            {serviceOptions.map((svc) => (
              <option key={svc.serviceSlug} value={svc.serviceSlug}>
                {svc.nameHe || getServiceBySlug(svc.serviceSlug)?.nameHe || svc.serviceSlug}
              </option>
            ))}
          </select>
        </label>
      )}

      {!firstSlot && (
        <div className="mb-4">
          <SlotPicker sellerId={sellerId} value={pickedSlot} onChange={setPickedSlot} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STANDING_FREQUENCIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFrequency(value)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              frequency === value
                ? "bg-[rgb(var(--color-primary))] text-white"
                : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]"
            }`}
          >
            {FREQUENCY_LABELS_HE[value]}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-[13px] text-[rgb(var(--color-text-muted))]">בודקים זמינות ומחירון...</p>
      )}

      {preview && (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl bg-[rgb(var(--color-bg))] px-4 py-3">
            <p className="text-[13px] font-semibold text-[rgb(var(--color-text))]">מחיר לביקור עכשיו</p>
            <QuotePriceBreakdown quote={preview.price} />
            <p className="mt-2 text-[12px] text-[rgb(var(--color-text-muted))]">{preview.chargeNote}</p>
          </div>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto text-[13px]">
            {preview.occurrences.map((row) => (
              <li
                key={row.slotStart}
                className={row.bookable ? "text-[rgb(var(--color-text))]" : "text-[rgb(var(--color-text-muted))]"}
              >
                {row.label}
                {row.bookable ? "" : ` · ${row.reasonLabel || "לא זמין"}`}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-[rgb(var(--color-text-secondary))]">
            {preview.bookableCount} ביקורים ייפתחו כהזמנות נפרדות
          </p>
        </div>
      )}

      {error && <p role="alert" className="mb-3 text-[13px] text-[rgb(var(--color-error))]">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]"
        >
          ביטול
        </button>
        <button
          type="button"
          disabled={saving || loading || !preview || preview.bookableCount === 0}
          onClick={() => void confirm()}
          className="rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {saving ? "פותחים..." : "אישור עבודה קבועה"}
        </button>
      </div>
    </Dialog>
  );
}
