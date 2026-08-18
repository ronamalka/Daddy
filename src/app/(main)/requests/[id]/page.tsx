"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-[16px] text-[#636E72]">הבקשה לא נמצאה</p>
        <button onClick={() => router.back()} className="mt-4 text-[14px] text-[#6C5CE7] hover:text-[#5A4BD1]">
          חזרה
        </button>
      </div>
    );
  }

  const svc = request.serviceSlug ? getServiceBySlug(request.serviceSlug) : null;
  const isBuyer = session?.user?.id === request.buyer.id || session?.user?.email;
  const isSeller = session?.user?.role === "SELLER";
  const alreadyResponded = request.responses.some((r) => r.seller.id === session?.user?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-[13px] text-[#6C5CE7] hover:text-[#5A4BD1]">
        → חזרה
      </button>

      <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-6 shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#2D3436]">{request.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-[13px] text-[#B2BEC3]">
              <span>{request.buyer.name}</span>
              {request.districtName && <span>· {request.cityName || request.districtName}</span>}
              {svc && <span>· {svc.nameHe}</span>}
              <span>· {new Date(request.createdAt).toLocaleDateString("he-IL")}</span>
            </div>
          </div>
          <span className={`rounded-[9999px] px-3 py-1 text-[12px] font-semibold ${
            request.status === "OPEN"
              ? "bg-[#00D2D3]/10 text-[#00B894]"
              : request.status === "IN_PROGRESS"
              ? "bg-[#FECA57]/10 text-[#F0932B]"
              : "bg-[#636E72]/10 text-[#636E72]"
          }`}>
            {request.status === "OPEN" ? "פתוח" : request.status === "IN_PROGRESS" ? "בטיפול" : "סגור"}
          </span>
        </div>

        <p className="text-[15px] leading-relaxed text-[#636E72] whitespace-pre-wrap">{request.description}</p>

        {svc && (
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-[9999px] bg-[#6C5CE7]/10 px-3 py-1 text-[12px] font-medium text-[#6C5CE7]">
              {svc.categoryIcon} {svc.nameHe}
            </span>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="mt-6">
        <h2 className="mb-4 text-[18px] font-bold text-[#2D3436]">
          הצעות ({request.responses.length})
        </h2>

        {request.responses.length === 0 ? (
          <div className="rounded-[12px] border border-[#E8ECF1] bg-white p-6 text-center">
            <p className="text-[14px] text-[#B2BEC3]">עדיין אין הצעות — היה הראשון!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {request.responses.map((resp) => (
              <div key={resp.id} className="rounded-[12px] border border-[#E8ECF1] bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[12px] font-bold text-white">
                      {resp.seller.name[0]}
                    </div>
                    <span className="text-[14px] font-semibold text-[#2D3436]">{resp.seller.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {resp.proposedPrice != null && (
                      <span className="rounded-[9999px] bg-[#FECA57]/15 px-3 py-1 text-[13px] font-bold text-[#F0932B]">
                        ₪{resp.proposedPrice}
                      </span>
                    )}
                    <span className="text-[12px] text-[#B2BEC3]">
                      {new Date(resp.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
                <p className="text-[14px] text-[#636E72]">{resp.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response form (for sellers only) */}
      {isSeller && request.status === "OPEN" && !alreadyResponded && !submitted && (
        <div className="mt-6 rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <h3 className="mb-4 text-[16px] font-bold text-[#2D3436]">הגש הצעה</h3>
          <textarea
            value={responseMsg}
            onChange={(e) => setResponseMsg(e.target.value)}
            placeholder="תאר את הניסיון שלך בתחום, זמינות, ולמה אתה מתאים..."
            rows={4}
            className="mb-3 w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none resize-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[#636E72]">מחיר מוצע:</span>
              <div className="flex items-center rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF]">
                <span className="px-3 text-[14px] text-[#B2BEC3]">₪</span>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="אופציונלי"
                  className="w-24 rounded-r-[12px] bg-transparent py-2.5 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSubmitResponse}
              disabled={submitting || !responseMsg.trim()}
              className="rounded-[12px] bg-[#6C5CE7] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A4BD1] disabled:opacity-40"
            >
              {submitting ? "שולח..." : "שלח הצעה"}
            </button>
          </div>
          {error && <p className="mt-2 text-[13px] text-[#FF6B6B]">{error}</p>}
        </div>
      )}

      {alreadyResponded && (
        <div className="mt-6 rounded-[12px] bg-[#00B894]/10 px-4 py-3 text-center text-[14px] font-medium text-[#00B894]">
          כבר הגשת הצעה לבקשה הזו
        </div>
      )}

      {submitted && (
        <div className="mt-6 rounded-[12px] bg-[#00B894]/10 px-4 py-3 text-center text-[14px] font-medium text-[#00B894]">
          ההצעה נשלחה בהצלחה! הלקוח יוכל ליצור איתך קשר.
        </div>
      )}
    </div>
  );
}
