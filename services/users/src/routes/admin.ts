import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";

/** Admin-only routes for users and simple counts. */
export const adminRoutes = Router();

/** List all users. */
adminRoutes.get("/users", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
});

/** Return the total number of users. */
adminRoutes.get("/stats", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.count();
  res.json({ users });
});
