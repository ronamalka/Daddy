import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { HIGH_RATING_MIN } from "../lib/review-ratings";

/** Routes for recent high ratings shown on the home page. */
export const recentReviewsRoutes = Router();

/** Return the latest reviews at or above the 1–10 high-rating floor. */
recentReviewsRoutes.get("/", async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: HIGH_RATING_MIN }, hiddenAt: null },
    select: {
      id: true,
      rating: true,
      comment: true,
      ratingAttitude: true,
      ratingTimeliness: true,
      ratingPrice: true,
      ratingQuality: true,
      userId: true,
      sellerId: true,
      createdAt: true,
      gig: {
        select: {
          title: true,
          sellerId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  res.json(reviews);
});
