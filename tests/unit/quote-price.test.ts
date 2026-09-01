import { describe, it, expect } from "vitest";
import { buyerBringsParts, laborAmount, materialsWhoLabel, quoteTotal } from "@/lib/quote-price";

describe("quoteTotal", () => {
  it("uses labor only when the buyer supplies materials", () => {
    expect(
      quoteTotal({
        laborPrice: 200,
        materialsEstimate: 80,
        buyerSuppliesMaterials: true,
      })
    ).toBe(200);
  });

  it("adds materials when the daddy supplies them", () => {
    expect(
      quoteTotal({
        laborPrice: 200,
        materialsEstimate: 80,
        buyerSuppliesMaterials: false,
      })
    ).toBe(280);
  });

  it("falls back to proposedPrice for old quotes", () => {
    expect(laborAmount({ proposedPrice: 180 })).toBe(180);
    expect(quoteTotal({ proposedPrice: 180 })).toBe(180);
  });

  it("treats missing who-supplies flag as labor only", () => {
    expect(buyerBringsParts({ laborPrice: 100 })).toBe(true);
    expect(materialsWhoLabel({ laborPrice: 100, buyerSuppliesMaterials: false })).toBe(
      "האבא מביא חומרים"
    );
  });

  it("returns null without a labor price", () => {
    expect(quoteTotal({ materialsEstimate: 40, buyerSuppliesMaterials: false })).toBeNull();
  });
});
