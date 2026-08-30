export const JERUSALEM_TZ = "Asia/Jerusalem";
export const SLOT_DURATION_MINUTES = 120;
export const SLOT_STEP_MINUTES = 60;
export const BOOKING_HORIZON_DAYS = 14;

export const DAY_LABELS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;

export interface WeeklyHours {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

export interface TimeOffDate {
  date: string;
}

export interface BookedSlot {
  slotStart: string | Date;
  slotEnd: string | Date;
}

export interface JerusalemParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export interface GeneratedSlot {
  slotStart: Date;
  slotEnd: Date;
  date: string;
  startMin: number;
  label: string;
}

const PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: JERUSALEM_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAY_TO_DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function formatToPartsMap(date: Date, timeZone = JERUSALEM_TZ): Record<string, string> {
  const dtf =
    timeZone === JERUSALEM_TZ
      ? PARTS_FORMAT
      : new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
          hourCycle: "h23",
        });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

export function zonedParts(date: Date, timeZone = JERUSALEM_TZ): JerusalemParts {
  const map = formatToPartsMap(date, timeZone);
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAY_TO_DOW[map.weekday] ?? 0,
  };
}

export function jerusalemDateKey(date: Date): string {
  const parts = zonedParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  return asUtc - date.getTime();
}

export function jerusalemLocalToUtc(
  year: number,
  month: number,
  day: number,
  minutes: number
): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let date = new Date(asUtc);
  date = new Date(asUtc - tzOffsetMs(date, JERUSALEM_TZ));
  date = new Date(asUtc - tzOffsetMs(date, JERUSALEM_TZ));
  return date;
}

export function addLocalDays(year: number, month: number, day: number, days: number): {
  year: number;
  month: number;
  day: number;
} {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function minutesToTimeLabel(min: number): string {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseTimeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function slotsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isTwoHourLocalWindow(start: Date, end: Date): boolean {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return false;
  }
  const startParts = zonedParts(start);
  const endParts = zonedParts(end);
  if (
    startParts.year !== endParts.year ||
    startParts.month !== endParts.month ||
    startParts.day !== endParts.day
  ) {
    return false;
  }
  return (
    endParts.hour * 60 + endParts.minute - (startParts.hour * 60 + startParts.minute) ===
    SLOT_DURATION_MINUTES
  );
}

function timeOffSet(timeOff: Array<string | TimeOffDate>): Set<string> {
  return new Set(timeOff.map((entry) => (typeof entry === "string" ? entry : entry.date)));
}

export function slotFitsSchedule(
  start: Date,
  end: Date,
  weeklyHours: WeeklyHours[],
  timeOff: Array<string | TimeOffDate>
): boolean {
  if (!isTwoHourLocalWindow(start, end)) return false;
  const startParts = zonedParts(start);
  if (timeOffSet(timeOff).has(jerusalemDateKey(start))) return false;
  const hours = weeklyHours.find((row) => row.dayOfWeek === startParts.weekday);
  if (!hours) return false;
  const startMin = startParts.hour * 60 + startParts.minute;
  const endMin = startMin + SLOT_DURATION_MINUTES;
  return startMin >= hours.startMin && endMin <= hours.endMin;
}

export function generateAvailableSlots(opts: {
  weeklyHours: WeeklyHours[];
  timeOff: Array<string | TimeOffDate>;
  bookedSlots: BookedSlot[];
  now?: Date;
  days?: number;
}): GeneratedSlot[] {
  const now = opts.now ?? new Date();
  const horizon = opts.days ?? BOOKING_HORIZON_DAYS;
  const booked = opts.bookedSlots.map((slot) => ({
    start: new Date(slot.slotStart),
    end: new Date(slot.slotEnd),
  }));
  const today = zonedParts(now);
  const off = timeOffSet(opts.timeOff);
  const slots: GeneratedSlot[] = [];

  for (let i = 0; i < horizon; i++) {
    const local = addLocalDays(today.year, today.month, today.day, i);
    const noon = jerusalemLocalToUtc(local.year, local.month, local.day, 12 * 60);
    const parts = zonedParts(noon);
    const hours = opts.weeklyHours.find((row) => row.dayOfWeek === parts.weekday);
    if (!hours) continue;

    const dateKey = `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
    if (off.has(dateKey)) continue;

    for (
      let startMin = hours.startMin;
      startMin + SLOT_DURATION_MINUTES <= hours.endMin;
      startMin += SLOT_STEP_MINUTES
    ) {
      const slotStart = jerusalemLocalToUtc(local.year, local.month, local.day, startMin);
      const slotEnd = jerusalemLocalToUtc(
        local.year,
        local.month,
        local.day,
        startMin + SLOT_DURATION_MINUTES
      );
      if (slotStart <= now) continue;
      if (booked.some((row) => slotsOverlap(slotStart, slotEnd, row.start, row.end))) continue;

      slots.push({
        slotStart,
        slotEnd,
        date: dateKey,
        startMin,
        label: formatVisitWindow(slotStart, slotEnd),
      });
    }
  }

  return slots;
}

export function formatVisitWindow(start: Date, end: Date): string {
  const startParts = zonedParts(start);
  const endParts = zonedParts(end);
  const dayName = DAY_LABELS_HE[startParts.weekday];
  return `יום ${dayName}, ${startParts.day}.${startParts.month} · ${minutesToTimeLabel(
    startParts.hour * 60 + startParts.minute
  )}–${minutesToTimeLabel(endParts.hour * 60 + endParts.minute)}`;
}

export function parseSlotIso(
  startIso: string,
  endIso: string
): { start: Date; end: Date } | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const probe = jerusalemLocalToUtc(year, month, day, 12 * 60);
  return jerusalemDateKey(probe) === value;
}
