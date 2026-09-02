import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";
import { WarrantyStatus } from "../generated/prisma/client";
import { isRequestPhotoUrl } from "../../../shared/request-details";

const MAX_WARRANTY_PHOTOS = 5;
const MAX_DESCRIPTION_LENGTH = 2000;
const WARRANTY_DAYS = 30;

const RESOLVE_ACTIONS = ["APPROVED_RESEND", "APPROVED_REFUND", "REJECTED"] as const;
type ResolveAction = (typeof RESOLVE_ACTIONS)[number];

/** Buyer warranty claim routes, mounted on /orders. */
export const warrantyRoutes = Router();

/** Create a warranty claim on a completed order. */
warrantyRoutes.post("/:id/warranty-claim", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { warrantyClaims: { select: { status: true } } },
  });

  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  if (order.buyerId !== req.user!.id) {
    res.status(403).json({ error: "רק הקונה יכול לפתוח תביעת אחריות" });
    return;
  }

  if (order.status !== "COMPLETED") {
    res.status(400).json({ error: "ניתן לפתוח תביעת אחריות רק על הזמנה שהושלמה" });
    return;
  }

  const completedAt = order.updatedAt;
  const daysSinceCompleted = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCompleted > WARRANTY_DAYS) {
    res.status(400).json({ error: "תקופת האחריות (30 יום) הסתיימה" });
    return;
  }

  const hasOpenClaim = order.warrantyClaims.some(
    (c) => c.status === "OPEN" || c.status === "UNDER_REVIEW"
  );
  if (hasOpenClaim) {
    res.status(409).json({ error: "כבר קיימת תביעת אחריות פתוחה להזמנה זו" });
    return;
  }

  const { description, photos } = req.body;

  if (!description || typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "יש לתאר את הבעיה" });
    return;
  }
  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    res.status(400).json({ error: `התיאור ארוך מדי (עד ${MAX_DESCRIPTION_LENGTH} תווים)` });
    return;
  }

  const validPhotos: string[] = [];
  if (photos != null) {
    if (!Array.isArray(photos)) {
      res.status(400).json({ error: "כתובת תמונה לא תקינה" });
      return;
    }
    if (photos.length > MAX_WARRANTY_PHOTOS) {
      res.status(400).json({ error: `אפשר לצרף עד ${MAX_WARRANTY_PHOTOS} תמונות` });
      return;
    }
    for (const photo of photos) {
      if (typeof photo !== "string" || !isRequestPhotoUrl(photo.trim())) {
        res.status(400).json({ error: "כתובת תמונה לא תקינה" });
        return;
      }
      validPhotos.push(photo.trim());
    }
  }

  const claim = await prisma.warrantyClaim.create({
    data: {
      orderId,
      buyerId: req.user!.id,
      description: description.trim(),
      photos: validPhotos,
    },
  });

  res.status(201).json(claim);
});

/** List warranty claims for this order. Buyer, seller, or admin can view. */
warrantyRoutes.get("/:id/warranty-claim", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  if (
    order.buyerId !== req.user!.id &&
    order.sellerId !== req.user!.id &&
    req.user!.role !== "ADMIN"
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const claims = await prisma.warrantyClaim.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  res.json(claims);
});

/** Admin warranty claim routes, mounted on /admin. */
export const adminWarrantyRoutes = Router();

/** List all warranty claims with pagination and optional status filter. */
adminWarrantyRoutes.get("/warranty-claims", requireAdmin, async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const where = status ? { status: status as WarrantyStatus } : undefined;

  const [claims, total] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            price: true,
            buyerId: true,
            sellerId: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.warrantyClaim.count({ where }),
  ]);

  res.json({ claims, total, limit, offset });
});

/** Resolve a warranty claim (admin only). */
adminWarrantyRoutes.post("/warranty-claims/:id/resolve", requireAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) {
    res.status(404).json({ error: "תביעת האחריות לא נמצאה" });
    return;
  }

  if (claim.status !== "OPEN" && claim.status !== "UNDER_REVIEW") {
    res.status(409).json({ error: "התביעה כבר טופלה" });
    return;
  }

  const { action, resolution } = req.body;

  if (!action || !RESOLVE_ACTIONS.includes(action as ResolveAction)) {
    res.status(400).json({ error: "פעולה לא תקינה" });
    return;
  }

  if (!resolution || typeof resolution !== "string" || !resolution.trim()) {
    res.status(400).json({ error: "יש לציין החלטה" });
    return;
  }

  const updated = await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: action as WarrantyStatus,
      resolution: resolution.trim(),
      resolvedAt: new Date(),
      resolvedBy: req.user!.id,
    },
  });

  res.json(updated);
});
