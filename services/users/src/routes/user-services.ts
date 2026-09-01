import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import { parseUserServiceInput } from "../request-match";

/** Routes for the services a seller offers. */
export const userServicesRoutes = Router();

function serializeServices(rows: { serviceSlug: string; alertsMuted: boolean }[]) {
  return rows.map((row) => ({ serviceSlug: row.serviceSlug, alertsMuted: row.alertsMuted }));
}

/** List the current user's services and request-alert mute flags. */
userServicesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const services = await prisma.userService.findMany({
    where: { userId: req.user!.id },
    select: { serviceSlug: true, alertsMuted: true },
  });
  res.json(serializeServices(services));
});

/** Mute or unmute nearby-request alerts for one of the current user's services. */
userServicesRoutes.patch("/alerts", requireAuth, async (req: Request, res: Response) => {
  const serviceSlug = typeof req.body?.serviceSlug === "string" ? req.body.serviceSlug.trim() : "";
  const alertsMuted = req.body?.alertsMuted;
  if (!serviceSlug || typeof alertsMuted !== "boolean") {
    res.status(400).json({ error: "serviceSlug and alertsMuted are required" });
    return;
  }
  const result = await prisma.userService.updateMany({
    where: { userId: req.user!.id, serviceSlug },
    data: { alertsMuted },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json({ serviceSlug, alertsMuted });
});

/** Replace the current user's service list, preserving mute flags unless a new value is sent. */
userServicesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parsed = parseUserServiceInput(req.body?.services);
  if (!parsed) {
    res.status(400).json({ error: "Invalid services" });
    return;
  }

  const existing = await prisma.userService.findMany({
    where: { userId },
    select: { serviceSlug: true, alertsMuted: true },
  });
  const muteBySlug = new Map(existing.map((row) => [row.serviceSlug, row.alertsMuted]));

  await prisma.userService.deleteMany({ where: { userId } });

  if (parsed.length > 0) {
    await prisma.userService.createMany({
      data: parsed.map((row) => ({
        userId,
        serviceSlug: row.serviceSlug,
        alertsMuted: row.alertsMuted ?? muteBySlug.get(row.serviceSlug) ?? false,
      })),
    });
  }

  const saved = await prisma.userService.findMany({
    where: { userId },
    select: { serviceSlug: true, alertsMuted: true },
  });
  res.json(serializeServices(saved));
});
