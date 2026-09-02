"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowClockwise } from "@phosphor-icons/react";
import { SectionHeader } from "./section-header";

interface RebookableSeller {
  sellerId: string;
  seller: { id: string; name: string; avatar: string | null };
  lastOrder: {
    id: string;
    title: string | null;
    price: number;
    completedAt: string;
    jobType: string;
  };
  orderCount: number;
}

/** Shows rebookable sellers on the homepage for logged-in buyers. */
export function RebookableSection({ sellers, loading }: { sellers: RebookableSeller[]; loading: boolean }) {
  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="בעלי מקצוע שעבדת איתם" subtitle="הזמן שוב בקליק אחד" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-[rgba(var(--color-primary),0.05)]" />
          ))}
        </div>
      </section>
    );
  }

  if (sellers.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="בעלי מקצוע שעבדת איתם" subtitle="הזמן שוב בקליק אחד" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((item) => (
          <div
            key={item.sellerId}
            className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:border-[rgba(var(--color-primary-light),0.3)] hover:shadow-md"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-[rgba(var(--color-primary),0.1)]">
              {item.seller.avatar ? (
                <Image src={item.seller.avatar} alt="" fill className="object-cover" sizes="56px" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[18px] font-bold text-[rgb(var(--color-primary))]">
                  {item.seller.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold text-[rgb(var(--color-text))]">
                {item.seller.name}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-[rgb(var(--color-text-secondary))]">
                {item.lastOrder.title || "שירות"}
              </p>
              <p className="mt-0.5 text-[12px] text-[rgb(var(--color-text-muted))]">
                {item.orderCount} {item.orderCount === 1 ? "הזמנה" : "הזמנות"}
              </p>
            </div>
            <Link
              href={`/orders/rebook?seller=${item.sellerId}&from=${item.lastOrder.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] whitespace-nowrap"
            >
              <ArrowClockwise className="h-4 w-4" />
              הזמן שוב
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
