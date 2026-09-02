import { USERS_SERVICE, proxyRequest } from "@/lib/gateway";

export interface SellerCard {
  id: string;
  name: string;
  avatar: string | null;
  city: string | null;
  avgRating: number;
  totalReviews: number;
}

interface RawSeller {
  id?: unknown;
  name?: unknown;
  avatar?: unknown;
  city?: unknown;
  avgRating?: unknown;
  totalReviews?: unknown;
  userServices?: { serviceSlug: string }[];
}

function mapSeller(s: RawSeller): SellerCard {
  return {
    id: s.id as string,
    name: s.name as string,
    avatar: typeof s.avatar === "string" ? s.avatar : null,
    city: typeof s.city === "string" ? s.city : null,
    avgRating: typeof s.avgRating === "number" ? s.avgRating : 0,
    totalReviews: typeof s.totalReviews === "number" ? s.totalReviews : 0,
  };
}

function isValidSeller(s: unknown): s is RawSeller {
  return !!s && typeof s === "object" && typeof (s as RawSeller).id === "string" && typeof (s as RawSeller).name === "string";
}

export async function fetchSellersByService(slug: string, limit = 8): Promise<SellerCard[]> {
  try {
    const { data, status } = await proxyRequest(USERS_SERVICE, `/providers?take=12`);
    if (status !== 200 || !Array.isArray(data)) return [];
    return data
      .filter((s: unknown) =>
        isValidSeller(s) &&
        Array.isArray(s.userServices) &&
        s.userServices.some((us) => us.serviceSlug === slug || us.serviceSlug.includes(slug.replace(/-/g, "")))
      )
      .slice(0, limit)
      .map(mapSeller);
  } catch {
    return [];
  }
}

export async function fetchSellersByCityAndService(serviceSlug: string, cityHe: string, limit = 12): Promise<SellerCard[]> {
  try {
    const { data, status } = await proxyRequest(USERS_SERVICE, `/providers?take=20`);
    if (status !== 200 || !Array.isArray(data)) return [];
    return data
      .filter((s: unknown) => {
        if (!isValidSeller(s)) return false;
        const matchesCity = typeof s.city === "string" && s.city.includes(cityHe);
        const matchesService = Array.isArray(s.userServices) &&
          s.userServices.some((us) => us.serviceSlug === serviceSlug || us.serviceSlug.includes(serviceSlug.replace(/-/g, "")));
        return matchesCity || matchesService;
      })
      .slice(0, limit)
      .map(mapSeller);
  } catch {
    return [];
  }
}

export const LANDING_CATEGORIES: Record<string, { he: string; description: string }> = {
  plumbing: { he: "אינסטלטור", description: "שירותי אינסטלציה — תיקון צנרת, ברזים, הבטחת אטימות ועוד" },
  electrical: { he: "חשמלאי", description: "עבודות חשמל — התקנת שקעים, תאורה, לוח חשמל ועוד" },
  renovation: { he: "שיפוצניק", description: "שיפוצים כלליים — צבע, ריצוף, גבס, שיפוץ דירה" },
  locksmith: { he: "מנעולן", description: "שירותי מנעולנות — פתיחת דלתות, החלפת מנעולים, התקנת מצלמות" },
  "ac-repair": { he: "מזגנים", description: "התקנה ותיקון מזגנים — מילוי גז, ניקוי, תחזוקה שנתית" },
  painting: { he: "צבע", description: "עבודות צביעה — צבע פנים וחוץ, שפכטל, טפטים" },
  carpentry: { he: "נגר", description: "נגרות — ארונות, מטבחים, דלתות, רהיטים בהתאמה אישית" },
  moving: { he: "הובלות", description: "שירותי הובלה — הובלת דירה, ריהוט, אריזה ופריקה" },
  cleaning: { he: "ניקיון", description: "שירותי ניקיון — ניקיון דירות, משרדים, אחרי שיפוץ" },
  gardening: { he: "גינון", description: "עבודות גינון — גיזום, השקייה, עיצוב גינות, דשא סינתטי" },
};

export const LANDING_CITIES: Record<string, { he: string; lat: number; lng: number }> = {
  "tel-aviv": { he: "תל אביב", lat: 32.0853, lng: 34.7818 },
  jerusalem: { he: "ירושלים", lat: 31.7683, lng: 35.2137 },
  haifa: { he: "חיפה", lat: 32.7940, lng: 34.9896 },
  "rishon-lezion": { he: "ראשון לציון", lat: 31.9730, lng: 34.7925 },
  "petah-tikva": { he: "פתח תקווה", lat: 32.0841, lng: 34.8878 },
  ashdod: { he: "אשדוד", lat: 31.8044, lng: 34.6553 },
  netanya: { he: "נתניה", lat: 32.3215, lng: 34.8532 },
  "beer-sheva": { he: "באר שבע", lat: 31.2530, lng: 34.7915 },
  "bnei-brak": { he: "בני ברק", lat: 32.0834, lng: 34.8332 },
  holon: { he: "חולון", lat: 32.0114, lng: 34.7748 },
  herzliya: { he: "הרצליה", lat: 32.1629, lng: 34.8447 },
  "ramat-gan": { he: "רמת גן", lat: 32.0680, lng: 34.8241 },
  "bat-yam": { he: "בת ים", lat: 32.0171, lng: 34.7514 },
  rehovot: { he: "רחובות", lat: 31.8928, lng: 34.8113 },
  "kfar-saba": { he: "כפר סבא", lat: 32.1780, lng: 34.9066 },
  raanana: { he: "רעננה", lat: 32.1849, lng: 34.8708 },
  modiin: { he: "מודיעין", lat: 31.8969, lng: 35.0104 },
  "givatayim": { he: "גבעתיים", lat: 32.0716, lng: 34.8124 },
  ashkelon: { he: "אשקלון", lat: 31.6688, lng: 34.5743 },
  eilat: { he: "אילת", lat: 29.5577, lng: 34.9519 },
};

export const CATEGORY_SLUGS = Object.keys(LANDING_CATEGORIES);
export const CITY_SLUGS = Object.keys(LANDING_CITIES);

export const SERVICE_FAQ: { q: string; a: string }[] = [
  {
    q: "כמה עולה שירות דרך אבאל׳ה?",
    a: "המחיר נקבע ישירות בין הלקוח לבעל המקצוע. אין עמלת תיווך ואין עלויות נוספות מצד הפלטפורמה.",
  },
  {
    q: "איך אני בוחר את בעל המקצוע הנכון?",
    a: "כל אבאל׳ה מדורג לפי 4 קריטריונים: איכות, יחס, זמנים ומחיר. קראו חוות דעת אמיתיות, השוו מחירים, ובחרו את מי שמתאים לכם.",
  },
  {
    q: "האם בעלי המקצוע מאומתים?",
    a: "אבאל׳ה מציגה ביקורות ציבוריות, מספר עבודות שהושלמו ואזורי שירות. הפלטפורמה אינה בודקת רישיונות — בקשו מהספק להציגם לפני עבודה טעונת רישיון.",
  },
  {
    q: "מה קורה אם אני לא מרוצה?",
    a: "דברו עם בעל המקצוע. אם לא הצלחתם — פתחו מחלוקת מדף ההזמנה. צוות אבאל׳ה יעזור לתווך.",
  },
  {
    q: "האם אפשר לבטל הזמנה?",
    a: "עד 24 שעות לפני חלון הביקור הביטול חינם. אחר כך נרשמים דמי ביטול קטנים. לפרטים מלאים ראו את תנאי השימוש.",
  },
];
