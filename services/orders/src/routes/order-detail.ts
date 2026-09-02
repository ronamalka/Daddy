import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { sendNotification, internalGet, internalPost } from "../../../shared/internal-client";
import { buildNotification } from "../../../shared/notification-templates";
import { prisma } from "../index";
import { OrderStatus } from "../generated/prisma/client";
import { isOpenDisputeStatus } from "../lib/disputes";
import { buyerCancelPatch, sellerDeclinePatch } from "../lib/cancellation";
import { canStartWork } from "../lib/materials";
import { parseDeliveryEvidence } from "../../../shared/delivery-photos";
import { releasePayment } from "../lib/escrow";
import { logger } from "../../../shared/logger";

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:4001";

/**
 * Fire-and-forget WhatsApp notification for an order status change.
 * Calls the users service WhatsApp endpoint via inter-service HTTP.
 */
async function notifyViaWhatsApp(
  order: { id: string; buyerId: string; sellerId: string; title?: string | null; price?: number | null },
  status: string,
): Promise<void> {
  const service = order.title || "הזמנה";
  const notifications: Array<{
    userId: string;
    template: string;
    params: Record<string, string>;
    link: string;
  }> = [];

  switch (status) {
    case "IN_PROGRESS":
      notifications.push({
        userId: order.buyerId,
        template: "order_in_progress",
        params: { "1": service },
        link: `/orders/${order.id}`,
      });
      break;

    case "ON_THE_WAY":
      notifications.push({
        userId: order.buyerId,
        template: "order_on_the_way",
        params: { "1": service },
        link: `/orders/${order.id}`,
      });
      break;

    case "DELIVERED":
      notifications.push({
        userId: order.buyerId,
        template: "order_completed",
        params: { "1": service },
        link: `/orders/${order.id}`,
      });
      break;

    case "COMPLETED":
      notifications.push({
        userId: order.sellerId,
        template: "payment_released",
        params: { "1": order.price ? `₪${order.price}` : "הסכום" },
        link: `/orders/${order.id}`,
      });
      break;

    case "CANCELLED":
      notifications.push(
        {
          userId: order.buyerId,
          template: "order_cancelled",
          params: { "1": service },
          link: `/orders/${order.id}`,
        },
        {
          userId: order.sellerId,
          template: "order_cancelled",
          params: { "1": service },
          link: `/orders/${order.id}`,
        },
      );
      break;
  }

  for (const n of notifications) {
    internalPost(USERS_SERVICE_URL, "/notifications/whatsapp/send", n).catch(() => {});
  }
}

/** Routes for one order: details, status changes, and buyer requirements. */
export const orderDetailRoutes = Router();

/** Get one order if the user is the buyer, the seller, or an admin. */
orderDetailRoutes.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      requirements: true,
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(order);
});

/** Update an order's status using the allowed buyer and seller steps. */
orderDetailRoutes.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { disputes: { select: { status: true } } },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (
    req.user!.role !== "ADMIN" &&
    order.disputes.some((d) => isOpenDisputeStatus(d.status))
  ) {
    res.status(409).json({ error: "לא ניתן לשנות סטטוס בזמן שמחלוקת פתוחה" });
    return;
  }

  const allowed: Record<string, { by: string[]; from: OrderStatus[] }> = {
    IN_PROGRESS: { by: ["seller"], from: ["PENDING"] },
    ON_THE_WAY: { by: ["seller"], from: ["IN_PROGRESS"] },
    DELIVERED: { by: ["seller"], from: ["IN_PROGRESS", "ON_THE_WAY"] },
    COMPLETED: { by: ["buyer"], from: ["DELIVERED"] },
  };

  if (status === "CANCELLED") {
    const isBuyer = order.buyerId === req.user!.id;
    const isSeller = order.sellerId === req.user!.id;
    if (!isBuyer && !isSeller && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const result = isBuyer
      ? buyerCancelPatch({
          status: order.status,
          price: order.price,
          slotStart: order.slotStart,
          slotEnd: order.slotEnd,
          actorId: req.user!.id,
        })
      : sellerDeclinePatch({
          status: order.status,
          actorId: req.user!.id,
        });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: result.data,
    });
    res.json(updated);

    // Notify both parties about the cancellation (fire-and-forget)
    const cancelNote = buildNotification("ORDER_CANCELLED", {
      orderId: id,
      service: order.title || undefined,
    });
    const otherParty = isBuyer ? order.sellerId : order.buyerId;
    sendNotification({ userId: otherParty, ...cancelNote, entityId: id }).catch(() => {});
    sendNotification({ userId: req.user!.id, ...cancelNote, entityId: id }).catch(() => {});

    // WhatsApp notifications for cancellation
    void notifyViaWhatsApp(order, "CANCELLED").catch(() => {});

    return;
  }

  const rule = allowed[status];
  if (!rule) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const isAllowed =
    rule.by.some((role) =>
      (role === "seller" && order.sellerId === req.user!.id) ||
      (role === "buyer" && order.buyerId === req.user!.id)
    ) || req.user!.role === "ADMIN";

  if (!isAllowed || !rule.from.includes(order.status)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (status === "IN_PROGRESS" && !canStartWork(order)) {
    res.status(409).json({ error: "הלקוח צריך לאשר את עדכון החומרים לפני תחילת העבודה" });
    return;
  }

  if (status === "ON_THE_WAY") {
    if (order.slotStart) {
      const slotDay = new Date(order.slotStart).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (slotDay !== today) {
        res.status(400).json({ error: "אפשר לעדכן ״בדרך״ רק ביום הביקור" });
        return;
      }
    }

    const { eta } = req.body;
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        onTheWayAt: new Date(),
        onTheWayEta: typeof eta === "string" && eta.trim() ? eta.trim() : null,
      },
    });
    res.json(updated);

    void notifyViaWhatsApp(order, "ON_THE_WAY").catch(() => {});

    return;
  }

  if (status === "DELIVERED") {
    const evidence = parseDeliveryEvidence(req.body);
    if (!evidence.ok) {
      res.status(400).json({ error: evidence.error });
      return;
    }
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        deliveryPhotos: evidence.value.photos,
        deliveryNote: evidence.value.note,
      },
    });
    res.json(updated);

    // Notify buyer to confirm completion (fire-and-forget)
    const deliverNote = buildNotification("CONFIRM_COMPLETION", { orderId: id });
    sendNotification({ userId: order.buyerId, ...deliverNote, entityId: id }).catch(() => {});

    void notifyViaWhatsApp(order, "DELIVERED").catch(() => {});

    return;
  }

  const updateData: Record<string, unknown> = { status };

  // Record commission when order is marked COMPLETED
  if (status === "COMPLETED") {
    try {
      const { data, status: commStatus } = await internalGet(
        USERS_SERVICE_URL,
        `/sellers/${order.sellerId}/commission`,
      );
      if (commStatus === 200 && data) {
        const commData = data as { rate: number };
        const rate = commData.rate;
        updateData.commissionRate = rate;
        updateData.commissionAmount = Math.round(order.price * rate * 100) / 100;
      }
    } catch (err) {
      logger.error({ err, sellerId: order.sellerId }, "Failed to fetch commission rate");
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  // Auto-release escrow when order is marked COMPLETED
  if (status === "COMPLETED") {
    releasePayment(prisma, id).catch((err) => {
      logger.error({ err, orderId: id }, "Escrow auto-release failed");
    });
  }

  res.json(updated);

  // Fire-and-forget notifications for status transitions
  if (status === "IN_PROGRESS") {
    const note = buildNotification("ORDER_IN_PROGRESS", {
      orderId: id,
      service: order.title || undefined,
    });
    sendNotification({ userId: order.buyerId, ...note, entityId: id }).catch(() => {});
  }

  // WhatsApp notification for the status change
  void notifyViaWhatsApp(order, status).catch(() => {});
});

/** Save the buyer's answers to the gig's requirement questions. */
orderDetailRoutes.post("/:id/requirements", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.buyerId !== req.user!.id) {
    res.status(403).json({ error: "Only the buyer can submit requirements" });
    return;
  }

  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: "Answers are required" });
    return;
  }

  const existing = await prisma.orderRequirement.findMany({ where: { orderId } });
  if (existing.length > 0) {
    await prisma.orderRequirement.deleteMany({ where: { orderId } });
  }

  const created = await prisma.orderRequirement.createMany({
    data: answers.map((a: { requirementId: string; answer: string }) => ({
      orderId,
      requirementId: a.requirementId,
      answer: a.answer,
    })),
  });

  res.status(201).json({ count: created.count });
});
