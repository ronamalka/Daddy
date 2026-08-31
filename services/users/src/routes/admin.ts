import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";

/** Admin-only routes for users, counts, and account suspension. */
export const adminRoutes = Router();

/** List all users. */
adminRoutes.get("/users", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      suspendedAt: true,
      suspendReason: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
});

/** Return the total number of users. */
adminRoutes.get("/stats", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.count();
  res.json({ users });
});

/** Suspend a non-admin user. Admins cannot suspend themselves. */
adminRoutes.post("/users/:id/suspend", requireAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (id === req.user!.id) {
    res.status(400).json({ error: "לא ניתן להשעות את עצמך" });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: "המשתמש לא נמצא" });
    return;
  }
  if (target.role === "ADMIN") {
    res.status(400).json({ error: "לא ניתן להשעות מנהל" });
    return;
  }

  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const updated = await prisma.user.update({
    where: { id },
    data: { suspendedAt: new Date(), suspendReason: reason || "הושעה על ידי מנהל" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      suspendedAt: true,
      suspendReason: true,
    },
  });
  res.json(updated);
});

/** Clear a suspension so the user can sign in again. */
adminRoutes.post("/users/:id/unsuspend", requireAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: "המשתמש לא נמצא" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { suspendedAt: null, suspendReason: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      suspendedAt: true,
      suspendReason: true,
    },
  });
  res.json(updated);
});
