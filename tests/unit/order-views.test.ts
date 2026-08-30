import { describe, it, expect } from "vitest";
import { jerusalemLocalToUtc } from "@/lib/availability";
import {
  formatMonthHeading,
  groupJobsByJerusalemDay,
  isCalendarJob,
  jerusalemMonthGrid,
  shiftMonth,
  sideOfOrder,
  splitOrdersForUser,
} from "@/lib/order-views";
import { orderListWhere } from "../../services/orders/src/lib/order-list";

const seller = "seed-user-seller1";
const buyer = "seed-user-buyer1";

function job(overrides: Record<string, unknown> = {}) {
  const start = jerusalemLocalToUtc(2026, 9, 1, 16 * 60);
  const end = jerusalemLocalToUtc(2026, 9, 1, 18 * 60);
  return {
    id: "ord-x",
    buyerId: buyer,
    sellerId: seller,
    status: "IN_PROGRESS",
    slotStart: start.toISOString(),
    slotEnd: end.toISOString(),
    ...overrides,
  };
}

describe("orderListWhere", () => {
  it("includes both sides of the marketplace for one user", () => {
    expect(orderListWhere(seller)).toEqual({
      OR: [{ sellerId: seller }, { buyerId: seller }],
    });
  });
});

describe("sideOfOrder / splitOrdersForUser", () => {
  it("classifies a closed gig as seller work", () => {
    expect(sideOfOrder(job(), seller)).toBe("SELLER");
    expect(sideOfOrder(job(), buyer)).toBe("BUYER");
  });

  it("splits a dad's closed jobs from services he ordered", () => {
    const selling = job({ id: "s1" });
    const buying = job({ id: "b1", buyerId: seller, sellerId: "seed-user-seller2" });
    const { selling: sellList, buying: buyList } = splitOrdersForUser([selling, buying], seller);
    expect(sellList.map((o) => o.id)).toEqual(["s1"]);
    expect(buyList.map((o) => o.id)).toEqual(["b1"]);
  });
});

describe("seller calendar grouping", () => {
  it("groups booked visits by Jerusalem day and skips cancelled", () => {
    const monday = job({ id: "mon" });
    const tuesday = job({
      id: "tue",
      slotStart: jerusalemLocalToUtc(2026, 9, 2, 16 * 60).toISOString(),
      slotEnd: jerusalemLocalToUtc(2026, 9, 2, 18 * 60).toISOString(),
    });
    const cancelled = job({ id: "nope", status: "CANCELLED" });
    const grouped = groupJobsByJerusalemDay([monday, tuesday, cancelled]);
    expect([...grouped.keys()]).toEqual(["2026-09-01", "2026-09-02"]);
    expect(grouped.get("2026-09-01")?.map((o) => o.id)).toEqual(["mon"]);
  });

  it("rejects jobs without a visit window", () => {
    expect(isCalendarJob(job({ slotStart: null, slotEnd: null }))).toBe(false);
  });

  it("builds a Sunday-first August 2026 grid", () => {
    const cells = jerusalemMonthGrid(2026, 8);
    expect(cells[0]?.date).toBe("2026-07-26");
    expect(cells.find((c) => c.date === "2026-08-30" && c.inMonth)?.day).toBe(30);
    expect(cells.length % 7).toBe(0);
  });

  it("shifts months and formats Hebrew headings", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(formatMonthHeading(2026, 9)).toBe("ספטמבר 2026");
  });
});
