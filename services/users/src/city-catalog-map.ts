import { getDistrictCode, getDistrictName } from "../../shared/districts";

export type CatalogCity = {
  code: number;
  name: string;
  districtCode: number;
  districtName: string;
  regionName: string;
};

export interface GovCityRecord {
  city_code: number;
  city_name_he: string;
  region_code: number;
  region_name: string;
}

export const GOV_CITIES_URL =
  "https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&limit=1500";
export const CITY_REFRESH_MS = 1000 * 60 * 60 * 24;

/** Map a data.gov.il datastore page into picker rows. */
export function mapGovRecords(records: GovCityRecord[]): CatalogCity[] {
  const seen = new Set<number>();
  const cities: CatalogCity[] = [];
  for (const record of records) {
    const name = record.city_name_he?.trim() ?? "";
    const code = Number(record.city_code);
    if (!name || !Number.isFinite(code) || seen.has(code)) continue;
    seen.add(code);
    const districtCode = getDistrictCode(Number(record.region_code));
    cities.push({
      code,
      name,
      districtCode,
      districtName: getDistrictName(districtCode),
      regionName: record.region_name?.trim() ?? "",
    });
  }
  return cities.sort((a, b) => a.name.localeCompare(b.name, "he"));
}

/** True when we have never pulled the government list, or the last pull is older than a day. */
export function shouldRefreshFromGov(fetchedAt: Date | null, now = Date.now(), ttlMs = CITY_REFRESH_MS): boolean {
  if (!fetchedAt) return true;
  return now - fetchedAt.getTime() > ttlMs;
}
