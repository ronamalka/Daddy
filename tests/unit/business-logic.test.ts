import { describe, it, expect } from "vitest";

describe("Average Rating Calculation", () => {
  function calcAvgRating(reviews: { rating: number }[]): number {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }

  it("returns 0 for no reviews", () => {
    expect(calcAvgRating([])).toBe(0);
  });

  it("calculates average correctly", () => {
    const reviews = [{ rating: 10 }, { rating: 8 }, { rating: 9 }];
    expect(calcAvgRating(reviews)).toBe(9);
  });

  it("handles single review", () => {
    expect(calcAvgRating([{ rating: 10 }])).toBe(10);
  });

  it("handles decimal averages", () => {
    const reviews = [{ rating: 9 }, { rating: 10 }];
    expect(calcAvgRating(reviews)).toBe(9.5);
  });
});

describe("Order Status Transitions", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["COMPLETED", "IN_PROGRESS"],
    COMPLETED: [],
    CANCELLED: [],
  };

  function canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  it("PENDING -> IN_PROGRESS is valid", () => {
    expect(canTransition("PENDING", "IN_PROGRESS")).toBe(true);
  });

  it("PENDING -> CANCELLED is valid", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("PENDING -> COMPLETED is invalid", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
  });

  it("IN_PROGRESS -> DELIVERED is valid", () => {
    expect(canTransition("IN_PROGRESS", "DELIVERED")).toBe(true);
  });

  it("COMPLETED -> anything is invalid", () => {
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("COMPLETED", "PENDING")).toBe(false);
  });

  it("CANCELLED -> anything is invalid", () => {
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "IN_PROGRESS")).toBe(false);
  });
});

describe("Price Tier Sorting", () => {
  const TIER_ORDER = ["BASIC", "STANDARD", "PREMIUM"];

  function sortTiers<T extends { tier: string }>(tiers: T[]): T[] {
    return [...tiers].sort(
      (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
    );
  }

  it("sorts tiers in correct order", () => {
    const tiers = [
      { tier: "PREMIUM", price: 100 },
      { tier: "BASIC", price: 25 },
      { tier: "STANDARD", price: 50 },
    ];
    const sorted = sortTiers(tiers);
    expect(sorted.map((t) => t.tier)).toEqual(["BASIC", "STANDARD", "PREMIUM"]);
  });

  it("handles single tier", () => {
    const tiers = [{ tier: "STANDARD", price: 50 }];
    expect(sortTiers(tiers)).toEqual(tiers);
  });
});

describe("Role-Based Filtering", () => {
  function buildOrderFilter(userId: string) {
    return { OR: [{ sellerId: userId }, { buyerId: userId }] };
  }

  it("returns orders the user sells or buys", () => {
    expect(buildOrderFilter("seller-1")).toEqual({
      OR: [{ sellerId: "seller-1" }, { buyerId: "seller-1" }],
    });
  });
});
