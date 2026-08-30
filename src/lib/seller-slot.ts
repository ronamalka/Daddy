import {
  isTwoHourLocalWindow,
  parseSlotIso,
  slotFitsSchedule,
  type TimeOffDate,
  type WeeklyHours,
} from "@/lib/availability";

export type AvailabilityPayload = {
  acceptingJobs?: boolean;
  weeklyHours?: WeeklyHours[];
  timeOff?: TimeOffDate[];
  error?: unknown;
};

export function parseRequiredVisitSlot(slotStart: unknown, slotEnd: unknown) {
  if (typeof slotStart !== "string" || typeof slotEnd !== "string") {
    return { error: "יש לבחור חלון ביקור של שעתיים", status: 400 as const };
  }
  const slot = parseSlotIso(slotStart, slotEnd);
  if (!slot || !isTwoHourLocalWindow(slot.start, slot.end)) {
    return { error: "יש לבחור חלון ביקור של שעתיים", status: 400 as const };
  }
  if (slot.start.getTime() <= Date.now()) {
    return { error: "חלון הביקור חייב להיות בעתיד", status: 400 as const };
  }
  return { slot };
}

export function sellerAvailabilityError(
  availability: AvailabilityPayload | null | undefined,
  slot: { start: Date; end: Date },
  opts?: { requireAccepting?: boolean }
): { error: string; status: number } | null {
  if (!availability || availability.error) {
    return { error: "לא ניתן לבדוק את הזמינות של האבא", status: 400 };
  }
  if (opts?.requireAccepting !== false && availability.acceptingJobs === false) {
    return { error: "האבא לא מקבל עבודות השבוע", status: 400 };
  }
  if (!slotFitsSchedule(slot.start, slot.end, availability.weeklyHours || [], availability.timeOff || [])) {
    return { error: "החלון שבחרת מחוץ לשעות הזמינות", status: 400 };
  }
  return null;
}
