"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bag, CalendarBlank, Lock } from "@phosphor-icons/react";
import { OrderCards } from "@/components/orders/order-cards";
import { SellerCalendar } from "@/components/orders/seller-calendar";
import type { OrderListItem } from "@/components/orders/types";
import { splitOrdersForUser } from "@/lib/order-views";

type Tab = "calendar" | "selling" | "buying";

/** Shows the user's orders as a calendar and buying or selling lists. */
export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab | null>(null);

  const userId = session?.user?.id ?? "";
  const role = session?.user?.role;
  const isProvider = role === "SELLER" || role === "ADMIN";

  const { selling, buying } = useMemo(
    () => (userId ? splitOrdersForUser(orders, userId) : { selling: [], buying: [] }),
    [orders, userId]
  );

  const sellingByVisit = useMemo(() => {
    return [...selling].sort((a, b) => {
      if (a.slotStart && b.slotStart) return new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime();
      if (a.slotStart) return -1;
      if (b.slotStart) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [selling]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (tab) return;
    if (!session) return;
    setTab(isProvider ? "calendar" : "buying");
  }, [session, isProvider, tab]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בהזמנות.</p>
      </div>
    );
  }

  if (loading || !tab) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  const title = isProvider ? "העבודות שלי" : "ההזמנות שלי";
  const subtitle = isProvider
    ? `${selling.length} עבודות לספק${buying.length ? ` · ${buying.length} הזמנות שביצעתי` : ""}`
    : `${buying.length} ${buying.length !== 1 ? "הזמנות" : "הזמנה"} סה״כ`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">{title}</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">{subtitle}</p>
          <Link href="/standing-jobs" className="mt-2 inline-block text-[13px] font-semibold text-[rgb(var(--color-primary))]">
            עבודות קבועות
          </Link>
        </div>
        {isProvider && (
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")} icon={<CalendarBlank className="h-4 w-4" />}>
              יומן
            </TabButton>
            <TabButton active={tab === "selling"} onClick={() => setTab("selling")} icon={<Bag className="h-4 w-4" />}>
              עבודות לספק
            </TabButton>
            <TabButton active={tab === "buying"} onClick={() => setTab("buying")}>
              הזמנות שביצעתי
            </TabButton>
          </div>
        )}
      </div>

      {tab === "calendar" && isProvider && <SellerCalendar orders={selling} />}

      {tab === "selling" && (
        <OrderCards
          orders={sellingByVisit}
          counterpart="buyer"
          emptyTitle="עדיין אין עבודות סגורות"
          emptyHint="כשייסגרו איתך ג׳ובים — הם יופיעו כאן עם חלון הביקור"
        />
      )}

      {tab === "buying" && (
        <OrderCards
          orders={buying}
          counterpart="seller"
          emptyTitle="שקט פה. בטח כולם כבר סידרו הכל."
          emptyHint="כשתזמין אבאל׳ה — ההזמנה תופיע כאן"
        />
      )}
    </div>
  );
}

/** Renders a tab chip used to switch order views. */
function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-[rgb(var(--color-primary))] text-white"
          : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
