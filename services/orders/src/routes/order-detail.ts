import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import { OrderStatus } from "../generated/prisma/client";

export const orderDetailRoutes = Router();

orderDetailRoutes.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
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

orderDetailRoutes.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const allowed: Record<string, { by: string; from: OrderStatus[] }> = {
    IN_PROGRESS: { by: "seller", from: ["PENDING"] },
    DELIVERED: { by: "seller", from: ["IN_PROGRESS"] },
    COMPLETED: { by: "buyer", from: ["DELIVERED"] },
    CANCELLED: { by: "buyer", from: ["PENDING"] },
  };

  const rule = allowed[status];
  if (!rule) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const isAllowed =
    (rule.by === "seller" && order.sellerId === req.user!.id) ||
    (rule.by === "buyer" && order.buyerId === req.user!.id) ||
    req.user!.role === "ADMIN";

  if (!isAllowed || !rule.from.includes(order.status)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  res.json(updated);
});

orderDetailRoutes.post("/:id/messages", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  const receiverId = req.user!.id === order.buyerId ? order.sellerId : order.buyerId;

  const message = await prisma.message.create({
    data: {
      content,
      orderId,
      senderId: req.user!.id,
      receiverId,
    },
  });

  res.status(201).json(message);
});
