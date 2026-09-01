import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for one gig, related gigs, seller stats, and favorite counts. */
export const gigDetailRoutes = Router();

/** Return one gig with tiers, reviews, and whether the user favorited it. */
gigDetailRoutes.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      category: true,
      tiers: { orderBy: { price: "asc" } },
      reviews: {
        where: { hiddenAt: null },
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
        orderBy: { createdAt: "desc" },
      },
      images: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      requirements: { orderBy: { order: "asc" } },
      _count: { select: { favorites: true } },
    },
  });

  if (!gig) {
    res.status(404).json({ error: "Gig not found" });
    return;
  }

  const avgRating =
    gig.reviews.length > 0
      ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
      : 0;

  let isFavorited = false;
  if (req.user) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_gigId: { userId: req.user.id, gigId: id } },
    });
    isFavorited = !!fav;
  }

  res.json({
    ...gig,
    avgRating,
    reviewCount: gig.reviews.length,
    favoriteCount: gig._count.favorites,
    isFavorited,
  });
});

/** Update a gig that the current user owns. */
gigDetailRoutes.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const gig = await prisma.gig.findUnique({ where: { id } });
  if (!gig) {
    res.status(404).json({ error: "Gig not found" });
    return;
  }
  if (gig.sellerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { title, description, image, categoryId, tiers, faqs, requirements } = req.body;

  let resolvedCategoryId = categoryId as string | undefined;
  if (resolvedCategoryId) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: resolvedCategoryId }, { slug: resolvedCategoryId }] },
      select: { id: true },
    });
    if (!category) {
      res.status(400).json({ error: "קטגוריה לא נמצאה" });
      return;
    }
    resolvedCategoryId = category.id;
  }

  /** Update the gig and replace tiers, FAQs, and requirements together. */
  await prisma.$transaction(async (tx) => {
    await tx.gig.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(image !== undefined && { image }),
        ...(resolvedCategoryId && { categoryId: resolvedCategoryId }),
      },
    });

    if (tiers?.length) {
      await tx.gigPricingTier.deleteMany({ where: { gigId: id } });
      await tx.gigPricingTier.createMany({
        data: tiers.map((t: { tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }) => ({
          gigId: id,
          tier: t.tier,
          title: t.title,
          description: t.description,
          price: t.price,
          deliveryDays: t.deliveryDays,
          revisions: t.revisions,
        })),
      });
    }

    if (faqs) {
      await tx.gigFaq.deleteMany({ where: { gigId: id } });
      if (faqs.length) {
        await tx.gigFaq.createMany({
          data: faqs.map((f: { question: string; answer: string }, i: number) => ({
            gigId: id,
            question: f.question,
            answer: f.answer,
            order: i,
          })),
        });
      }
    }

    if (requirements) {
      await tx.gigRequirement.deleteMany({ where: { gigId: id } });
      if (requirements.length) {
        await tx.gigRequirement.createMany({
          data: requirements.map((r: { question: string; required: boolean }, i: number) => ({
            gigId: id,
            question: r.question,
            required: r.required ?? true,
            order: i,
          })),
        });
      }
    }
  });

  const full = await prisma.gig.findUnique({
    where: { id },
    include: { tiers: true, category: true, faqs: true, requirements: true },
  });

  res.json(full);
});

/** List a few other gigs in the same category or from the same seller. */
gigDetailRoutes.get("/:id/related", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const gig = await prisma.gig.findUnique({
    where: { id },
    select: { categoryId: true, sellerId: true },
  });

  if (!gig) {
    res.status(404).json({ error: "Gig not found" });
    return;
  }

  const related = await prisma.gig.findMany({
    where: {
      id: { not: id },
      OR: [{ categoryId: gig.categoryId }, { sellerId: gig.sellerId }],
    },
    include: {
      category: true,
      tiers: { orderBy: { price: "asc" }, take: 1 },
      reviews: { where: { hiddenAt: null }, select: { rating: true } },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const result = related.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : 0;
    return { ...g, avgRating, reviewCount: g.reviews.length };
  });

  res.json(result);
});

/** List all gigs for one seller. */
gigDetailRoutes.get("/by-seller/:sellerId", async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId as string;

  const gigs = await prisma.gig.findMany({
    where: { sellerId },
    include: {
      category: true,
      tiers: { orderBy: { price: "asc" }, take: 1 },
      reviews: {
        where: { hiddenAt: null },
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const result = gigs.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : 0;
    return { ...g, avgRating, reviewCount: g.reviews.length };
  });

  res.json(result);
});

/** Return how many gigs exist. */
gigDetailRoutes.get("/stats/counts", async (_req: Request, res: Response) => {
  const count = await prisma.gig.count();
  res.json({ gigs: count });
});

  gigDetailRoutes.get("/favorites/count/:userId", async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const count = await prisma.favorite.count({ where: { userId } });
  res.json({ favoritesCount: count });
});
