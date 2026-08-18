"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

interface OrderDetail {
  id: string;
  tier: string;
  price: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  gig: { id: string; title: string; image: string | null; tiers: { tier: string; deliveryDays: number }[] };
  buyer: { id: string; name: string; avatar: string | null };
  seller: { id: string; name: string; avatar: string | null };
  messages: { id: string; content: string; createdAt: string; sender: { id: string; name: string; avatar: string | null } }[];
  review: { id: string; rating: number; comment: string; communicationRating: number | null; qualityRating: number | null; timelinessRating: number | null; sellerResponse: string | null } | null;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-[#FDCB6E]/15", text: "text-[#E67E22]", label: "ממתין" },
  IN_PROGRESS: { bg: "bg-[#6C5CE7]/10", text: "text-[#6C5CE7]", label: "בעבודה" },
  DELIVERED: { bg: "bg-[#A29BFE]/15", text: "text-[#5A4BD1]", label: "נמסר" },
  COMPLETED: { bg: "bg-[#00B894]/15", text: "text-[#00B894]", label: "הושלם" },
  CANCELLED: { bg: "bg-[#E17055]/10", text: "text-[#E17055]", label: "בוטל" },
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
  const [commRating, setCommRating] = useState(5);
  const [qualRating, setQualRating] = useState(5);
  const [timeRating, setTimeRating] = useState(5);
  const [sellerResponseText, setSellerResponseText] = useState("");
  const [respondingTo, setRespondingTo] = useState(false);

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
      body: JSON.stringify({
        rating, comment,
        communicationRating: commRating,
        qualityRating: qualRating,
        timelinessRating: timeRating,
      }),
    });
    if (res.ok) {
      const review = await res.json();
      setOrder((prev) => prev ? { ...prev, review } : prev);
      setReviewOpen(false);
    }
  }

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

  const [now] = useState(() => Date.now());

  if (!order) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" /></div>;
  }

  const isBuyer = session?.user?.id === order.buyer.id;
  const isSeller = session?.user?.id === order.seller.id;
  const statusInfo = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
  const daysLeft = order.dueDate ? Math.ceil((new Date(order.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)) : null;

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
          <span className={`rounded-[9999px] px-4 py-1.5 text-[13px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Due Date Countdown */}
        {daysLeft !== null && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
          <div className={`mb-5 flex items-center gap-2 rounded-[12px] px-4 py-3 ${
            daysLeft < 0 ? "bg-[#E17055]/10" : daysLeft <= 1 ? "bg-[#FDCB6E]/15" : "bg-[#00B894]/10"
          }`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-[14px] font-medium ${
              daysLeft < 0 ? "text-[#E17055]" : daysLeft <= 1 ? "text-[#E67E22]" : "text-[#00B894]"
            }`}>
              {daysLeft < 0 ? `באיחור של ${Math.abs(daysLeft)} ימים` :
               daysLeft === 0 ? "מועד האספקה היום!" :
               daysLeft === 1 ? "יום אחד לאספקה" :
               `${daysLeft} ימים לאספקה`}
            </span>
            <span className="text-[12px] text-[#B2BEC3] ms-auto">
              עד {new Date(order.dueDate!).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {isSeller && order.status === "PENDING" && (
            <button onClick={() => updateStatus("IN_PROGRESS")} className="flex items-center gap-2 rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]">התחל לעבוד</button>
          )}
          {isSeller && order.status === "IN_PROGRESS" && (
            <button onClick={() => updateStatus("DELIVERED")} className="flex items-center gap-2 rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]">שלח הזמנה</button>
          )}
          {isBuyer && order.status === "DELIVERED" && (
            <button onClick={() => updateStatus("COMPLETED")} className="flex items-center gap-2 rounded-[12px] bg-[#00B894] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#00A884]">אשר קבלה</button>
          )}
          {isBuyer && order.status === "PENDING" && (
            <button onClick={() => updateStatus("CANCELLED")} className="flex items-center gap-2 rounded-[12px] border-2 border-[#E17055]/20 bg-[#E17055]/5 px-5 py-2.5 text-[14px] font-semibold text-[#E17055] transition-all hover:bg-[#E17055]/10">בטל הזמנה</button>
          )}
          {isBuyer && order.status === "COMPLETED" && !order.review && (
            <button onClick={() => setReviewOpen(true)} className="flex items-center gap-2 rounded-[12px] bg-[#FECA57] px-5 py-2.5 text-[14px] font-semibold text-[#2D3436] transition-all hover:bg-[#FECA57]/80">כתוב ביקורת</button>
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
            {(order.review.communicationRating || order.review.qualityRating || order.review.timelinessRating) && (
              <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-[#636E72]">
                {order.review.communicationRating && <span>תקשורת: {order.review.communicationRating}/5</span>}
                {order.review.qualityRating && <span>איכות: {order.review.qualityRating}/5</span>}
                {order.review.timelinessRating && <span>זמנים: {order.review.timelinessRating}/5</span>}
              </div>
            )}
            <p className="mt-2 text-[14px] leading-relaxed text-[#2D3436]">{order.review.comment}</p>

            {order.review.sellerResponse && (
              <div className="mt-3 rounded-[8px] bg-white/60 p-3">
                <p className="text-[12px] font-semibold text-[#6C5CE7] mb-1">תגובת המוכר:</p>
                <p className="text-[13px] text-[#636E72]">{order.review.sellerResponse}</p>
              </div>
            )}

            {isSeller && !order.review.sellerResponse && (
              <div className="mt-3 flex gap-2">
                <input
                  value={sellerResponseText}
                  onChange={(e) => setSellerResponseText(e.target.value)}
                  placeholder="כתוב תגובה לביקורת..."
                  className="flex-1 rounded-[8px] border border-[#E8ECF1] bg-white px-3 py-2 text-[13px] focus:border-[#6C5CE7] focus:outline-none"
                />
                <button
                  onClick={submitSellerResponse}
                  disabled={respondingTo || !sellerResponseText.trim()}
                  className="rounded-[8px] bg-[#6C5CE7] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#5A4BD1] disabled:opacity-40"
                >
                  שלח
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Form with Sub-ratings */}
      {reviewOpen && (
        <div className="mb-6 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <h2 className="mb-4 text-[18px] font-bold text-[#2D3436]">כתוב ביקורת</h2>
          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#636E72]">דירוג כללי</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#636E72]">תקשורת</label>
                <StarPicker value={commRating} onChange={setCommRating} size="sm" />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#636E72]">איכות</label>
                <StarPicker value={qualRating} onChange={setQualRating} size="sm" />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#636E72]">עמידה בזמנים</label>
                <StarPicker value={timeRating} onChange={setTimeRating} size="sm" />
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              placeholder="שתף את החוויה שלך..."
              className="w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
            <div className="flex gap-3">
              <button type="submit" className="rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A4BD1]">שלח ביקורת</button>
              <button type="button" onClick={() => setReviewOpen(false)} className="rounded-[12px] border border-[#E8ECF1] px-5 py-2.5 text-[14px] font-medium text-[#636E72] hover:bg-[#FAFBFF]">ביטול</button>
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
          <span className="rounded-[9999px] bg-[#F0EEFF] px-2.5 py-0.5 text-[12px] font-semibold text-[#6C5CE7]">{order.messages.length}</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-6 bg-[#FAFBFF]">
          {order.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[14px] text-[#B2BEC3]">אין הודעות עדיין. התחל את השיחה!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {order.messages.map((msg) => {
                const isMe = msg.sender.id === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[320px] ${isMe ? "order-2" : "order-1"}`}>
                      <div className={`rounded-[16px] px-4 py-3 ${isMe ? "rounded-br-[4px] bg-[#6C5CE7] text-white" : "rounded-bl-[4px] bg-[#FFFFFF] border border-[#E8ECF1] text-[#2D3436]"}`}>
                        <p className={`text-[12px] font-semibold mb-1 ${isMe ? "text-white/70" : "text-[#6C5CE7]"}`}>{msg.sender.name}</p>
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
            className="flex-1 rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
          />
          <button type="submit" disabled={sending || !message.trim()} className="flex items-center justify-center rounded-[12px] bg-[#6C5CE7] p-3 text-white hover:bg-[#5A4BD1] disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-5 w-5" : "h-8 w-8";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-110">
          <svg className={`${cls} ${n <= value ? "text-[#FECA57]" : "text-[#E8ECF1]"}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
