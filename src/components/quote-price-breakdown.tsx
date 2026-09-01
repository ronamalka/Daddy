import { materialsWhoLabel, quoteTotal, type QuotePriceInput } from "@/lib/quote-price";

/** Compact Hebrew breakdown of labor vs materials on a quote or order. */
export function QuotePriceBreakdown({
  quote,
  size = "md",
}: {
  quote: QuotePriceInput;
  size?: "sm" | "md";
}) {
  const total = quoteTotal(quote);
  if (total == null) return null;

  const labor = quote.laborPrice ?? quote.proposedPrice ?? quote.price;
  const buyerBrings = quote.buyerSuppliesMaterials !== false;
  const text = size === "sm" ? "text-[12px]" : "text-[13px]";

  return (
    <div className={`${text} text-[rgb(var(--color-text-secondary))]`}>
      <p>
        <span className="font-semibold text-[rgb(var(--color-text))]">₪{total}</span>
        {labor != null && labor !== total && (
          <span> · עבודה ₪{labor}</span>
        )}
        {!buyerBrings && quote.materialsEstimate != null && quote.materialsEstimate > 0 && (
          <span> · חומרים ₪{quote.materialsEstimate}</span>
        )}
      </p>
      <p className="mt-0.5 text-[rgb(var(--color-text-muted))]">{materialsWhoLabel(quote)}</p>
      {buyerBrings && quote.materialsEstimate != null && quote.materialsEstimate > 0 && (
        <p className="mt-0.5 text-[rgb(var(--color-text-muted))]">
          הערכת חומרים לקנייה: ₪{quote.materialsEstimate}
        </p>
      )}
    </div>
  );
}
