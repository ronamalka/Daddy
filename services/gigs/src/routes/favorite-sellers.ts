import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for the current user's favorite sellers. */
export const favoriteSellerRoutes = Router();

/** List the current user's favorite seller IDs. */
favoriteSellerRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const favorites = await prisma.favoriteSeller.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });

  res.json(favorites);
});

/** Add or remove a favorite seller (toggle). */
favoriteSellerRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { sellerId } = req.body;
  if (!sellerId) {
    res.status(400).json({ error: "sellerId required" });
    return;
  }

  const existing = await prisma.favoriteSeller.findUnique({
    where: { userId_sellerId: { userId: req.user!.id, sellerId } },
  });

  if (existing) {
    await prisma.favoriteSeller.delete({ where: { id: existing.id } });
    res.json({ favorited: false });
    return;
  }

  await prisma.favoriteSeller.create({
    data: { userId: req.user!.id, sellerId },
  });

  res.json({ favorited: true });
});

/** Check whether the current user has favorited a specific seller. */
favoriteSellerRoutes.get("/check", requireAuth, async (req: Request, res: Response) => {
  const sellerId = req.query.sellerId as string | undefined;
  if (!sellerId) {
    res.status(400).json({ error: "sellerId query param required" });
    return;
  }

  const existing = await prisma.favoriteSeller.findUnique({
    where: { userId_sellerId: { userId: req.user!.id, sellerId } },
  });

  res.json({ favorited: Boolean(existing) });
});
