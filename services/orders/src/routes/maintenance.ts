import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";

/** 90 days in milliseconds. */
const VISIT_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

/** Routes for recurring maintenance plan subscriptions. */
export const maintenanceRoutes = Router();

// ---------------------------------------------------------------------------
// Buyer routes
// ---------------------------------------------------------------------------

/** Subscribe the current buyer to a maintenance plan. */
maintenanceRoutes.post("/subscribe", requireAuth, async (req: Request, res: Response) => {
  const buyerId = req.user!.id;
  const planType = req.body.planType === "BASIC" ? "BASIC" : null;

  if (!planType) {
    res.status(400).json({ error: "סוג תוכנית לא תקין" });
    return;
  }

  const existing = await prisma.maintenancePlan.findFirst({
    where: { buyerId, status: "ACTIVE" },
  });

  if (existing) {
    res.status(409).json({ error: "כבר יש לך תוכנית תחזוקה פעילה" });
    return;
  }

  const firstVisitDate = new Date(Date.now() + VISIT_INTERVAL_MS);

  const plan = await prisma.maintenancePlan.create({
    data: {
      buyerId,
      planType,
      priceMonthly: 99,
      status: "ACTIVE",
      nextVisitAt: firstVisitDate,
      visits: {
        create: {
          scheduledAt: firstVisitDate,
          status: "SCHEDULED",
        },
      },
    },
    include: { visits: true },
  });

  res.status(201).json(plan);
});

/** Return the current buyer's active maintenance plan with visits. */
maintenanceRoutes.get("/my-plan", requireAuth, async (req: Request, res: Response) => {
  const plan = await prisma.maintenancePlan.findFirst({
    where: { buyerId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      visits: { orderBy: { scheduledAt: "asc" } },
    },
  });

  if (!plan) {
    res.status(404).json({ error: "לא נמצאה תוכנית תחזוקה" });
    return;
  }

  res.json(plan);
});

/** Cancel the current buyer's active plan and all scheduled visits. */
maintenanceRoutes.post("/cancel", requireAuth, async (req: Request, res: Response) => {
  const buyerId = req.user!.id;

  const plan = await prisma.maintenancePlan.findFirst({
    where: { buyerId, status: "ACTIVE" },
  });

  if (!plan) {
    res.status(404).json({ error: "לא נמצאה תוכנית תחזוקה פעילה" });
    return;
  }

  await prisma.$transaction([
    prisma.maintenanceVisit.updateMany({
      where: { planId: plan.id, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    }),
    prisma.maintenancePlan.update({
      where: { id: plan.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
  ]);

  res.json({ message: "תוכנית התחזוקה בוטלה" });
});

// ---------------------------------------------------------------------------
// Seller routes
// ---------------------------------------------------------------------------

/** Return visits assigned to this seller (SCHEDULED or CONFIRMED). */
maintenanceRoutes.get("/my-visits", requireAuth, async (req: Request, res: Response) => {
  const sellerId = req.user!.id;

  const visits = await prisma.maintenanceVisit.findMany({
    where: {
      plan: { sellerId },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: { plan: { select: { id: true, buyerId: true, planType: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  res.json(visits);
});

/** Mark a visit as completed and auto-schedule the next one. */
maintenanceRoutes.post("/visits/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const visitId = req.params.id;
  const sellerId = req.user!.id;
  const { report, photos } = req.body;

  if (!report || typeof report !== "string" || !report.trim()) {
    res.status(400).json({ error: "נדרש דוח ביקור" });
    return;
  }

  const visit = await prisma.maintenanceVisit.findUnique({
    where: { id: visitId },
    include: { plan: true },
  });

  if (!visit) {
    res.status(404).json({ error: "ביקור לא נמצא" });
    return;
  }

  if (visit.plan.sellerId !== sellerId) {
    res.status(403).json({ error: "אין הרשאה להשלים ביקור זה" });
    return;
  }

  if (visit.status === "COMPLETED") {
    res.status(400).json({ error: "הביקור כבר הושלם" });
    return;
  }

  const nextVisitDate = new Date(Date.now() + VISIT_INTERVAL_MS);

  const [updatedVisit] = await prisma.$transaction([
    prisma.maintenanceVisit.update({
      where: { id: visitId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        report: report.trim(),
        photos: Array.isArray(photos) ? photos : [],
      },
    }),
    prisma.maintenanceVisit.create({
      data: {
        planId: visit.planId,
        scheduledAt: nextVisitDate,
        status: "SCHEDULED",
      },
    }),
    prisma.maintenancePlan.update({
      where: { id: visit.planId },
      data: { nextVisitAt: nextVisitDate },
    }),
  ]);

  res.json(updatedVisit);
});

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

/** List all maintenance plans with optional status filter and pagination. */
maintenanceRoutes.get("/plans", requireAdmin, async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  const skip = (page - 1) * limit;

  const where = status ? { status: status as "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED" } : {};

  const [plans, total] = await Promise.all([
    prisma.maintenancePlan.findMany({
      where,
      include: {
        visits: { orderBy: { scheduledAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.maintenancePlan.count({ where }),
  ]);

  res.json({ plans, total, page, limit });
});

/** Assign a handyman (seller) to a maintenance plan. */
maintenanceRoutes.post("/plans/:id/assign", requireAdmin, async (req: Request, res: Response) => {
  const planId = req.params.id;
  const { sellerId } = req.body;

  if (!sellerId || typeof sellerId !== "string") {
    res.status(400).json({ error: "נדרש מזהה בעל מקצוע" });
    return;
  }

  const plan = await prisma.maintenancePlan.findUnique({ where: { id: planId } });
  if (!plan) {
    res.status(404).json({ error: "תוכנית לא נמצאה" });
    return;
  }

  const updated = await prisma.maintenancePlan.update({
    where: { id: planId },
    data: { sellerId },
    include: { visits: { orderBy: { scheduledAt: "asc" } } },
  });

  res.json(updated);
});
