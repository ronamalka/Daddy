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

export interface SellerChecklistItem {
  key: SellerReadyKey;
  title: string;
  description: string;
  href: string;
}

/** Labels and links for the daddy onboarding checklist. */
export const SELLER_CHECKLIST_ITEMS: SellerChecklistItem[] = [
  {
    key: "pricedService",
    title: "שירות עם מחיר",
    description: "לפחות שירות אחד עם מחיר ב₪. בלי הפתעות בחשבון.",
    href: "/profile/prices",
  },
  {
    key: "serviceArea",
    title: "אזור שירות",
    description: "סמן איפה אתה מוכן להגיע — שכונה, עיר, או מחוז.",
    href: "/profile/service-areas",
  },
  {
    key: "availability",
    title: "שעות זמינות",
    description: "חלון אחד בשבוע לפחות, כדי שאפשר יהיה לקבוע ביקור.",
    href: "/profile/availability",
  },
  {
    key: "phone",
    title: "מספר טלפון",
    description: "שיהיה ללקוח איך להשיג אותך כשהארון כבר באמצע הסלון.",
    href: "/profile/edit",
  },
  {
    key: "photo",
    title: "תמונת פרופיל",
    description: "פרצוף, לא אימוג׳י. הלקוחות רוצים לראות מי מגיע.",
    href: "/profile/edit",
  },
];

export interface ProfileReadinessResponse extends SellerReadiness {
  role: string;
}

/** Returns an in-app path, or null if `next` is missing or an open redirect. */
export function safeInAppPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return null;
  }
  return next;
}

/** Returns a safe in-app path after sign-up. Sellers go to onboarding. */
export function postRegisterPath(role: string, next: string | null | undefined): string {
  return safeInAppPath(next) ?? (role === "SELLER" ? "/onboarding" : "/");
}

