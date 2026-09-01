export type QuotePriceInput = {
  laborPrice?: number | null;
  proposedPrice?: number | null;
  price?: number | null;
  materialsEstimate?: number | null;
  buyerSuppliesMaterials?: boolean | null;
};

/** Labor-only amount. Falls back to the legacy proposedPrice or catalog price. */
export function laborAmount(input: QuotePriceInput): number | null {
  const labor = input.laborPrice ?? input.proposedPrice ?? input.price ?? null;
  if (labor == null || Number.isNaN(labor) || labor <= 0) return null;
  return labor;
}

/** Buyer-facing total: labor, plus materials when the daddy supplies them. */
export function quoteTotal(input: QuotePriceInput): number | null {
  const labor = laborAmount(input);
  if (labor == null) return null;
  if (input.buyerSuppliesMaterials !== false) return labor;
  const materials = input.materialsEstimate;
  if (materials == null || Number.isNaN(materials) || materials <= 0) return labor;
  return labor + materials;
}

/** True when the quote says the buyer brings parts (faucet, screws, etc). */
export function buyerBringsParts(input: QuotePriceInput): boolean {
  return input.buyerSuppliesMaterials !== false;
}

/** Short Hebrew label for who buys the parts. */
export function materialsWhoLabel(input: QuotePriceInput): string {
  return buyerBringsParts(input) ? "הלקוח מביא חומרים" : "האבא מביא חומרים";
}
