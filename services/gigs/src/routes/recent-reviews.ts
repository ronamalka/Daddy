import { Router, Request, Response } from "express";
import { prisma } from "../index";

/** Routes for recent high ratings shown on the home page. */
export const recentReviewsRoutes = Router();

/** Return the latest reviews with a rating of 4 or higher. */
recentReviewsRoutes.get("/", async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 }, hiddenAt: null },
    select: {
      id: true,
      rating: true,
      comment: true,
      ratingAttitude: true,
      ratingTimeliness: true,
      ratingPrice: true,
      ratingQuality: true,
      userId: true,
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
