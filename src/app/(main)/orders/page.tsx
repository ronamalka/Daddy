"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  PENDING: { bg: "bg-[#FDCB6E]/15", text: "text-[#E67E22]", dot: "bg-[#FDCB6E]" },
  IN_PROGRESS: { bg: "bg-[#6C5CE7]/10", text: "text-[#6C5CE7]", dot: "bg-[#6C5CE7]" },
  DELIVERED: { bg: "bg-[#A29BFE]/15", text: "text-[#5A4BD1]", dot: "bg-[#A29BFE]" },
  COMPLETED: { bg: "bg-[#00B894]/15", text: "text-[#00B894]", dot: "bg-[#00B894]" },
  CANCELLED: { bg: "bg-[#E17055]/10", text: "text-[#E17055]", dot: "bg-[#E17055]" },
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
        <div className="rounded-full bg-[#F0EEFF] p-4 mb-4">
          <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-[16px] text-[#636E72]">התחבר כדי לצפות בהזמנות.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">ההזמנות שלי</h1>
          <p className="mt-1 text-[14px] text-[#636E72]">{orders.length} {orders.length !== 1 ? "הזמנות" : "הזמנה"} סה״כ</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] py-16">
          <div className="rounded-full bg-[#F0EEFF] p-5 mb-4">
            <svg className="h-10 w-10 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#2D3436]">אין הזמנות עדיין</p>
          <p className="mt-1 text-[14px] text-[#B2BEC3]">ההזמנות שלך יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex items-center gap-4 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-5 transition-all hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)] hover:border-[#A29BFE]/30"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#F0EEFF]">
                  {order.gig.image ? (
                    <img src={order.gig.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[20px] font-bold text-[#6C5CE7]">
                      D
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2D3436] truncate group-hover:text-[#6C5CE7] transition-colors">
                    {order.gig.title}
                  </h3>
                  <p className="mt-1 text-[14px] text-[#636E72]">
                    {session.user.role === "SELLER" ? `קונה: ${order.buyer.name}` : `מוכר: ${order.seller.name}`}
                    <span className="mx-2 text-[#E8ECF1]">|</span>
                    {order.tier}
                    <span className="mx-2 text-[#E8ECF1]">|</span>
                    <span className="font-semibold text-[#2D3436]">₪{order.price}</span>
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 rounded-[9999px] px-3.5 py-1.5 text-[12px] font-semibold ${colors.bg} ${colors.text}`}>
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
