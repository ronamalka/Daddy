/** Current published terms version. Bump this when legal copy changes. */
export const TERMS_VERSION = "2026-08-31";

export const LEGAL_CONTACTS = {
  legal: "legal@abale.co.il",
  privacy: "privacy@abale.co.il",
  abuse: "abuse@abale.co.il",
  accessibility: "accessibility@abale.co.il",
} as const;

export const BUSINESS_DISCLOSURE = {
  name: "אבאל׳ה בע״מ",
  country: "ישראל",
  /** Fill with the registered office before public launch. */
  address: "כתובת המשרד הרשום תפורסם עם השלמת הרישום ברשם החברות",
  registration: "ח.פ. יפורסם עם השלמת הרישום",
  phone: "טלפון ייעוץ משפטי: דרך הדוא״ל בלבד עד לפרסום קו תמיכה",
} as const;

export const COOKIE_CONSENT_STORAGE_KEY = "abale_cookie_consent_v1";
export const COOKIE_CONSENT_COOKIE = "abale_cookie_consent";
/** Re-prompt after 12 months (PPA informed-consent practice). */
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Work that typically requires an Israeli license or regulated status. */
export const REGULATED_SERVICE_SLUGS = new Set([
  "lighting-fixtures",
  "grill-assembly",
  "insurance-comparison",
  "form-filling",
  "bill-negotiation",
]);

export const REGULATED_SERVICE_WARNING: Record<string, string> = {
  "lighting-fixtures": "עבודות חשמל מעבר להחלפת גוף תאורה קיים דורשות חשמלאי מוסמך לפי חוק החשמל.",
  "grill-assembly": "חיבור לגז דורש מתקין גז מוסמך. הרכבה מכנית בלבד מותרת בלי חיבור לגז.",
  "insurance-comparison": "ייעוץ או מכירת ביטוח דורשים רישיון סוכן ביטוח. כאן מדובר בהשוואה כללית בלבד, לא ייעוץ.",
  "form-filling": "סיוע טכני במילוי טפסים אינו ייעוץ משפטי, מיסויי או פנסיוני.",
  "bill-negotiation": "משא ומתן מול ספקים אינו ייעוץ פיננסי מורשה.",
};

export type CookieConsentChoice = "accepted" | "rejected";

export interface CookieConsentState {
  choice: CookieConsentChoice;
  analytics: boolean;
  marketing: boolean;
  ts: number;
  version: number;
}

/** Returns true if cookie consent is older than one year. */
export function isConsentExpired(state: CookieConsentState, now = Date.now()): boolean {
  return now - state.ts > COOKIE_CONSENT_MAX_AGE_MS;
}

/** Parses stored cookie-consent JSON. Returns null if missing, invalid, or expired. */
export function parseCookieConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (parsed.choice !== "accepted" && parsed.choice !== "rejected") return null;
    if (typeof parsed.ts !== "number") return null;
    if (isConsentExpired(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
