import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import { parseRequiredSlot } from "../lib/slots";

export const ordersRoutes = Router();

ordersRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const where =
    req.user!.role === "SELLER"
      ? { sellerId: req.user!.id }
      : { buyerId: req.user!.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      requirements: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

ordersRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { gigId, sellerId, tier, price, slotStart, slotEnd } = req.body;

  if (!gigId || !sellerId || !tier || !price) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (sellerId === req.user!.id) {
    res.status(400).json({ error: "Cannot order your own gig" });
    return;
  }

  const slot = parseRequiredSlot(slotStart, slotEnd);
  if (!slot) {
    res.status(400).json({ error: "A 2-hour visit window is required" });
    return;
  }

  if (slot.start.getTime() <= Date.now()) {
    res.status(400).json({ error: "Visit window must be in the future" });
    return;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const conflict = await tx.order.findFirst({
        where: {
          sellerId,
          status: { not: "CANCELLED" },
          slotStart: { lt: slot.end },
          slotEnd: { gt: slot.start },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new Error("SLOT_CONFLICT");
      }

      return tx.order.create({
        data: {
          gigId,
          buyerId: req.user!.id,
          sellerId,
          tier,
          price,
          dueDate: slot.end,
          slotStart: slot.start,
          slotEnd: slot.end,
        },
      });
    });

    res.status(201).json(order);
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_CONFLICT") {
      res.status(409).json({ error: "That visit window is already booked" });
      return;
    }
    throw err;
  }
});

ordersRoutes.get("/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [ordersBuyer, ordersSeller] = await Promise.all([
    prisma.order.count({ where: { buyerId: userId } }),
    prisma.order.count({ where: { sellerId: userId } }),
  ]);

  res.json({ ordersBuyer, ordersSeller, totalOrders: ordersBuyer + ordersSeller });
});

ordersRoutes.get("/stats/admin", requireAuth, async (_req: Request, res: Response) => {
  const orderCount = await prisma.order.count();

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    select: { price: true },
  });

  const revenue = completedOrders.reduce((sum, o) => sum + o.price, 0);

  res.json({ orders: orderCount, revenue });
});

ordersRoutes.get("/count-by-seller/:sellerId", async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId as string;
  const count = await prisma.order.count({
    where: { sellerId, status: "COMPLETED" },
  });
  res.json({ completedOrders: count });
});

ordersRoutes.get("/booked-slots/:sellerId", async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId as string;
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : new Date();
  const to =
    typeof req.query.to === "string"
      ? new Date(req.query.to)
      : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    res.status(400).json({ error: "Invalid date range" });
    return;
  }

  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      status: { not: "CANCELLED" },
      slotStart: { lt: to },
      slotEnd: { gt: from },
    },
    select: { slotStart: true, slotEnd: true },
    orderBy: { slotStart: "asc" },
  });

  res.json(
    orders
      .filter((row) => row.slotStart && row.slotEnd)
      .map((row) => ({ slotStart: row.slotStart, slotEnd: row.slotEnd }))
  );
});
