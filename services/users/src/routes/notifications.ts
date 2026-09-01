import { Router, Request, Response } from "express";
import { requireAuth, requireInternal } from "../../../shared/middleware";
import { dispatchExternalChannels } from "../../../shared/notify";
import { prisma } from "../index";
import { searchableSellerWhere } from "../seller-ready";
import {
  nearbyRequestNotification,
  pickMatchedSellers,
  NOTIFICATION_TYPE_NEARBY_REQUEST,
  type AreaRow,
} from "../request-match";
import type { Prisma } from "../generated/prisma/client";

/** Persisted in-app notifications and nearby-request matching. */
export const notificationsRoutes = Router();

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Lists persisted notifications for the signed-in user, newest first. */
notificationsRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const rows = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      href: row.href,
      entityId: row.entityId,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt ? row.readAt.toISOString() : null,
    }))
  );
});

/** Marks the given notifications as read for the signed-in user. */
notificationsRoutes.post("/mark-read", requireAuth, async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (ids.length === 0) {
    res.json({ updated: 0 });
    return;
  }
  const result = await prisma.notification.updateMany({
    where: { userId: req.user!.id, id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ updated: result.count });
});

/** Matches ready sellers to a new request and persists NEW_NEARBY_REQUEST rows. */
notificationsRoutes.post("/nearby-request", requireAuth, async (req: Request, res: Response) => {
  const requestId = toText(req.body?.requestId);
  const title = toText(req.body?.title);
  const serviceSlug = toText(req.body?.serviceSlug);
  const buyerId = toText(req.body?.buyerId) || req.user!.id;
  const cityCode = toInt(req.body?.cityCode);
  const districtCode = toInt(req.body?.districtCode);
  const cityName = toText(req.body?.cityName);
  const districtName = toText(req.body?.districtName);

  if (!requestId || !title) {
    res.status(400).json({ error: "requestId and title are required" });
    return;
  }
  if (buyerId !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!serviceSlug || (cityCode == null && districtCode == null)) {
    res.json({ notified: 0, eventType: NOTIFICATION_TYPE_NEARBY_REQUEST });
    return;
  }

  const areaFilter: Prisma.ServiceAreaWhereInput =
    cityCode != null
      ? {
          OR: [
            { cityCode },
            ...(districtCode != null ? [{ districtCode, cityCode: null as number | null }] : []),
          ],
        }
      : { districtCode: districtCode!, cityCode: null };

  const readyWhere = searchableSellerWhere() as Prisma.UserWhereInput;
  const candidates = await prisma.user.findMany({
    where: {
      AND: [
        readyWhere,
        {
          id: { not: buyerId },
          suspendedAt: null,
          userServices: { some: { serviceSlug, alertsMuted: false } },
          serviceAreas: { some: areaFilter },
        },
      ],
    },
    select: {
      id: true,
      serviceAreas: { select: { cityCode: true, districtCode: true } },
    },
    orderBy: { id: "asc" },
  });

  const matched = pickMatchedSellers(
    candidates.map((row) => ({ id: row.id, areas: row.serviceAreas as AreaRow[] })),
    { cityCode, districtCode }
  );
  if (matched.length === 0) {
    res.json({ notified: 0, eventType: NOTIFICATION_TYPE_NEARBY_REQUEST });
    return;
  }

  const note = nearbyRequestNotification({
    requestId,
    title,
    serviceSlug,
    cityName,
    districtName,
  });

  const created = await prisma.notification.createMany({
    data: matched.map((row) => ({
      userId: row.id,
      type: note.type,
      title: note.title,
      message: note.message,
      href: note.href,
      entityId: note.entityId,
      payload: note.payload as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });

  res.json({ notified: created.count, eventType: NOTIFICATION_TYPE_NEARBY_REQUEST });
});

/**
 * Internal endpoint called by other services to create an in-app notification
 * AND dispatch to WhatsApp / SMS / email based on user preferences.
 *
 * Body: { userId, type, title, message, href?, entityId? }
 */
notificationsRoutes.post("/send", requireInternal, async (req: Request, res: Response) => {
  const userId = toText(req.body?.userId);
  const type = toText(req.body?.type);
  const title = toText(req.body?.title);
  const message = toText(req.body?.message);
  const href = toText(req.body?.href) || "/";
  const entityId = toText(req.body?.entityId) || "";

  if (!userId || !type || !title || !message) {
    res.status(400).json({ error: "userId, type, title, and message are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      email: true,
      notifyWhatsapp: true,
      notifySms: true,
      notifyEmail: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Create in-app notification (skip duplicates for idempotency)
  await prisma.notification.upsert({
    where: {
      userId_type_entityId: { userId, type, entityId },
    },
    update: {},
    create: {
      userId,
      type,
      title,
      message,
      href,
      entityId,
    },
  });

  // Dispatch to external channels based on user preferences
  await dispatchExternalChannels(
    { userId, phone: user.phone, email: user.email, type, title, message, href, entityId },
    { whatsapp: user.notifyWhatsapp, sms: user.notifySms, email: user.notifyEmail },
  );

  res.json({ sent: true });
});

/** Returns the notification preferences of the signed-in user. */
notificationsRoutes.get("/preferences", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      notifyWhatsapp: true,
      notifySms: true,
      notifyEmail: true,
      marketingConsent: true,
      marketingConsentAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "משתמש לא נמצא" });
    return;
  }

  res.json({
    notifyWhatsapp: user.notifyWhatsapp,
    notifySms: user.notifySms,
    notifyEmail: user.notifyEmail,
    marketingConsent: user.marketingConsent,
    marketingConsentAt: user.marketingConsentAt ? user.marketingConsentAt.toISOString() : null,
  });
});

/** Updates the notification preferences of the signed-in user. */
notificationsRoutes.put("/preferences", requireAuth, async (req: Request, res: Response) => {
  const { notifyWhatsapp, notifySms, notifyEmail, marketingConsent } = req.body;

  const data: Record<string, unknown> = {};

  if (typeof notifyWhatsapp === "boolean") data.notifyWhatsapp = notifyWhatsapp;
  if (typeof notifySms === "boolean") data.notifySms = notifySms;
  if (typeof notifyEmail === "boolean") data.notifyEmail = notifyEmail;
  if (typeof marketingConsent === "boolean") {
    data.marketingConsent = marketingConsent;
    data.marketingConsentAt = marketingConsent ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "לא סופקו שדות לעדכון" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      notifyWhatsapp: true,
      notifySms: true,
      notifyEmail: true,
      marketingConsent: true,
      marketingConsentAt: true,
    },
  });

  res.json({
    notifyWhatsapp: updated.notifyWhatsapp,
    notifySms: updated.notifySms,
    notifyEmail: updated.notifyEmail,
    marketingConsent: updated.marketingConsent,
    marketingConsentAt: updated.marketingConsentAt ? updated.marketingConsentAt.toISOString() : null,
  });
});
