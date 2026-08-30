"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash } from "@phosphor-icons/react";
import { DAY_LABELS_HE, minutesToTimeLabel } from "@/lib/availability";

interface WeeklyHoursRow {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

interface TimeOffRow {
  date: string;
  note?: string | null;
}

const START_OPTIONS = Array.from({ length: 17 }, (_, i) => (6 + i) * 60);
const END_OPTIONS = [...START_OPTIONS.filter((min) => min >= 7 * 60), 24 * 60];

function defaultHoursForDay(dayOfWeek: number): WeeklyHoursRow {
  if (dayOfWeek === 5) return { dayOfWeek, startMin: 8 * 60, endMin: 13 * 60 };
  return { dayOfWeek, startMin: 16 * 60, endMin: 20 * 60 };
}

export default function ProfileAvailabilityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [acceptingJobs, setAcceptingJobs] = useState(true);
  const [hoursByDay, setHoursByDay] = useState<Record<number, WeeklyHoursRow | null>>({});
  const [timeOff, setTimeOff] = useState<TimeOffRow[]>([]);
  const [newOffDate, setNewOffDate] = useState("");

  useEffect(() => {
    fetch("/api/availability")
      .then((res) => res.json())
      .then((data) => {
        setAcceptingJobs(data.acceptingJobs !== false);
        const map: Record<number, WeeklyHoursRow | null> = {};
        for (let day = 0; day < 7; day++) map[day] = null;
        if (Array.isArray(data.weeklyHours)) {
          for (const row of data.weeklyHours as WeeklyHoursRow[]) {
            map[row.dayOfWeek] = row;
          }
        }
        setHoursByDay(map);
        setTimeOff(Array.isArray(data.timeOff) ? data.timeOff : []);
      })
      .catch(() => setError("לא ניתן לטעון זמינות"))
      .finally(() => setLoading(false));
  }, []);

  function toggleDay(dayOfWeek: number) {
    setHoursByDay((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek] ? null : defaultHoursForDay(dayOfWeek),
    }));
  }

  function updateDay(dayOfWeek: number, field: "startMin" | "endMin", value: number) {
    setHoursByDay((prev) => {
      const current = prev[dayOfWeek] ?? defaultHoursForDay(dayOfWeek);
      const next = { ...current, [field]: value };
      if (next.endMin <= next.startMin) {
        next.endMin = Math.min(24 * 60, next.startMin + 120);
      }
      return { ...prev, [dayOfWeek]: next };
    });
  }

  function addTimeOff() {
    if (!newOffDate || timeOff.some((row) => row.date === newOffDate)) return;
    setTimeOff((prev) => [...prev, { date: newOffDate }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewOffDate("");
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const weeklyHours = Object.values(hoursByDay).filter((row): row is WeeklyHoursRow => Boolean(row));
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptingJobs, weeklyHours, timeOff }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const payload = await res.json().catch(() => ({}));
        setError((payload as { error?: string }).error || "שגיאה בשמירה");
      }
    } catch {
      setError("שגיאה בשמירה, נסה שנית");
    }
    setSaving(false);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל זמינות.</p>
      </div>
    );
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">רק אבאל׳ות יכולים להגדיר לוח זמינות.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">הזמינות שלי</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            שעות שבועיות, ימי חופש, והאם אתה מקבל עבודות השבוע
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg))] transition-all"
        >
          חזרה
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!acceptingJobs}
                onChange={(e) => setAcceptingJobs(!e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-[15px] font-semibold text-[rgb(var(--color-text))]">
                  לא מקבל עבודות השבוע
                </span>
                <span className="mt-0.5 block text-[13px] text-[rgb(var(--color-text-secondary))]">
                  כשהשבוע מלא, סמן כאן. תוסתר מחיפוש ולא יתקבלו הזמנות חדשות.
                </span>
              </span>
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
            <div className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-bg))] px-6 py-4">
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">
                סמן ימים פעילים ובחר שעות. הקונים בוחרים חלון של שעתיים בתוך השעות האלה.
              </p>
            </div>
            <div className="divide-y divide-[rgb(var(--color-border-light))]">
              {DAY_LABELS_HE.map((label, dayOfWeek) => {
                const row = hoursByDay[dayOfWeek];
                const enabled = Boolean(row);
                return (
                  <div key={dayOfWeek} className="flex flex-wrap items-center gap-3 px-6 py-3">
                    <label className="flex w-24 items-center gap-2 text-[14px] font-semibold text-[rgb(var(--color-text))]">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleDay(dayOfWeek)}
                      />
                      {label}
                    </label>
                    {enabled && row ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={row.startMin}
                          onChange={(e) => updateDay(dayOfWeek, "startMin", Number(e.target.value))}
                          className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-3 py-2 text-[13px]"
                        >
                          {START_OPTIONS.map((min) => (
                            <option key={min} value={min}>
                              {minutesToTimeLabel(min)}
                            </option>
                          ))}
                        </select>
                        <span className="text-[13px] text-[rgb(var(--color-text-muted))]">עד</span>
                        <select
                          value={row.endMin}
                          onChange={(e) => updateDay(dayOfWeek, "endMin", Number(e.target.value))}
                          className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-3 py-2 text-[13px]"
                        >
                          {END_OPTIONS.filter((min) => min > row.startMin).map((min) => (
                            <option key={min} value={min}>
                              {min === 1440 ? "00:00" : minutesToTimeLabel(min)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[13px] text-[rgb(var(--color-text-muted))]">לא זמין</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
            <h2 className="mb-3 text-[16px] font-bold text-[rgb(var(--color-text))]">ימי חופש</h2>
            <div className="mb-4 flex gap-2">
              <input
                type="date"
                value={newOffDate}
                onChange={(e) => setNewOffDate(e.target.value)}
                className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-2.5 text-[14px]"
              />
              <button
                type="button"
                onClick={addTimeOff}
                className="flex items-center gap-1 rounded-xl border border-[rgb(var(--color-border))] px-4 py-2.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
              >
                <Plus className="h-4 w-4" />
                חסום
              </button>
            </div>
            {timeOff.length === 0 ? (
              <p className="text-[13px] text-[rgb(var(--color-text-muted))]">אין ימים חסומים</p>
            ) : (
              <ul className="space-y-2">
                {timeOff.map((row) => (
                  <li
                    key={row.date}
                    className="flex items-center justify-between rounded-xl bg-[rgb(var(--color-bg))] px-4 py-2 text-[14px]"
                  >
                    <span>{new Date(row.date + "T12:00:00").toLocaleDateString("he-IL")}</span>
                    <button
                      type="button"
                      onClick={() => setTimeOff((prev) => prev.filter((item) => item.date !== row.date))}
                      className="text-[rgb(var(--color-error))]"
                      aria-label="הסר יום חופש"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמור זמינות"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-[rgb(var(--color-success))]">
                <Check className="h-4 w-4" />
                נשמר. אבא היה מתגאה.
              </span>
            )}
            {error && <span className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
