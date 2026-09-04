"use client";

import Link from "next/link";
import Image from "next/image";
import { Archive, ArrowClockwise } from "@phosphor-icons/react";
import { formatVisitWindow } from "@/lib/availability";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { orderHasOpenDispute } from "@/lib/disputes";
import type { OrderListItem } from "@/components/orders/types";

/** Stack of order cards with status, visit time, and the other party, or an empty state. */
export function OrderCards({
  orders,
  emptyTitle,
  emptyHint,
  counterpart,
}: {
  orders: OrderListItem[];
  emptyTitle: string;
  emptyHint: string;
  counterpart: "buyer" | "seller";
}) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-16">
        <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-5">
          <Archive className="h-10 w-10 text-[rgb(var(--color-primary-light))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">{emptyTitle}</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const colors = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
        const other = counterpart === "buyer" ? order.buyer : order.seller;
        const otherLabel = counterpart === "buyer" ? "קונה" : "מוכר";
        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:border-[rgba(var(--color-primary-light),0.3)] hover:shadow-md"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[rgba(var(--color-primary),0.1)]">
              {order.gig.image ? (
                <Image src={order.gig.image} alt="" fill className="object-cover" sizes="64px" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[20px] font-bold text-[rgb(var(--color-primary))]">
                  א
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-[rgb(var(--color-text))] transition-colors group-hover:text-[rgb(var(--color-primary))]">
                {order.gig.title}
              </h3>
              <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
                {otherLabel}: {other.name}
                {order.tier ? (
                  <>
                    <span className="mx-2 text-[rgb(var(--color-border))]">|</span>
                    {order.tier}
                  </>
                ) : null}
                <span className="mx-2 text-[rgb(var(--color-border))]">|</span>
                <span className="font-semibold text-[rgb(var(--color-text))]">₪{order.price}</span>
              </p>
              {order.slotStart && order.slotEnd && (
                <p className="mt-1 text-[13px] text-[rgb(var(--color-primary))]">
                  {formatVisitWindow(new Date(order.slotStart), new Date(order.slotEnd))}
                </p>
              )}
            </div>
            <span className="flex flex-col items-end gap-1">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${colors.bg} ${colors.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                {STATUS_LABELS[order.status] || order.status}
              </span>
              {orderHasOpenDispute(order.disputes) && (
                <span className="rounded-full bg-[rgba(var(--color-error),0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-error))]">
                  מחלוקת פתוחה
                </span>
              )}
              {counterpart === "seller" && order.status === "COMPLETED" && (
                <Link
                  href={`/orders/rebook?seller=${order.sellerId}&from=${order.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.2)] transition-colors"
                >
                  <ArrowClockwise className="h-3 w-3" />
                  הזמן שוב
                </Link>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
