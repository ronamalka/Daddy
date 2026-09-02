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

  return router;
}
