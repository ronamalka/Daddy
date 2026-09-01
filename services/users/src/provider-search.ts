import { sellerMatchTier, type AreaRow, type MatchTier } from "./request-match";
import { coordsFor, haversineKm } from "./city-coords";

export type ProviderSort = "distance" | "price" | "rating";
export type PricingFilter = "all" | "fixed" | "quote";

export interface ProviderSearchQuery {
  service?: string;
  district?: string;
  cityCode?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  pricing?: string;
}

export interface ParsedProviderSearch {
  service?: string;
  district?: string;
  cityCode?: string;
  originCityCode: number | null;
  originDistrictCode: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: ProviderSort;
  pricing: PricingFilter;
}

export interface PricedService {
  serviceSlug: string;
  price: number;
}

const SORTS = new Set<ProviderSort>(["distance", "price", "rating"]);
const PRICING = new Set<PricingFilter>(["all", "fixed", "quote"]);

function optionalNumber(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function optionalCode(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : undefined;
}

/** Normalizes homepage / providers query params. */
export function parseProviderSearchQuery(q: ProviderSearchQuery): ParsedProviderSearch {
  const cityCode = optionalCode(q.cityCode);
  const district = optionalCode(q.district);
  const originCityCode = cityCode ? Number(cityCode) : null;
  const originDistrictCode = district ? Number(district) : null;
  const sortRaw = q.sortBy as ProviderSort | undefined;
  const pricingRaw = q.pricing as PricingFilter | undefined;
  return {
    service: q.service?.trim() || undefined,
    district,
    cityCode,
    originCityCode,
    originDistrictCode,
    minPrice: optionalNumber(q.minPrice),
    maxPrice: optionalNumber(q.maxPrice),
    sortBy: sortRaw && SORTS.has(sortRaw) ? sortRaw : originCityCode ? "distance" : "price",
    pricing: pricingRaw && PRICING.has(pricingRaw) ? pricingRaw : "all",
  };
}

/** City search includes that city and daddies who cover the whole district. */
export function serviceAreaWhere(filters: { cityCode?: string; district?: string }) {
  const cityCode = filters.cityCode ? Number(filters.cityCode) : undefined;
  const districtCode = filters.district ? Number(filters.district) : undefined;
  if (cityCode) {
    return {
      some: {
        OR: [
          { cityCode },
          ...(districtCode != null ? [{ districtCode, cityCode: null as number | null }] : []),
        ],
      },
    };
  }
  if (districtCode != null) {
    return { some: { districtCode } };
  }
  return { some: {} };
}

/** Extra Prisma filters for price range and fixed-price vs quote-only. */
export function extraProviderWhere(parsed: ParsedProviderSearch): object[] {
  const extra: object[] = [];
  const { service, minPrice, maxPrice, pricing } = parsed;
  const hasRange = minPrice != null || maxPrice != null;

  if (pricing === "quote") {
    extra.push({
      NOT: {
        servicePrices: {
          some: service ? { serviceSlug: service, price: { gt: 0 } } : { price: { gt: 0 } },
        },
      },
    });
    return extra;
  }

  if (pricing === "fixed" || hasRange) {
    extra.push({
      servicePrices: {
        some: {
          ...(service ? { serviceSlug: service } : {}),
          price: {
            gt: 0,
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        },
      },
    });
  }

  return extra;
}

/** Lowest ServicePrice for the searched service, or the daddy's cheapest listed price. */
export function startingPriceFor(prices: PricedService[], service?: string): number | null {
  const relevant = service ? prices.filter((p) => p.serviceSlug === service && p.price > 0) : prices.filter((p) => p.price > 0);
  if (relevant.length === 0) return null;
  return Math.min(...relevant.map((p) => p.price));
}

/** Fixed-price means a ServicePrice for this search; every ready daddy still takes quotes. */
export function providerTags(startingPrice: number | null): { hasFixedPrice: boolean; acceptsQuotes: boolean } {
  return {
    hasFixedPrice: startingPrice != null,
    acceptsQuotes: true,
  };
}

/** Kilometers from the buyer's city: 0 for an exact city match, else home-city distance. */
export function providerDistanceKm(opts: {
  originCityCode: number | null;
  originDistrictCode: number | null;
  sellerCityCode: number | null;
  sellerDistrictCode: number | null;
  matchTier: MatchTier | null;
}): number | null {
  if (opts.originCityCode == null) return null;
  if (opts.matchTier === "city") return 0;
  const from = coordsFor(opts.originCityCode, opts.originDistrictCode);
  const to = coordsFor(opts.sellerCityCode, opts.sellerDistrictCode);
  if (!from || !to) return opts.matchTier === "district" ? 80 : null;
  return Math.round(haversineKm(from, to) * 10) / 10;
}

export function matchTierFor(
  areas: AreaRow[],
  origin: { cityCode: number | null; districtCode: number | null }
): MatchTier | null {
  if (origin.cityCode == null && origin.districtCode == null) return null;
  return sellerMatchTier(areas, origin);
}

export interface RankableProvider {
  startingPrice: number | null;
  distanceKm: number | null;
  matchTier: MatchTier | null;
  avgRating?: number;
}

/** Sorts one result list: distance, starting price, or rating. */
export function sortProviderRows<T extends RankableProvider>(rows: T[], sortBy: ProviderSort): T[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortBy === "price") {
      const ap = a.startingPrice ?? Number.POSITIVE_INFINITY;
      const bp = b.startingPrice ?? Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    }
    if (sortBy === "rating") {
      const ar = b.avgRating ?? 0;
      const br = a.avgRating ?? 0;
      if (ar !== br) return ar - br;
      const ap = a.startingPrice ?? Number.POSITIVE_INFINITY;
      const bp = b.startingPrice ?? Number.POSITIVE_INFINITY;
      return ap - bp;
    }
    const rank = (row: T) => {
      if (row.matchTier === "city") return 0;
      if (row.distanceKm != null) return 1;
      if (row.matchTier === "district") return 2;
      return 3;
    };
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
  });
  return copy;
}
