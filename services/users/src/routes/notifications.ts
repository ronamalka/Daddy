import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
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
