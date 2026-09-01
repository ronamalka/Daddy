"use client";

import { useState } from "react";
import { CreditCard, Warning } from "@phosphor-icons/react";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLE, PAYMENT_METHOD_LABELS } from "@/lib/payments";

interface PaymentInfo {
  id: string;
  status: string;
  method: string;
  amount: number;
  currency: string;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
}

interface PaymentSectionProps {
  orderId: string;
  orderStatus: string;
  isBuyer: boolean;
  payment: PaymentInfo | null;
  onPaymentCreated: (payment: PaymentInfo) => void;
}

/** Shows payment status or a pay-now form for the buyer on pending orders. */
export function PaymentSection({ orderId, orderStatus, isBuyer, payment, onPaymentCreated }: PaymentSectionProps) {
  const [method, setMethod] = useState<string>("CARD");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (res.ok) {
        onPaymentCreated(data);
      } else {
        setError(data?.error || "שגיאה בתשלום");
      }
    } catch {
      setError("שגיאה בתשלום");
    }
    setPaying(false);
  }

  // Show existing payment status
  if (payment && payment.status !== "UNPAID") {
    const style = PAYMENT_STATUS_STYLE[payment.status] || PAYMENT_STATUS_STYLE.UNPAID;
    return (
      <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">תשלום</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${style.bg} ${style.text}`}>
            {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-[rgb(var(--color-text-secondary))]">
          <span>₪{payment.amount}</span>
          <span className="text-[rgb(var(--color-border))]">|</span>
          <span>{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
          {payment.refundAmount != null && (
            <>
              <span className="text-[rgb(var(--color-border))]">|</span>
              <span className="text-[rgb(var(--color-error))]">הוחזר ₪{payment.refundAmount}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // CASH payment recorded but unprotected
  if (payment && payment.status === "UNPAID" && payment.method === "CASH") {
    return (
      <div className="rounded-xl border border-[rgba(var(--color-accent-yellow),0.35)] bg-[rgba(var(--color-accent-yellow),0.08)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Warning className="h-5 w-5 text-[rgb(var(--color-warning))]" />
          <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">מזומן (ללא הגנה)</span>
        </div>
        <p className="mt-1 text-[13px] text-[rgb(var(--color-text-secondary))]">
          עסקה במזומן לא מוגנת בנאמנות. התשלום מתבצע ישירות בין הצדדים.
        </p>
      </div>
    );
  }

  // Show pay form for buyer on PENDING orders with no payment
  if (!isBuyer || orderStatus !== "PENDING") return null;

  return (
    <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-5 w-5 text-[rgb(var(--color-primary))]" />
        <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">תשלום</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(["CARD", "BIT", "CASH"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
              method === m
                ? "bg-[rgb(var(--color-primary))] text-white"
                : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))]"
            }`}
          >
            {PAYMENT_METHOD_LABELS[m]}
          </button>
        ))}
      </div>

      {method === "CASH" && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-[rgba(var(--color-accent-yellow),0.12)] px-3 py-2">
          <Warning className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--color-warning))]" />
          <p className="text-[12px] text-[rgb(var(--color-text-secondary))]">
            תשלום במזומן לא מוגן בנאמנות. לא נוכל לעזור במקרה של מחלוקת.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={paying}
        className="w-full rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50"
      >
        {paying ? "מעבד..." : "שלם"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-[rgb(var(--color-error))]">{error}</p>
      )}
    </div>
  );
}
