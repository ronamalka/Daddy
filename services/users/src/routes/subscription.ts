import { Router, Request, Response } from "express";
import { requireAuth, requireSeller } from "../../../shared/middleware";
import { prisma } from "../db";
import { logEvent } from "../../../shared/analytics";

export const subscriptionRoutes = Router();

const FREE_BENEFITS = [
  "הצגה בתוצאות חיפוש",
  "קבלת הזמנות",
  "צ'אט עם לקוחות",
];

const PREMIUM_BENEFITS = [
  "מיקום מועדף בתוצאות חיפוש",
  "גישה מוקדמת להזמנות חדשות",
  "תג בעל מקצוע מוביל",
  "עמלה מופחתת",
  "חשבוניות אוטומטיות",
  "ניתוח ביצועים",
  "תמיכה בעדיפות",
];

const PREMIUM_PRICE = 79;
const SUBSCRIPTION_DAYS = 30;

/** Returns the current user's subscription status and benefits. */
subscriptionRoutes.get("/", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      subscriptionTier: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
      subscriptionPaymentId: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  const now = new Date();
  const isActive =
    user.subscriptionTier === "PREMIUM" &&
    user.subscriptionExpiresAt != null &&
    user.subscriptionExpiresAt > now;

  res.json({
    tier: user.subscriptionTier,
    startedAt: user.subscriptionStartedAt,
    expiresAt: user.subscriptionExpiresAt,
    isActive,
    price: PREMIUM_PRICE,
    benefits: user.subscriptionTier === "PREMIUM" && isActive ? PREMIUM_BENEFITS : FREE_BENEFITS,
    allBenefits: { free: FREE_BENEFITS, premium: PREMIUM_BENEFITS },
  });
});

/** Subscribes the user to Premium (payment stubbed for MVP). */
subscriptionRoutes.post("/subscribe", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  const now = new Date();
  if (
    user.subscriptionTier === "PREMIUM" &&
    user.subscriptionExpiresAt &&
    user.subscriptionExpiresAt > now
  ) {
    res.status(400).json({ error: "כבר יש לך מנוי פעיל" });
    return;
  }

  const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PREMIUM",
      subscriptionStartedAt: now,
      subscriptionExpiresAt: expiresAt,
      subscriptionPaymentId: `stub_${Date.now()}`,
    },
    select: {
      subscriptionTier: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
    },
  });

  logEvent(prisma, {
    eventName: "revenue.subscription_payment",
    eventCategory: "revenue",
    actorId: userId,
    actorRole: "seller",
    entityType: "subscription",
    entityId: userId,
    properties: { price: PREMIUM_PRICE, tier: "PREMIUM" },
  });

  res.json({
    tier: updated.subscriptionTier,
    startedAt: updated.subscriptionStartedAt,
    expiresAt: updated.subscriptionExpiresAt,
    isActive: true,
    message: "המנוי הופעל בהצלחה!",
  });
});

/** Cancels the subscription (keeps active until expiry). */
subscriptionRoutes.post("/cancel", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  if (user.subscriptionTier !== "PREMIUM" || !user.subscriptionExpiresAt) {
    res.status(400).json({ error: "אין מנוי פעיל לביטול" });
    return;
  }

  // Mark tier back to FREE so it won't auto-renew, but keep expiresAt so access continues until then.
  // The subscription remains usable until the expiresAt date.
  const expiresAt = user.subscriptionExpiresAt;
  const formatted = expiresAt.toLocaleDateString("he-IL");

  logEvent(prisma, {
    eventName: "revenue.subscription_churned",
    eventCategory: "revenue",
    actorId: userId,
    actorRole: "seller",
    entityType: "subscription",
    entityId: userId,
    properties: { expiresAt: expiresAt.toISOString() },
  });

  res.json({
    tier: "PREMIUM",
    expiresAt,
    isActive: expiresAt > new Date(),
    message: `המנוי יסתיים ב-${formatted}`,
  });
});

/** Renews the subscription for another 30 days (payment stubbed). */
subscriptionRoutes.post("/renew", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  const now = new Date();
  // Extend from current expiry if still active, otherwise from now
  const baseDate =
    user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
      ? user.subscriptionExpiresAt
      : now;

  const newExpiresAt = new Date(baseDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: newExpiresAt,
      subscriptionPaymentId: `stub_${Date.now()}`,
      ...(user.subscriptionTier !== "PREMIUM" ? { subscriptionStartedAt: now } : {}),
    },
    select: {
      subscriptionTier: true,
      subscriptionStartedAt: true,
      subscriptionExpiresAt: true,
    },
  });

  logEvent(prisma, {
    eventName: "revenue.subscription_payment",
    eventCategory: "revenue",
    actorId: userId,
    actorRole: "seller",
    entityType: "subscription",
    entityId: userId,
    properties: { price: PREMIUM_PRICE, tier: "PREMIUM", type: "renewal" },
  });

  res.json({
    tier: updated.subscriptionTier,
    startedAt: updated.subscriptionStartedAt,
    expiresAt: updated.subscriptionExpiresAt,
    isActive: true,
    message: "המנוי חודש בהצלחה!",
  });
});
