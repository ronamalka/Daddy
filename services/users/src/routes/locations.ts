import { Router, Request, Response } from "express";
import { DISTRICTS, getDistrictCode, getDistrictName } from "../../../shared/districts";

interface GovRecord {
  city_code: number;
  city_name_he: string;
  region_code: number;
  region_name: string;
}

let cachedCities: { code: number; name: string; districtCode: number; districtName: string; regionName: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24;

export const locationsRoutes = Router();

locationsRoutes.get("/", async (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;

  if (!cachedCities || Date.now() - cacheTime > CACHE_TTL) {
    const apiRes = await fetch(
      "https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&limit=1500"
    );

    if (!apiRes.ok) {
      res.status(502).json({ error: "Failed to fetch cities" });
      return;
    }

    const data = (await apiRes.json()) as { result: { records: GovRecord[] } };
    const records: GovRecord[] = data.result.records;

    cachedCities = records
      .map((r) => ({
        code: r.city_code,
        name: r.city_name_he.trim(),
        districtCode: getDistrictCode(r.region_code),
        districtName: getDistrictName(getDistrictCode(r.region_code)),
        regionName: r.region_name.trim(),
      }))
      .filter((c) => c.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "he"));

    cacheTime = Date.now();
  }

  const districts = Object.entries(DISTRICTS).map(([code, name]) => ({
    code: Number(code),
    name,
  }));

  let cities = cachedCities;
  if (district) {
    const districtCode = Number(district);
    cities = cities.filter((c) => c.districtCode === districtCode);
  }

  res.json({ districts, cities });
});
