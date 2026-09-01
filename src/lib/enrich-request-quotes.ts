import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { quoteAreaOverlap, type AreaOverlap } from "@/lib/quote-compare";

export type ServiceAreaRow = {
  districtCode: number;
  districtName: string;
  cityCode: number | null;
  cityName: string | null;
};

export type QuotePerson = { id: string; name: string; avatar?: string | null };

export type QuoteSeller = QuotePerson & {
  avgRating: number;
  reviewCount: number;
  serviceAreas: ServiceAreaRow[];
  areaOverlap: AreaOverlap;
};

type ProxyFn = typeof proxyRequest;

type RawResponse = {
  sellerId: string;
  [key: string]: unknown;
};

export type RequestWithQuoteSellers = {
  buyerId: string;
  cityCode?: number | null;
  districtCode?: number | null;
  responses?: RawResponse[];
  [key: string]: unknown;
};

const emptySeller = (id: string): QuoteSeller => ({
  id,
  name: "משתמש",
  avatar: null,
  avgRating: 0,
  reviewCount: 0,
  serviceAreas: [],
  areaOverlap: "none",
});

/** Reads public name/avatar, or a fallback if the lookup fails. */
export async function loadPerson(id: string, proxy: ProxyFn = proxyRequest): Promise<QuotePerson> {
  const { data } = await proxy(USERS_SERVICE, `/sellers/${id}`);
  if (data?.id && typeof data.name === "string") {
    return { id: data.id, name: data.name, avatar: data.avatar ?? null };
  }
  return { id, name: "משתמש", avatar: null };
}

/** Keeps only well-formed service-area rows from a seller profile. */
export function parseServiceAreas(raw: unknown): ServiceAreaRow[] {
  if (!Array.isArray(raw)) return [];
  const areas: ServiceAreaRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const districtCode = (row as { districtCode?: unknown }).districtCode;
    const districtName = (row as { districtName?: unknown }).districtName;
    if (typeof districtCode !== "number" || typeof districtName !== "string") continue;
    const cityCodeRaw = (row as { cityCode?: unknown }).cityCode;
    const cityNameRaw = (row as { cityName?: unknown }).cityName;
    areas.push({
      districtCode,
      districtName,
      cityCode: typeof cityCodeRaw === "number" ? cityCodeRaw : null,
      cityName: typeof cityNameRaw === "string" ? cityNameRaw : null,
    });
  }
  return areas;
}

/** Rating, review count, and area overlap for one quoting daddy. */
export async function loadQuoteSeller(
  id: string,
  request: { cityCode?: number | null; districtCode?: number | null },
  proxy: ProxyFn = proxyRequest
): Promise<QuoteSeller> {
  const [{ data: seller }, { data: reviews }] = await Promise.all([
    proxy(USERS_SERVICE, `/sellers/${id}`),
    proxy(GIGS_SERVICE, `/reviews/by-seller/${id}`),
  ]);
  const person =
    seller?.id && typeof seller.name === "string"
      ? { id: seller.id as string, name: seller.name as string, avatar: seller.avatar ?? null }
      : { id, name: "משתמש", avatar: null };
  const serviceAreas = parseServiceAreas(seller?.serviceAreas);
  return {
    ...person,
    avgRating: typeof reviews?.avgRating === "number" ? reviews.avgRating : 0,
    reviewCount: typeof reviews?.reviewCount === "number" ? reviews.reviewCount : 0,
    serviceAreas,
    areaOverlap: quoteAreaOverlap(serviceAreas, {
      cityCode: request.cityCode ?? null,
      districtCode: request.districtCode ?? null,
    }),
  };
}

/** Adds buyer name plus rating / area overlap on each quote seller. */
export async function enrichRequestWithQuoteSellers<T extends RequestWithQuoteSellers>(
  request: T,
  proxy: ProxyFn = proxyRequest
): Promise<T & { buyer: QuotePerson; responses: (RawResponse & { seller: QuoteSeller })[] }> {
  const sellerIds = [...new Set((request.responses || []).map((row) => row.sellerId))];
  const [buyer, ...sellers] = await Promise.all([
    loadPerson(request.buyerId, proxy),
    ...sellerIds.map((id) => loadQuoteSeller(id, request, proxy)),
  ]);
  const sellerMap = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));
  return {
    ...request,
    buyer,
    responses: (request.responses || []).map((row) => ({
      ...row,
      seller: sellerMap[row.sellerId] || emptySeller(row.sellerId),
    })),
  };
}
