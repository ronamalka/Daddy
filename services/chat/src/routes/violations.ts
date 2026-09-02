import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { PrismaClient } from "../generated/prisma/client";

/** Build the router for admin chat-violation management. */
export function createViolationsRouter(prisma: PrismaClient) {
  const router = Router();

  /** List violations, newest first, with pagination. */
  router.get("/", requireAdmin, async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status === "dismissed") {
      where.dismissed = true;
    } else if (status === "warned") {
      where.warned = true;
    } else if (status === "pending") {
      where.dismissed = false;
      where.warned = false;
    }

    const [items, total] = await Promise.all([
      prisma.chatViolation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.chatViolation.count({ where }),
    ]);

    res.json({ items, total, limit, offset });
  });

  /** Mark a violation as a false positive (dismissed). */
  router.post("/:id/dismiss", requireAdmin, async (req: Request, res: Response) => {
    const id = String(req.params.id);
    try {
      const updated = await prisma.chatViolation.update({
        where: { id },
        data: { dismissed: true },
      });
      res.json(updated);
    } catch {
      res.status(404).json({ error: "Violation not found" });
    }
  });

  /** Mark that the user has been warned about this violation. */
  router.post("/:id/warn", requireAdmin, async (req: Request, res: Response) => {
    const id = String(req.params.id);
    try {
      const updated = await prisma.chatViolation.update({
        where: { id },
        data: { warned: true },
      });
      res.json(updated);
    } catch {
      res.status(404).json({ error: "Violation not found" });
    }
  });

  return router;
}
