import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { listConversations, listMessages, markRead, sendMessage, unreadCount, type MessageRepo, type ViolationRepo } from "../chat";

/** Build the router for sending, listing, and marking chat messages. */
export function createMessagesRouter(repo: MessageRepo, violationRepo?: ViolationRepo) {
  const router = Router();

  /** Send a new chat message. */
  router.post("/", requireAuth, async (req: Request, res: Response) => {
    const result = await sendMessage(
      repo,
      {
        senderId: req.user!.id,
        senderRole: req.user!.role,
        receiverId: req.body.receiverId,
        content: req.body.content,
        attachment: req.body.attachment,
        orderId: req.body.orderId,
      },
      violationRepo,
    );

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(result.status).json(result.data);
  });

  /** List this user's conversations. */
  router.get("/conversations", requireAuth, async (req: Request, res: Response) => {
    const result = await listConversations(repo, req.user!.id);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.data);
  });

  /** List messages, optionally with one user or for one order. */
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

  /** Return how many unread messages this user has. */
  router.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
    const result = await unreadCount(repo, req.user!.id);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.data);
  });

  /** Mark messages as read for an order or a sender. */
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
