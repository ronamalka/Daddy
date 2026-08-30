"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { GigCard, GigCardSkeleton } from "@/components/gig-card";
import { MagnifyingGlass, SquaresFour, ListBullets, CircleNotch } from "@phosphor-icons/react";
import { CategoryIcon } from "@/components/ui/category-icon";

interface GigItem {
  id: string;
  title: string;
  image: string | null;
  seller: { id: string; name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] };
  tiers: { price: number }[];
  avgRating: number;
  reviewCount: number;
  category: { name: string; slug: string };
}

const CATEGORIES = [
  { slug: "home-maintenance", name: "תיקונים ותחזוקת הבית" },
  { slug: "car-transport", name: "רכב ותחבורה" },
  { slug: "negotiation-bureaucracy", name: "מיקוח ובירוקרטיה" },
  { slug: "garden-yard", name: "גינון, חצר וארגון" },
  { slug: "consulting-training", name: "ייעוץ, הדרכה וסיוע אישי" },
  { slug: "moving-lifting", name: "הובלות ושינוע" },
  { slug: "tech-support", name: "טכנולוגיה ומחשבים" },
];

const DISTRICTS = [
  "ירושלים",
  "הצפון",
  "חיפה",
  "המרכז",
  "תל אביב",
  "הדרום",
  "יהודה והשומרון",
];

const SORT_OPTIONS = [
  { value: "newest", label: "חדש ביותר" },
  { value: "rating", label: "דירוג גבוה" },
  { value: "price_asc", label: "מחיר: נמוך לגבוה" },
  { value: "price_desc", label: "מחיר: גבוה לנמוך" },
  { value: "popular", label: "פופולרי" },
];

const PAGE_SIZE = 12;

/** Shows a searchable, filterable list of gigs. */
function GigsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [gigs, setGigs] = useState<GigItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const district = searchParams.get("district") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const vals = { category, search, sort: sortBy, minPrice, maxPrice, district, ...overrides };
      for (const [k, v] of Object.entries(vals)) {
        if (v) params.set(k, v);
      }
      return `/gigs?${params.toString()}`;
    },
    [category, search, sortBy, minPrice, maxPrice, district]
  );

  const fetchGigs = useCallback(
    async (skip: number, append: boolean) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (district) params.set("district", district);
      params.set("sortBy", sortBy);
      params.set("skip", String(skip));
      params.set("take", String(PAGE_SIZE));

      try {
        const res = await fetch(`/api/gigs?${params.toString()}`);
        const data = await res.json();
        if (data.gigs) {
          setGigs((prev) => (append ? [...prev, ...data.gigs] : data.gigs));
          setTotal(data.total);
          setHasMore(data.hasMore);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, category, sortBy, minPrice, maxPrice, district]
  );

  useEffect(() => {
    setSearchInput(search);
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
    fetchGigs(0, false);
  }, [search, category, sortBy, minPrice, maxPrice, district, fetchGigs]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchGigs(gigs.length, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, gigs.length, fetchGigs]);

  /** Runs the gig search with the text the user typed. */
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search: searchInput }));
  }

  /** Applies the minimum and maximum price filters. */
  function handlePriceApply() {
    router.push(buildUrl({ minPrice: minPriceInput, maxPrice: maxPriceInput }));
  }

  /** Clears all search and price filters. */
  function handleClearFilters() {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/gigs");
  }

  const activeCategory = CATEGORIES.find((c) => c.slug === category);
  const hasFilters = category || search || minPrice || maxPrice || district || sortBy !== "newest";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))] md:text-[32px]">
          {activeCategory ? activeCategory.name : search ? `תוצאות חיפוש: "${search}"` : "כל השירותים"}
        </h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
          {total > 0 ? `${total} שירותים נמצאו` : loading ? "רגע, בודק את ארגז הכלים..." : "לא נמצאו שירותים"}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full shrink-0 lg:w-[260px]">
          <div className="space-y-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
            {/* Search */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text))]">חיפוש</label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="חפש שירות..."
                  className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[rgb(var(--color-primary))] px-3 py-2.5 text-white transition-colors hover:bg-[rgb(var(--color-primary-hover))]"
                >
                  <MagnifyingGlass className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Categories */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text))]">קטגוריה</label>
              <div className="space-y-1">
                <button
                  onClick={() => router.push(buildUrl({ category: "" }))}
                  className={`w-full rounded-lg px-3 py-2 text-right text-[13px] transition-colors ${
                    !category ? "bg-[rgb(var(--color-primary))] font-semibold text-white" : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)]"
                  }`}
                >
                  הכל
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => router.push(buildUrl({ category: cat.slug }))}
                    className={`w-full rounded-lg px-3 py-2 text-right text-[13px] transition-colors ${
                      category === cat.slug ? "bg-[rgb(var(--color-primary))] font-semibold text-white" : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)]"
                    }`}
                  >
                    <CategoryIcon slug={cat.slug} className="inline-block h-4 w-4 me-2" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text))]">טווח מחירים (₪)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="מ-"
                  dir="ltr"
                  className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2 text-center text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <span className="text-[rgb(var(--color-text-muted))]">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="עד"
                  dir="ltr"
                  className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2 text-center text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="mt-2 w-full rounded-lg border border-[rgb(var(--color-primary))] py-1.5 text-[12px] font-semibold text-[rgb(var(--color-primary))] transition-colors hover:bg-[rgb(var(--color-primary))] hover:text-white"
              >
                החל
              </button>
            </div>

            {/* District */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text))]">אזור</label>
              <select
                value={district}
                onChange={(e) => router.push(buildUrl({ district: e.target.value }))}
                className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2.5 text-[13px] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
              >
                <option value="">כל האזורים</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full rounded-lg border border-[rgb(var(--color-border))] py-2 text-[13px] text-[rgb(var(--color-text-secondary))] transition-colors hover:border-[rgb(var(--color-error))] hover:text-[rgb(var(--color-error))]"
              >
                נקה סינון
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">מיין לפי:</label>
                <select
                  value={sortBy}
                  onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                  className="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2 text-[13px] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex overflow-hidden rounded-lg border border-[rgb(var(--color-border))]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[rgb(var(--color-primary))] text-white" : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)]"}`}
                  aria-label="תצוגת רשת"
                >
                  <SquaresFour className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-[rgb(var(--color-primary))] text-white" : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)]"}`}
                  aria-label="תצוגת רשימה"
                >
                  <ListBullets className="h-4 w-4" />
                </button>
              </div>
            </div>
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">{total} תוצאות</span>
          </div>

          {/* Gig grid */}
          {loading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
              {Array.from({ length: 6 }).map((_, i) => (
                <GigCardSkeleton key={i} variant={viewMode} />
              ))}
            </div>
          ) : gigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)]">
                <MagnifyingGlass className="h-8 w-8 text-[rgb(var(--color-primary-light))]" />
              </div>
              <h3 className="mb-1 text-[16px] font-bold text-[rgb(var(--color-text))]">גם אבא לא מצא. נסה מילים אחרות?</h3>
              <p className="mb-4 text-[14px] text-[rgb(var(--color-text-secondary))]">שנה את הסינון, חפש משהו אחר, או פשוט תראה הכל</p>
              <button
                onClick={handleClearFilters}
                className="rounded-lg bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[rgb(var(--color-primary-hover))]"
              >
                הצג הכל
              </button>
            </div>
          ) : (
            <>
              <LayoutGroup>
                <AnimatePresence mode="popLayout">
                  <div className={viewMode === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                    {gigs.map((gig) => (
                      <GigCard
                        key={gig.id}
                        id={gig.id}
                        title={gig.title}
                        image={gig.image}
                        seller={gig.seller}
                        startingPrice={gig.tiers[0]?.price || 0}
                        avgRating={gig.avgRating}
                        reviewCount={gig.reviewCount}
                        variant={viewMode}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </LayoutGroup>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="mt-8 flex items-center justify-center py-4">
                {loadingMore && (
                  <div className="flex items-center gap-3 text-[14px] text-[rgb(var(--color-text-secondary))]">
                    <CircleNotch className="h-6 w-6 animate-spin text-[rgb(var(--color-primary))]" />
                    מחפש עוד אבאל׳ות...
                  </div>
                )}
                {!hasMore && gigs.length > 0 && (
                  <p className="text-[13px] text-[rgb(var(--color-text-muted))]">זהו, ראית את כולם. אבא מתרשם.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shows the gig marketplace with a loading fallback. */
export default function GigsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      }
    >
      <GigsContent />
    </Suspense>
  );
}
