import { Router, Request, Response } from "express";
import { DISTRICTS } from "../../../shared/districts";
import { listCatalogCities } from "../city-catalog";

function districtList() {
  return Object.entries(DISTRICTS).map(([code, name]) => ({
    code: Number(code),
    name,
  }));
}

/** Routes for Israeli districts and cities. */
export const locationsRoutes = Router();

/** Return districts and cities from the local catalog. Never calls data.gov.il on this path. */
locationsRoutes.get("/", async (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;
  const districtCode = district ? Number(district) : undefined;
  const cities = await listCatalogCities(
    districtCode != null && Number.isFinite(districtCode) ? districtCode : undefined
  );
  res.json({ districts: districtList(), cities });
});
