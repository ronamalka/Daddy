export function slotsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function parseRequiredSlot(slotStart: unknown, slotEnd: unknown): { start: Date; end: Date } | null {
  if (typeof slotStart !== "string" || typeof slotEnd !== "string") return null;
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return { start, end };
}
