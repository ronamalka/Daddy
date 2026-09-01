"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarBlank, CaretLeft, CaretRight, Clock } from "@phosphor-icons/react";
import { formatVisitWindow } from "@/lib/availability";
import {
  DAY_LABELS_HE,
  formatMonthHeading,
  formatSlotClock,
  groupJobsByJerusalemDay,
  jerusalemMonthGrid,
  jerusalemToday,
  shiftMonth,
} from "@/lib/order-views";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { WazeNavigate } from "@/components/orders/waze-navigate";
import { canShowSellerWaze } from "@/lib/waze";
import type { OrderListItem } from "@/components/orders/types";

/** Month calendar of a seller's booked jobs, with a day list of visits. */
export function SellerCalendar({ orders }: { orders: OrderListItem[] }) {
  const today = jerusalemToday();
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selectedDate, setSelectedDate] = useState(today.date);
  const [focusedUpcoming, setFocusedUpcoming] = useState(false);

  const byDay = useMemo(() => groupJobsByJerusalemDay(orders), [orders]);
  const cells = useMemo(() => jerusalemMonthGrid(cursor.year, cursor.month), [cursor]);
  const selectedJobs = byDay.get(selectedDate) ?? [];

  useEffect(() => {
    if (focusedUpcoming) return;
    if (orders.length === 0) return;
    const upcomingDates = [...byDay.keys()].filter((date) => date >= today.date).sort();
    setFocusedUpcoming(true);
    if (!upcomingDates[0]) return;
    const focus = upcomingDates[0];
    const [year, month] = focus.split("-").map(Number);
    setCursor({ year, month });
    setSelectedDate(focus);
  }, [byDay, focusedUpcoming, orders.length, today.date]);

  const upcoming = useMemo(() => {
    return [...byDay.entries()]
      .filter(([date]) => date >= today.date)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, jobs]) => jobs)
      .slice(0, 8);
  }, [byDay, today.date]);

  /** Moves the calendar to the previous or next month. */
  function goMonth(delta: number) {
    setCursor((prev) => shiftMonth(prev.year, prev.month, delta));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <section className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
            aria-label="חודש הבא"
          >
            <CaretLeft className="h-4 w-4" />
          </button>
          <h2 className="text-[18px] font-bold text-[rgb(var(--color-text))]">{formatMonthHeading(cursor.year, cursor.month)}</h2>
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
            aria-label="חודש קודם"
          >
            <CaretRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-[rgb(var(--color-text-muted))]">
          {DAY_LABELS_HE.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const jobs = byDay.get(cell.date) ?? [];
            const isToday = cell.date === today.date;
            const isSelected = cell.date === selectedDate;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-[72px] rounded-xl p-1.5 text-right transition-colors ${
                  isSelected
                    ? "bg-[rgba(var(--color-primary),0.12)] ring-2 ring-[rgb(var(--color-primary))]"
                    : isToday
                      ? "bg-[rgba(var(--color-accent),0.1)]"
                      : "hover:bg-[rgb(var(--color-surface-elevated))]"
                } ${cell.inMonth ? "text-[rgb(var(--color-text))]" : "text-[rgb(var(--color-text-muted))] opacity-50"}`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold ${
                  isToday ? "bg-[rgb(var(--color-primary))] text-white" : ""
                }`}>
                  {cell.day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {jobs.slice(0, 2).map((job) => (
                    <div
                      key={job.id}
                      className="truncate rounded-md bg-[rgba(var(--color-primary),0.14)] px-1 py-0.5 text-[10px] font-semibold text-[rgb(var(--color-primary))]"
                    >
                      {formatSlotClock(new Date(job.slotStart!), new Date(job.slotEnd!))}
                    </div>
                  ))}
                  {jobs.length > 2 && (
                    <div className="text-[10px] text-[rgb(var(--color-text-muted))]">+{jobs.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[rgb(var(--color-text))]">
            <CalendarBlank className="h-4 w-4 text-[rgb(var(--color-primary))]" />
            {selectedDate === today.date ? "היום" : selectedJobs.length ? "ביקורים ביום הנבחר" : "אין ביקורים ביום הזה"}
          </div>
          {selectedJobs.length === 0 ? (
            <p className="text-[13px] text-[rgb(var(--color-text-muted))]">היומן פנוי ביום הזה.</p>
          ) : (
            <div className="space-y-2">
              {selectedJobs.map((job) => {
                const colors = STATUS_COLORS[job.status] || STATUS_COLORS.PENDING;
                const showWaze = canShowSellerWaze({
                  isSeller: true,
                  status: job.status,
                  street: job.visit?.street,
                  streetVisible: job.visit?.streetVisible,
                });
                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-[rgb(var(--color-border))] p-3 hover:border-[rgb(var(--color-primary))]"
                  >
                    <Link href={`/orders/${job.id}`} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[14px] font-semibold text-[rgb(var(--color-text))]">{job.gig.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors.bg} ${colors.text}`}>
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[rgb(var(--color-primary))]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatVisitWindow(new Date(job.slotStart!), new Date(job.slotEnd!))}
                      </p>
                      <p className="mt-1 text-[12px] text-[rgb(var(--color-text-secondary))]">קונה: {job.buyer.name}</p>
                    </Link>
                    {showWaze && job.visit && (
                      <WazeNavigate
                        street={job.visit.street}
                        cityName={job.visit.cityName}
                        districtName={job.visit.districtName}
                        compact
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
          <h3 className="mb-3 text-[14px] font-semibold text-[rgb(var(--color-text))]">הבא בתור</h3>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-[rgb(var(--color-text-muted))]">
              אין ביקורים מתוכננים. כשייסגרו איתך עבודות — הן יופיעו כאן לפי יום.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((job) => (
                <Link key={job.id} href={`/orders/${job.id}`} className="block rounded-xl bg-[rgb(var(--color-surface-elevated))] px-3 py-2 hover:bg-[rgba(var(--color-primary),0.08)]">
                  <p className="truncate text-[13px] font-semibold text-[rgb(var(--color-text))]">{job.gig.title}</p>
                  <p className="text-[12px] text-[rgb(var(--color-text-secondary))]">
                    {formatVisitWindow(new Date(job.slotStart!), new Date(job.slotEnd!))}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
