import { prisma } from "./db";
import { logger } from "../../shared/logger";
import snapshot from "./data/israeli-cities.json";
import {
  CITY_REFRESH_MS,
  GOV_CITIES_URL,
  isMissingCatalogSchema,
  mapGovRecords,
  shouldRefreshFromGov,
  type CatalogCity,
  type GovCityRecord,
} from "./city-catalog-map";

export {
  CITY_REFRESH_MS,
  GOV_CITIES_URL,
  isMissingCatalogSchema,
  mapGovRecords,
  shouldRefreshFromGov,
};
export type { CatalogCity, GovCityRecord };

const bundledCities = snapshot as CatalogCity[];

async function writeCities(cities: CatalogCity[], source: "snapshot" | "gov") {
  if (cities.length === 0) return;
  const fetchedAt = source === "gov" ? new Date() : null;
  await prisma.$transaction([
    prisma.city.deleteMany(),
    prisma.city.createMany({ data: cities }),
    prisma.cityCatalog.upsert({
      where: { id: 1 },
      create: { id: 1, source, fetchedAt },
      update: { source, fetchedAt },
    }),
  ]);
}

/** Load the committed CBS snapshot if the table is empty so pickers never wait on data.gov.il. */
export async function ensureCityCatalog(): Promise<void> {
  const count = await prisma.city.count();
  if (count > 0) return;
  if (bundledCities.length === 0) return;
  await prisma.$transaction([
    prisma.city.createMany({ data: bundledCities, skipDuplicates: true }),
    prisma.cityCatalog.upsert({
      where: { id: 1 },
      create: { id: 1, source: "snapshot", fetchedAt: null },
      update: {},
    }),
  ]);
}

/** Cities for GET /locations — database only. */
export async function listCatalogCities(districtCode?: number): Promise<CatalogCity[]> {
  await ensureCityCatalog();
  return prisma.city.findMany({
    where: districtCode != null && Number.isFinite(districtCode) ? { districtCode } : undefined,
    orderBy: { name: "asc" },
    select: { code: true, name: true, districtCode: true, districtName: true, regionName: true },
  });
}

/** Replace the table from data.gov.il. Returns false and keeps existing rows on failure. */
export async function refreshCityCatalogFromGov(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const apiRes = await fetchImpl(GOV_CITIES_URL, { signal: AbortSignal.timeout(8000) });
      if (!apiRes.ok) {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      const data = (await apiRes.json()) as { result?: { records?: GovCityRecord[] } };
      const cities = mapGovRecords(data.result?.records ?? []);
      if (cities.length === 0) {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      await writeCities(cities, "gov");
      return true;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return false;
}

/** Background path: snapshot if empty, then gov if the last successful pull is stale. Never throws — schema may not exist yet. */
export async function refreshCityCatalogIfStale(): Promise<void> {
  try {
    await ensureCityCatalog();
    const meta = await prisma.cityCatalog.findUnique({ where: { id: 1 } });
    if (!shouldRefreshFromGov(meta?.fetchedAt ?? null)) return;
    await refreshCityCatalogFromGov();
  } catch (err) {
    if (isMissingCatalogSchema(err)) {
      logger.warn("City catalog skipped until schema is applied");
      return;
    }
    logger.warn({ err: err instanceof Error ? err.message : err }, "City catalog refresh failed");
  }
}

/** Fill an empty table from the snapshot, then refresh from the government once a day. */
export function startCityCatalogRefresh(): void {
  void refreshCityCatalogIfStale();
  setInterval(() => {
    void refreshCityCatalogIfStale();
  }, CITY_REFRESH_MS);
}
