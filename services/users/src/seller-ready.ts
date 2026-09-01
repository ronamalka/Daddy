import { extraProviderWhere, parseProviderSearchQuery, serviceAreaWhere, type ProviderSearchQuery } from "./provider-search";

export const SELLER_READY_KEYS = [
  "pricedService",
  "serviceArea",
  "availability",
  "phone",
  "photo",
] as const;

export type SellerReadyKey = (typeof SELLER_READY_KEYS)[number];

export type SellerReadyItems = Record<SellerReadyKey, boolean>;

export interface SellerReadyInput {
  phone: string | null | undefined;
  avatar: string | null | undefined;
  serviceAreaCount: number;
  pricedServiceCount: number;
  weeklyHoursCount: number;
}

export interface SellerReadiness {
  complete: boolean;
  completedCount: number;
  total: number;
  percent: number;
  items: SellerReadyItems;
}

/** Returns true when a profile field is present after trimming. */
export function hasProfileValue(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

/** Counts which daddy-onboarding checklist items the seller has finished. */
export function evaluateSellerReadiness(input: SellerReadyInput): SellerReadiness {
  const items: SellerReadyItems = {
    pricedService: input.pricedServiceCount > 0,
    serviceArea: input.serviceAreaCount > 0,
    availability: input.weeklyHoursCount > 0,
    phone: hasProfileValue(input.phone),
    photo: hasProfileValue(input.avatar),
  };
  const completedCount = SELLER_READY_KEYS.filter((key) => items[key]).length;
  const total = SELLER_READY_KEYS.length;
  return {
    complete: completedCount === total,
    completedCount,
    total,
    percent: Math.round((completedCount / total) * 100),
    items,
  };
}

interface SearchableSellerFilters {
  service?: string;
  district?: string;
  cityCode?: string;
  minPrice?: string;
  maxPrice?: string;
  pricing?: string;
}

/** Prisma where-clause for sellers who may appear in search and featured lists. */
export function searchableSellerWhere(filters: SearchableSellerFilters = {}) {
  const parsed = parseProviderSearchQuery(filters as ProviderSearchQuery);
  const and: object[] = [
    { phone: { not: null } },
    { phone: { not: "" } },
    { avatar: { not: null } },
    { avatar: { not: "" } },
    { servicePrices: { some: { price: { gt: 0 } } } },
    { weeklyHours: { some: {} } },
    { serviceAreas: serviceAreaWhere({ cityCode: parsed.cityCode, district: parsed.district }) },
    ...extraProviderWhere(parsed),
  ];

  if (parsed.service) {
    and.push({ userServices: { some: { serviceSlug: parsed.service } } });
  }

  return {
    role: "SELLER" as const,
    acceptingJobs: true,
    AND: and,
  };
}
