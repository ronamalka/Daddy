import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

export const profileRoutes = Router();

profileRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      city: true,
      createdAt: true,
    },
  });

  res.json(user);
});

profileRoutes.put("/", requireAuth, async (req: Request, res: Response) => {
  const { name, bio, phone, city, avatar } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(city !== undefined && { city }),
      ...(avatar !== undefined && { avatar }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      city: true,
    },
  });

  res.json(updated);
});
