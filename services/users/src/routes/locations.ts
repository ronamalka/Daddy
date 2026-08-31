import { Router, Request, Response } from "express";
import { DISTRICTS, getDistrictCode, getDistrictName } from "../../../shared/districts";

interface GovRecord {
  city_code: number;
  city_name_he: string;
  region_code: number;
  region_name: string;
}

type City = { code: number; name: string; districtCode: number; districtName: string; regionName: string };

let cachedCities: City[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24;
const GOV_CITIES_URL =
  "https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&limit=1500";

function districtList() {
  return Object.entries(DISTRICTS).map(([code, name]) => ({
    code: Number(code),
    name,
  }));
}

/** Pull the government city list, retrying when data.gov.il is slow or down. */
async function refreshGovCities(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const apiRes = await fetch(GOV_CITIES_URL, { signal: AbortSignal.timeout(8000) });
      if (!apiRes.ok) {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }

      const data = (await apiRes.json()) as { result: { records: GovRecord[] } };
      cachedCities = data.result.records
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
      return true;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return false;
}

/** Routes for Israeli districts and cities. */
export const locationsRoutes = Router();

/** Return districts and cities, using a cached government city list. */
locationsRoutes.get("/", async (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;

  if (!cachedCities || Date.now() - cacheTime > CACHE_TTL) {
    const refreshed = await refreshGovCities();
    // Keep serving districts (and a stale city list if we have one) so a
    // data.gov.il outage does not 502 the picker or CI.
    if (!refreshed && !cachedCities) {
      res.json({ districts: districtList(), cities: [] });
      return;
    }
  }

  let cities = cachedCities ?? [];
  if (district) {
    const districtCode = Number(district);
    cities = cities.filter((c) => c.districtCode === districtCode);
  }

  res.json({ districts: districtList(), cities });
});
