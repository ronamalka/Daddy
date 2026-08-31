import { describe, it, expect } from "vitest";
import {
  HIGH_RATING_MIN,
  RATING_MAX,
  areTenPointCriteria,
  isLegacyFivePointReview,
  isTenPointRating,
  overallFromCriteria,
  scaleLegacyFivePointReview,
} from "@/lib/review-ratings";
import { migrateReviewScaleAndSeller } from "../../services/gigs/src/lib/review-ratings";

describe("isTenPointRating", () => {
  it("accepts integers from 1 to 10", () => {
    expect(isTenPointRating(1)).toBe(true);
    expect(isTenPointRating(10)).toBe(true);
    expect(isTenPointRating(7)).toBe(true);
  });

  it("rejects the old 1–5 overflow and non-integers", () => {
    expect(isTenPointRating(0)).toBe(false);
    expect(isTenPointRating(11)).toBe(false);
    expect(isTenPointRating(4.5)).toBe(false);
    expect(isTenPointRating("8")).toBe(false);
  });
});

describe("overallFromCriteria", () => {
  it("averages the four Midrag scores", () => {
    expect(overallFromCriteria(10, 9, 8, 10)).toBe(9);
    expect(overallFromCriteria(1, 1, 1, 1)).toBe(1);
  });
});

describe("legacy 1–5 scale-up", () => {
  it("treats a row with overall and criteria ≤ 5 as leftover 1–5", () => {
    expect(
      isLegacyFivePointReview({
        rating: 4,
        ratingAttitude: 5,
        ratingTimeliness: 4,
        ratingPrice: 3,
        ratingQuality: 4,
      })
    ).toBe(true);
  });

  it("leaves seed 1–10 rows alone even when overall is 5", () => {
    expect(
      isLegacyFivePointReview({
        rating: 5,
        ratingAttitude: 4,
        ratingTimeliness: 6,
        ratingPrice: 5,
        ratingQuality: 5,
      })
    ).toBe(false);
  });

  it("doubles overall and present criteria", () => {
    expect(
      scaleLegacyFivePointReview({
        rating: 4,
        ratingAttitude: 5,
        ratingTimeliness: 4,
        ratingPrice: null,
        ratingQuality: 3,
      })
    ).toEqual({
      rating: 8,
      ratingAttitude: 10,
      ratingTimeliness: 8,
      ratingPrice: null,
      ratingQuality: 6,
    });
  });

  it("keeps the high-rating homepage floor on the 1–10 scale", () => {
    expect(HIGH_RATING_MIN).toBe(8);
    expect(RATING_MAX).toBe(10);
  });

  it("requires all four criteria on the 1–10 scale", () => {
    expect(areTenPointCriteria(9, 8, 7, 10)).toBe(true);
    expect(areTenPointCriteria(9, 8, 7, 11)).toBe(false);
  });
});

describe("migrateReviewScaleAndSeller", () => {
  it("doubles leftover 1–5 rows and copies sellerId from the gig", async () => {
    const rows = [
      {
        id: "old",
        rating: 4,
        ratingAttitude: 5,
        ratingTimeliness: 4,
        ratingPrice: 3,
        ratingQuality: 4,
        sellerId: "",
        gigId: "gig-1",
      },
      {
        id: "fresh",
        rating: 9,
        ratingAttitude: 10,
        ratingTimeliness: 8,
        ratingPrice: 9,
        ratingQuality: 9,
        sellerId: "seller-1",
        gigId: "gig-1",
      },
    ];
    const updates: { id: string; data: Record<string, unknown> }[] = [];
    await migrateReviewScaleAndSeller({
      review: {
        findMany: async () => rows,
        update: async ({ where, data }) => {
          updates.push({ id: where.id, data: data as Record<string, unknown> });
          return {};
        },
      },
      gig: {
        findMany: async () => [{ id: "gig-1", sellerId: "seller-1" }],
      },
    });
    expect(updates).toEqual([
      {
        id: "old",
        data: {
          rating: 8,
          ratingAttitude: 10,
          ratingTimeliness: 8,
          ratingPrice: 6,
          ratingQuality: 8,
          sellerId: "seller-1",
        },
      },
    ]);
  });
});
