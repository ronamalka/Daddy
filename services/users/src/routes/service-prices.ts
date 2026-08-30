import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for a seller's prices per service. */
export const servicePricesRoutes = Router();

/** List the current user's service prices. */
servicePricesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const prices = await prisma.servicePrice.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json(prices);
});

/** Replace the current user's service prices. */
servicePricesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { prices } = req.body;

  if (!Array.isArray(prices)) {
    res.status(400).json({ error: "Invalid prices format" });
    return;
  }

  await prisma.servicePrice.deleteMany({ where: { userId } });

  if (prices.length > 0) {
    await prisma.servicePrice.createMany({
      data: prices
        .filter((p: { serviceSlug: string; price: number }) => p.serviceSlug && p.price > 0)
        .map((p: { serviceSlug: string; price: number; description?: string }) => ({
          userId,
          serviceSlug: p.serviceSlug,
          price: Number(p.price),
          description: p.description || null,
        })),
    });
  }

  const saved = await prisma.servicePrice.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  res.json(saved);
});
