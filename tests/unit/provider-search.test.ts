import { describe, it, expect } from "vitest";
import { haversineKm } from "../../services/users/src/city-coords";
import {
  extraProviderWhere,
  matchTierFor,
  parseProviderSearchQuery,
  providerDistanceKm,
  providerTags,
  serviceAreaWhere,
  sortProviderRows,
  startingPriceFor,
} from "../../services/users/src/provider-search";

const BEER_SHEVA = 9000;
const EILAT = 2600;
const TEL_AVIV = 5000;
const SOUTH = 6;
const TEL_AVIV_DISTRICT = 5;

describe("parseProviderSearchQuery", () => {
  it("defaults to distance sort when a city is set", () => {
    const parsed = parseProviderSearchQuery({ cityCode: "5000", district: "5" });
    expect(parsed.sortBy).toBe("distance");
    expect(parsed.originCityCode).toBe(5000);
    expect(parsed.pricing).toBe("all");
  });

  it("defaults to starting-price sort without a city", () => {
    expect(parseProviderSearchQuery({}).sortBy).toBe("price");
    expect(parseProviderSearchQuery({ sortBy: "rating" }).sortBy).toBe("rating");
  });

  it("ignores unknown sort and pricing values", () => {
    const parsed = parseProviderSearchQuery({ sortBy: "newest", pricing: "packages" });
    expect(parsed.sortBy).toBe("price");
    expect(parsed.pricing).toBe("all");
  });
});

describe("serviceAreaWhere", () => {
  it("includes the city and whole-district coverage, not every city in the south", () => {
    expect(serviceAreaWhere({ cityCode: String(BEER_SHEVA), district: String(SOUTH) })).toEqual({
      some: {
        OR: [{ cityCode: BEER_SHEVA }, { districtCode: SOUTH, cityCode: null }],
      },
    });
  });
});

describe("extraProviderWhere", () => {
  it("filters ServicePrice for the selected service", () => {
    const parsed = parseProviderSearchQuery({
      service: "furniture-assembly",
      minPrice: "100",
      maxPrice: "250",
    });
    expect(extraProviderWhere(parsed)).toEqual([
      {
        servicePrices: {
          some: {
            serviceSlug: "furniture-assembly",
            price: { gt: 0, gte: 100, lte: 250 },
          },
        },
      },
    ]);
  });

  it("keeps quote-only daddies (no listed price for this service)", () => {
    const parsed = parseProviderSearchQuery({ service: "tv-mounting", pricing: "quote" });
    expect(extraProviderWhere(parsed)).toEqual([
      {
        NOT: {
          servicePrices: { some: { serviceSlug: "tv-mounting", price: { gt: 0 } } },
        },
      },
    ]);
  });

  it("requires a listed price when filtering to fixed-price daddies", () => {
    const parsed = parseProviderSearchQuery({ service: "tv-mounting", pricing: "fixed" });
    expect(extraProviderWhere(parsed)).toEqual([
      {
        servicePrices: {
          some: { serviceSlug: "tv-mounting", price: { gt: 0 } },
        },
      },
    ]);
  });

  it("ignores a price range when the buyer asked for quotes only", () => {
    const parsed = parseProviderSearchQuery({
      service: "tv-mounting",
      pricing: "quote",
      minPrice: "50",
      maxPrice: "100",
    });
    expect(extraProviderWhere(parsed)).toEqual([
      {
        NOT: {
          servicePrices: { some: { serviceSlug: "tv-mounting", price: { gt: 0 } } },
        },
      },
    ]);
  });

  it("adds no extra clause when pricing is all and there is no range", () => {
    expect(extraProviderWhere(parseProviderSearchQuery({ service: "tv-mounting" }))).toEqual([]);
  });
});

describe("startingPriceFor and tags", () => {
  const prices = [
    { serviceSlug: "furniture-assembly", price: 200 },
    { serviceSlug: "tv-mounting", price: 250 },
  ];

  it("uses the searched service, not the cheapest unrelated one", () => {
    expect(startingPriceFor(prices, "tv-mounting")).toBe(250);
    expect(startingPriceFor(prices)).toBe(200);
    expect(startingPriceFor(prices, "lawn-mowing")).toBeNull();
  });

  it("tags a listed price as fixed while still accepting quotes", () => {
    expect(providerTags(200)).toEqual({ hasFixedPrice: true, acceptsQuotes: true });
    expect(providerTags(null)).toEqual({ hasFixedPrice: false, acceptsQuotes: true });
  });
});

describe("distance", () => {
  it("puts Be'er Sheva far from Eilat instead of treating both as The South", () => {
    const km = haversineKm(
      { lat: 31.253, lng: 34.792 },
      { lat: 29.557, lng: 34.951 }
    );
    expect(km).toBeGreaterThan(180);
    expect(km).toBeLessThan(280);
  });

  it("is zero for an exact city match and uses home-city km for district-wide daddies", () => {
    expect(
      providerDistanceKm({
        originCityCode: EILAT,
        originDistrictCode: SOUTH,
        sellerCityCode: EILAT,
        sellerDistrictCode: SOUTH,
        matchTier: "city",
      })
    ).toBe(0);

    const fromBeerSheva = providerDistanceKm({
      originCityCode: EILAT,
      originDistrictCode: SOUTH,
      sellerCityCode: BEER_SHEVA,
      sellerDistrictCode: SOUTH,
      matchTier: "district",
    });
    expect(fromBeerSheva).toBeGreaterThan(180);
  });

  it("matches a Tel Aviv city listing and a Center-wide daddy for a Tel Aviv search", () => {
    expect(
      matchTierFor([{ cityCode: TEL_AVIV, districtCode: TEL_AVIV_DISTRICT }], {
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
      })
    ).toBe("city");
    expect(
      matchTierFor([{ cityCode: null, districtCode: TEL_AVIV_DISTRICT }], {
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
      })
    ).toBe("district");
  });
});

describe("sortProviderRows", () => {
  const rows = [
    { id: "far", startingPrice: 80, distanceKm: 240, matchTier: "district" as const, avgRating: 9 },
    { id: "city", startingPrice: 200, distanceKm: 0, matchTier: "city" as const, avgRating: 7 },
    { id: "quote", startingPrice: null, distanceKm: 12, matchTier: "district" as const, avgRating: 8 },
  ];

  it("sorts by distance with city matches first", () => {
    expect(sortProviderRows(rows, "distance").map((r) => r.id)).toEqual(["city", "quote", "far"]);
  });

  it("sorts by starting price and parks quote-only at the end", () => {
    expect(sortProviderRows(rows, "price").map((r) => r.id)).toEqual(["far", "city", "quote"]);
  });

  it("sorts by rating", () => {
    expect(sortProviderRows(rows, "rating").map((r) => r.id)).toEqual(["far", "quote", "city"]);
  });
});
