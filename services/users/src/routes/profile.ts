import { Router, Request, Response } from "express";
import { compare, hash } from "bcryptjs";
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

profileRoutes.put("/password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "נדרשות סיסמה נוכחית וסיסמה חדשה" });
    return;
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({ error: "חשבון זה מתחבר דרך Google. אין סיסמה לעדכן." });
    return;
  }

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "הסיסמה הנוכחית שגויה" });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: "הסיסמה החדשה חייבת להיות שונה מהנוכחית" });
    return;
  }

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  res.json({ message: "הסיסמה עודכנה בהצלחה" });
});
