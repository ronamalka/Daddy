import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for analytics dashboards — admin only. */
export function analyticsRoutes() {
  const router = Router();

  router.use(requireAdmin);

  /** Return funnel step counts for a given period (default 30 days). */
  router.get("/funnel", async (req: Request, res: Response) => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

      const steps = await Promise.all([
        prisma.analyticsEvent.count({ where: { eventName: "signup_completed", createdAt: { gte: since } } }),
        prisma.analyticsEvent.count({ where: { eventName: "request.created", createdAt: { gte: since } } }),
        prisma.analyticsEvent.count({ where: { eventName: "order.created", createdAt: { gte: since } } }),
        prisma.analyticsEvent.count({ where: { eventName: "order.completed", createdAt: { gte: since } } }),
      ]);

      res.json({
        period: `${period}d`,
        steps: [
          { name: "signed_up", count: steps[0] },
          { name: "posted_request", count: steps[1] },
          { name: "order_created", count: steps[2] },
          { name: "order_completed", count: steps[3] },
        ],
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch funnel data" });
    }
  });

  /** Return revenue summary for a given period (default 30 days). */
  router.get("/revenue", async (req: Request, res: Response) => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

      const events = await prisma.analyticsEvent.findMany({
        where: {
          eventName: "order.completed",
          createdAt: { gte: since },
        },
        select: { properties: true, createdAt: true },
      });

      const totalRevenue = events.reduce((sum: number, e: any) => {
        return sum + (e.properties?.commission_amount || 0);
      }, 0);

      res.json({
        period: `${period}d`,
        totalRevenue,
        ordersCompleted: events.length,
        avgOrderValue: events.length > 0 ? Math.round(totalRevenue / events.length) : 0,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  /** Overview: orders this month, revenue this month, with comparison to previous period. */
  router.get("/overview", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        ordersThisMonth,
        ordersPrevMonth,
        completedThisMonth,
        completedPrevMonth,
        totalOrders,
      ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.order.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.order.findMany({
          where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
          select: { price: true, commissionAmount: true },
        }),
        prisma.order.findMany({
          where: { status: "COMPLETED", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
          select: { price: true, commissionAmount: true },
        }),
        prisma.order.count(),
      ]);

      const revenueThisMonth = completedThisMonth.reduce((s, o) => s + o.price, 0);
      const revenuePrevMonth = completedPrevMonth.reduce((s, o) => s + o.price, 0);
      const commissionThisMonth = completedThisMonth.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      const commissionPrevMonth = completedPrevMonth.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      const avgOrderValue = completedThisMonth.length > 0
        ? Math.round(revenueThisMonth / completedThisMonth.length)
        : 0;
      const avgOrderValuePrev = completedPrevMonth.length > 0
        ? Math.round(revenuePrevMonth / completedPrevMonth.length)
        : 0;

      const conversionRate = ordersThisMonth > 0
        ? Math.round((completedThisMonth.length / ordersThisMonth) * 100)
        : 0;
      const conversionRatePrev = ordersPrevMonth > 0
        ? Math.round((completedPrevMonth.length / ordersPrevMonth) * 100)
        : 0;

      res.json({
        totalOrders,
        ordersThisMonth,
        ordersPrevMonth,
        revenueThisMonth,
        revenuePrevMonth,
        commissionThisMonth,
        commissionPrevMonth,
        completedThisMonth: completedThisMonth.length,
        completedPrevMonth: completedPrevMonth.length,
        avgOrderValue,
        avgOrderValuePrev,
        conversionRate,
        conversionRatePrev,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch orders overview" });
    }
  });

  /** Daily orders & revenue time series for last N days (default 90). */
  router.get("/timeseries", async (req: Request, res: Response) => {
    try {
      const days = Math.min(parseInt(req.query.days as string) || 90, 365);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, price: true, status: true, commissionAmount: true },
        orderBy: { createdAt: "asc" },
      });

      const dailyMap: Record<string, { orders: number; completed: number; revenue: number; commission: number }> = {};

      for (let i = 0; i < days; i++) {
        const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = { orders: 0, completed: 0, revenue: 0, commission: 0 };
      }

      for (const o of orders) {
        const key = o.createdAt.toISOString().slice(0, 10);
        if (dailyMap[key]) {
          dailyMap[key].orders++;
          if (o.status === "COMPLETED") {
            dailyMap[key].completed++;
            dailyMap[key].revenue += o.price;
            dailyMap[key].commission += o.commissionAmount || 0;
          }
        }
      }

      const series = Object.entries(dailyMap).map(([date, counts]) => ({
        date,
        ...counts,
      }));

      res.json({ days, series });
    } catch {
      res.status(500).json({ error: "Failed to fetch timeseries" });
    }
  });

  /** Orders breakdown by status. */
  router.get("/by-status", async (_req: Request, res: Response) => {
    try {
      const statuses = ["PENDING", "IN_PROGRESS", "ON_THE_WAY", "DELIVERED", "COMPLETED", "CANCELLED"] as const;

      const counts = await Promise.all(
        statuses.map((status) => prisma.order.count({ where: { status } })),
      );

      const result: Record<string, number> = {};
      statuses.forEach((s, i) => { result[s] = counts[i]; });

      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to fetch orders by status" });
    }
  });

  /** Commission analytics: total collected, by tier, avg per order. */
  router.get("/commission", async (_req: Request, res: Response) => {
    try {
      const completed = await prisma.order.findMany({
        where: { status: "COMPLETED" },
        select: { price: true, commissionAmount: true, commissionRate: true },
      });

      const totalCollected = completed.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      const avgPerOrder = completed.length > 0 ? Math.round(totalCollected / completed.length) : 0;
      const totalRevenue = completed.reduce((s, o) => s + o.price, 0);
      const effectiveRate = totalRevenue > 0 ? totalCollected / totalRevenue : 0;

      const byRate: Record<string, { count: number; total: number }> = {};
      for (const o of completed) {
        const rate = o.commissionRate != null ? `${Math.round(o.commissionRate * 100)}%` : "unknown";
        if (!byRate[rate]) { byRate[rate] = { count: 0, total: 0 }; }
        byRate[rate].count++;
        byRate[rate].total += o.commissionAmount || 0;
      }

      res.json({
        totalCollected,
        avgPerOrder,
        totalRevenue,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        completedOrders: completed.length,
        byRate,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch commission analytics" });
    }
  });

  /** LTV data: avg buyer spend, avg seller earnings. */
  router.get("/ltv", async (_req: Request, res: Response) => {
    try {
      const completed = await prisma.order.findMany({
        where: { status: "COMPLETED" },
        select: { buyerId: true, sellerId: true, price: true, commissionAmount: true },
      });

      const buyerSpend: Record<string, number> = {};
      const sellerEarnings: Record<string, number> = {};

      for (const o of completed) {
        buyerSpend[o.buyerId] = (buyerSpend[o.buyerId] || 0) + o.price;
        const sellerNet = o.price - (o.commissionAmount || 0);
        sellerEarnings[o.sellerId] = (sellerEarnings[o.sellerId] || 0) + sellerNet;
      }

      const buyerIds = Object.keys(buyerSpend);
      const sellerIds = Object.keys(sellerEarnings);

      const avgBuyerSpend = buyerIds.length > 0
        ? Math.round(Object.values(buyerSpend).reduce((a, b) => a + b, 0) / buyerIds.length)
        : 0;
      const avgSellerEarnings = sellerIds.length > 0
        ? Math.round(Object.values(sellerEarnings).reduce((a, b) => a + b, 0) / sellerIds.length)
        : 0;

      res.json({
        avgBuyerSpend,
        avgSellerEarnings,
        uniqueBuyers: buyerIds.length,
        uniqueSellers: sellerIds.length,
        totalGMV: completed.reduce((s, o) => s + o.price, 0),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch LTV data" });
    }
  });

  /** Count analytics events by name for a given period (for cross-service funnel). */
  router.get("/event-counts", async (req: Request, res: Response) => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      const names = (req.query.names as string || "").split(",").filter(Boolean);
      if (names.length === 0) {
        res.json({ counts: {} });
        return;
      }
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
      const counts: Record<string, number> = {};
      await Promise.all(
        names.map(async (name) => {
          counts[name] = await prisma.analyticsEvent.count({
            where: { eventName: name, createdAt: { gte: since } },
          });
        }),
      );
      res.json({ counts });
    } catch {
      res.status(500).json({ error: "Failed to fetch event counts" });
    }
  });

  return router;
}
