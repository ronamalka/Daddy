"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Order {
  id: string;
  gig: { title: string };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  status: string;
}

const AVATAR_COLORS = [
  "from-[#6C5CE7] to-[#A29BFE]",
  "from-[#00D2D3] to-[#00B894]",
  "from-[#FF6B6B] to-[#FECA57]",
  "from-[#A29BFE] to-[#00D2D3]",
  "from-[#FECA57] to-[#FF6B6B]",
  "from-[#00B894] to-[#6C5CE7]",
];

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-[#FDCB6E]",
  IN_PROGRESS: "bg-[#6C5CE7]",
  DELIVERED: "bg-[#A29BFE]",
  COMPLETED: "bg-[#00B894]",
  CANCELLED: "bg-[#E17055]",
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
        <div className="rounded-full bg-[#F0EEFF] p-4 mb-4">
          <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-[16px] text-[#636E72]">התחבר כדי לצפות בהודעות.</p>
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-[12px] bg-[#F0EEFF] p-2.5">
          <svg className="h-6 w-6 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">הודעות</h1>
          <p className="text-[14px] text-[#636E72]">{orders.length} {orders.length !== 1 ? "שיחות" : "שיחה"}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] py-16">
          <div className="rounded-full bg-[#F0EEFF] p-5 mb-4">
            <svg className="h-10 w-10 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#2D3436]">אין שיחות עדיין</p>
          <p className="mt-1 text-[14px] text-[#B2BEC3]">הודעות מההזמנות שלך יופיעו כאן</p>
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
                className="group flex items-center gap-4 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-4 transition-all hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)] hover:border-[#A29BFE]/30"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-[16px] font-bold text-white`}>
                    {otherPerson.name[0]}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusDot}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">
                      {otherPerson.name}
                    </p>
                    <span className="text-[12px] text-[#B2BEC3]">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[14px] text-[#636E72] truncate">{order.gig.title}</p>
                </div>

                {/* Arrow */}
                <svg className="h-5 w-5 flex-shrink-0 text-[#B2BEC3] group-hover:text-[#6C5CE7] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
