"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

interface OrderDetail {
  id: string;
  tier: string;
  price: number;
  status: string;
  createdAt: string;
  gig: { id: string; title: string; image: string | null; tiers: { tier: string; deliveryDays: number }[] };
  buyer: { id: string; name: string; avatar: string | null };
  seller: { id: string; name: string; avatar: string | null };
  messages: { id: string; content: string; createdAt: string; sender: { id: string; name: string; avatar: string | null } }[];
  review: { rating: number; comment: string } | null;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-[#FDCB6E]/15", text: "text-[#E67E22]" },
  IN_PROGRESS: { bg: "bg-[#6C5CE7]/10", text: "text-[#6C5CE7]" },
  DELIVERED: { bg: "bg-[#A29BFE]/15", text: "text-[#5A4BD1]" },
  COMPLETED: { bg: "bg-[#00B894]/15", text: "text-[#00B894]" },
  CANCELLED: { bg: "bg-[#E17055]/10", text: "text-[#E17055]" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [params.id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch(`/api/orders/${params.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    if (res.ok) {
      const msg = await res.json();
      setOrder((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setMessage("");
    }
    setSending(false);
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev) => prev ? { ...prev, status: updated.status } : prev);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/orders/${params.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    if (res.ok) {
      const review = await res.json();
      setOrder((prev) => prev ? { ...prev, review } : prev);
      setReviewOpen(false);
    }
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  const isBuyer = session?.user?.id === order.buyer.id;
  const isSeller = session?.user?.id === order.seller.id;
  const statusStyle = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Order Header Card */}
      <div className="mb-6 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-[#2D3436]">{order.gig.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-[#636E72]">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                חבילת {order.tier}
              </span>
              <span className="text-[#E8ECF1]">|</span>
              <span className="font-semibold text-[#2D3436]">₪{order.price}</span>
              <span className="text-[#E8ECF1]">|</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`rounded-[9999px] px-4 py-1.5 text-[13px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {order.status.replace("_", " ")}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {isSeller && order.status === "PENDING" && (
            <button
              onClick={() => updateStatus("IN_PROGRESS")}
              className="flex items-center gap-2 rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(108,92,231,0.06)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              התחל לעבוד
            </button>
          )}
          {isSeller && order.status === "IN_PROGRESS" && (
            <button
              onClick={() => updateStatus("DELIVERED")}
              className="flex items-center gap-2 rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(108,92,231,0.06)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              שלח הזמנה
            </button>
          )}
          {isBuyer && order.status === "DELIVERED" && (
            <button
              onClick={() => updateStatus("COMPLETED")}
              className="flex items-center gap-2 rounded-[12px] bg-[#00B894] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#00A884]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              אשר קבלה
            </button>
          )}
          {isBuyer && order.status === "PENDING" && (
            <button
              onClick={() => updateStatus("CANCELLED")}
              className="flex items-center gap-2 rounded-[12px] border-2 border-[#E17055]/20 bg-[#E17055]/5 px-5 py-2.5 text-[14px] font-semibold text-[#E17055] transition-all hover:bg-[#E17055]/10"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              בטל הזמנה
            </button>
          )}
          {isBuyer && order.status === "COMPLETED" && !order.review && (
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-2 rounded-[12px] bg-[#FECA57] px-5 py-2.5 text-[14px] font-semibold text-[#2D3436] transition-all hover:bg-[#FECA57]/80"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              כתוב ביקורת
            </button>
          )}
        </div>

        {/* Review Display */}
        {order.review && (
          <div className="mt-5 rounded-[12px] bg-[#FECA57]/10 p-4">
            <div className="flex items-center gap-1 text-[#FECA57]">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className={`h-5 w-5 ${i < order.review!.rating ? "text-[#FECA57]" : "text-[#E8ECF1]"}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[#2D3436]">{order.review.comment}</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      {reviewOpen && (
        <div className="mb-6 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-4 text-[18px] font-bold text-[#2D3436]">כתוב ביקורת</h2>
          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#636E72]">דירוג</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg className={`h-8 w-8 ${n <= rating ? "text-[#FECA57]" : "text-[#E8ECF1]"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              placeholder="שתף את החוויה שלך..."
              className="w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]"
              >
                שלח ביקורת
              </button>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-[12px] border border-[#E8ECF1] px-5 py-2.5 text-[14px] font-medium text-[#636E72] transition-all hover:bg-[#FAFBFF]"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages Section */}
      <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] shadow-[0_2px_8px_rgba(108,92,231,0.06)] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#E8ECF1] px-6 py-4">
          <svg className="h-5 w-5 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <h2 className="text-[16px] font-bold text-[#2D3436]">הודעות</h2>
          <span className="rounded-[9999px] bg-[#F0EEFF] px-2.5 py-0.5 text-[12px] font-semibold text-[#6C5CE7]">
            {order.messages.length}
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-6 bg-[#FAFBFF]">
          {order.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-[#F0EEFF] p-3 mb-3">
                <svg className="h-6 w-6 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <p className="text-[14px] text-[#B2BEC3]">אין הודעות עדיין. התחל את השיחה!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {order.messages.map((msg) => {
                const isMe = msg.sender.id === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[320px] ${isMe ? "order-2" : "order-1"}`}>
                      <div
                        className={`rounded-[16px] px-4 py-3 ${
                          isMe
                            ? "rounded-br-[4px] bg-[#6C5CE7] text-white"
                            : "rounded-bl-[4px] bg-[#FFFFFF] border border-[#E8ECF1] text-[#2D3436]"
                        }`}
                      >
                        <p className={`text-[12px] font-semibold mb-1 ${isMe ? "text-white/70" : "text-[#6C5CE7]"}`}>
                          {msg.sender.name}
                        </p>
                        <p className="text-[14px] leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={`mt-1 text-[11px] text-[#B2BEC3] ${isMe ? "text-right" : "text-left"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-[#E8ECF1] p-4 bg-[#FFFFFF]">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="כתוב הודעה..."
            className="flex-1 rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="flex items-center justify-center rounded-[12px] bg-[#6C5CE7] p-3 text-white transition-all hover:bg-[#5A4BD1] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
