"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock, Archive } from "lucide-react";

interface Order {
  id: string;
  tier: string;
  price: number;
  status: string;
  createdAt: string;
  gig: { id: string; title: string; image: string | null };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]", dot: "bg-[rgb(var(--color-accent-yellow))]" },
  IN_PROGRESS: { bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]", dot: "bg-[rgb(var(--color-primary))]" },
  DELIVERED: { bg: "bg-[rgba(var(--color-primary-light),0.15)]", text: "text-[rgb(var(--color-primary-hover))]", dot: "bg-[rgb(var(--color-primary-light))]" },
  COMPLETED: { bg: "bg-[rgba(var(--color-success),0.15)]", text: "text-[rgb(var(--color-success))]", dot: "bg-[rgb(var(--color-success))]" },
  CANCELLED: { bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]", dot: "bg-[rgb(var(--color-error))]" },
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בהזמנות.</p>
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">ההזמנות שלי</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">{orders.length} {orders.length !== 1 ? "הזמנות" : "הזמנה"} סה״כ</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-16">
          <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-5 mb-4">
            <Archive className="h-10 w-10 text-[rgb(var(--color-primary-light))]" />
          </div>
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין הזמנות עדיין</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">ההזמנות שלך יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] hover:border-[rgba(var(--color-primary-light),0.3)]"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[rgba(var(--color-primary),0.1)]">
                  {order.gig.image ? (
                    <img src={order.gig.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[20px] font-bold text-[rgb(var(--color-primary))]">
                      D
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[rgb(var(--color-text))] truncate group-hover:text-[rgb(var(--color-primary))] transition-colors">
                    {order.gig.title}
                  </h3>
                  <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
                    {session.user.role === "SELLER" ? `קונה: ${order.buyer.name}` : `מוכר: ${order.seller.name}`}
                    <span className="mx-2 text-[rgb(var(--color-border))]">|</span>
                    {order.tier}
                    <span className="mx-2 text-[rgb(var(--color-border))]">|</span>
                    <span className="font-semibold text-[rgb(var(--color-text))]">₪{order.price}</span>
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${colors.bg} ${colors.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  {order.status.replace("_", " ")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
