import { Router, Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { requireAuth } from "../../../shared/middleware";
import { validatePassword } from "../../../shared/security";
import { prisma } from "../index";
import { evaluateSellerReadiness } from "../seller-ready";

/** Routes for the current user's profile and password. */
export const profileRoutes = Router();

/** Return the current user's profile. */
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
      cityCode: true,
      districtCode: true,
      payoutBankAccount: true,
      payoutBankBranch: true,
      payoutAccountNumber: true,
      osekType: true,
      osekNumber: true,
      legalName: true,
      businessAddress: true,
      createdAt: true,
    },
  });

  res.json(user);
});

/** Return how far the current seller is from being searchable. */
profileRoutes.get("/readiness", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      role: true,
      phone: true,
      avatar: true,
      serviceAreas: { select: { id: true } },
      weeklyHours: { select: { id: true } },
      servicePrices: { select: { price: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  const readiness = evaluateSellerReadiness({
    phone: user.phone,
    avatar: user.avatar,
    serviceAreaCount: user.serviceAreas.length,
    pricedServiceCount: user.servicePrices.filter((p) => p.price > 0).length,
    weeklyHoursCount: user.weeklyHours.length,
  });

  res.json({ role: user.role, ...readiness });
});

/** Upgrade a buyer to a seller after independent-contractor confirmation. */
profileRoutes.post("/become-seller", requireAuth, async (req: Request, res: Response) => {
  if (req.body?.independentContractor !== true) {
    res.status(400).json({ error: "נותן שירות חייב לאשר שהוא עצמאי ושלא יבצע עבודה טעונת רישיון בלי רישיון." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, role: true },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  if (user.role === "ADMIN") {
    res.status(400).json({ error: "חשבון מנהל לא יכול להפוך לאבאל׳ה." });
    return;
  }

  if (user.role === "SELLER") {
    res.json({ id: user.id, role: user.role });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "SELLER" },
    select: { id: true, role: true },
  });

  res.json(updated);
});

/** Update the current user's name, bio, phone, city, avatar, payout details, or tax profile. */
profileRoutes.put("/", requireAuth, async (req: Request, res: Response) => {
  const { name, bio, phone, city, cityCode, districtCode, avatar, payoutBankAccount, payoutBankBranch, payoutAccountNumber, osekType, osekNumber, legalName, businessAddress } = req.body;

  if (osekType !== undefined && osekType !== null && osekType !== "patur" && osekType !== "murshe") {
    res.status(400).json({ error: "סוג עוסק לא תקין. יש לבחור פטור או מורשה." });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(city !== undefined && { city }),
      ...(cityCode !== undefined && { cityCode }),
      ...(districtCode !== undefined && { districtCode }),
      ...(avatar !== undefined && { avatar }),
      ...(payoutBankAccount !== undefined && { payoutBankAccount }),
      ...(payoutBankBranch !== undefined && { payoutBankBranch }),
      ...(payoutAccountNumber !== undefined && { payoutAccountNumber }),
      ...(osekType !== undefined && { osekType }),
      ...(osekNumber !== undefined && { osekNumber }),
      ...(legalName !== undefined && { legalName }),
      ...(businessAddress !== undefined && { businessAddress }),
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
      cityCode: true,
      districtCode: true,
      payoutBankAccount: true,
      payoutBankBranch: true,
      payoutAccountNumber: true,
      osekType: true,
      osekNumber: true,
      legalName: true,
      businessAddress: true,
    },
  });

  res.json(updated);
});

/** Change the current user's password after checking the old one. */
profileRoutes.put("/password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "נדרשות סיסמה נוכחית וסיסמה חדשה" });
    return;
  }

  if (typeof newPassword !== "string") {
    res.status(400).json({ error: "נדרשת סיסמה חדשה" });
    return;
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
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
