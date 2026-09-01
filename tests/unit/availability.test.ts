import { describe, it, expect } from "vitest";
import {
  generateAvailableSlots,
  isTwoHourLocalWindow,
  jerusalemLocalToUtc,
  slotFitsSchedule,
  slotsOverlap,
  formatVisitWindow,
} from "@/lib/availability";

describe("jerusalemLocalToUtc", () => {
  it("converts summer IDT (UTC+3) correctly", () => {
    const utc = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    expect(utc.toISOString()).toBe("2026-08-30T13:00:00.000Z");
  });

  it("converts winter IST (UTC+2) correctly", () => {
    const utc = jerusalemLocalToUtc(2026, 12, 1, 16 * 60);
    expect(utc.toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });
});

describe("isTwoHourLocalWindow", () => {
  it("accepts a 2-hour Israel afternoon window", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    expect(isTwoHourLocalWindow(start, end)).toBe(true);
  });

  it("rejects a 1-hour window", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 17 * 60);
    expect(isTwoHourLocalWindow(start, end)).toBe(false);
  });

  it("rejects windows that cross midnight", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 23 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 31, 1 * 60);
    expect(isTwoHourLocalWindow(start, end)).toBe(false);
  });
});

describe("slotsOverlap", () => {
  const aStart = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
  const aEnd = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);

  it("detects overlapping windows", () => {
    const bStart = jerusalemLocalToUtc(2026, 8, 30, 17 * 60);
    const bEnd = jerusalemLocalToUtc(2026, 8, 30, 19 * 60);
    expect(slotsOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
  });

  it("allows back-to-back windows", () => {
    const bStart = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    const bEnd = jerusalemLocalToUtc(2026, 8, 30, 20 * 60);
    expect(slotsOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
  });

  it("allows a window on a different day", () => {
    const bStart = jerusalemLocalToUtc(2026, 8, 31, 16 * 60);
    const bEnd = jerusalemLocalToUtc(2026, 8, 31, 18 * 60);
    expect(slotsOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
  });
});

describe("slotFitsSchedule", () => {
  const weeklyHours = [
    { dayOfWeek: 0, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 5, startMin: 8 * 60, endMin: 13 * 60 },
  ];

  it("accepts Sunday 16:00–18:00 inside Sun–Thu hours", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(true);
  });

  it("accepts Sunday 18:00–20:00 when hours end at 20:00", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 20 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(true);
  });

  it("rejects a window past closing time", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 19 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 21 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(false);
  });

  it("accepts Friday 11:00–13:00", () => {
    const start = jerusalemLocalToUtc(2026, 9, 4, 11 * 60);
    const end = jerusalemLocalToUtc(2026, 9, 4, 13 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(true);
  });

  it("rejects Friday 12:00–14:00 when Friday ends at 13:00", () => {
    const start = jerusalemLocalToUtc(2026, 9, 4, 12 * 60);
    const end = jerusalemLocalToUtc(2026, 9, 4, 14 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(false);
  });

  it("rejects a time-off date", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [{ date: "2026-08-30" }])).toBe(false);
  });

  it("rejects Saturday when no hours are set", () => {
    const start = jerusalemLocalToUtc(2026, 8, 29, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 29, 18 * 60);
    expect(slotFitsSchedule(start, end, weeklyHours, [])).toBe(false);
  });
});

describe("generateAvailableSlots", () => {
  const weeklyHours = [
    { dayOfWeek: 0, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 5, startMin: 8 * 60, endMin: 13 * 60 },
  ];

  it("skips booked and time-off slots and only emits 2-hour windows", () => {
    const now = jerusalemLocalToUtc(2026, 8, 30, 10 * 60);
    const bookedStart = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const bookedEnd = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);

    const slots = generateAvailableSlots({
      weeklyHours,
      timeOff: [{ date: "2026-09-04" }],
      bookedSlots: [{ slotStart: bookedStart, slotEnd: bookedEnd }],
      now,
      days: 7,
    });

    expect(slots.every((slot) => isTwoHourLocalWindow(slot.slotStart, slot.slotEnd))).toBe(true);
    expect(slots.some((slot) => slot.date === "2026-08-30" && slot.startMin === 16 * 60)).toBe(false);
    expect(slots.some((slot) => slot.date === "2026-08-30" && slot.startMin === 18 * 60)).toBe(true);
    expect(slots.some((slot) => slot.date === "2026-09-04")).toBe(false);
  });
});

describe("formatVisitWindow", () => {
  it("formats a Hebrew visit window", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const end = jerusalemLocalToUtc(2026, 8, 30, 18 * 60);
    expect(formatVisitWindow(start, end)).toBe("יום ראשון, 30.8 · 16:00–18:00");
  });
});
