import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";
import { getPaymentGateway } from "../lib/payment-gateway";
import { releasePayment, refundPayment } from "../lib/escrow";

const gateway = getPaymentGateway();

const VALID_METHODS = ["CARD", "BIT", "CASH"] as const;
type ValidMethod = (typeof VALID_METHODS)[number];

/** Payment routes mounted under /orders */
export const paymentRoutes = Router();

/**
 * POST /orders/:id/pay — Initiate payment (buyer only).
 * CARD/BIT: charge via gateway, hold in escrow.
 * CASH: record as unprotected label (UNPAID).
 */
paymentRoutes.post("/:id/pay", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const method = typeof req.body?.method === "string" ? req.body.method.toUpperCase() : "";

  if (!VALID_METHODS.includes(method as ValidMethod)) {
    res.status(400).json({ error: "שיטת תשלום לא חוקית. בחר CARD, BIT או CASH." });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  if (order.buyerId !== req.user!.id) {
    res.status(403).json({ error: "רק הקונה יכול לשלם" });
    return;
  }

  if (order.status !== "PENDING") {
    res.status(409).json({ error: "אפשר לשלם רק על הזמנה ממתינה" });
    return;
  }

  // Idempotency: check for existing held payment
  const existingPayment = await prisma.payment.findFirst({
    where: { orderId, status: { in: ["HELD", "RELEASED"] } },
  });
  if (existingPayment) {
    res.status(409).json({ error: "כבר קיים תשלום על הזמנה זו", payment: existingPayment });
    return;
  }

  // CASH: just record, no escrow
  if (method === "CASH") {
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: order.price,
        currency: "ILS",
        method: "CASH",
        status: "UNPAID",
      },
    });
    res.status(201).json(payment);
    return;
  }

  // CARD / BIT: charge via gateway
  try {
    const chargeResult = await gateway.createCharge({
      amount: order.price,
      currency: "ILS",
      method,
      orderId,
      buyerEmail: "", // Buyer email not available in order service
    });

    if (chargeResult.status === "failed") {
      const payment = await prisma.payment.create({
        data: {
          orderId,
          amount: order.price,
          currency: "ILS",
          method: method as ValidMethod,
          status: "FAILED",
          gatewayId: chargeResult.gatewayId,
          gatewayResponse: chargeResult.raw as object,
          failureReason: "Gateway returned failed status",
        },
      });
      res.status(402).json({ error: "התשלום נכשל", payment });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: order.price,
        currency: "ILS",
        method: method as ValidMethod,
        status: "HELD",
        gatewayId: chargeResult.gatewayId,
        gatewayResponse: chargeResult.raw as object,
        heldAt: new Date(),
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error("[payments] createCharge error:", err);
    res.status(500).json({ error: "שגיאה בעיבוד התשלום" });
  }
});

/**
 * POST /orders/:id/release — Release escrow to seller.
 * Only when order is COMPLETED.
 */
paymentRoutes.post("/:id/release", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  // Only seller, buyer (confirming), or admin can release
  const isParty = order.buyerId === req.user!.id || order.sellerId === req.user!.id;
  if (!isParty && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "אין הרשאה" });
    return;
  }

  if (order.status !== "COMPLETED") {
    res.status(409).json({ error: "אפשר לשחרר תשלום רק אחרי שההזמנה הושלמה" });
    return;
  }

  const payment = await releasePayment(prisma, orderId);
  if (!payment) {
    res.status(404).json({ error: "לא נמצא תשלום בנאמנות לשחרור" });
    return;
  }

  res.json(payment);
});

/**
 * POST /orders/:id/refund — Refund to buyer (admin only).
 * For dispute resolution. Optional body.amount for partial refund.
 */
paymentRoutes.post("/:id/refund", requireAdmin, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const amount = typeof req.body?.amount === "number" ? req.body.amount : undefined;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  const payment = await refundPayment(prisma, orderId, amount);
  if (!payment) {
    res.status(404).json({ error: "לא נמצא תשלום בנאמנות להחזר" });
    return;
  }

  res.json(payment);
});

/**
 * GET /orders/:id/payment — Get payment status.
 * Buyer, seller, or admin can view.
 */
paymentRoutes.get("/:id/payment", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "אין הרשאה" });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    res.json({ status: "UNPAID", orderId });
    return;
  }

  res.json(payment);
});

/**
 * GET /payments/history — List user's payment history.
 * Returns payments for orders where the user is buyer or seller.
 */
export const paymentHistoryRoutes = Router();

paymentHistoryRoutes.get("/history", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Find all orders where user is buyer or seller
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: { id: true, title: true, price: true, buyerId: true, sellerId: true },
  });

  const orderIds = orders.map((o) => o.id);
  if (orderIds.length === 0) {
    res.json([]);
    return;
  }

  const payments = await prisma.payment.findMany({
    where: { orderId: { in: orderIds } },
    orderBy: { createdAt: "desc" },
  });

  // Enrich payments with order info
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const enriched = payments.map((p) => ({
    ...p,
    order: orderMap.get(p.orderId) ?? null,
  }));

  res.json(enriched);
});
