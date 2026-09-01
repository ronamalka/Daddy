import { quoteTotal, type QuotePriceInput } from "@/lib/quote-price";

type CompareQuote = QuotePriceInput & {
  id: string;
  seller?: { name?: string };
};

/** Side-by-side labor vs materials for priced quotes on a request. */
export function QuoteCompareTable({
  quotes,
}: {
  quotes: CompareQuote[];
}) {
  const priced = quotes.filter((q) => quoteTotal(q) != null);
  if (priced.length < 2) return null;

  return (
    <div className="mb-4 overflow-x-auto rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
      <table className="w-full min-w-[480px] text-right text-[13px]">
        <caption className="sr-only">השוואת הצעות — עבודה מול חומרים</caption>
        <thead>
          <tr className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-muted))]">
            <th className="px-4 py-3 font-medium">אבא</th>
            <th className="px-4 py-3 font-medium">עבודה</th>
            <th className="px-4 py-3 font-medium">חומרים</th>
            <th className="px-4 py-3 font-medium">סה״כ לתשלום</th>
          </tr>
        </thead>
        <tbody>
          {priced.map((q) => {
            const labor = q.laborPrice ?? q.proposedPrice ?? q.price;
            const buyerBrings = q.buyerSuppliesMaterials !== false;
            return (
              <tr key={q.id} className="border-b border-[rgb(var(--color-border-light))] last:border-0">
                <td className="px-4 py-3 font-semibold text-[rgb(var(--color-text))]">{q.seller?.name || "אבא"}</td>
                <td className="px-4 py-3 text-[rgb(var(--color-text))]">{labor != null ? `₪${labor}` : "—"}</td>
                <td className="px-4 py-3 text-[rgb(var(--color-text-secondary))]">
                  {buyerBrings
                    ? "הלקוח מביא"
                    : q.materialsEstimate
                      ? `₪${q.materialsEstimate}`
                      : "האבא מביא"}
                </td>
                <td className="px-4 py-3 font-bold text-[rgb(var(--color-text))]">
                  ₪{quoteTotal(q)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
