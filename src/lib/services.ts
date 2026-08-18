export interface ServiceDef {
  slug: string;
  nameHe: string;
  description: string;
}

export interface ServiceCategory {
  slug: string;
  nameHe: string;
  icon: string;
  services: ServiceDef[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "assembly-and-installation",
    nameHe: "הרכבות והתקנות",
    icon: "🔧",
    services: [
      { slug: "furniture-assembly", nameHe: "הרכבת רהיטים", description: "ארונות, מדפים, שולחנות, מיטות (איקאה וכד׳)" },
      { slug: "tv-mounting", nameHe: "תליית טלוויזיה", description: "התקנת זרוע והרכבה על קיר" },
      { slug: "shelf-hanging", nameHe: "תליית מדפים", description: "מדפים, ארוניות, מתלים" },
      { slug: "curtain-rods", nameHe: "התקנת וילונות", description: "מוטות וילון, רולרים, וילונות רומאיים" },
      { slug: "picture-hanging", nameHe: "תליית תמונות ומראות", description: "תמונות, מראות, שעוני קיר, לוחות" },
      { slug: "lighting-fixtures", nameHe: "התקנת גופי תאורה", description: "אהילים, ספוטים, פסי לד (החלפה בלבד)" },
    ],
  },
  {
    slug: "home-maintenance",
    nameHe: "תחזוקה ותיקונים קטנים",
    icon: "🏠",
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
    icon: "📦",
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
    icon: "🌿",
    services: [
      { slug: "lawn-mowing", nameHe: "כיסוח דשא", description: "כיסוח, ניקוי עשבים, תחזוקת חצר בסיסית" },
      { slug: "garden-maintenance", nameHe: "גינון בסיסי", description: "גיזום, השקיה, שתילה, עציצים" },
      { slug: "grill-assembly", nameHe: "הרכבת גריל/מנגל", description: "הרכבת גריל גז, מנגל, מעשנה" },
      { slug: "outdoor-furniture", nameHe: "ריהוט גינה", description: "הרכבת שולחנות, כסאות, סט ישיבה" },
      { slug: "pressure-washing", nameHe: "שטיפת לחץ", description: "ניקוי מרצפות, חניה, קירות חיצוניים" },
    ],
  },
  {
    slug: "tech-support",
    nameHe: "טכנולוגיה ומחשבים",
    icon: "💻",
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
    icon: "🚗",
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
    icon: "📞",
    services: [
      { slug: "bill-negotiation", nameHe: "הוזלת חשבונות", description: "הפחתת חשבונות סלולר, אינטרנט, ביטוח" },
      { slug: "form-filling", nameHe: "עזרה במילוי טפסים", description: "ביטוח לאומי, מס הכנסה, ביטוחים, רישוי" },
      { slug: "govt-office-companion", nameHe: "ליווי למשרדים ממשלתיים", description: "עירייה, משרד הפנים, ביטוח לאומי" },
      { slug: "insurance-comparison", nameHe: "השוואת ביטוחים", description: "רכב, דירה, בריאות, חיים" },
    ],
  },
  {
    slug: "events-and-family",
    nameHe: "אירועים ומשפחה",
    icon: "🎉",
    services: [
      { slug: "bbq-grilling", nameHe: "גרילאדה / מנגליסט", description: "ניהול מנגל, קניית חומרים, הכנה והגשה" },
      { slug: "event-setup", nameHe: "הקמת אירוע ופירוק", description: "שולחנות, כסאות, תאורה, אוהלים, סוכות" },
      { slug: "holiday-decorations", nameHe: "קישוט לחגים", description: "סוכה, חנוכייה, בלונים, יום הולדת" },
      { slug: "flatpack-gifts", nameHe: "הרכבת מתנות גדולות", description: "אופניים, טרמפולינה, בית עץ, נדנדה" },
    ],
  },
];

export const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((cat) =>
  cat.services.map((s) => ({ ...s, category: cat.slug, categoryName: cat.nameHe, categoryIcon: cat.icon }))
);

export function getServiceBySlug(slug: string) {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

export function getServicesByCategory(categorySlug: string) {
  return SERVICE_CATEGORIES.find((c) => c.slug === categorySlug);
}
