import {
  addLocalDays,
  DAY_LABELS_HE,
  jerusalemDateKey,
  jerusalemLocalToUtc,
  minutesToTimeLabel,
  zonedParts,
} from "@/lib/availability";

export const CANCELLED_STATUS = "CANCELLED";

export type OrderSide = "SELLER" | "BUYER";

export interface OrderPartyIds {
  buyerId?: string | null;
  sellerId?: string | null;
  buyer?: { id: string };
  seller?: { id: string };
}

export interface SlotLike {
  slotStart?: string | Date | null;
  slotEnd?: string | Date | null;
  status?: string | null;
}

export interface CalendarDayCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

/** Returns a user id from a string or `{ id }` object. */
export function partyId(party: { id: string } | string | null | undefined): string {
  if (!party) return "";
  return typeof party === "string" ? party : party.id;
}

/** Returns SELLER, BUYER, or null for this user on this order. */
export function sideOfOrder(order: OrderPartyIds, userId: string): OrderSide | null {
  const sellerId = partyId(order.sellerId ?? order.seller);
  const buyerId = partyId(order.buyerId ?? order.buyer);
  if (sellerId && sellerId === userId) return "SELLER";
  if (buyerId && buyerId === userId) return "BUYER";
  return null;
}

/** Splits orders into selling vs buying for this user. */
export function splitOrdersForUser<T extends OrderPartyIds>(orders: T[], userId: string): {
  selling: T[];
  buying: T[];
} {
  const selling: T[] = [];
  const buying: T[] = [];
  for (const order of orders) {
    const side = sideOfOrder(order, userId);
    if (side === "SELLER") selling.push(order);
    else if (side === "BUYER") buying.push(order);
  }
  return { selling, buying };
}

/** Returns true if the order has a valid, non-cancelled visit slot. */
export function isCalendarJob<T extends SlotLike>(order: T): boolean {
  if (!order.slotStart || !order.slotEnd) return false;
  if (order.status === CANCELLED_STATUS) return false;
  const start = new Date(order.slotStart);
  const end = new Date(order.slotEnd);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

/** Groups calendar jobs by Jerusalem date and sorts each day by start time. */
export function groupJobsByJerusalemDay<T extends SlotLike>(orders: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const order of orders) {
    if (!isCalendarJob(order) || !order.slotStart) continue;
    const key = jerusalemDateKey(new Date(order.slotStart));
    const list = grouped.get(key) ?? [];
    list.push(order);
    grouped.set(key, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => new Date(a.slotStart!).getTime() - new Date(b.slotStart!).getTime());
  }
  return grouped;
}

/** Formats a slot as HH:MM–HH:MM in Jerusalem time. */
export function formatSlotClock(start: Date, end: Date): string {
  const startParts = zonedParts(start);
  const endParts = zonedParts(end);
  return `${minutesToTimeLabel(startParts.hour * 60 + startParts.minute)}–${minutesToTimeLabel(
    endParts.hour * 60 + endParts.minute
  )}`;
}

/** Returns a Hebrew month name and year. */
export function formatMonthHeading(year: number, month: number): string {
  return `${HEBREW_MONTHS[month - 1]} ${year}`;
}

/** Moves a year and month by delta months. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const utc = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1 };
}

/** Returns today's year, month, day, and date key in Jerusalem time. */
export function jerusalemToday(now = new Date()): { year: number; month: number; day: number; date: string } {
  const parts = zonedParts(now);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    date: jerusalemDateKey(now),
  };
}

/** Builds a Sunday-start calendar grid for a Jerusalem month, including days from other months. */
export function jerusalemMonthGrid(year: number, month: number): CalendarDayCell[] {
  const first = jerusalemLocalToUtc(year, month, 1, 12 * 60);
  const firstDow = zonedParts(first).weekday;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < firstDow; i++) {
    const prev = addLocalDays(year, month, 1, i - firstDow);
    cells.push({
      date: `${prev.year}-${String(prev.month).padStart(2, "0")}-${String(prev.day).padStart(2, "0")}`,
      day: prev.day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!;
    const [y, m, d] = last.date.split("-").map(Number);
    const next = addLocalDays(y, m, d, 1);
    cells.push({
      date: `${next.year}-${String(next.month).padStart(2, "0")}-${String(next.day).padStart(2, "0")}`,
      day: next.day,
      inMonth: false,
    });
  }

  return cells;
}

export { DAY_LABELS_HE };
