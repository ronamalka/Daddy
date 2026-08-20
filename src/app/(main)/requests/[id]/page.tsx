"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import { CategoryIcon } from "@/components/ui/category-icon";

interface ServiceRequestDetail {
  id: string;
  title: string;
  description: string;
  serviceSlug: string | null;
  districtName: string | null;
  cityName: string | null;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string };
  responses: {
    id: string;
    message: string;
    proposedPrice: number | null;
    createdAt: string;
    seller: { id: string; name: string };
  }[];
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseMsg, setResponseMsg] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/service-requests/${params.id}/respond`)
      .then((r) => r.json())
      .then((data) => {
        if (data.request) {
          setRequest(data.request);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function handleSubmitResponse() {
    if (!responseMsg.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/service-requests/${params.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: responseMsg,
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setResponseMsg("");
        setProposedPrice("");
        const updated = await fetch(`/api/service-requests/${params.id}/respond`);
        const data = await updated.json();
        if (data.request) setRequest(data.request);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError((errData as { error?: string }).error || "שגיאה בשליחת ההצעה");
      }
    } catch {
      setError("שגיאה בשליחת ההצעה");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">הבקשה לא נמצאה</p>
        <button onClick={() => router.back()} className="mt-4 text-[14px] text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]">
          חזרה
        </button>
      </div>
    );
  }

  const svc = request.serviceSlug ? getServiceBySlug(request.serviceSlug) : null;
  const isSeller = session?.user?.role === "SELLER";
  const alreadyResponded = request.responses.some((r) => r.seller.id === session?.user?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-[13px] text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]">
        → חזרה
      </button>

      <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-[rgb(var(--color-text))]">{request.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-[13px] text-[rgb(var(--color-text-muted))]">
              <span>{request.buyer.name}</span>
              {request.districtName && <span>· {request.cityName || request.districtName}</span>}
              {svc && <span>· {svc.nameHe}</span>}
              <span>· {new Date(request.createdAt).toLocaleDateString("he-IL")}</span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
            request.status === "OPEN"
              ? "bg-[rgba(var(--color-accent),0.1)] text-[rgb(var(--color-success))]"
              : request.status === "IN_PROGRESS"
              ? "bg-[rgba(var(--color-accent-yellow),0.1)] text-[rgb(var(--color-warning))]"
              : "bg-[rgba(var(--color-text-secondary),0.1)] text-[rgb(var(--color-text-secondary))]"
          }`}>
            {request.status === "OPEN" ? "פתוח" : request.status === "IN_PROGRESS" ? "בטיפול" : "סגור"}
          </span>
        </div>

        <p className="text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))] whitespace-pre-wrap">{request.description}</p>

        {svc && (
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[12px] font-medium text-[rgb(var(--color-primary))]">
              <CategoryIcon slug={svc.category} className="inline-block h-3.5 w-3.5" /> {svc.nameHe}
            </span>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="mt-6">
        <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">
          הצעות ({request.responses.length})
        </h2>

        {request.responses.length === 0 ? (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 text-center">
            <p className="text-[14px] text-[rgb(var(--color-text-muted))]">עדיין אין הצעות — היה הראשון!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {request.responses.map((resp) => (
              <div key={resp.id} className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-[12px] font-bold text-white">
                      {resp.seller.name[0]}
                    </div>
                    <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{resp.seller.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {resp.proposedPrice != null && (
                      <span className="rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-3 py-1 text-[13px] font-bold text-[rgb(var(--color-warning))]">
                        ₪{resp.proposedPrice}
                      </span>
                    )}
                    <span className="text-[12px] text-[rgb(var(--color-text-muted))]">
                      {new Date(resp.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
                <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">{resp.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response form (for sellers only) */}
      {isSeller && request.status === "OPEN" && !alreadyResponded && !submitted && (
        <div className="mt-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <h3 className="mb-4 text-[16px] font-bold text-[rgb(var(--color-text))]">הגש הצעה</h3>
          <textarea
            value={responseMsg}
            onChange={(e) => setResponseMsg(e.target.value)}
            placeholder="תאר את הניסיון שלך בתחום, זמינות, ולמה אתה מתאים..."
            rows={4}
            className="mb-3 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none resize-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[rgb(var(--color-text-secondary))]">מחיר מוצע:</span>
              <div className="flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
                <span className="px-3 text-[14px] text-[rgb(var(--color-text-muted))]">₪</span>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="אופציונלי"
                  className="w-24 rounded-r-xl bg-transparent py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSubmitResponse}
              disabled={submitting || !responseMsg.trim()}
              className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
            >
              {submitting ? "שולח..." : "שלח הצעה"}
            </button>
          </div>
          {error && <p className="mt-2 text-[13px] text-[rgb(var(--color-error))]">{error}</p>}
        </div>
      )}

      {alreadyResponded && (
        <div className="mt-6 rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-success))]">
          כבר הגשת הצעה לבקשה הזו
        </div>
      )}

      {submitted && (
        <div className="mt-6 rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-success))]">
          יופי! ההצעה בדרך. הלקוח יחזור אליך בקרוב.
        </div>
      )}
    </div>
  );
}
