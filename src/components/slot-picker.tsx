"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarBlank, Clock } from "@phosphor-icons/react";

export interface SlotOption {
  slotStart: string;
  slotEnd: string;
  date: string;
  startMin: number;
  label: string;
}

interface SellerAvailability {
  acceptingJobs: boolean;
  slots: SlotOption[];
}

interface SlotPickerProps {
  sellerId: string;
  value: SlotOption | null;
  onChange: (slot: SlotOption | null) => void;
}

/** Lets the user pick an open two-hour visit slot from a seller's calendar. */
export function SlotPicker({ sellerId, value, onChange }: SlotPickerProps) {
  const [data, setData] = useState<SellerAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sellers/${sellerId}/availability`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((payload: SellerAvailability) => {
        setData(payload);
        const first = payload.slots?.[0]?.date ?? null;
        setSelectedDate(first);
      })
      .catch(() => setData({ acceptingJobs: true, slots: [] }))
      .finally(() => setLoading(false));
  }, [sellerId]);

  const dates = useMemo(() => {
    const seen = new Map<string, string>();
    for (const slot of data?.slots ?? []) {
      if (!seen.has(slot.date)) {
        seen.set(slot.date, slot.label.split(" · ")[0]);
      }
    }
    return [...seen.entries()].map(([date, heading]) => ({ date, heading }));
  }, [data]);

  const daySlots = (data?.slots ?? []).filter((slot) => slot.date === selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(var(--color-primary),0.2)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (data && data.acceptingJobs === false) {
    return (
      <p className="rounded-xl bg-[rgba(var(--color-accent-yellow),0.15)] px-4 py-3 text-[13px] text-[rgb(var(--color-warning))]">
        האבא לא מקבל עבודות השבוע
      </p>
    );
  }

  if (!data?.slots.length) {
    return (
      <p className="rounded-xl bg-[rgb(var(--color-bg))] px-4 py-3 text-[13px] text-[rgb(var(--color-text-secondary))]">
        אין חלונות פנויים בשבועיים הקרובים. נסה ליצור קשר עם האבא או לחזור מאוחר יותר.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
        <CalendarBlank className="h-4 w-4" />
        בחרו חלון ביקור של שעתיים
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {dates.map((day) => {
          const active = day.date === selectedDate;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                setSelectedDate(day.date);
                onChange(null);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                active
                  ? "bg-[rgb(var(--color-primary))] text-white"
                  : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))]"
              }`}
            >
              {day.heading.replace("יום ", "")}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {daySlots.map((slot) => {
          const active = value?.slotStart === slot.slotStart;
          return (
            <button
              key={slot.slotStart}
              type="button"
              onClick={() => onChange(slot)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-[rgba(var(--color-primary),0.12)] text-[rgb(var(--color-primary))] ring-2 ring-[rgb(var(--color-primary))]"
                  : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {slot.label.split(" · ")[1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
