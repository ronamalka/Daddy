"use client";

import { jerusalemLocalToUtc, minutesToTimeLabel } from "@/lib/availability";

const START_OPTIONS = Array.from({ length: 15 }, (_, i) => (6 + i) * 60);

/** Returns today's date in Asia/Jerusalem as YYYY-MM-DD. */
function todayKey(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}

export interface VisitWindowValue {
  date: string;
  startMin: number;
}

interface VisitWindowFieldsProps {
  value: VisitWindowValue | null;
  onChange: (value: VisitWindowValue) => void;
}

/** Turns a date and start minute into UTC start and end times for a two-hour visit. */
export function visitWindowToIso(value: VisitWindowValue): { slotStart: string; slotEnd: string } {
  const [year, month, day] = value.date.split("-").map(Number);
  const start = jerusalemLocalToUtc(year, month, day, value.startMin);
  const end = jerusalemLocalToUtc(year, month, day, value.startMin + 120);
  return { slotStart: start.toISOString(), slotEnd: end.toISOString() };
}

/** Date and start-time fields for choosing a two-hour visit window. */
export function VisitWindowFields({ value, onChange }: VisitWindowFieldsProps) {
  const minDate = todayKey();
  const date = value?.date || "";
  const startMin = value?.startMin ?? 16 * 60;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
          תאריך הביקור
        </label>
        <input
          type="date"
          min={minDate}
          required
          value={date}
          onChange={(e) => onChange({ date: e.target.value, startMin })}
          className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
          חלון של שעתיים
        </label>
        <select
          required
          value={startMin}
          onChange={(e) => onChange({ date: date || minDate, startMin: Number(e.target.value) })}
          className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
        >
          {START_OPTIONS.map((min) => (
            <option key={min} value={min}>
              {minutesToTimeLabel(min)}–{minutesToTimeLabel(min + 120)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
