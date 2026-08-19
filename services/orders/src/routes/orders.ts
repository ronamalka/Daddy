import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

export const ordersRoutes = Router();

ordersRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const where =
    req.user!.role === "SELLER"
      ? { sellerId: req.user!.id }
      : { buyerId: req.user!.id };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

ordersRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { gigId, sellerId, tier, price, deliveryDays } = req.body;

  if (!gigId || !sellerId || !tier || !price) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (sellerId === req.user!.id) {
    res.status(400).json({ error: "Cannot order your own gig" });
    return;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (deliveryDays || 7));

  const order = await prisma.order.create({
    data: {
      gigId,
      buyerId: req.user!.id,
      sellerId,
      tier,
      price,
      dueDate,
    },
  });

  res.status(201).json(order);
});

ordersRoutes.get("/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [ordersBuyer, ordersSeller] = await Promise.all([
    prisma.order.count({ where: { buyerId: userId } }),
    prisma.order.count({ where: { sellerId: userId } }),
  ]);

  res.json({ ordersBuyer, ordersSeller, totalOrders: ordersBuyer + ordersSeller });
});

ordersRoutes.get("/stats/admin", async (_req: Request, res: Response) => {
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
