import { getServiceBySlug } from "../../shared/services";

export const MAX_NEARBY_REQUEST_NOTIFY = 20;
export const NOTIFICATION_TYPE_NEARBY_REQUEST = "NEW_NEARBY_REQUEST";

export type AreaRow = { cityCode: number | null; districtCode: number };
export type MatchTier = "city" | "district";

export interface NearbyRequestLocation {
  cityCode: number | null;
  districtCode: number | null;
}

/** Classifies a seller's coverage against a request: city, whole-district, or no overlap. */
export function sellerMatchTier(areas: AreaRow[], request: NearbyRequestLocation): MatchTier | null {
  if (request.cityCode != null) {
    if (areas.some((area) => area.cityCode === request.cityCode)) return "city";
    if (
      request.districtCode != null &&
      areas.some((area) => area.districtCode === request.districtCode && area.cityCode == null)
    ) {
      return "district";
    }
    return null;
  }
  if (request.districtCode != null) {
    if (areas.some((area) => area.districtCode === request.districtCode && area.cityCode == null)) {
      return "district";
    }
  }
  return null;
}

/** City-exact matches first, then district-wide fill, capped so one Holon post cannot spam the district. */
export function pickMatchedSellers<T extends { id: string; areas: AreaRow[] }>(
  candidates: T[],
  request: NearbyRequestLocation,
  maxN = MAX_NEARBY_REQUEST_NOTIFY
): { id: string; match: MatchTier }[] {
  const city: { id: string; match: MatchTier }[] = [];
  const district: { id: string; match: MatchTier }[] = [];
  for (const candidate of candidates) {
    const tier = sellerMatchTier(candidate.areas, request);
    if (tier === "city") city.push({ id: candidate.id, match: "city" });
    else if (tier === "district") district.push({ id: candidate.id, match: "district" });
  }
  return [...city, ...district].slice(0, maxN);
}

export interface NearbyRequestInput {
  requestId: string;
  title: string;
  serviceSlug: string | null;
  cityName: string | null;
  districtName: string | null;
}

/** Builds the persisted in-app row. Type is `NEW_NEARBY_REQUEST` for WhatsApp (#52) later. */
export function nearbyRequestNotification(input: NearbyRequestInput) {
  const place = input.cityName || input.districtName;
  const service = input.serviceSlug ? getServiceBySlug(input.serviceSlug)?.nameHe : undefined;
  const where = place ? ` ב${place}` : "";
  const what = service ? ` — ${service}` : "";
  return {
    type: NOTIFICATION_TYPE_NEARBY_REQUEST,
    title: "בקשה חדשה באזור שלך",
    message: `${input.title}${where}${what}`.slice(0, 280),
    href: `/requests/${input.requestId}`,
    entityId: input.requestId,
    payload: {
      requestId: input.requestId,
      serviceSlug: input.serviceSlug,
      cityName: input.cityName,
      districtName: input.districtName,
      eventType: NOTIFICATION_TYPE_NEARBY_REQUEST,
    },
  };
}

export interface UserServiceInput {
  serviceSlug: string;
  alertsMuted?: boolean;
}

/** Accepts either `string[]` slugs or `{ serviceSlug, alertsMuted }[]`. */
export function parseUserServiceInput(services: unknown): UserServiceInput[] | null {
  if (!Array.isArray(services)) return null;
  const out: UserServiceInput[] = [];
  const seen = new Set<string>();
  for (const item of services) {
    let slug = "";
    let mute: boolean | undefined;
    if (typeof item === "string") {
      slug = item.trim();
    } else if (item && typeof item === "object" && "serviceSlug" in item) {
      const raw = (item as { serviceSlug: unknown }).serviceSlug;
      if (typeof raw === "string") slug = raw.trim();
      const muteRaw = (item as { alertsMuted?: unknown }).alertsMuted;
      if (typeof muteRaw === "boolean") mute = muteRaw;
    }
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(mute === undefined ? { serviceSlug: slug } : { serviceSlug: slug, alertsMuted: mute });
  }
  return out;
}
