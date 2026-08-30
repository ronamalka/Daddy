import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for the current user's favorite gigs. */
export const favoritesRoutes = Router();

/** List the current user's favorite gigs. */
favoritesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      gig: {
        include: {
          category: true,
          tiers: { orderBy: { price: "asc" }, take: 1 },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const gigs = favorites.map((f) => {
    const g = f.gig;
    const avgRating =
      g.reviews.length > 0
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : 0;
    return { ...g, avgRating, reviewCount: g.reviews.length };
  });

  res.json(gigs);
});

/** Add or remove a favorite for this gig. */
favoritesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { gigId } = req.body;
  if (!gigId) {
    res.status(400).json({ error: "gigId required" });
    return;
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_gigId: { userId: req.user!.id, gigId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.json({ favorited: false });
    return;
  }

  await prisma.favorite.create({
    data: { userId: req.user!.id, gigId },
  });

  res.json({ favorited: true });
});
