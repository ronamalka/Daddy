import { Router, Request, Response } from "express";
import { requireAuth, requireInternal } from "../../../shared/middleware";
import { internalGet } from "../../../shared/internal-client";
import { prisma } from "../db";
import { calculateTier, nextTierInfo, COMMISSION_TIERS, CommissionTierName } from "../lib/commission";
import { logger } from "../../../shared/logger";

const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || "http://localhost:4003";

/** How long before we re-check the tier (24 hours in ms). */
const TIER_STALE_MS = 24 * 60 * 60 * 1000;

/** Routes for seller commission tier information. */
export const commissionRoutes = Router();

/** Fetch 90-day completed order count from orders service. */
async function fetch90DayCount(sellerId: string): Promise<number> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, status } = await internalGet(
    ORDERS_SERVICE_URL,
    `/orders/count-by-seller/${sellerId}?since=${since}`,
  );
  if (status !== 200 || !data) {
    logger.warn({ sellerId, status }, "Failed to fetch order count for commission tier");
    return 0;
  }
  return (data as { completedOrders: number }).completedOrders ?? 0;
}

/** Recalculate and persist a seller's commission tier. */
async function recalculateCommissionTier(userId: string) {
  const count = await fetch90DayCount(userId);
  const { tier, rate } = calculateTier(count);

  await prisma.user.update({
    where: { id: userId },
    data: {
      commissionTier: tier,
      commissionRate: rate,
      tierCalculatedAt: new Date(),
    },
  });

  return { tier, rate, completedOrders90d: count };
}

/**
 * GET /sellers/:id/commission
 *
 * Auth: seller can only see their own, admin can see any.
 * Also accepted via requireInternal (service-to-service).
 */
commissionRoutes.get("/:id/commission", requireInternal, async (req: Request, res: Response) => {
  const sellerId = req.params.id as string;

  // If called by a logged-in user (not service-to-service), check access
  if (req.user) {
    const isOwn = req.user.id === sellerId;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwn && !isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      role: true,
      commissionTier: true,
      commissionRate: true,
      tierCalculatedAt: true,
    },
  });

  if (!seller) {
    res.status(404).json({ error: "Seller not found" });
    return;
  }

  if (seller.role !== "SELLER") {
    res.status(400).json({ error: "User is not a seller" });
    return;
  }

  // Lazy recalculation: refresh if stale or never calculated
  const isStale =
    !seller.tierCalculatedAt ||
    Date.now() - seller.tierCalculatedAt.getTime() > TIER_STALE_MS;

  let tier = seller.commissionTier as CommissionTierName;
  let rate = seller.commissionRate;
  let completedOrders90d: number;

  if (isStale) {
    const result = await recalculateCommissionTier(sellerId);
    tier = result.tier;
    rate = result.rate;
    completedOrders90d = result.completedOrders90d;
  } else {
    completedOrders90d = await fetch90DayCount(sellerId);
  }

  const tierInfo = COMMISSION_TIERS[tier];
  const next = nextTierInfo(tier, completedOrders90d);

  res.json({
    tier,
    rate,
    label: tierInfo.label,
    completedOrders90d,
    nextTier: next?.nextTier ?? null,
    ordersToNextTier: next?.ordersNeeded ?? 0,
  });
});
