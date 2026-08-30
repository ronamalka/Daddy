import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { listMessages, markRead, sendMessage, unreadCount, type MessageRepo } from "../chat";

export function createMessagesRouter(repo: MessageRepo) {
  const router = Router();

  router.post("/", requireAuth, async (req: Request, res: Response) => {
    const result = await sendMessage(repo, {
      senderId: req.user!.id,
      senderRole: req.user!.role,
      receiverId: req.body.receiverId,
      content: req.body.content,
      orderId: req.body.orderId,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(result.status).json(result.data);
  });

  router.get("/", requireAuth, async (req: Request, res: Response) => {
    const result = await listMessages(repo, {
      userId: req.user!.id,
      role: req.user!.role,
      withUser: req.query.withUser as string | undefined,
      orderId: req.query.orderId as string | undefined,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.data);
  });

  router.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
    const result = await unreadCount(repo, req.user!.id);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.data);
  });

  router.post("/mark-read", requireAuth, async (req: Request, res: Response) => {
    const result = await markRead(repo, {
      userId: req.user!.id,
      orderId: req.body.orderId,
      senderId: req.body.senderId,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.data);
  });

  return router;
}
