import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

export const messagesRoutes = Router();

messagesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content?.trim()) {
    res.status(400).json({ error: "receiverId and content required" });
    return;
  }

  if (receiverId === req.user!.id) {
    res.status(400).json({ error: "Cannot message yourself" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      content,
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
