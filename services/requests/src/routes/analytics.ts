import { Router, Request, Response } from "express";
import { requireAdmin } from "../../../shared/middleware";
import { prisma } from "../index";

export const requestAnalyticsRoutes = Router();

requestAnalyticsRoutes.use(requireAdmin);

/** Count analytics events by name for a given period (for cross-service funnel). */
requestAnalyticsRoutes.get("/event-counts", async (req: Request, res: Response) => {
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
