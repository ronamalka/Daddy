import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { prisma } from "../db";

export const userAnalyticsRoutes = Router();

userAnalyticsRoutes.use(requireAdmin);

/** Overview: active users (7d), new signups (7d), with comparison to previous period. */
userAnalyticsRoutes.get("/overview", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newSignups7d,
      newSignupsPrev7d,
      totalSellers,
      totalBuyers,
      totalAdmins,
      activePremium,
      newSignups30d,
      newSignupsPrev30d,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({
        where: {
          subscriptionTier: "PREMIUM",
          subscriptionExpiresAt: { gte: now },
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    res.json({
      totalUsers,
      newSignups7d,
      newSignupsPrev7d,
      newSignups30d,
      newSignupsPrev30d,
      byRole: { SELLER: totalSellers, BUYER: totalBuyers, ADMIN: totalAdmins },
      activePremiumSubscriptions: activePremium,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch user overview" });
  }
});

/** Daily signups for the last N days (default 90). */
userAnalyticsRoutes.get("/signups-timeseries", async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap: Record<string, { total: number; buyers: number; sellers: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { total: 0, buyers: 0, sellers: 0 };
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].total++;
        if (u.role === "BUYER") { dailyMap[key].buyers++; }
        if (u.role === "SELLER") { dailyMap[key].sellers++; }
      }
    }

    const series = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    res.json({ days, series });
  } catch {
    res.status(500).json({ error: "Failed to fetch signups timeseries" });
  }
});

/** Subscription analytics: active count by tier, MRR. */
userAnalyticsRoutes.get("/subscriptions", async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const [freeSellers, activePremium] = await Promise.all([
      prisma.user.count({
        where: {
          role: "SELLER",
          OR: [
            { subscriptionTier: "FREE" },
            { subscriptionExpiresAt: { lt: now } },
            { subscriptionExpiresAt: null },
          ],
        },
      }),
      prisma.user.count({
        where: {
          subscriptionTier: "PREMIUM",
          subscriptionExpiresAt: { gte: now },
        },
      }),
    ]);

    const PREMIUM_PRICE = 79;
    const mrr = activePremium * PREMIUM_PRICE;

    res.json({
      byTier: { FREE: freeSellers, PREMIUM: activePremium },
      mrr,
      premiumPrice: PREMIUM_PRICE,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch subscription analytics" });
  }
});

/** Commission tier distribution across active sellers. */
userAnalyticsRoutes.get("/commission-tiers", async (_req: Request, res: Response) => {
  try {
    const sellers = await prisma.user.findMany({
      where: { role: "SELLER" },
      select: { commissionTier: true, commissionRate: true },
    });

    const distribution: Record<string, number> = {};
    for (const s of sellers) {
      const tier = s.commissionTier || "STANDARD";
      distribution[tier] = (distribution[tier] || 0) + 1;
    }

    res.json({ totalSellers: sellers.length, distribution });
  } catch {
    res.status(500).json({ error: "Failed to fetch commission tier data" });
  }
});

/** LTV: total buyers and sellers counts. */
userAnalyticsRoutes.get("/ltv", async (_req: Request, res: Response) => {
  try {
    const [totalBuyers, totalSellers] = await Promise.all([
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
    ]);

    res.json({
      totalBuyers,
      totalSellers,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch LTV data" });
  }
});
