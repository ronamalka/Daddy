import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

export const messagesRoutes = Router();

const MAX_MESSAGE_LENGTH = 5000;

messagesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { receiverId, content } = req.body;
  const trimmed = typeof content === "string" ? content.trim() : "";

  if (!receiverId || !trimmed) {
    res.status(400).json({ error: "receiverId and content required" });
    return;
  }

  if (typeof receiverId !== "string" || receiverId.length > 64) {
    res.status(400).json({ error: "Invalid receiverId" });
    return;
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  if (receiverId === req.user!.id) {
    res.status(400).json({ error: "Cannot message yourself" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      content: trimmed,
      senderId: req.user!.id,
      receiverId,
    },
  });

  res.status(201).json(message);
});

messagesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const withUser = req.query.withUser as string | undefined;

  if (withUser) {
    const messages = await prisma.message.findMany({
      where: {
        orderId: null,
        OR: [
          { senderId: req.user!.id, receiverId: withUser },
          { senderId: withUser, receiverId: req.user!.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
    return;
  }

  const messages = await prisma.message.findMany({
    where: {
      orderId: null,
      OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }],
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(messages);
});

messagesRoutes.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
  const count = await prisma.message.count({
    where: {
      receiverId: req.user!.id,
      readAt: null,
    },
  });

  res.json({ count });
});

messagesRoutes.post("/mark-read", requireAuth, async (req: Request, res: Response) => {
  const { orderId, senderId } = req.body;

  if (!orderId && !senderId) {
    res.status(400).json({ error: "orderId or senderId required" });
    return;
  }

  const where: Record<string, unknown> = {
    receiverId: req.user!.id,
    readAt: null,
  };

  if (orderId) {
    where.orderId = orderId;
  } else {
    where.senderId = senderId;
    where.orderId = null;
  }

  const { count } = await prisma.message.updateMany({
    where,
    data: { readAt: new Date() },
  });

  res.json({ marked: count });
});
