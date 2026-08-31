"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ReviewForm } from "@/components/review-form";
import { Star, Handshake, Clock, Coins, Tag, ClipboardText, ChatCircle, PaperPlaneTilt, ArrowsClockwise, Warning, Scales } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { formatVisitWindow } from "@/lib/availability";
import { DisputeDialog } from "@/components/orders/dispute-dialog";
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_LABELS, isDisputableStatus, isOpenDisputeStatus } from "@/lib/disputes";
import { AttachmentBubble } from "@/components/chat/attachment-bubble";
import { ComposerAttach } from "@/components/chat/composer-attach";

interface GigRequirement {
  id: string;
  question: string;
  required: boolean;
}

interface OrderRequirement {
  id: string;
  requirementId: string;
  answer: string;
}

interface OrderDetail {
  id: string;
  jobType?: string;
  tier: string | null;
  price: number;
  status: string;
  dueDate: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  createdAt: string;
  gig: { id: string; title: string; image: string | null; tiers: { tier: string; deliveryDays: number }[]; requirements: GigRequirement[] };
  buyer: { id: string; name: string; avatar: string | null };
  seller: { id: string; name: string; avatar: string | null };
  messages: { id: string; content: string; attachment: string | null; createdAt: string; sender: { id: string; name: string; avatar: string | null } }[];
  requirements: OrderRequirement[];
  review: {
    id: string;
    rating: number;
    comment: string;
    ratingAttitude: number | null;
    ratingTimeliness: number | null;
    ratingPrice: number | null;
    ratingQuality: number | null;
    sellerResponse: string | null;
  } | null;
  disputes?: {
    id: string;
    status: string;
    reason: string;
    description: string;
    photos: string[];
    createdAt: string;
  }[];
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]", label: "ממתין" },
  IN_PROGRESS: { bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]", label: "בעבודה" },
  DELIVERED: { bg: "bg-[rgba(var(--color-primary-light),0.15)]", text: "text-[rgb(var(--color-primary-hover))]", label: "נמסר" },
  COMPLETED: { bg: "bg-[rgba(var(--color-success),0.15)]", text: "text-[rgb(var(--color-success))]", label: "הושלם" },
  REVISION: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]", label: "תיקון" },
  CANCELLED: { bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]", label: "בוטל" },
};

/** Shows one order's status, messages, and review form. */
export default function OrderDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachError, setAttachError] = useState("");
  const [attachBusy, setAttachBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sellerResponseText, setSellerResponseText] = useState("");
  const [respondingTo, setRespondingTo] = useState(false);
  const [reqAnswers, setReqAnswers] = useState<Record<string, string>>({});
  const [submittingReqs, setSubmittingReqs] = useState(false);
  const [reqsSubmitted, setReqsSubmitted] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.id || !data?.buyer || !data?.seller) {
          setLoadError(true);
          return;
        }
        setLoadError(false);
        setOrder(data);
        if (data.requirements?.length > 0) {
          setReqsSubmitted(true);
          const answers: Record<string, string> = {};
          data.requirements.forEach((r: OrderRequirement) => { answers[r.requirementId] = r.answer; });
          setReqAnswers(answers);
        }
        fetch("/api/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: params.id }),
        }).catch(() => {});
      })
      .catch(() => setLoadError(true));
  }, [params.id]);

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      fetch(`/api/orders/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.messages?.length > (order.messages?.length ?? 0)) {
            setOrder((prev) => prev ? { ...prev, messages: data.messages } : prev);
            fetch("/api/messages/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: params.id }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [params.id, order?.messages?.length]);

  /** Sends a message on this order, with an optional photo or PDF. */
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!message.trim() && !attachment) || attachBusy) return;
    setSending(true);
    const res = await fetch(`/api/orders/${params.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message,
        ...(attachment ? { attachment } : {}),
      }),
    });
    if (res.ok) {
      const msg = await res.json();
      setOrder((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setMessage("");
      setAttachment(null);
      setAttachError("");
    }
    setSending(false);
  }

  /** Changes the status of this order. */
  async function updateStatus(status: string) {
    setStatusBusy(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder((prev) => prev ? { ...prev, status: updated.status } : prev);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusError((data as { error?: string }).error || "לא הצלחנו לעדכן את ההזמנה");
      }
    } catch {
      setStatusError("לא הצלחנו לעדכן את ההזמנה");
    }
    setStatusBusy(false);
  }

  /** Posts the seller's reply to the buyer's review. */
  async function submitSellerResponse() {
    if (!order?.review || !sellerResponseText.trim()) return;
    setRespondingTo(true);
    const res = await fetch(`/api/reviews/${order.review.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: sellerResponseText }),
    });
    if (res.ok) {
      setOrder((prev) => prev ? { ...prev, review: { ...prev.review!, sellerResponse: sellerResponseText } } : prev);
      setSellerResponseText("");
    }
    setRespondingTo(false);
  }

  /** Reports the review on this order. */
  async function flagReview() {
    if (!order?.review || !flagReason.trim()) return;
    const res = await fetch(`/api/reviews/${order.review.id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: flagReason }),
    });
    if (res.ok) {
      setFlagSubmitted(true);
      setShowFlagForm(false);
      setFlagReason("");
    }
  }

  /** Reloads the order after a review is posted. */
  function handleReviewSubmitted() {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
    setReviewOpen(false);
  }

  /** Sends the buyer's answers to the order questions. */
  async function submitRequirements() {
    if (!order) return;
    const answers = Object.entries(reqAnswers)
      .filter(([, v]) => v.trim())
      .map(([requirementId, answer]) => ({ requirementId, answer }));
    if (answers.length === 0) return;
    setSubmittingReqs(true);
    const res = await fetch(`/api/orders/${params.id}/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (res.ok) {
      setReqsSubmitted(true);
    }
    setSubmittingReqs(false);
  }

  /** Asks for a revision and marks the order as in revision. */
  async function submitRevision() {
    if (!revisionReason.trim()) return;
    setRevisionSubmitting(true);
    await fetch(`/api/orders/${params.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `📝 בקשת תיקון: ${revisionReason}` }),
    });
    const res = await fetch(`/api/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVISION" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev) => prev ? { ...prev, status: updated.status } : prev);
      fetch(`/api/orders/${params.id}`)
        .then((r) => r.json())
        .then((data) => { if (data.messages) setOrder((prev) => prev ? { ...prev, messages: data.messages } : prev); });
    }
    setRevisionReason("");
    setRevisionOpen(false);
    setRevisionSubmitting(false);
  }

  /** Cancels the order after the user confirms. */
  async function confirmCancel() {
    setCancelSubmitting(true);
    const res = await fetch(`/api/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev) => prev ? { ...prev, status: updated.status } : prev);
    }
    setCancelOpen(false);
    setCancelSubmitting(false);
  }

  const [now] = useState(() => Date.now());

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">לא ניתן לטעון את ההזמנה.</p>
      </div>
    );
  }

  if (!order) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" /></div>;
  }

  const isBuyer = session?.user?.id === order.buyer.id;
  const isSeller = session?.user?.id === order.seller.id;
  const statusInfo = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
  const daysLeft = order.dueDate ? Math.ceil((new Date(order.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Order Header Card */}
      <div className="mb-6 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-[rgb(var(--color-text))]">{order.gig.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-[rgb(var(--color-text-secondary))]">
              {order.tier && (
                <>
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-[rgb(var(--color-primary-light))]" />
                    חבילת {order.tier}
                  </span>
                  <span className="text-[rgb(var(--color-border))]">|</span>
                </>
              )}
              <span className="font-semibold text-[rgb(var(--color-text))]">₪{order.price}</span>
              <span className="text-[rgb(var(--color-border))]">|</span>
              <span>{new Date(order.createdAt).toLocaleDateString("he-IL")}</span>
            </div>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Visit window */}
        {order.slotStart && order.slotEnd && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[rgba(var(--color-primary),0.08)] px-4 py-3">
            <Clock className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <span className="text-[14px] font-medium text-[rgb(var(--color-text))]">
              ביקור: {formatVisitWindow(new Date(order.slotStart), new Date(order.slotEnd))}
            </span>
          </div>
        )}

        {/* Due Date Countdown */}
        {daysLeft !== null && !order.slotStart && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
          <div className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 ${
            daysLeft < 0 ? "bg-[rgba(var(--color-error),0.1)]" : daysLeft <= 1 ? "bg-[rgba(var(--color-accent-yellow),0.15)]" : "bg-[rgba(var(--color-success),0.1)]"
          }`}>
            <Clock className="h-5 w-5" />
            <span className={`text-[14px] font-medium ${
              daysLeft < 0 ? "text-[rgb(var(--color-error))]" : daysLeft <= 1 ? "text-[rgb(var(--color-warning))]" : "text-[rgb(var(--color-success))]"
            }`}>
              {daysLeft < 0 ? `באיחור של ${Math.abs(daysLeft)} ימים` :
               daysLeft === 0 ? "מועד האספקה היום!" :
               daysLeft === 1 ? "יום אחד לאספקה" :
               `${daysLeft} ימים לאספקה`}
            </span>
            <span className="text-[12px] text-[rgb(var(--color-text-muted))] ms-auto">
              עד {new Date(order.dueDate!).toLocaleDateString("he-IL")}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {isSeller && order.status === "PENDING" && (
            <>
              <button disabled={statusBusy} onClick={() => updateStatus("IN_PROGRESS")} className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50">{statusBusy ? "מעדכן..." : "קבל הזמנה"}</button>
              <button disabled={statusBusy} onClick={() => setCancelOpen(true)} className="flex items-center gap-2 rounded-xl border-2 border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.05)] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--color-error))] transition-all hover:bg-[rgba(var(--color-error),0.1)] disabled:opacity-50">דחה הזמנה</button>
            </>
          )}
          {isSeller && (order.status === "IN_PROGRESS" || order.status === "REVISION") && (
            <button disabled={statusBusy} onClick={() => updateStatus("DELIVERED")} className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50">{statusBusy ? "מעדכן..." : "סמן כנמסר"}</button>
          )}
          {isBuyer && order.status === "DELIVERED" && (
            <>
              <button disabled={statusBusy} onClick={() => updateStatus("COMPLETED")} className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-success))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50">{statusBusy ? "מעדכן..." : "אשר קבלה"}</button>
              <button onClick={() => setRevisionOpen(true)} className="flex items-center gap-2 rounded-xl border-2 border-[rgba(var(--color-accent-yellow),0.3)] bg-[rgba(var(--color-accent-yellow),0.1)] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--color-warning))] transition-all hover:bg-[rgba(var(--color-accent-yellow),0.2)]">
                <ArrowsClockwise className="h-4 w-4" />
                בקש תיקון
              </button>
            </>
          )}
          {isBuyer && order.status === "PENDING" && (
            <button onClick={() => setCancelOpen(true)} className="flex items-center gap-2 rounded-xl border-2 border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.05)] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--color-error))] transition-all hover:bg-[rgba(var(--color-error),0.1)]">בטל הזמנה</button>
          )}
          {isBuyer && order.status === "COMPLETED" && !order.review && (
            <button onClick={() => setReviewOpen(true)} className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-accent-yellow))] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--color-text))] transition-all hover:opacity-80">כתוב חוות דעת</button>
          )}
          {(isBuyer || isSeller) && isDisputableStatus(order.status) && !order.disputes?.some((d) => isOpenDisputeStatus(d.status)) && (
            <button
              onClick={() => setDisputeOpen(true)}
              className="flex items-center gap-2 rounded-xl border-2 border-[rgba(var(--color-error),0.25)] bg-[rgba(var(--color-error),0.05)] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--color-error))] transition-all hover:bg-[rgba(var(--color-error),0.1)]"
            >
              <Scales className="h-4 w-4" />
              פתיחת מחלוקת
            </button>
          )}
        </div>
        {statusError && (
          <p role="alert" className="mt-3 text-[13px] font-medium text-[rgb(var(--color-error))]">{statusError}</p>
        )}

        {order.disputes && order.disputes.length > 0 && (
          <div className="mt-5 rounded-xl border border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.06)] p-4">
            <p className="mb-2 text-[13px] font-bold text-[rgb(var(--color-text))]">מחלוקות על הזמנה זו</p>
            <ul className="space-y-2">
              {order.disputes.map((d) => (
                <li key={d.id} className="text-[13px] text-[rgb(var(--color-text-secondary))]">
                  <span className="font-semibold text-[rgb(var(--color-text))]">
                    {DISPUTE_REASON_LABELS[d.reason as keyof typeof DISPUTE_REASON_LABELS] || d.reason}
                  </span>
                  {" · "}
                  {DISPUTE_STATUS_LABELS[d.status] || d.status}
                  {d.description ? ` — ${d.description}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Existing Review Display */}
        {order.review && (
          <div className="mt-5 rounded-xl bg-[rgba(var(--color-accent-yellow),0.1)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[18px] font-bold text-[rgb(var(--color-warning))]">{order.review.rating}/10</span>
              <span className="text-[13px] text-[rgb(var(--color-text-muted))]">ציון כללי</span>
            </div>

            {order.review.ratingAttitude != null && (
              <div className="flex flex-wrap gap-3 mb-3 text-[12px]">
                <span className="flex items-center gap-1 rounded-lg bg-[rgba(var(--color-surface),0.6)] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                  <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" /> איכות: <b className="text-[rgb(var(--color-text))]">{order.review.ratingQuality}/10</b>
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-[rgba(var(--color-surface),0.6)] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                  <Handshake className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" /> יחס: <b className="text-[rgb(var(--color-text))]">{order.review.ratingAttitude}/10</b>
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-[rgba(var(--color-surface),0.6)] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                  <Clock className="h-3.5 w-3.5 text-[rgb(var(--color-accent))]" /> זמנים: <b className="text-[rgb(var(--color-text))]">{order.review.ratingTimeliness}/10</b>
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-[rgba(var(--color-surface),0.6)] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                  <Coins className="h-3.5 w-3.5 text-[rgb(var(--color-success))]" /> מחיר: <b className="text-[rgb(var(--color-text))]">{order.review.ratingPrice}/10</b>
                </span>
              </div>
            )}

            <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text))]">{order.review.comment}</p>

            {order.review.sellerResponse && (
              <div className="mt-3 rounded-lg bg-[rgba(var(--color-surface),0.6)] p-3">
                <p className="text-[12px] font-semibold text-[rgb(var(--color-primary))] mb-1">תגובת בעל המקצוע:</p>
                <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">{order.review.sellerResponse}</p>
              </div>
            )}

            {isSeller && !order.review.sellerResponse && (
              <div className="mt-3 flex gap-2">
                <input
                  value={sellerResponseText}
                  onChange={(e) => setSellerResponseText(e.target.value)}
                  placeholder="כתוב תגובה לחוות הדעת..."
                  className="flex-1 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-2 text-[13px] focus:border-[rgb(var(--color-primary))] focus:outline-none"
                />
                <button
                  onClick={submitSellerResponse}
                  disabled={respondingTo || !sellerResponseText.trim()}
                  className="rounded-lg bg-[rgb(var(--color-primary))] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                >
                  שלח
                </button>
              </div>
            )}

            {/* Flag Review */}
            {!isSeller && !flagSubmitted && (
              <div className="mt-3 border-t border-[#E8ECF1] pt-3">
                {!showFlagForm ? (
                  <button
                    onClick={() => setShowFlagForm(true)}
                    className="text-[12px] text-[#B2BEC3] hover:text-[#E17055] transition-colors"
                  >
                    🚩 דווח על חוות דעת זו
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="סיבת הדיווח..."
                      className="flex-1 rounded-[8px] border border-[#E8ECF1] bg-white px-3 py-2 text-[13px] focus:border-[#E17055] focus:outline-none"
                    />
                    <button
                      onClick={flagReview}
                      disabled={!flagReason.trim()}
                      className="rounded-[8px] bg-[#E17055] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#D63031] disabled:opacity-40"
                    >
                      דווח
                    </button>
                    <button
                      onClick={() => { setShowFlagForm(false); setFlagReason(""); }}
                      className="rounded-[8px] border border-[#E8ECF1] px-3 py-2 text-[13px] text-[#636E72] hover:bg-[#F8F9FA]"
                    >
                      ביטול
                    </button>
                  </div>
                )}
              </div>
            )}
            {flagSubmitted && (
              <p className="mt-3 text-[12px] text-[#00B894]">✓ הדיווח נשלח בהצלחה</p>
            )}
          </div>
        )}
      </div>

      {/* Requirements Form */}
      {order.gig.requirements.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardText className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">דרישות ההזמנה</h2>
            {reqsSubmitted && (
              <span className="rounded-full bg-[rgba(var(--color-success),0.15)] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-success))]">נשלח</span>
            )}
          </div>

          {isBuyer && !reqsSubmitted ? (
            <div className="space-y-4">
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">מלא את הפרטים הבאים כדי שבעל המקצוע יוכל להתחיל לעבוד</p>
              {order.gig.requirements.map((req) => (
                <div key={req.id}>
                  <label className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[rgb(var(--color-text))]">
                    {req.question}
                    {req.required && <span className="text-[rgb(var(--color-error))]">*</span>}
                  </label>
                  <textarea
                    value={reqAnswers[req.id] || ""}
                    onChange={(e) => setReqAnswers((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    rows={2}
                    className="w-full rounded-[10px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)] resize-none"
                    placeholder="הזן תשובה..."
                  />
                </div>
              ))}
              <button
                onClick={submitRequirements}
                disabled={submittingReqs || order.gig.requirements.filter((r) => r.required).some((r) => !reqAnswers[r.id]?.trim())}
                className="rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingReqs ? "שולח..." : "שלח דרישות"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {order.gig.requirements.map((req) => (
                <div key={req.id} className="rounded-[10px] bg-[rgb(var(--color-surface-elevated))] p-3">
                  <p className="text-[13px] font-semibold text-[rgb(var(--color-text))] mb-1">{req.question}</p>
                  <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
                    {reqAnswers[req.id] || <span className="text-[rgb(var(--color-text-muted))] italic">לא נענה</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Midrag-style Review Form */}
      {reviewOpen && (
        <div className="mb-6">
          <ReviewForm
            orderId={order.id}
            sellerName={order.seller.name}
            onSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Messages Section */}
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_2px_8px_rgba(var(--color-primary),0.06)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] px-6 py-4">
        <div className="flex flex-1 items-center gap-2">
          <ChatCircle className="h-5 w-5 text-[rgb(var(--color-primary))]" />
          <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">הודעות</h2>
          <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">{order.messages.length}</span>
        </div>
        {session?.user && (
          <Link
            href={`/inbox/${session.user.id === order.buyer.id ? order.seller.id : order.buyer.id}`}
            className="text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline"
          >
            כל השיחה עם {session.user.id === order.buyer.id ? order.seller.name : order.buyer.name}
          </Link>
        )}
        </div>

        <div className="max-h-[400px] overflow-y-auto p-6 bg-[rgb(var(--color-surface-elevated))]">
          {order.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[14px] text-[rgb(var(--color-text-muted))]">אין הודעות עדיין. התחל את השיחה!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {order.messages.map((msg) => {
                const isMe = msg.sender?.id === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[320px] ${isMe ? "order-2" : "order-1"}`}>
                      <div className={`rounded-2xl px-4 py-3 ${isMe ? "rounded-br-[4px] bg-[rgb(var(--color-primary))] text-white" : "rounded-bl-[4px] bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]"}`}>
                        <p className={`text-[12px] font-semibold mb-1 ${isMe ? "text-white/70" : "text-[rgb(var(--color-primary))]"}`}>{msg.sender?.name ?? "משתמש"}</p>
                        {msg.attachment && <AttachmentBubble url={msg.attachment} onPrimary={isMe} />}
                        {msg.content ? <p className="text-[14px] leading-relaxed">{msg.content}</p> : null}
                      </div>
                      <p className={`mt-1 text-[11px] text-[rgb(var(--color-text-muted))] ${isMe ? "text-right" : "text-left"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-[rgb(var(--color-border))] p-4 bg-[rgb(var(--color-surface))]">
          <div className="flex items-center gap-3">
            <ComposerAttach
              value={attachment}
              onChange={setAttachment}
              disabled={sending}
              onError={setAttachError}
              onBusyChange={setAttachBusy}
            />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
            />
            <button type="submit" disabled={sending || attachBusy || (!message.trim() && !attachment)} className="flex items-center justify-center rounded-xl bg-[rgb(var(--color-primary))] p-3 text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed">
              <PaperPlaneTilt className="h-5 w-5" />
            </button>
          </div>
          {attachError && (
            <p className="mt-2 text-[12px] text-[rgb(var(--color-error))]">{attachError}</p>
          )}
        </form>
      </div>

      {/* Revision Request Modal */}
      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <div className="pt-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-accent-yellow),0.15)]">
              <ArrowsClockwise className="h-5 w-5 text-[rgb(var(--color-warning))]" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))]">בקשת תיקון</h3>
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">פרט מה צריך לתקן כדי שבעל המקצוע יוכל לטפל</p>
            </div>
          </div>
          <textarea
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={4}
            placeholder="תאר את מה שצריך לתקן או לשנות..."
            className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)] resize-none"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={submitRevision}
              disabled={revisionSubmitting || !revisionReason.trim()}
              className="flex-1 rounded-xl bg-[rgb(var(--color-warning))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {revisionSubmitting ? "שולח..." : "שלח בקשת תיקון"}
            </button>
            <button
              onClick={() => { setRevisionOpen(false); setRevisionReason(""); }}
              className="rounded-xl border border-[rgb(var(--color-border))] px-5 py-2.5 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
            >
              ביטול
            </button>
          </div>
        </div>
      </Dialog>

      {/* Cancellation Confirmation Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <div className="pt-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-error),0.1)]">
              <Warning className="h-5 w-5 text-[rgb(var(--color-error))]" weight="fill" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))]">
                {isSeller ? "דחיית הזמנה" : "ביטול הזמנה"}
              </h3>
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">פעולה זו אינה ניתנת לביטול</p>
            </div>
          </div>

          <div className="mb-5 rounded-xl bg-[rgb(var(--color-surface-elevated))] p-4 space-y-2">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-[rgb(var(--color-text-secondary))]">שירות</span>
              <span className="font-medium text-[rgb(var(--color-text))]">{order.gig.title}</span>
            </div>
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-[rgb(var(--color-text-secondary))]">סכום ההזמנה</span>
              <span className="font-bold text-[rgb(var(--color-text))]">₪{order.price}</span>
            </div>
            {isBuyer && order.status === "PENDING" && (
              <div className="border-t border-[rgb(var(--color-border-light))] pt-2 mt-2">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[rgb(var(--color-success))] font-semibold">החזר כספי</span>
                  <span className="font-bold text-[rgb(var(--color-success))]">₪{order.price} (מלא)</span>
                </div>
                <p className="mt-1 text-[12px] text-[rgb(var(--color-text-muted))]">
                  ביטול לפני תחילת העבודה — החזר מלא
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={confirmCancel}
              disabled={cancelSubmitting}
              className="flex-1 rounded-xl bg-[rgb(var(--color-error))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cancelSubmitting ? "מבטל..." : isSeller ? "אשר דחייה" : "אשר ביטול"}
            </button>
            <button
              onClick={() => setCancelOpen(false)}
              className="rounded-xl border border-[rgb(var(--color-border))] px-5 py-2.5 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
            >
              חזור
            </button>
          </div>
        </div>
      </Dialog>

      <DisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        orderId={order.id}
        onCreated={(dispute) => {
          setOrder((prev) => prev ? {
            ...prev,
            disputes: [{
              id: dispute.id,
              status: dispute.status,
              reason: dispute.reason,
              description: dispute.description,
              photos: dispute.photos ?? [],
              createdAt: dispute.createdAt || new Date().toISOString(),
            }, ...(prev.disputes || [])],
          } : prev);
        }}
      />
    </div>
  );
}
