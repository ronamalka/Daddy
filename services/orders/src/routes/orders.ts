import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin, requireInternal } from "../../../shared/middleware";
import { sendNotification } from "../../../shared/internal-client";
import { buildNotification } from "../../../shared/notification-templates";
import { prisma } from "../index";
import { parseRequiredSlot } from "../lib/slots";
import { orderListWhere } from "../lib/order-list";
import { laborAmount, quoteTotal } from "../lib/quote-price";

/** Routes for listing orders, creating them, and reading booking stats. */
export const ordersRoutes = Router();

/** List the current user's orders. */
ordersRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: orderListWhere(req.user!.id),
    include: {
      requirements: true,
      disputes: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

/** Create a gig order or a local-request order with a visit window. */
ordersRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const jobType = req.body.jobType === "LOCAL_REQUEST" ? "LOCAL_REQUEST" : "GIG";
  const {
    gigId,
    sellerId,
    tier,
    price,
    laborPrice,
    materialsEstimate,
    buyerSuppliesMaterials,
    slotStart,
    slotEnd,
    title,
    requestId,
  } = req.body;

  const labor = laborAmount({ laborPrice, price });
  if (!sellerId || labor == null) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const buyerSupplies = buyerSuppliesMaterials !== false;
  const materials =
    materialsEstimate != null && Number(materialsEstimate) > 0 ? Number(materialsEstimate) : null;
  const total = quoteTotal({
    laborPrice: labor,
    materialsEstimate: materials,
    buyerSuppliesMaterials: buyerSupplies,
  }) ?? labor;

  if (jobType === "GIG" && (!gigId || !tier)) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (jobType === "LOCAL_REQUEST" && !String(title || "").trim()) {
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
    /** Create the order only if the visit window is free. */
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
          jobType,
          gigId: jobType === "GIG" ? gigId : null,
          requestId: jobType === "LOCAL_REQUEST" ? requestId || null : null,
          title: jobType === "LOCAL_REQUEST" ? String(title).trim() : null,
          buyerId: req.user!.id,
          sellerId,
          tier: jobType === "GIG" ? tier : null,
          price: total,
          laborPrice: jobType === "LOCAL_REQUEST" ? labor : null,
          materialsEstimate: jobType === "LOCAL_REQUEST" ? materials : null,
          buyerSuppliesMaterials: jobType === "LOCAL_REQUEST" ? buyerSupplies : true,
          dueDate: slot.end,
          slotStart: slot.start,
          slotEnd: slot.end,
        },
      });
    });

    res.status(201).json(order);

    // Notify seller about the new order (fire-and-forget)
    const note = buildNotification("ORDER_BOOKED", {
      orderId: order.id,
      service: order.title || undefined,
      price: order.price,
      date: order.slotStart ? order.slotStart.toLocaleDateString("he-IL") : undefined,
    });
    sendNotification({ userId: sellerId, ...note, entityId: order.id }).catch(() => {});
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_CONFLICT") {
      res.status(409).json({ error: "That visit window is already booked" });
      return;
    }
    throw err;
  }
});

/** Return how many orders this user has as buyer and as seller. */
ordersRoutes.get("/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [ordersBuyer, ordersSeller] = await Promise.all([
    prisma.order.count({ where: { buyerId: userId } }),
    prisma.order.count({ where: { sellerId: userId } }),
  ]);

  res.json({ ordersBuyer, ordersSeller, totalOrders: ordersBuyer + ordersSeller });
});

/** Return platform-wide order count and completed-order revenue. */
ordersRoutes.get("/stats/admin", requireAdmin, async (_req: Request, res: Response) => {
  const orderCount = await prisma.order.count();

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    select: { price: true },
  });

  const revenue = completedOrders.reduce((sum, o) => sum + o.price, 0);

  res.json({ orders: orderCount, revenue });
});

/** Count completed orders for one seller. Pass ?since=ISO_DATE to filter by date. */
ordersRoutes.get("/count-by-seller/:sellerId", requireInternal, async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId as string;
  const since = typeof req.query.since === "string" ? req.query.since : null;

  const where: { sellerId: string; status: "COMPLETED"; createdAt?: { gte: Date } } = {
    sellerId,
    status: "COMPLETED",
  };

  if (since) {
    const sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) {
      res.status(400).json({ error: "Invalid since date" });
      return;
    }
    where.createdAt = { gte: sinceDate };
  }

  const count = await prisma.order.count({ where });
  res.json({ completedOrders: count });
});

/** List a seller's booked visit windows in a date range. */
ordersRoutes.get("/booked-slots/:sellerId", requireInternal, async (req: Request, res: Response) => {
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
