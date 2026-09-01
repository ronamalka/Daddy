import {
  SLOT_DURATION_MINUTES,
  addLocalDays,
  formatVisitWindow,
  jerusalemDateKey,
  jerusalemLocalToUtc,
  slotFitsSchedule,
  slotsOverlap,
  zonedParts,
  type BookedSlot,
  type TimeOffDate,
  type WeeklyHours,
} from "@/lib/availability";
import { laborAmount, quoteTotal, type QuotePriceInput } from "@/lib/quote-price";

export const STANDING_FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
export type StandingFrequency = (typeof STANDING_FREQUENCIES)[number];

export const STANDING_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED"] as const;
export type StandingStatus = (typeof STANDING_STATUSES)[number];

export const STANDING_HORIZON = 8;
export const STANDING_SCAN_LIMIT = 24;

/** How many new visits to book so the active job stays at the horizon. */
export function horizonGap(upcomingCount: number, horizon = STANDING_HORIZON): number {
  return Math.max(0, horizon - upcomingCount);
}

export const FREQUENCY_LABELS_HE: Record<StandingFrequency, string> = {
  WEEKLY: "שבועי",
  BIWEEKLY: "כל שבועיים",
  MONTHLY: "חודשי (כל 4 שבועות)",
};

export const STANDING_STATUS_LABELS_HE: Record<StandingStatus, string> = {
  ACTIVE: "פעיל",
  PAUSED: "מושהה",
  CANCELLED: "בוטל",
};

export type OccurrenceSkipReason = "hours" | "timeoff" | "booked" | "past";

export type PlannedOccurrence = {
  slotStart: Date;
  slotEnd: Date;
  label: string;
  bookable: boolean;
  reason?: OccurrenceSkipReason;
};

export type StandingServicePrice = {
  laborPrice: number;
  materialsEstimate: number | null;
  buyerSuppliesMaterials: boolean;
  price: number;
};

/** Days between repeats. Monthly stays on the same weekday so WeeklyHours still apply. */
export function frequencyStepDays(frequency: StandingFrequency): number {
  if (frequency === "WEEKLY") return 7;
  if (frequency === "BIWEEKLY") return 14;
  return 28;
}

/** Weekday and minutes-from-midnight in Jerusalem for a visit start. */
export function slotToWeekdayAndStart(slotStart: Date): { weekday: number; startMin: number } {
  const parts = zonedParts(slotStart);
  return { weekday: parts.weekday, startMin: parts.hour * 60 + parts.minute };
}

/** Builds a two-hour visit window from a Jerusalem calendar day and start minute. */
export function slotFromLocal(
  year: number,
  month: number,
  day: number,
  startMin: number
): { start: Date; end: Date } {
  return {
    start: jerusalemLocalToUtc(year, month, day, startMin),
    end: jerusalemLocalToUtc(year, month, day, startMin + SLOT_DURATION_MINUTES),
  };
}

/** Next repeating slot strictly after `after` for this weekday and start minute. */
export function firstSlotAfter(opts: {
  weekday: number;
  startMin: number;
  after: Date;
}): { start: Date; end: Date } {
  const parts = zonedParts(opts.after);
  const delta = (opts.weekday - parts.weekday + 7) % 7;
  let local = addLocalDays(parts.year, parts.month, parts.day, delta);
  let slot = slotFromLocal(local.year, local.month, local.day, opts.startMin);
  if (slot.start.getTime() <= opts.after.getTime()) {
    local = addLocalDays(local.year, local.month, local.day, 7);
    slot = slotFromLocal(local.year, local.month, local.day, opts.startMin);
  }
  return slot;
}

/** Moves a visit start forward by one frequency step, keeping the local clock time. */
export function addFrequency(slotStart: Date, frequency: StandingFrequency): Date {
  const parts = zonedParts(slotStart);
  const startMin = parts.hour * 60 + parts.minute;
  const next = addLocalDays(parts.year, parts.month, parts.day, frequencyStepDays(frequency));
  return jerusalemLocalToUtc(next.year, next.month, next.day, startMin);
}

function timeOffHasDate(timeOff: Array<string | TimeOffDate>, dateKey: string): boolean {
  return timeOff.some((entry) => (typeof entry === "string" ? entry : entry.date) === dateKey);
}

/** Why this candidate cannot be booked, or null if it can. */
export function occurrenceSkipReason(
  slot: { start: Date; end: Date },
  opts: {
    after: Date;
    weeklyHours: WeeklyHours[];
    timeOff: Array<string | TimeOffDate>;
    bookedSlots: BookedSlot[];
  }
): OccurrenceSkipReason | null {
  if (slot.start.getTime() <= opts.after.getTime()) return "past";
  if (timeOffHasDate(opts.timeOff, jerusalemDateKey(slot.start))) return "timeoff";
  if (!slotFitsSchedule(slot.start, slot.end, opts.weeklyHours, opts.timeOff)) return "hours";
  const booked = opts.bookedSlots.some((row) =>
    slotsOverlap(slot.start, slot.end, new Date(row.slotStart), new Date(row.slotEnd))
  );
  if (booked) return "booked";
  return null;
}

const SKIP_REASON_HE: Record<OccurrenceSkipReason, string> = {
  hours: "מחוץ לשעות הזמינות",
  timeoff: "האבא לא עובד ביום הזה",
  booked: "החלון כבר תפוס",
  past: "החלון כבר עבר",
};

/** Hebrew explanation for a skipped occurrence. */
export function skipReasonLabelHe(reason: OccurrenceSkipReason): string {
  return SKIP_REASON_HE[reason];
}

/** Upcoming cadence dates, marked bookable only when hours, time-off, and bookings allow. */
export function planOccurrences(opts: {
  frequency: StandingFrequency;
  weekday: number;
  startMin: number;
  after: Date;
  weeklyHours: WeeklyHours[];
  timeOff: Array<string | TimeOffDate>;
  bookedSlots: BookedSlot[];
  horizon?: number;
  scanLimit?: number;
  firstSlot?: { start: Date; end: Date };
}): PlannedOccurrence[] {
  const horizon = opts.horizon ?? STANDING_HORIZON;
  const scanLimit = opts.scanLimit ?? STANDING_SCAN_LIMIT;
  const planned: PlannedOccurrence[] = [];
  let cursor =
    opts.firstSlot && opts.firstSlot.start.getTime() > opts.after.getTime()
      ? opts.firstSlot
      : firstSlotAfter({ weekday: opts.weekday, startMin: opts.startMin, after: opts.after });

  for (let i = 0; i < scanLimit && planned.filter((row) => row.bookable).length < horizon; i++) {
    const reason = occurrenceSkipReason(cursor, opts);
    planned.push({
      slotStart: cursor.start,
      slotEnd: cursor.end,
      label: formatVisitWindow(cursor.start, cursor.end),
      bookable: reason == null,
      reason: reason ?? undefined,
    });
    const nextStart = addFrequency(cursor.start, opts.frequency);
    const parts = zonedParts(nextStart);
    cursor = slotFromLocal(parts.year, parts.month, parts.day, opts.startMin);
  }

  return planned;
}

/** Bookable subset of a preview plan. */
export function bookableOccurrences(planned: PlannedOccurrence[]): PlannedOccurrence[] {
  return planned.filter((row) => row.bookable);
}

/** True when this order is still waiting and its visit is in the future. */
export function isFuturePendingOrder(
  order: { status: string; slotStart?: Date | string | null },
  now = new Date()
): boolean {
  if (order.status !== "PENDING" || !order.slotStart) return false;
  return new Date(order.slotStart).getTime() > now.getTime();
}

/** Pause and cancel drop future pending visits only; past and in-progress stay. */
export function shouldCancelOnStandingStop(
  order: { status: string; slotStart?: Date | string | null },
  now = new Date()
): boolean {
  return isFuturePendingOrder(order, now);
}

/** Buyer can start a standing job from a completed local visit. */
export function canCreateFromCompletedJob(order: {
  jobType?: string | null;
  status: string;
  buyerId: string;
}, userId: string): boolean {
  return order.jobType === "LOCAL_REQUEST" && order.status === "COMPLETED" && order.buyerId === userId;
}

/** Buyer or assigned daddy can pause or cancel future visits. */
export function canManageStandingJob(
  job: { buyerId: string; sellerId: string },
  userId: string,
  role?: string
): boolean {
  return job.buyerId === userId || job.sellerId === userId || role === "ADMIN";
}

/** Current catalog price for one occurrence; null when the daddy has no list price. */
export function standingPriceFromService(price: QuotePriceInput | null | undefined): StandingServicePrice | null {
  const labor = laborAmount(price ?? {});
  if (labor == null) return null;
  const buyerSupplies = price?.buyerSuppliesMaterials !== false;
  const materials =
    price?.materialsEstimate != null && Number(price.materialsEstimate) > 0
      ? Number(price.materialsEstimate)
      : null;
  const total =
    quoteTotal({
      laborPrice: labor,
      materialsEstimate: materials,
      buyerSuppliesMaterials: buyerSupplies,
    }) ?? labor;
  return {
    laborPrice: labor,
    materialsEstimate: materials,
    buyerSuppliesMaterials: buyerSupplies,
    price: total,
  };
}

/** Each visit is its own order amount — never one combined hold for the series. */
export function occurrenceCharge(price: StandingServicePrice): number {
  return price.price;
}

/** JSON shape for a planned visit in preview and confirm UIs. */
export function serializePlannedOccurrence(row: PlannedOccurrence) {
  return {
    slotStart: row.slotStart.toISOString(),
    slotEnd: row.slotEnd.toISOString(),
    label: row.label,
    bookable: row.bookable,
    reason: row.reason ?? null,
    reasonLabel: row.reason ? skipReasonLabelHe(row.reason) : null,
  };
}

/** Order-create payload for one visit at the current ServicePrice. */
export function occurrenceOrderPayload(row: PlannedOccurrence, price: StandingServicePrice) {
  return {
    slotStart: row.slotStart.toISOString(),
    slotEnd: row.slotEnd.toISOString(),
    price: price.price,
    laborPrice: price.laborPrice,
    materialsEstimate: price.materialsEstimate,
    buyerSuppliesMaterials: price.buyerSuppliesMaterials,
  };
}
