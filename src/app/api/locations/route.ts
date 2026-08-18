import { NextResponse } from "next/server";
import { getDistrictCode, getDistrictName, DISTRICTS } from "@/lib/districts";

interface GovRecord {
  city_code: number;
  city_name_he: string;
  region_code: number;
  region_name: string;
}

let cachedCities: { code: number; name: string; districtCode: number; districtName: string; regionName: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");

  if (!cachedCities || Date.now() - cacheTime > CACHE_TTL) {
    const res = await fetch(
      "https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&limit=1500",
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch cities" }, { status: 502 });
    }

    const data = await res.json();
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

  return NextResponse.json({ districts, cities });
}
