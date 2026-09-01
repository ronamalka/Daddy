"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CreditCard, Lock } from "@phosphor-icons/react";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLE, PAYMENT_METHOD_LABELS } from "@/lib/payments";

interface PaymentHistoryItem {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  createdAt: string;
  order: {
    id: string;
    title: string | null;
    price: number;
    buyerId: string;
    sellerId: string;
  } | null;
}

/** Lists all payments the user has made or received. */
export default function PaymentHistoryPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments/history")
      .then((r) => r.json())
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בהיסטוריית תשלומים.</p>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">היסטוריית תשלומים</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
          {payments.length} {payments.length !== 1 ? "תשלומים" : "תשלום"} סה"כ
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-16">
          <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
            <CreditCard className="h-8 w-8 text-[rgb(var(--color-primary))]" />
          </div>
          <p className="text-[16px] font-semibold text-[rgb(var(--color-text))]">אין תשלומים עדיין</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">כשתשלם על הזמנה, הפרטים יופיעו כאן.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const style = PAYMENT_STATUS_STYLE[p.status] || PAYMENT_STATUS_STYLE.UNPAID;
            const isBuyer = session.user?.id === p.order?.buyerId;
            return (
              <Link
                key={p.id}
                href={`/orders/${p.orderId}`}
                className="block rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 transition-colors hover:border-[rgb(var(--color-primary))]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">
                      {p.order?.title || "הזמנה"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[rgb(var(--color-text-secondary))]">
                      <span className="font-medium">₪{p.amount}</span>
                      <span className="text-[rgb(var(--color-border))]">|</span>
                      <span>{PAYMENT_METHOD_LABELS[p.method] || p.method}</span>
                      <span className="text-[rgb(var(--color-border))]">|</span>
                      <span>{isBuyer ? "שילמתי" : "קיבלתי"}</span>
                      <span className="text-[rgb(var(--color-border))]">|</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("he-IL")}</span>
                    </div>
                    {p.refundAmount != null && (
                      <p className="mt-1 text-[12px] text-[rgb(var(--color-error))]">הוחזר ₪{p.refundAmount}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${style.bg} ${style.text}`}>
                    {PAYMENT_STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
