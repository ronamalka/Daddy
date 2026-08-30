import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for creating reviews, looking them up, flagging, and seller replies. */
export const reviewsRoutes = Router();

/** Get the review for one order, if it exists. */
reviewsRoutes.get("/by-order/:orderId", async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;

  const review = await prisma.review.findUnique({
    where: { orderId },
    select: {
      id: true,
      rating: true,
      comment: true,
      ratingAttitude: true,
      ratingTimeliness: true,
      ratingPrice: true,
      ratingQuality: true,
      sellerResponse: true,
      sellerResponseAt: true,
      userId: true,
      createdAt: true,
    },
  });

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json(review);
});

/** Flag a review as a problem, unless it is the user's own review. */
reviewsRoutes.post("/:id/flag", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;

  if (!reason?.trim()) {
    res.status(400).json({ error: "Reason is required" });
    return;
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (review.userId === req.user!.id) {
    res.status(400).json({ error: "Cannot flag your own review" });
    return;
  }

  const existing = await prisma.reviewFlag.findUnique({
    where: { reviewId_userId: { reviewId: id, userId: req.user!.id } },
  });
  if (existing) {
    res.status(409).json({ error: "Already flagged" });
    return;
  }

  const flag = await prisma.reviewFlag.create({
    data: {
      reviewId: id,
      userId: req.user!.id,
      reason,
    },
  });

  res.status(201).json(flag);
});

/** Let the gig's seller reply to a review once. */
reviewsRoutes.post("/:id/respond", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const review = await prisma.review.findUnique({
    where: { id },
    include: { gig: { select: { sellerId: true } } },
  });

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (review.gig.sellerId !== req.user!.id) {
    res.status(403).json({ error: "Only the seller can respond" });
    return;
  }

  if (review.sellerResponse) {
    res.status(409).json({ error: "Already responded" });
    return;
  }

  const { response } = req.body;
  if (!response?.trim()) {
    res.status(400).json({ error: "Response text required" });
    return;
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { sellerResponse: response, sellerResponseAt: new Date() },
  });

  res.json(updated);
});

/** Create a review for a completed order. */
reviewsRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { orderId, gigId, rating, comment, ratingAttitude, ratingTimeliness, ratingPrice, ratingQuality } = req.body;

  if (!orderId || !gigId || !rating || !comment) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const subRatings = [ratingAttitude, ratingTimeliness, ratingPrice, ratingQuality];
  for (const r of subRatings) {
    if (r !== undefined && r !== null && (typeof r !== "number" || r < 1 || r > 5)) {
      res.status(400).json({ error: "Sub-ratings must be between 1 and 5" });
      return;
    }
  }

  if (typeof comment !== "string" || comment.trim().length === 0 || comment.length > 2000) {
    res.status(400).json({ error: "Comment must be between 1 and 2000 characters" });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) {
    res.status(409).json({ error: "Review already exists for this order" });
    return;
  }

  const review = await prisma.review.create({
    data: {
      orderId,
      gigId,
      userId: req.user!.id,
      rating,
      comment: comment.trim(),
      ratingAttitude: ratingAttitude ?? null,
      ratingTimeliness: ratingTimeliness ?? null,
      ratingPrice: ratingPrice ?? null,
      ratingQuality: ratingQuality ?? null,
    },
  });

  res.status(201).json(review);
});
