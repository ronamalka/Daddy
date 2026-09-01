import { quoteTotal, type QuotePriceInput } from "@/lib/quote-price";

export const NOTE_PREVIEW_CHARS = 90;

export const QUOTE_SORTS = ["price", "rating"] as const;
export type QuoteSort = (typeof QUOTE_SORTS)[number];

export type AreaOverlap = "city" | "district" | "none";

export type QuoteArea = {
  cityCode?: number | null;
  districtCode?: number | null;
};

export type QuoteRequestLocation = {
  cityCode?: number | null;
  districtCode?: number | null;
};

export type SortableQuote = QuotePriceInput & {
  id: string;
  message?: string | null;
  seller?: {
    name?: string;
    avgRating?: number | null;
    reviewCount?: number | null;
    areaOverlap?: AreaOverlap;
  };
};

/** Classifies a daddy's service area against the request city/district. */
export function quoteAreaOverlap(areas: QuoteArea[], request: QuoteRequestLocation): AreaOverlap {
  const cityCode = request.cityCode ?? null;
  const districtCode = request.districtCode ?? null;
  if (cityCode != null) {
    if (areas.some((area) => area.cityCode === cityCode)) return "city";
    if (
      districtCode != null &&
      areas.some((area) => area.districtCode === districtCode && area.cityCode == null)
    ) {
      return "district";
    }
    return "none";
  }
  if (districtCode != null) {
    if (areas.some((area) => area.districtCode === districtCode && area.cityCode == null)) {
      return "district";
    }
  }
  return "none";
}

/** Hebrew line for whether this daddy covers the request location. */
export function areaOverlapLabel(
  overlap: AreaOverlap,
  place?: { cityName?: string | null; districtName?: string | null }
): string {
  if (overlap === "city") {
    return place?.cityName ? `בעיר ${place.cityName}` : "בעיר הבקשה";
  }
  if (overlap === "district") {
    return place?.districtName ? `כל מחוז ${place.districtName}` : "כל המחוז";
  }
  return "לא באזור הבקשה";
}

/** First line of the quote note, trimmed for a compare card. */
export function quoteNotePreview(message?: string | null, maxChars = NOTE_PREVIEW_CHARS): string {
  const text = (message ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

/** Priced quotes only — unpriced "I'm interested" notes stay out of the compare. */
export function pricedQuotes<T extends QuotePriceInput>(quotes: T[]): T[] {
  return quotes.filter((quote) => quoteTotal(quote) != null);
}

/** True when the buyer has at least two priced quotes to put side by side. */
export function shouldShowQuoteCompare(quotes: QuotePriceInput[]): boolean {
  return pricedQuotes(quotes).length >= 2;
}

/** Sorts priced quotes by total price (cheap first) or rating (high first). */
export function sortCompareQuotes<T extends SortableQuote>(quotes: T[], sortBy: QuoteSort): T[] {
  const copy = [...quotes];
  copy.sort((a, b) => {
    if (sortBy === "rating") {
      const ar = a.seller?.avgRating ?? 0;
      const br = b.seller?.avgRating ?? 0;
      if (ar !== br) return br - ar;
      const ap = quoteTotal(a) ?? Number.POSITIVE_INFINITY;
      const bp = quoteTotal(b) ?? Number.POSITIVE_INFINITY;
      return ap - bp;
    }
    const ap = quoteTotal(a) ?? Number.POSITIVE_INFINITY;
    const bp = quoteTotal(b) ?? Number.POSITIVE_INFINITY;
    if (ap !== bp) return ap - bp;
    return (b.seller?.avgRating ?? 0) - (a.seller?.avgRating ?? 0);
  });
  return copy;
}
