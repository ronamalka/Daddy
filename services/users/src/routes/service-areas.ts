import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for the areas a seller works in. */
export const serviceAreasRoutes = Router();

/** List the current user's service areas. */
serviceAreasRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const areas = await prisma.serviceArea.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
  });

  res.json(areas);
});

/** Replace the current user's service areas. */
serviceAreasRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { areas } = req.body;

  if (!Array.isArray(areas)) {
    res.status(400).json({ error: "Invalid areas" });
    return;
  }

  await prisma.serviceArea.deleteMany({ where: { userId } });

  if (areas.length > 0) {
    await prisma.serviceArea.createMany({
      data: areas.map((a: { districtCode: number; districtName: string; cityCode?: number; cityName?: string }) => ({
        userId,
        districtCode: a.districtCode,
        districtName: a.districtName,
        cityCode: a.cityCode ?? null,
        cityName: a.cityName ?? null,
      })),
    });
  }

  const saved = await prisma.serviceArea.findMany({
    where: { userId },
    orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
  });

  res.json(saved);
});
