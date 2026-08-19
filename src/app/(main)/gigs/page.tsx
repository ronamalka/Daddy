"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GigCard } from "@/components/gig-card";

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
  { slug: "home-maintenance", name: "תיקונים ותחזוקת הבית", icon: "🏠" },
  { slug: "car-transport", name: "רכב ותחבורה", icon: "🚗" },
  { slug: "negotiation-bureaucracy", name: "מיקוח ובירוקרטיה", icon: "📞" },
  { slug: "garden-yard", name: "גינון, חצר וארגון", icon: "🌿" },
  { slug: "consulting-training", name: "ייעוץ, הדרכה וסיוע אישי", icon: "💡" },
  { slug: "moving-lifting", name: "הובלות ושינוע", icon: "📦" },
  { slug: "tech-support", name: "טכנולוגיה ומחשבים", icon: "💻" },
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

  // Infinite scroll
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search: searchInput }));
  }

  function handlePriceApply() {
    router.push(buildUrl({ minPrice: minPriceInput, maxPrice: maxPriceInput }));
  }

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
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-[#2D3436] md:text-[32px]">
          {activeCategory ? activeCategory.name : search ? `תוצאות חיפוש: "${search}"` : "כל השירותים"}
        </h1>
        <p className="mt-1 text-[14px] text-[#636E72]">
          {total > 0 ? `${total} שירותים נמצאו` : loading ? "טוען..." : "לא נמצאו שירותים"}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full shrink-0 lg:w-[260px]">
          <div className="space-y-6 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-5">
            {/* Search */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#2D3436]">חיפוש</label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="חפש שירות..."
                  className="w-full rounded-[10px] border border-[#E8ECF1] bg-[#FAFBFF] px-3 py-2.5 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
                />
                <button
                  type="submit"
                  className="rounded-[10px] bg-[#6C5CE7] px-3 py-2.5 text-white transition-colors hover:bg-[#5A4BD1]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#2D3436]">קטגוריה</label>
              <div className="space-y-1">
                <button
                  onClick={() => router.push(buildUrl({ category: "" }))}
                  className={`w-full rounded-[8px] px-3 py-2 text-right text-[13px] transition-colors ${
                    !category ? "bg-[#6C5CE7] font-semibold text-white" : "text-[#636E72] hover:bg-[#F0EEFF]"
                  }`}
                >
                  הכל
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => router.push(buildUrl({ category: cat.slug }))}
                    className={`w-full rounded-[8px] px-3 py-2 text-right text-[13px] transition-colors ${
                      category === cat.slug ? "bg-[#6C5CE7] font-semibold text-white" : "text-[#636E72] hover:bg-[#F0EEFF]"
                    }`}
                  >
                    <span className="me-2">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#2D3436]">טווח מחירים (₪)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="מ-"
                  dir="ltr"
                  className="w-full rounded-[10px] border border-[#E8ECF1] bg-[#FAFBFF] px-3 py-2 text-center text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
                />
                <span className="text-[#B2BEC3]">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="עד"
                  dir="ltr"
                  className="w-full rounded-[10px] border border-[#E8ECF1] bg-[#FAFBFF] px-3 py-2 text-center text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="mt-2 w-full rounded-[8px] border border-[#6C5CE7] py-1.5 text-[12px] font-semibold text-[#6C5CE7] transition-colors hover:bg-[#6C5CE7] hover:text-white"
              >
                החל
              </button>
            </div>

            {/* District */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#2D3436]">אזור</label>
              <select
                value={district}
                onChange={(e) => router.push(buildUrl({ district: e.target.value }))}
                className="w-full rounded-[10px] border border-[#E8ECF1] bg-[#FAFBFF] px-3 py-2.5 text-[13px] text-[#2D3436] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
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
                className="w-full rounded-[8px] border border-[#E8ECF1] py-2 text-[13px] text-[#636E72] transition-colors hover:border-[#E17055] hover:text-[#E17055]"
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
                <label className="text-[13px] font-medium text-[#636E72]">מיין לפי:</label>
                <select
                  value={sortBy}
                  onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                  className="rounded-[10px] border border-[#E8ECF1] bg-[#FAFBFF] px-3 py-2 text-[13px] text-[#2D3436] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex rounded-[8px] border border-[#E8ECF1] overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#6C5CE7] text-white" : "bg-[#FAFBFF] text-[#636E72] hover:bg-[#F0EEFF]"}`}
                  aria-label="תצוגת רשת"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#6C5CE7] text-white" : "bg-[#FAFBFF] text-[#636E72] hover:bg-[#F0EEFF]"}`}
                  aria-label="תצוגת רשימה"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 5.25h16.5m-16.5-10.5h16.5" />
                  </svg>
                </button>
              </div>
            </div>
            <span className="text-[13px] text-[#B2BEC3]">{total} תוצאות</span>
          </div>

          {/* Gig grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF]">
                  <div className="aspect-video w-full bg-[#F0EEFF]" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-1/3 rounded bg-[#F0EEFF]" />
                    <div className="h-4 w-full rounded bg-[#F0EEFF]" />
                    <div className="h-4 w-2/3 rounded bg-[#F0EEFF]" />
                    <div className="h-px bg-[#F1F3F8]" />
                    <div className="h-5 w-1/4 rounded bg-[#F0EEFF]" />
                  </div>
                </div>
              ))}
            </div>
          ) : gigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EEFF]">
                <svg className="h-8 w-8 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="mb-1 text-[16px] font-bold text-[#2D3436]">לא נמצאו שירותים</h3>
              <p className="mb-4 text-[14px] text-[#636E72]">נסה לשנות את הסינון או לחפש משהו אחר</p>
              <button
                onClick={handleClearFilters}
                className="rounded-[10px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#5A4BD1]"
              >
                הצג הכל
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {gigs.map((gig) => (
                    <GigListItem
                      key={gig.id}
                      id={gig.id}
                      title={gig.title}
                      image={gig.image}
                      seller={gig.seller}
                      startingPrice={gig.tiers[0]?.price || 0}
                      avgRating={gig.avgRating}
                      reviewCount={gig.reviewCount}
                      category={gig.category}
                    />
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="mt-8 flex items-center justify-center py-4">
                {loadingMore && (
                  <div className="flex items-center gap-3 text-[14px] text-[#636E72]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F0EEFF] border-t-[#6C5CE7]" />
                    טוען עוד...
                  </div>
                )}
                {!hasMore && gigs.length > 0 && (
                  <p className="text-[13px] text-[#B2BEC3]">הגעת לסוף הרשימה</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const AVATAR_GRADIENTS = [
  "from-[#6C5CE7] to-[#A29BFE]",
  "from-[#00D2D3] to-[#00B894]",
  "from-[#FF6B6B] to-[#FECA57]",
  "from-[#A29BFE] to-[#00D2D3]",
];

function GigListItem({
  id,
  title,
  image,
  seller,
  startingPrice,
  avgRating,
  reviewCount,
  category,
}: {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] };
  startingPrice: number;
  avgRating: number;
  reviewCount: number;
  category: { name: string; slug: string };
}) {
  const gradientIndex = seller.name.charCodeAt(0) % AVATAR_GRADIENTS.length;

  return (
    <Link
      href={`/gigs/${id}`}
      className="group flex overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] transition-all hover:shadow-[0_8px_24px_rgba(108,92,231,0.12)] hover:border-[#A29BFE]/40"
    >
      <div className="w-[200px] shrink-0 overflow-hidden bg-[#F0EEFF] sm:w-[240px]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}>
            <span className="text-4xl font-bold text-white/30">א</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#F0EEFF] px-2.5 py-0.5 text-[11px] font-medium text-[#6C5CE7]">
              {category.name}
            </span>
          </div>
          <h3 className="mb-2 text-[15px] font-semibold leading-snug text-[#2D3436] transition-colors group-hover:text-[#6C5CE7]">
            {title}
          </h3>
          <div className="flex items-center gap-2.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradientIndex]} text-[11px] font-bold text-white`}>
              {seller.name[0]}
            </div>
            <span className="text-[13px] text-[#636E72]">{seller.name}</span>
            {seller.serviceAreas && seller.serviceAreas.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[#B2BEC3]">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {seller.serviceAreas.slice(0, 3).map((a) => a.cityName || a.districtName).join(", ")}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#F1F3F8] pt-3">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[13px] font-bold text-[#2D3436]">{avgRating.toFixed(1)}</span>
            <span className="text-[13px] text-[#B2BEC3]">({reviewCount})</span>
          </div>
          <div>
            <span className="text-[12px] text-[#B2BEC3]">החל מ-</span>
            <span className="text-[18px] font-bold text-[#2D3436]">₪{startingPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GigsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
        </div>
      }
    >
      <GigsContent />
    </Suspense>
  );
}
