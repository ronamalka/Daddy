import { describe, it, expect } from "vitest";
import { jerusalemLocalToUtc } from "@/lib/availability";
import {
  addFrequency,
  bookableOccurrences,
  canCreateFromCompletedJob,
  canManageStandingJob,
  firstSlotAfter,
  frequencyStepDays,
  occurrenceCharge,
  occurrenceSkipReason,
  planOccurrences,
  shouldCancelOnStandingStop,
  slotToWeekdayAndStart,
  standingPriceFromService,
  horizonGap,
} from "@/lib/standing-job";

const weeklyHours = [
  { dayOfWeek: 0, startMin: 16 * 60, endMin: 20 * 60 },
  { dayOfWeek: 1, startMin: 16 * 60, endMin: 20 * 60 },
  { dayOfWeek: 2, startMin: 16 * 60, endMin: 20 * 60 },
  { dayOfWeek: 3, startMin: 16 * 60, endMin: 20 * 60 },
  { dayOfWeek: 4, startMin: 16 * 60, endMin: 20 * 60 },
];

describe("frequency steps", () => {
  it("keeps monthly on a 4-week weekday cadence", () => {
    expect(frequencyStepDays("WEEKLY")).toBe(7);
    expect(frequencyStepDays("BIWEEKLY")).toBe(14);
    expect(frequencyStepDays("MONTHLY")).toBe(28);
  });

  it("advances a Sunday 16:00 slot by two weeks", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    const next = addFrequency(start, "BIWEEKLY");
    expect(next.toISOString()).toBe(jerusalemLocalToUtc(2026, 9, 13, 16 * 60).toISOString());
  });
});

describe("firstSlotAfter", () => {
  it("picks the next Sunday 16:00 after a Saturday evening", () => {
    const after = jerusalemLocalToUtc(2026, 8, 29, 20 * 60);
    const slot = firstSlotAfter({ weekday: 0, startMin: 16 * 60, after });
    expect(slot.start.toISOString()).toBe(jerusalemLocalToUtc(2026, 8, 30, 16 * 60).toISOString());
  });

  it("skips today's slot when that time has already passed", () => {
    const after = jerusalemLocalToUtc(2026, 8, 30, 17 * 60);
    const slot = firstSlotAfter({ weekday: 0, startMin: 16 * 60, after });
    expect(slot.start.toISOString()).toBe(jerusalemLocalToUtc(2026, 9, 6, 16 * 60).toISOString());
  });
});

describe("planOccurrences", () => {
  const after = jerusalemLocalToUtc(2026, 8, 29, 12 * 60);

  it("returns eight weekly Sunday visits inside hours", () => {
    const planned = planOccurrences({
      frequency: "WEEKLY",
      weekday: 0,
      startMin: 16 * 60,
      after,
      weeklyHours,
      timeOff: [],
      bookedSlots: [],
    });
    const bookable = bookableOccurrences(planned);
    expect(bookable).toHaveLength(8);
    expect(bookable[0].slotStart.toISOString()).toBe(jerusalemLocalToUtc(2026, 8, 30, 16 * 60).toISOString());
    expect(bookable[1].slotStart.toISOString()).toBe(jerusalemLocalToUtc(2026, 9, 6, 16 * 60).toISOString());
  });

  it("marks time-off and overlapping bookings as not bookable", () => {
    const planned = planOccurrences({
      frequency: "WEEKLY",
      weekday: 0,
      startMin: 16 * 60,
      after,
      weeklyHours,
      timeOff: ["2026-08-30"],
      bookedSlots: [
        {
          slotStart: jerusalemLocalToUtc(2026, 9, 6, 16 * 60),
          slotEnd: jerusalemLocalToUtc(2026, 9, 6, 18 * 60),
        },
      ],
      horizon: 2,
      scanLimit: 4,
    });
    expect(planned[0].bookable).toBe(false);
    expect(planned[0].reason).toBe("timeoff");
    expect(planned[1].bookable).toBe(false);
    expect(planned[1].reason).toBe("booked");
  });

  it("skips a weekday the daddy does not work", () => {
    const friday = occurrenceSkipReason(
      {
        start: jerusalemLocalToUtc(2026, 9, 4, 16 * 60),
        end: jerusalemLocalToUtc(2026, 9, 4, 18 * 60),
      },
      { after, weeklyHours, timeOff: [], bookedSlots: [] }
    );
    expect(friday).toBe("hours");
  });
});

describe("pause and cancel keep past visits", () => {
  const now = jerusalemLocalToUtc(2026, 9, 1, 12 * 60);

  it("cancels only future pending orders", () => {
    expect(
      shouldCancelOnStandingStop({ status: "PENDING", slotStart: jerusalemLocalToUtc(2026, 9, 6, 16 * 60) }, now)
    ).toBe(true);
    expect(
      shouldCancelOnStandingStop({ status: "PENDING", slotStart: jerusalemLocalToUtc(2026, 8, 30, 16 * 60) }, now)
    ).toBe(false);
    expect(
      shouldCancelOnStandingStop({ status: "COMPLETED", slotStart: jerusalemLocalToUtc(2026, 9, 6, 16 * 60) }, now)
    ).toBe(false);
    expect(
      shouldCancelOnStandingStop({ status: "IN_PROGRESS", slotStart: jerusalemLocalToUtc(2026, 9, 6, 16 * 60) }, now)
    ).toBe(false);
  });
});

describe("who can start or manage a standing job", () => {
  it("lets the buyer create from a completed local job", () => {
    expect(
      canCreateFromCompletedJob(
        { jobType: "LOCAL_REQUEST", status: "COMPLETED", buyerId: "buyer-1" },
        "buyer-1"
      )
    ).toBe(true);
    expect(
      canCreateFromCompletedJob(
        { jobType: "LOCAL_REQUEST", status: "DELIVERED", buyerId: "buyer-1" },
        "buyer-1"
      )
    ).toBe(false);
    expect(
      canCreateFromCompletedJob({ jobType: "GIG", status: "COMPLETED", buyerId: "buyer-1" }, "buyer-1")
    ).toBe(false);
  });

  it("lets either party pause or cancel", () => {
    const job = { buyerId: "buyer-1", sellerId: "seller-1" };
    expect(canManageStandingJob(job, "buyer-1")).toBe(true);
    expect(canManageStandingJob(job, "seller-1")).toBe(true);
    expect(canManageStandingJob(job, "stranger")).toBe(false);
  });
});

describe("price at generation time", () => {
  it("uses the current ServicePrice and charges each visit separately", () => {
    const first = standingPriceFromService({ price: 120, buyerSuppliesMaterials: true });
    const later = standingPriceFromService({
      laborPrice: 150,
      materialsEstimate: 40,
      buyerSuppliesMaterials: false,
    });
    expect(first).toEqual({
      laborPrice: 120,
      materialsEstimate: null,
      buyerSuppliesMaterials: true,
      price: 120,
    });
    expect(later?.price).toBe(190);
    expect(occurrenceCharge(later!)).toBe(190);
    expect(occurrenceCharge(first!) + occurrenceCharge(later!)).toBe(310);
  });

  it("only fills the remaining horizon, never a second full batch", () => {
    expect(horizonGap(8)).toBe(0);
    expect(horizonGap(6)).toBe(2);
    expect(horizonGap(0)).toBe(8);
  });

  it("returns null when the daddy has no list price", () => {
    expect(standingPriceFromService(null)).toBeNull();
    expect(standingPriceFromService({ price: 0 })).toBeNull();
  });
});

describe("slotToWeekdayAndStart", () => {
  it("reads Sunday 16:00 Jerusalem from the UTC instant", () => {
    const start = jerusalemLocalToUtc(2026, 8, 30, 16 * 60);
    expect(slotToWeekdayAndStart(start)).toEqual({ weekday: 0, startMin: 16 * 60 });
  });
});
