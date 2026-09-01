import { describe, it, expect } from "vitest";
import {
  areaOverlapLabel,
  pricedQuotes,
  quoteAreaOverlap,
  quoteNotePreview,
  shouldShowQuoteCompare,
  sortCompareQuotes,
} from "@/lib/quote-compare";

const TEL_AVIV = 5000;
const TEL_AVIV_DISTRICT = 5;
const BEER_SHEVA = 9000;
const SOUTH = 6;

const yossi = {
  id: "q-yossi",
  laborPrice: 250,
  message: "אגיע עם מקדחה",
  seller: { name: "יוסי", avgRating: 9.4, reviewCount: 5, areaOverlap: "city" as const },
};
const moshe = {
  id: "q-moshe",
  laborPrice: 180,
  message: "כל ארון עד שעתיים",
  seller: { name: "משה", avgRating: 8.1, reviewCount: 2, areaOverlap: "none" as const },
};
const chatOnly = {
  id: "q-chat",
  laborPrice: null,
  message: "אפשר לדבר?",
  seller: { name: "דן", avgRating: 10, reviewCount: 1, areaOverlap: "district" as const },
};

describe("quoteAreaOverlap", () => {
  it("is city when the daddy listed the request city", () => {
    expect(
      quoteAreaOverlap([{ cityCode: TEL_AVIV, districtCode: TEL_AVIV_DISTRICT }], {
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
      })
    ).toBe("city");
  });

  it("is district when coverage is the whole district, not another city", () => {
    expect(
      quoteAreaOverlap([{ cityCode: null, districtCode: TEL_AVIV_DISTRICT }], {
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
      })
    ).toBe("district");
    expect(
      quoteAreaOverlap([{ cityCode: BEER_SHEVA, districtCode: SOUTH }], {
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
      })
    ).toBe("none");
  });
});

describe("areaOverlapLabel", () => {
  it("names the city, the whole district, or no overlap", () => {
    const place = { cityName: "תל אביב - יפו", districtName: "תל אביב" };
    expect(areaOverlapLabel("city", place)).toBe("בעיר תל אביב - יפו");
    expect(areaOverlapLabel("district", place)).toBe("כל מחוז תל אביב");
    expect(areaOverlapLabel("none", place)).toBe("לא באזור הבקשה");
  });
});

describe("quoteNotePreview", () => {
  it("returns the short note and ellipsizes a long one", () => {
    expect(quoteNotePreview("  אגיע מחר  ")).toBe("אגיע מחר");
    const long = "א".repeat(120);
    const preview = quoteNotePreview(long);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(91);
  });
});

describe("pricedQuotes / shouldShowQuoteCompare", () => {
  it("needs two priced quotes before compare appears", () => {
    expect(pricedQuotes([yossi, chatOnly])).toHaveLength(1);
    expect(shouldShowQuoteCompare([yossi, chatOnly])).toBe(false);
    expect(shouldShowQuoteCompare([yossi, moshe, chatOnly])).toBe(true);
  });
});

describe("sortCompareQuotes", () => {
  it("sorts cheap first, then by rating", () => {
    expect(sortCompareQuotes([yossi, moshe], "price").map((q) => q.id)).toEqual(["q-moshe", "q-yossi"]);
    expect(sortCompareQuotes([moshe, yossi], "rating").map((q) => q.id)).toEqual(["q-yossi", "q-moshe"]);
  });
});
