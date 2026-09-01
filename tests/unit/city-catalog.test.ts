import { describe, it, expect } from "vitest";
import {
  mapGovRecords,
  shouldRefreshFromGov,
  isMissingCatalogSchema,
  CITY_REFRESH_MS,
} from "../../services/users/src/city-catalog-map";

describe("mapGovRecords", () => {
  it("maps CBS region codes to districts and drops empty names", () => {
    const cities = mapGovRecords([
      { city_code: 5000, city_name_he: " תל אביב - יפו ", region_code: 51, region_name: " תל אביב " },
      { city_code: 9000, city_name_he: "באר שבע", region_code: 62, region_name: "באר שבע" },
      { city_code: 1, city_name_he: "   ", region_code: 51, region_name: "תל אביב" },
      { city_code: 5000, city_name_he: "duplicate", region_code: 51, region_name: "תל אביב" },
    ]);
    expect(cities).toEqual([
      {
        code: 9000,
        name: "באר שבע",
        districtCode: 6,
        districtName: "הדרום",
        regionName: "באר שבע",
      },
      {
        code: 5000,
        name: "תל אביב - יפו",
        districtCode: 5,
        districtName: "תל אביב",
        regionName: "תל אביב",
      },
    ]);
  });
});

describe("isMissingCatalogSchema", () => {
  it("treats Prisma P2021 and Postgres missing-relation errors as schema-not-ready", () => {
    expect(isMissingCatalogSchema({ code: "P2021" })).toBe(true);
    expect(isMissingCatalogSchema({ message: 'relation "public.City" does not exist' })).toBe(true);
    expect(isMissingCatalogSchema({ message: "relation \"public.CityCatalog\" does not exist" })).toBe(true);
    expect(isMissingCatalogSchema({ code: "P2002" })).toBe(false);
    expect(isMissingCatalogSchema(new Error("connection refused"))).toBe(false);
  });
});

describe("shouldRefreshFromGov", () => {
  it("refreshes when the catalog was never pulled from the government", () => {
    expect(shouldRefreshFromGov(null)).toBe(true);
  });

  it("keeps a fresh pull and refreshes after the daily TTL", () => {
    const now = Date.parse("2026-09-01T10:00:00Z");
    expect(shouldRefreshFromGov(new Date(now - 1000), now)).toBe(false);
    expect(shouldRefreshFromGov(new Date(now - CITY_REFRESH_MS - 1), now)).toBe(true);
  });
});

describe("bundled snapshot", () => {
  it("includes Tel Aviv, Be'er Sheva, and Eilat so pickers work offline", async () => {
    const { default: snapshot } = await import("../../services/users/src/data/israeli-cities.json");
    const byCode = new Map(snapshot.map((city) => [city.code, city]));
    expect(byCode.get(5000)?.name).toBe("תל אביב - יפו");
    expect(byCode.get(9000)?.districtCode).toBe(6);
    expect(byCode.get(2600)?.name).toBe("אילת");
    expect(snapshot.length).toBeGreaterThan(1000);
  });
});
