"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Star } from "@phosphor-icons/react";
import { QuotePriceBreakdown } from "@/components/quote-price-breakdown";
import {
  areaOverlapLabel,
  pricedQuotes,
  quoteNotePreview,
  shouldShowQuoteCompare,
  sortCompareQuotes,
  type AreaOverlap,
  type QuoteSort,
} from "@/lib/quote-compare";
import { quoteTotal, type QuotePriceInput } from "@/lib/quote-price";
import { cn } from "@/lib/utils";

export type CompareQuote = QuotePriceInput & {
  id: string;
  message?: string | null;
  selected?: boolean;
  seller?: {
    id?: string;
    name?: string;
    avgRating?: number | null;
    reviewCount?: number | null;
    areaOverlap?: AreaOverlap;
  };
};

interface QuoteCompareProps {
  quotes: CompareQuote[];
  cityName?: string | null;
  districtName?: string | null;
  canAccept?: boolean;
  resolved?: boolean;
  acceptingId?: string | null;
  onAccept?: (quoteId: string) => void;
}

const SORT_OPTIONS: { id: QuoteSort; label: string }[] = [
  { id: "price", label: "מחיר" },
  { id: "rating", label: "דירוג" },
];

/** Side-by-side compare of 2+ priced quotes. Stacked on a phone, a horizontal row on larger screens. */
export function QuoteCompare({
  quotes,
  cityName,
  districtName,
  canAccept = false,
  resolved = false,
  acceptingId = null,
  onAccept,
}: QuoteCompareProps) {
  const [sortBy, setSortBy] = useState<QuoteSort>("price");
  const priced = useMemo(() => pricedQuotes(quotes), [quotes]);
  const sorted = useMemo(() => sortCompareQuotes(priced, sortBy), [priced, sortBy]);

  if (!shouldShowQuoteCompare(quotes)) return null;

  const place = { cityName, districtName };

  return (
    <div className="mb-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[rgb(var(--color-text))]">השוואת הצעות</h3>
        <div
          className="flex items-center gap-1 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-0.5"
          role="group"
          aria-label="מיון הצעות"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSortBy(option.id)}
              aria-pressed={sortBy === option.id}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                sortBy === option.id
                  ? "bg-[rgb(var(--color-primary))] text-white"
                  : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-1">
        {sorted.map((quote) => {
          const total = quoteTotal(quote);
          const rating = quote.seller?.avgRating ?? 0;
          const reviewCount = quote.seller?.reviewCount ?? 0;
          const overlap = quote.seller?.areaOverlap ?? "none";
          const note = quoteNotePreview(quote.message);
          const sellerHref = quote.seller?.id ? `/sellers/${quote.seller.id}` : null;
          const name = quote.seller?.name || "אבא";

          return (
            <article
              key={quote.id}
              className="flex flex-col rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 shadow-[0_4px_16px_rgba(var(--color-primary),0.06)] sm:min-w-[240px] sm:max-w-[280px] sm:flex-1"
            >
              <div className="flex items-start justify-between gap-2">
                {sellerHref ? (
                  <Link
                    href={sellerHref}
                    className="text-[15px] font-bold text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))]"
                  >
                    {name}
                  </Link>
                ) : (
                  <p className="text-[15px] font-bold text-[rgb(var(--color-text))]">{name}</p>
                )}
                {total != null && (
                  <p className="shrink-0 text-[16px] font-extrabold text-[rgb(var(--color-text))]">₪{total}</p>
                )}
              </div>

              <div
                className="mt-1 flex items-center gap-1 text-[13px] text-[rgb(var(--color-text-secondary))]"
                aria-label={
                  reviewCount > 0
                    ? `דירוג ${rating.toFixed(1)} מתוך 10, ${reviewCount} ביקורות`
                    : "אין ביקורות עדיין"
                }
              >
                <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
                {reviewCount > 0 ? (
                  <>
                    <span className="font-semibold text-[rgb(var(--color-text))]">{rating.toFixed(1)}/10</span>
                    <span className="text-[rgb(var(--color-text-muted))]">({reviewCount})</span>
                  </>
                ) : (
                  <span className="text-[rgb(var(--color-text-muted))]">אין ביקורות</span>
                )}
              </div>

              {total != null && (
                <div className="mt-2">
                  <QuotePriceBreakdown quote={quote} size="sm" />
                </div>
              )}

              <p className="mt-2 flex items-center gap-1 text-[12px] text-[rgb(var(--color-text-secondary))]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {areaOverlapLabel(overlap, place)}
              </p>

              {note ? (
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
                  {note}
                </p>
              ) : null}

              {canAccept && total != null && onAccept && (
                <button
                  type="button"
                  onClick={() => onAccept(quote.id)}
                  disabled={acceptingId !== null}
                  className="mt-auto rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                >
                  {acceptingId === quote.id
                    ? "סוגרים עבודה..."
                    : `קבלו את ההצעה של ${name} ב-₪${total}`}
                </button>
              )}
              {quote.selected && (
                <p className="mt-3 text-[13px] font-semibold text-[rgb(var(--color-success))]">ההצעה שנבחרה</p>
              )}
              {resolved && !quote.selected && (
                <p className="mt-3 text-[13px] text-[rgb(var(--color-text-muted))]">לא נבחרה</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
