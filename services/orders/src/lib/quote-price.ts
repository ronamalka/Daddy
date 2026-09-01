export type QuotePriceInput = {
  laborPrice?: number | null;
  proposedPrice?: number | null;
  price?: number | null;
  materialsEstimate?: number | null;
  buyerSuppliesMaterials?: boolean | null;
};

/** Labor-only amount from a quote or booking payload. */
export function laborAmount(input: QuotePriceInput): number | null {
  const labor = input.laborPrice ?? input.proposedPrice ?? input.price ?? null;
  if (labor == null || Number.isNaN(Number(labor)) || Number(labor) <= 0) return null;
  return Number(labor);
}

/** Buyer-facing total: labor, plus materials when the daddy supplies them. */
export function quoteTotal(input: QuotePriceInput): number | null {
  const labor = laborAmount(input);
  if (labor == null) return null;
  if (input.buyerSuppliesMaterials !== false) return labor;
  const materials = input.materialsEstimate == null ? 0 : Number(input.materialsEstimate);
  if (!Number.isFinite(materials) || materials <= 0) return labor;
  return labor + materials;
}
