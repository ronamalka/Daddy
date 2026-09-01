import {
  isLegacyFivePointReview,
  scaleLegacyFivePointReview,
} from "../../../shared/review-ratings";

export {
  HIGH_RATING_MIN,
  RATING_MAX,
  RATING_MIN,
  areTenPointCriteria,
  isTenPointRating,
  overallFromCriteria,
} from "../../../shared/review-ratings";

type ReviewScaleRow = {
  id: string;
  rating: number;
  ratingAttitude: number | null;
  ratingTimeliness: number | null;
  ratingPrice: number | null;
  ratingQuality: number | null;
};

type GigSellerRow = { id: string; sellerId: string };

/** Prisma subset used to migrate leftover 1–5 rows and fill sellerId from the gig. */
export interface ReviewMigrationDb {
  review: {
    findMany: (args: {
      select: {
        id: true;
        rating: true;
        ratingAttitude: true;
        ratingTimeliness: true;
        ratingPrice: true;
        ratingQuality: true;
        sellerId: true;
        gigId: true;
      };
    }) => Promise<
      (ReviewScaleRow & { sellerId: string; gigId: string | null })[]
    >;
    update: (args: {
      where: { id: string };
      data: Partial<ReviewScaleRow> & { sellerId?: string };
    }) => Promise<unknown>;
  };
  gig: {
    findMany: (args: {
      where: { id: { in: string[] } };
      select: { id: true; sellerId: true };
    }) => Promise<GigSellerRow[]>;
  };
}

/**
 * Doubles leftover 1–5 scores and copies gig.sellerId onto reviews that still
 * have an empty sellerId. Safe to run on every seed: 1–10 rows are unchanged.
 */
export async function migrateReviewScaleAndSeller(db: ReviewMigrationDb): Promise<void> {
  const rows = await db.review.findMany({
    select: {
      id: true,
      rating: true,
      ratingAttitude: true,
      ratingTimeliness: true,
      ratingPrice: true,
      ratingQuality: true,
      sellerId: true,
      gigId: true,
    },
  });

  const gigIds = [...new Set(rows.map((row) => row.gigId).filter((id): id is string => Boolean(id)))];
  const gigs = gigIds.length
    ? await db.gig.findMany({
        where: { id: { in: gigIds } },
        select: { id: true, sellerId: true },
      })
    : [];
  const sellerByGig = new Map(gigs.map((gig) => [gig.id, gig.sellerId]));

  for (const row of rows) {
    const scaled = isLegacyFivePointReview(row) ? scaleLegacyFivePointReview(row) : row;
    const sellerId = row.sellerId || (row.gigId ? sellerByGig.get(row.gigId) : undefined) || "";
    const scaleChanged = scaled.rating !== row.rating;
    const sellerChanged = sellerId !== "" && sellerId !== row.sellerId;
    if (!scaleChanged && !sellerChanged) continue;
    await db.review.update({
      where: { id: row.id },
      data: {
        ...(scaleChanged
          ? {
              rating: scaled.rating,
              ratingAttitude: scaled.ratingAttitude,
              ratingTimeliness: scaled.ratingTimeliness,
              ratingPrice: scaled.ratingPrice,
              ratingQuality: scaled.ratingQuality,
            }
          : {}),
        ...(sellerChanged ? { sellerId } : {}),
      },
    });
  }
}
