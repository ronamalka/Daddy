import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";
import {
  canOpenDispute,
  isOpenDisputeStatus,
  parseDisputeInput,
  resolveDisputeAction,
} from "../lib/disputes";
import { DisputeReason, DisputeStatus, PaymentAction, OrderStatus } from "../generated/prisma/client";

/** Open a dispute, list them for admin, and record a staff decision. */
export const disputeRoutes = Router();

/** Create a dispute on an in-progress or delivered order. Buyer or daddy, with optional photos. */
disputeRoutes.post("/:id/disputes", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const parsed = parseDisputeInput(req.body ?? {});
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { disputes: { select: { status: true } } },
  });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  const allowed = canOpenDispute({
    orderStatus: order.status,
    actorId: req.user!.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    hasOpenDispute: order.disputes.some((d) => isOpenDisputeStatus(d.status)),
  });
  if (!allowed.ok) {
    res.status(allowed.status).json({ error: allowed.error });
    return;
  }

  const dispute = await prisma.dispute.create({
    data: {
      orderId,
      openerId: req.user!.id,
      reason: parsed.reason as DisputeReason,
      description: parsed.description,
      photos: parsed.photos,
    },
  });

  res.status(201).json(dispute);
});

/** List disputes on one order for a party or an admin. */
disputeRoutes.get("/:id/disputes", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }
  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const disputes = await prisma.dispute.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  res.json(disputes);
});

/** Admin list of disputes, newest first. Optional ?status=OPEN. */
export const adminDisputeRoutes = Router();

adminDisputeRoutes.get("/disputes", requireAdmin, async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const disputes = await prisma.dispute.findMany({
    where: status ? { status: status as DisputeStatus } : undefined,
    include: {
      order: { select: { id: true, price: true, buyerId: true, sellerId: true, title: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(disputes);
});

/** Apply a staff decision: review, release, refund, split, or close. */
adminDisputeRoutes.patch("/disputes/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!dispute) {
    res.status(404).json({ error: "המחלוקת לא נמצאה" });
    return;
  }
  if (!isOpenDisputeStatus(dispute.status) && req.body?.action !== "review") {
    res.status(409).json({ error: "המחלוקת כבר טופלה" });
    return;
  }

  const resolved = resolveDisputeAction({
    action: req.body?.action,
    orderPrice: dispute.order.price,
    splitBuyerAmount: req.body?.splitBuyerAmount,
  });
  if (!resolved.ok) {
    res.status(400).json({ error: resolved.error });
    return;
  }

  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  const isFinal = resolved.status !== "UNDER_REVIEW";

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.dispute.update({
      where: { id },
      data: {
        status: resolved.status as DisputeStatus,
        paymentAction: (resolved.paymentAction as PaymentAction | null) ?? null,
        splitBuyerAmount: resolved.splitBuyerAmount,
        resolution: note || dispute.resolution,
        resolvedAt: isFinal ? new Date() : dispute.resolvedAt,
        resolvedBy: isFinal ? req.user!.id : dispute.resolvedBy,
      },
      include: {
        order: { select: { id: true, price: true, buyerId: true, sellerId: true, title: true, status: true } },
      },
    });
    if (resolved.orderStatus) {
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: resolved.orderStatus as OrderStatus },
      });
    }
    return next;
  });

  res.json(updated);
});
