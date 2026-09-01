"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QuotePriceBreakdown } from "@/components/quote-price-breakdown";
import { formatVisitWindow, DAY_LABELS_HE, minutesToTimeLabel } from "@/lib/availability";
import { STATUS_LABELS } from "@/lib/order-status";
import {
  FREQUENCY_LABELS_HE,
  STANDING_STATUS_LABELS_HE,
  type StandingFrequency,
  type StandingStatus,
} from "@/lib/standing-job";

type StandingOrder = {
  id: string;
  status: string;
  slotStart: string | null;
  slotEnd: string | null;
  price: number;
  laborPrice?: number | null;
  materialsEstimate?: number | null;
  buyerSuppliesMaterials?: boolean | null;
};

type StandingDetail = {
  id: string;
  title: string;
  frequency: StandingFrequency;
  weekday: number;
  startMin: number;
  status: StandingStatus;
  buyerId: string;
  sellerId: string;
  buyer?: { id: string; name: string };
  seller?: { id: string; name: string };
  orders?: StandingOrder[];
};

/** One standing job: schedule, per-visit orders, pause / resume / cancel future visits. */
export default function StandingJobDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [job, setJob] = useState<StandingDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/standing-jobs/${params.id}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data?.id) {
          setError((data as { error?: string }).error || "לא נמצאה עבודה קבועה");
          return;
        }
        setJob(data as StandingDetail);
      })
      .catch(() => setError("לא הצלחנו לטעון את העבודה הקבועה"));
  }, [params.id]);

  /** Pause, resume, or cancel only future pending visits. */
  async function act(action: "pause" | "resume" | "cancel") {
    if (!job) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/standing-jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((data as { error?: string }).error || "הפעולה נכשלה");
      return;
    }
    setJob(data as StandingDetail);
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[15px] text-[rgb(var(--color-text-secondary))]">
        התחבר כדי לצפות בעבודה קבועה.
      </div>
    );
  }

  if (!job && !error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[15px] text-[rgb(var(--color-error))]">{error}</div>
    );
  }

  const isParty = session.user?.id === job.buyerId || session.user?.id === job.sellerId;
  const latestPrice = [...(job.orders || [])].reverse().find((row) => row.price > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/standing-jobs" className="text-[13px] font-semibold text-[rgb(var(--color-primary))]">
        ← כל העבודות הקבועות
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[rgb(var(--color-text))]">{job.title}</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            {FREQUENCY_LABELS_HE[job.frequency]} · יום {DAY_LABELS_HE[job.weekday]} · {minutesToTimeLabel(job.startMin)}
            {job.seller?.name ? ` · ${job.seller.name}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-[rgb(var(--color-bg))] px-3 py-1 text-[12px] font-semibold text-[rgb(var(--color-text-secondary))]">
          {STANDING_STATUS_LABELS_HE[job.status]}
        </span>
      </div>

      {latestPrice && (
        <div className="mt-5 rounded-xl bg-[rgb(var(--color-bg))] px-4 py-3">
          <p className="text-[13px] font-semibold text-[rgb(var(--color-text))]">מחיר לביקור (לפי המחירון בזמן יצירת ההזמנה)</p>
          <QuotePriceBreakdown quote={latestPrice} />
          <p className="mt-2 text-[12px] text-[rgb(var(--color-text-muted))]">
            כל ביקור מחויב בנפרד. אין חיוב אחד על כל הסדרה.
          </p>
        </div>
      )}

      {isParty && job.status === "ACTIVE" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("pause")}
            className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
          >
            השהה ביקורים עתידיים
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("cancel")}
            className="rounded-xl border border-[rgba(var(--color-error),0.3)] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-error))] disabled:opacity-40"
          >
            בטל ביקורים עתידיים
          </button>
        </div>
      )}
      {isParty && job.status === "PAUSED" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("resume")}
            className="rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            חידוש ביקורים
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("cancel")}
            className="rounded-xl border border-[rgba(var(--color-error),0.3)] px-4 py-2 text-[13px] font-semibold text-[rgb(var(--color-error))] disabled:opacity-40"
          >
            בטל ביקורים עתידיים
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-[13px] text-[rgb(var(--color-error))]">{error}</p>}

      <h2 className="mt-8 mb-3 text-[16px] font-bold text-[rgb(var(--color-text))]">ביקורים</h2>
      <ul className="space-y-2">
        {(job.orders || []).map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-[14px]"
            >
              <span>
                {order.slotStart && order.slotEnd
                  ? formatVisitWindow(new Date(order.slotStart), new Date(order.slotEnd))
                  : order.id}
                <span className="ms-2 font-semibold">₪{order.price}</span>
              </span>
              <span className="text-[12px] font-semibold text-[rgb(var(--color-text-secondary))]">
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
