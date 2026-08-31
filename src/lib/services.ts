export interface ServiceDef {
  slug: string;
  nameHe: string;
  description: string;
}

export interface ServiceCategory {
  slug: string;
  nameHe: string;
  services: ServiceDef[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "assembly-and-installation",
    nameHe: "הרכבות והתקנות",
    services: [
      { slug: "furniture-assembly", nameHe: "הרכבת רהיטים", description: "ארונות, מדפים, שולחנות, מיטות (איקאה וכד׳)" },
      { slug: "tv-mounting", nameHe: "תליית טלוויזיה", description: "התקנת זרוע והרכבה על קיר" },
      { slug: "shelf-hanging", nameHe: "תליית מדפים", description: "מדפים, ארוניות, מתלים" },
      { slug: "curtain-rods", nameHe: "התקנת וילונות", description: "מוטות וילון, רולרים, וילונות רומאיים" },
      { slug: "picture-hanging", nameHe: "תליית תמונות ומראות", description: "תמונות, מראות, שעוני קיר, לוחות" },
      { slug: "lighting-fixtures", nameHe: "התקנת גופי תאורה", description: "החלפת אהיל/גוף קיים בלבד. לא עבודת חשמלאי" },
    ],
  },
  {
    slug: "home-maintenance",
    nameHe: "תחזוקה ותיקונים קטנים",
    services: [
      { slug: "minor-repairs", nameHe: "תיקונים קטנים", description: "ידיות, צירים, מגירות, ברזים טפטפים" },
      { slug: "paint-touchups", nameHe: "תיקוני צבע", description: "נגיעות צבע, כיסוי חורים, רענון קיר בודד" },
      { slug: "caulking-sealing", nameHe: "סיליקון ואיטום קל", description: "חידוש סיליקון באמבטיה, מטבח, חלונות" },
      { slug: "door-adjustment", nameHe: "כוונון דלתות וארונות", description: "דלתות שנתקעות, ציר שבור, הגבהת ארון" },
      { slug: "drywall-patch", nameHe: "סתימת חורים בקיר", description: "חורי מקדחה, שקעי מסגרות, סדקים קטנים" },
      { slug: "clothesline", nameHe: "החלפת חבלי כביסה", description: "חבלים, גלגלות, מתקני כביסה" },
    ],
  },
  {
    slug: "moving-and-organization",
    nameHe: "הובלות וסדר בבית",
    services: [
      { slug: "moving-muscle", nameHe: "עזרה בהובלה", description: "ידיים נוספות ליום הובלה, העלאה וסחיבה" },
      { slug: "packing-help", nameHe: "עזרה באריזה", description: "אריזת קרטונים, פירוק והרכבה מחדש" },
      { slug: "garage-organization", nameHe: "סידור מחסן/חניה", description: "ארגון, מדפים, ווי תלייה, פינוי" },
      { slug: "decluttering", nameHe: "פינוי ומיון", description: "מיון בגדים, ספרים, ציוד ישן, פינוי לתרומה" },
      { slug: "home-childproofing", nameHe: "בטיחות ילדים בבית", description: "שערי בטיחות, סוגרי מגירות, עיגון רהיטים" },
    ],
  },
  {
    slug: "garden-and-outdoor",
    nameHe: "גינה וחצר",
    services: [
      { slug: "lawn-mowing", nameHe: "כיסוח דשא", description: "כיסוח, ניקוי עשבים, תחזוקת חצר בסיסית" },
      { slug: "garden-maintenance", nameHe: "גינון בסיסי", description: "גיזום, השקיה, שתילה, עציצים" },
      { slug: "grill-assembly", nameHe: "הרכבת גריל/מנגל", description: "הרכבה מכנית בלבד. בלי חיבור לגז" },
      { slug: "outdoor-furniture", nameHe: "ריהוט גינה", description: "הרכבת שולחנות, כסאות, סט ישיבה" },
      { slug: "pressure-washing", nameHe: "שטיפת לחץ", description: "ניקוי מרצפות, חניה, קירות חיצוניים" },
    ],
  },
  {
    slug: "tech-support",
    nameHe: "טכנולוגיה ומחשבים",
    services: [
      { slug: "elderly-tech-help", nameHe: "עזרה טכנית לגיל השלישי", description: "הגדרת סמארטפון, וואטסאפ, שיחות וידאו" },
      { slug: "wifi-setup", nameHe: "התקנת WiFi ורשת", description: "הגדרת ראוטר, מאריכי טווח, חיבור מדפסת" },
      { slug: "smart-home", nameHe: "בית חכם בסיסי", description: "מצלמות, נורות חכמות, Google/Alexa" },
      { slug: "computer-help", nameHe: "עזרה במחשב", description: "התקנת תוכנות, גיבוי, ניקוי, שדרוג" },
      { slug: "tv-streaming-setup", nameHe: "הגדרת סטרימינג", description: "חיבור סטינג, Apple TV, נטפליקס" },
    ],
  },
  {
    slug: "car-and-errands",
    nameHe: "רכב ומשימות",
    services: [
      { slug: "car-test-companion", nameHe: "ליווי לטסט רכב", description: "ליווי לקניית רכב יד שנייה, בדיקה, מו״מ" },
      { slug: "tire-change", nameHe: "החלפת גלגל", description: "החלפת צמיג תקוע, לימוד החלפה עצמית" },
      { slug: "car-wash-help", nameHe: "שטיפת רכב וטיפוח", description: "שטיפה ידנית, פוליש בסיסי, ניקוי פנימי" },
      { slug: "errand-running", nameHe: "ריצת שליחויות", description: "איסוף חבילות, קניות, הסעת חפצים" },
      { slug: "jump-start", nameHe: "התנעת רכב", description: "כבלים, מטען, עזרה בפנצ׳ר בצד הדרך" },
    ],
  },
  {
    slug: "admin-and-bureaucracy",
    nameHe: "בירוקרטיה ועניינים",
    services: [
      { slug: "bill-negotiation", nameHe: "הוזלת חשבונות", description: "הפחתת חשבונות סלולר, אינטרנט, ביטוח" },
      { slug: "form-filling", nameHe: "עזרה במילוי טפסים", description: "סיוע טכני בלבד — לא ייעוץ משפטי או מס" },
      { slug: "govt-office-companion", nameHe: "ליווי למשרדים ממשלתיים", description: "עירייה, משרד הפנים, ביטוח לאומי" },
      { slug: "insurance-comparison", nameHe: "השוואת ביטוחים", description: "השוואה כללית בלבד — לא ייעוץ או מכירת ביטוח" },
    ],
  },
  {
    slug: "events-and-family",
    nameHe: "אירועים ומשפחה",
    services: [
      { slug: "bbq-grilling", nameHe: "גרילאדה / מנגליסט", description: "ניהול מנגל, קניית חומרים, הכנה והגשה" },
      { slug: "event-setup", nameHe: "הקמת אירוע ופירוק", description: "שולחנות, כסאות, תאורה, אוהלים, סוכות" },
      { slug: "holiday-decorations", nameHe: "קישוט לחגים", description: "סוכה, חנוכייה, בלונים, יום הולדת" },
      { slug: "flatpack-gifts", nameHe: "הרכבת מתנות גדולות", description: "אופניים, טרמפולינה, בית עץ, נדנדה" },
    ],
  },
];

export const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((cat) =>
  cat.services.map((s) => ({ ...s, category: cat.slug, categoryName: cat.nameHe }))
);

/** Old Fiverr-style gig slugs → the 8 local catalog categories. */
export const LEGACY_GIG_CATEGORY_MAP: Record<string, string> = {
  "car-transport": "car-and-errands",
  "negotiation-bureaucracy": "admin-and-bureaucracy",
  "garden-yard": "garden-and-outdoor",
  "consulting-training": "home-maintenance",
  "moving-lifting": "moving-and-organization",
};

/** Seed / leftover service slugs that predate the local catalog. */
export const LEGACY_SERVICE_TO_CATEGORY: Record<string, string> = {
  "faucet-repair": "home-maintenance",
  "door-repair": "home-maintenance",
  "paint-touch-up": "home-maintenance",
  "car-test": "car-and-errands",
  "car-purchase-escort": "car-and-errands",
  "moving-help": "moving-and-organization",
  "heavy-lifting": "moving-and-organization",
  "smart-tv-setup": "tech-support",
  "computer-setup": "tech-support",
  "tech-elderly-help": "tech-support",
  "smart-home-setup": "tech-support",
  "printer-setup": "tech-support",
  "bureaucracy-help": "admin-and-bureaucracy",
  "insurance-negotiation": "admin-and-bureaucracy",
  "apartment-inspection": "home-maintenance",
  "tree-pruning": "garden-and-outdoor",
  "planter-setup": "garden-and-outdoor",
  "irrigation-setup": "garden-and-outdoor",
  "yard-cleanup": "garden-and-outdoor",
  "pergola-assembly": "assembly-and-installation",
};

/** Finds a service by slug, including its category. */
export function getServiceBySlug(slug: string) {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

/** Finds a category and its services by category slug. */
export function getServicesByCategory(categorySlug: string) {
  return SERVICE_CATEGORIES.find((c) => c.slug === categorySlug);
}

/** Maps a gig category slug (current or legacy) onto the 8 local groups. */
export function canonicalizeCategorySlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  if (SERVICE_CATEGORIES.some((c) => c.slug === slug)) return slug;
  return LEGACY_GIG_CATEGORY_MAP[slug] ?? null;
}

/** Public browse URL for providers + prices, optionally scoped to a local category. */
export function catalogBrowsePath(category?: string | null): string {
  const slug = canonicalizeCategorySlug(category);
  return slug ? `/?category=${encodeURIComponent(slug)}` : "/";
}

/** Local category slug for a priced service, including leftover seed slugs. */
export function categorySlugForService(serviceSlug: string): string | null {
  const fromCatalog = ALL_SERVICES.find((s) => s.slug === serviceSlug);
  if (fromCatalog) return fromCatalog.category;
  return LEGACY_SERVICE_TO_CATEGORY[serviceSlug] ?? null;
}

/** Categories a daddy may attach a package to, based on their price list. */
export function categoriesFromPricedServices(serviceSlugs: string[]): ServiceCategory[] {
  const slugs = new Set<string>();
  for (const serviceSlug of serviceSlugs) {
    const category = categorySlugForService(serviceSlug);
    if (category) slugs.add(category);
  }
  return SERVICE_CATEGORIES.filter((c) => slugs.has(c.slug));
}
