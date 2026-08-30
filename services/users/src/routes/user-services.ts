import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for the services a seller offers. */
export const userServicesRoutes = Router();

/** List the current user's service slugs. */
userServicesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const services = await prisma.userService.findMany({
    where: { userId: req.user!.id },
    select: { serviceSlug: true },
  });

  res.json(services.map((s) => s.serviceSlug));
});

/** Replace the current user's service list. */
userServicesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { services } = req.body;

  if (!Array.isArray(services)) {
    res.status(400).json({ error: "Invalid services" });
    return;
  }

  await prisma.userService.deleteMany({ where: { userId } });

  if (services.length > 0) {
    await prisma.userService.createMany({
      data: services.map((slug: string) => ({ userId, serviceSlug: slug })),
    });
  }

  const saved = await prisma.userService.findMany({
    where: { userId },
    select: { serviceSlug: true },
  });

  res.json(saved.map((s) => s.serviceSlug));
});
