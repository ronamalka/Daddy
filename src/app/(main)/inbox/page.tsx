"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock, Mail, MessageCircle, ChevronLeft } from "lucide-react";

interface Order {
  id: string;
  gig: { title: string };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  status: string;
}

const AVATAR_COLORS = [
  "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]",
  "from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]",
  "from-[rgb(var(--color-error))] to-[rgb(var(--color-accent-yellow))]",
  "from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]",
  "from-[rgb(var(--color-accent-yellow))] to-[rgb(var(--color-error))]",
  "from-[rgb(var(--color-success))] to-[rgb(var(--color-primary))]",
];

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-[rgb(var(--color-accent-yellow))]",
  IN_PROGRESS: "bg-[rgb(var(--color-primary))]",
  DELIVERED: "bg-[rgb(var(--color-primary-light))]",
  COMPLETED: "bg-[rgb(var(--color-success))]",
  CANCELLED: "bg-[rgb(var(--color-error))]",
};

export default function InboxPage() {
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
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בהודעות.</p>
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-[rgba(var(--color-primary),0.1)] p-2.5">
          <Mail className="h-6 w-6 text-[rgb(var(--color-primary))]" />
        </div>
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">הודעות</h1>
          <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">{orders.length} {orders.length !== 1 ? "שיחות" : "שיחה"}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-16">
          <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-5 mb-4">
            <MessageCircle className="h-10 w-10 text-[rgb(var(--color-primary-light))]" />
          </div>
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין שיחות עדיין</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">הודעות מההזמנות שלך יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, index) => {
            const otherPerson = session.user.id === order.buyer.id ? order.seller : order.buyer;
            const avatarGradient = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const statusDot = STATUS_DOT[order.status] || STATUS_DOT.PENDING;

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 transition-all hover:shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] hover:border-[rgba(var(--color-primary-light),0.3)]"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-[16px] font-bold text-white`}>
                    {otherPerson.name[0]}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[rgb(var(--color-surface))] ${statusDot}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                      {otherPerson.name}
                    </p>
                    <span className="text-[12px] text-[rgb(var(--color-text-muted))]">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[14px] text-[rgb(var(--color-text-secondary))] truncate">{order.gig.title}</p>
                </div>

                {/* Arrow */}
                <ChevronLeft className="h-5 w-5 flex-shrink-0 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))] transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
