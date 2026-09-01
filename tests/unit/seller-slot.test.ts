import { describe, it, expect } from "vitest";
import { parseRequiredVisitSlot, sellerAvailabilityError } from "@/lib/seller-slot";

describe("parseRequiredVisitSlot", () => {
  it("rejects missing or invalid windows", () => {
    expect(parseRequiredVisitSlot("", "").error).toBeDefined();
    expect(parseRequiredVisitSlot("nope", "nope").error).toBeDefined();
  });

  it("rejects a past window", () => {
    const start = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const result = parseRequiredVisitSlot(start.toISOString(), end.toISOString());
    expect("error" in result).toBe(true);
  });
});

describe("sellerAvailabilityError", () => {
  const futureStart = new Date("2030-01-06T14:00:00.000Z");
  const futureEnd = new Date("2030-01-06T16:00:00.000Z");

  it("blocks when the daddy paused new jobs", () => {
    const result = sellerAvailabilityError(
      { acceptingJobs: false, weeklyHours: [], timeOff: [] },
      { start: futureStart, end: futureEnd }
    );
    expect(result?.error).toMatch(/לא מקבל/);
  });

  it("allows a paused daddy when requireAccepting is false", () => {
    const result = sellerAvailabilityError(
      {
        acceptingJobs: false,
        weeklyHours: [{ dayOfWeek: 0, startMin: 0, endMin: 24 * 60 }],
        timeOff: [],
      },
      { start: futureStart, end: futureEnd },
      { requireAccepting: false }
    );
    expect(result).toBeNull();
  });
});
