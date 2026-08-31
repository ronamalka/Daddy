/** Stored ratings are 1–10 (Midrag-style). The old gigs-service contract was 1–5. */

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const LEGACY_RATING_MAX = 5;
/** Homepage “high rating” floor on the 1–10 scale (was 4 on 1–5). */
export const HIGH_RATING_MIN = 8;

export interface ReviewScoreFields {
  rating: number;
  ratingAttitude?: number | null;
  ratingTimeliness?: number | null;
  ratingPrice?: number | null;
  ratingQuality?: number | null;
}

/** True when `value` is an integer in 1–10 inclusive. */
export function isTenPointRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= RATING_MIN && value <= RATING_MAX;
}

/** True when all four criteria are integers 1–10. */
export function areTenPointCriteria(
  attitude: unknown,
  timeliness: unknown,
  price: unknown,
  quality: unknown
): boolean {
  return [attitude, timeliness, price, quality].every(isTenPointRating);
}

/** Average of the four criteria, rounded to the nearest integer. */
export function overallFromCriteria(
  attitude: number,
  timeliness: number,
  price: number,
  quality: number
): number {
  return Math.round((attitude + timeliness + price + quality) / 4);
}

function isPresentLegacyScore(value: number | null | undefined): boolean {
  return value != null && value >= RATING_MIN && value <= LEGACY_RATING_MAX;
}

/**
 * A leftover 1–5 row: overall is 1–5 and every present criterion is also 1–5.
 * Seed 1–10 rows have at least one criterion above 5, so they are left alone.
 */
export function isLegacyFivePointReview(review: ReviewScoreFields): boolean {
  if (review.rating < RATING_MIN || review.rating > LEGACY_RATING_MAX) return false;
  const criteria = [
    review.ratingAttitude,
    review.ratingTimeliness,
    review.ratingPrice,
    review.ratingQuality,
  ];
  return criteria.every((value) => value == null || isPresentLegacyScore(value));
}

function doubleScore(value: number | null | undefined): number | null {
  if (value == null) return null;
  return value * 2;
}

/** Doubles overall + criteria so a 1–5 row becomes 2–10. */
export function scaleLegacyFivePointReview<T extends ReviewScoreFields>(review: T): T {
  if (!isLegacyFivePointReview(review)) return review;
  return {
    ...review,
    rating: review.rating * 2,
    ratingAttitude: doubleScore(review.ratingAttitude),
    ratingTimeliness: doubleScore(review.ratingTimeliness),
    ratingPrice: doubleScore(review.ratingPrice),
    ratingQuality: doubleScore(review.ratingQuality),
  };
}
