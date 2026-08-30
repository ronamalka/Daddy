"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { GigCard } from "@/components/gig-card";
import { Heart, Star, Clock, ArrowsClockwise, ChatCircle, CaretDown } from "@phosphor-icons/react";
import { MarketplaceDisclaimer } from "@/components/marketplace-disclaimer";
import { SlotPicker, type SlotOption } from "@/components/slot-picker";

interface GigDetail {
  id: string;
  title: string;
  description: string;
  image: string | null;
  seller: { id: string; name: string; avatar: string | null; bio: string | null; city: string | null; createdAt: string };
  category: { name: string };
  tiers: { id: string; tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }[];
  reviews: {
    id: string; rating: number; comment: string; createdAt: string;
    communicationRating: number | null; qualityRating: number | null; timelinessRating: number | null;
    sellerResponse: string | null; sellerResponseAt: string | null;
    user?: { name: string; avatar: string | null };
  }[];
  images: { id: string; url: string; order: number }[];
  faqs: { id: string; question: string; answer: string; order: number }[];
  requirements: { id: string; question: string; required: boolean }[];
  avgRating: number;
  reviewCount: number;
  favoriteCount: number;
  isFavorited: boolean;
}

interface RelatedGig {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null };
  tiers: { price: number }[];
  avgRating: number;
  reviewCount: number;
}

const TIER_ORDER = ["BASIC", "STANDARD", "PREMIUM"];

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [selectedTier, setSelectedTier] = useState("BASIC");
  const [ordering, setOrdering] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [related, setRelated] = useState<RelatedGig[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flaggedReviews, setFlaggedReviews] = useState<Set<string>>(new Set());
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  async function flagReview(reviewId: string) {
    if (!flagReason.trim()) return;
    const res = await fetch(`/api/reviews/${reviewId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: flagReason }),
    });
    if (res.ok) {
      setFlaggedReviews((prev) => new Set(prev).add(reviewId));
      setFlaggingReviewId(null);
      setFlagReason("");
    }
  }

  useEffect(() => {
    const gigId = typeof params.id === "string" ? params.id : undefined;
    if (!gigId) return;

    let cancelled = false;

    fetch(`/api/gigs/${gigId}`, { signal: AbortSignal.timeout(15_000) })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data?.id || !Array.isArray(data.tiers)) {
          setLoadError(true);
          return;
        }
        setLoadError(false);
        setGig(data);
        setFavorited(Boolean(data.isFavorited));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    fetch(`/api/gigs/${gigId}/related`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setRelated(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadKey]);

  async function toggleFavorite() {
    if (!session) { router.push("/login"); return; }
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gigId: gig?.id }),
    });
    if (res.ok) {
      const { favorited: f } = await res.json();
      setFavorited(f);
    }
  }

  async function handleOrder() {
    if (!session) { router.push("/login"); return; }
    if (!selectedSlot) {
      setOrderError("יש לבחור חלון ביקור של שעתיים");
      return;
    }
    setOrdering(true);
    setOrderError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gigId: gig!.id,
        tier: selectedTier,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
      }),
    });
    if (res.ok) {
      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } else {
      const data = await res.json();
      setOrderError(data.error || "ביצוע ההזמנה נכשל");
      setOrdering(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">לא ניתן לטעון את השירות.</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setGig(null);
            setReloadKey((k) => k + 1);
          }}
          className="mt-4 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  const currentTier = gig.tiers.find((t) => t.tier === selectedTier) || gig.tiers[0];
  const sortedTiers = [...gig.tiers].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  const allImages = gig.images?.length > 0 ? gig.images.map((i) => i.url) : gig.image ? [gig.image] : [];
  const sellerName = gig.seller?.name || "משתמש";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
              {gig.category.name}
            </span>
            {gig.seller?.id === session?.user?.id && (
              <Link
                href={`/gigs/${gig.id}/edit`}
                className="rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-3 py-1 text-[12px] font-semibold text-[rgb(var(--color-warning))] hover:bg-[rgba(var(--color-accent-yellow),0.25)] transition-colors"
              >
                ערוך שירות
              </Link>
            )}
          </div>
          <div className="mb-5 flex items-start justify-between gap-4">
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-[rgb(var(--color-text))] md:text-[28px]">
              {gig.title}
            </h1>
            <button onClick={toggleFavorite} aria-label={favorited ? "הסר ממועדפים" : "הוסף למועדפים"} className="flex-shrink-0 mt-1 transition-transform hover:scale-110">
              <Heart
                className={`h-6 w-6 ${favorited ? "text-[rgb(var(--color-error))] " : "text-[rgb(var(--color-text-muted))]"}`}
                weight={favorited ? "fill" : "regular"}
              />
            </button>
          </div>

          {/* Seller Info */}
          <Link href={`/sellers/${gig.seller?.id ?? ""}`} className="mb-6 flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-[14px] font-bold text-white">
              {sellerName[0]}
            </div>
            <div>
              <p className="font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{sellerName}</p>
              <div className="flex items-center gap-2 text-[13px]">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-[rgb(var(--color-accent-yellow))] " weight="fill" />
                  <span className="font-bold text-[rgb(var(--color-text))]">{(gig.avgRating ?? 0).toFixed(1)}</span>
                </div>
                <span className="text-[rgb(var(--color-text-muted))]">({gig.reviewCount} ביקורות)</span>
                {gig.seller?.city && <span className="text-[rgb(var(--color-text-muted))]">· {gig.seller.city}</span>}
              </div>
            </div>
          </Link>

          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="mb-8">
              <div className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))]">
                <img src={allImages[activeImage]} alt={gig.title} className="w-full object-cover max-h-[400px]" />
              </div>
              {allImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImage === i ? "border-[rgb(var(--color-primary))]" : "border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary-light))]"
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-8 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
            <h2 className="mb-3 text-[18px] font-bold text-[rgb(var(--color-text))]">על השירות הזה</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{gig.description}</p>
          </div>

          {/* FAQ Accordion */}
          {gig.faqs.length > 0 && (
            <div className="mb-8 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[rgb(var(--color-border))] px-6 py-4">
                <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">שאלות נפוצות</h2>
                <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
                  {gig.faqs.length}
                </span>
              </div>
              <div className="divide-y divide-[rgb(var(--color-border))]/50">
                {gig.faqs.map((faq) => (
                  <div key={faq.id}>
                    <h3>
                      <button
                        onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                        aria-expanded={openFaq === faq.id}
                        aria-controls={`faq-${faq.id}`}
                        className="flex w-full items-center justify-between px-6 py-4 text-right transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
                      >
                        <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{faq.question}</span>
                        <CaretDown
                          aria-hidden="true"
                          className={`h-5 w-5 flex-shrink-0 text-[rgb(var(--color-text-muted))] transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    </h3>
                    {openFaq === faq.id && (
                      <div id={`faq-${faq.id}`} role="region" aria-label={faq.question} className="px-6 pb-4">
                        <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {Array.isArray(gig.reviews) && gig.reviews.length > 0 && (
            <div className="mb-8 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[rgb(var(--color-border))] px-6 py-4">
                <Star className="h-5 w-5 text-[rgb(var(--color-accent-yellow))] " weight="fill" />
                <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">ביקורות</h2>
                <span className="rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-warning))]">
                  {gig.reviewCount}
                </span>
              </div>
              <div className="divide-y divide-[rgb(var(--color-border))]/50 p-6">
                {gig.reviews.map((review) => (
                  <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))] text-[12px] font-bold text-white">
                        {(review.user?.name || "משתמש")[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{review.user?.name || "משתמש"}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? "text-[rgb(var(--color-accent-yellow))]" : "text-[rgb(var(--color-border))]"}`}
                              weight={i < review.rating ? "fill" : "regular"}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[12px] text-[rgb(var(--color-text-muted))]">
                        {new Date(review.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>

                    {/* Sub-ratings */}
                    {(review.communicationRating || review.qualityRating || review.timelinessRating) && (
                      <div className="mb-2 flex flex-wrap gap-3 text-[12px]">
                        {review.communicationRating && (
                          <span className="text-[rgb(var(--color-text-secondary))]">תקשורת: <span className="font-semibold text-[rgb(var(--color-text))]">{review.communicationRating}/5</span></span>
                        )}
                        {review.qualityRating && (
                          <span className="text-[rgb(var(--color-text-secondary))]">איכות: <span className="font-semibold text-[rgb(var(--color-text))]">{review.qualityRating}/5</span></span>
                        )}
                        {review.timelinessRating && (
                          <span className="text-[rgb(var(--color-text-secondary))]">עמידה בזמנים: <span className="font-semibold text-[rgb(var(--color-text))]">{review.timelinessRating}/5</span></span>
                        )}
                      </div>
                    )}

                    <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{review.comment}</p>

                    {/* Seller response */}
                    {review.sellerResponse && (
                      <div className="mt-3 rounded-xl bg-[rgba(var(--color-primary),0.1)] p-4 ms-6">
                        <p className="text-[12px] font-semibold text-[rgb(var(--color-primary))] mb-1">תגובת המוכר:</p>
                        <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{review.sellerResponse}</p>
                      </div>
                    )}

                    {/* Flag review */}
                    {session && gig.seller?.id !== (session.user as { id: string }).id && !flaggedReviews.has(review.id) && (
                      <div className="mt-2">
                        {flaggingReviewId !== review.id ? (
                          <button
                            onClick={() => setFlaggingReviewId(review.id)}
                            className="text-[11px] text-[#B2BEC3] hover:text-[#E17055] transition-colors"
                          >
                            🚩 דווח
                          </button>
                        ) : (
                          <div className="flex gap-2 mt-1">
                            <input
                              value={flagReason}
                              onChange={(e) => setFlagReason(e.target.value)}
                              placeholder="סיבת הדיווח..."
                              aria-label="סיבת הדיווח על ביקורת"
                              className="flex-1 rounded-[8px] border border-[#E8ECF1] bg-white px-3 py-1.5 text-[12px] focus:border-[#E17055] focus:outline-none"
                            />
                            <button
                              onClick={() => flagReview(review.id)}
                              disabled={!flagReason.trim()}
                              className="rounded-[8px] bg-[#E17055] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#D63031] disabled:opacity-40"
                            >
                              דווח
                            </button>
                            <button
                              onClick={() => { setFlaggingReviewId(null); setFlagReason(""); }}
                              className="rounded-[8px] border border-[#E8ECF1] px-2 py-1.5 text-[12px] text-[#636E72] hover:bg-[#F8F9FA]"
                            >
                              ביטול
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {flaggedReviews.has(review.id) && (
                      <p className="mt-2 text-[11px] text-[#00B894]">✓ תודה! הדיווח נשלח. אנחנו בודקים.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Gigs */}
          {related.length > 0 && (
            <div>
              <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">אבאל׳ות נוספים שאולי יעניינו אותך</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map((g) => (
                  <GigCard
                    key={g.id}
                    id={g.id}
                    title={g.title}
                    image={g.image}
                    seller={g.seller}
                    startingPrice={g.tiers[0]?.price || 0}
                    avgRating={g.avgRating}
                    reviewCount={g.reviewCount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Pricing */}
        <div>
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
            {/* Tier Tabs */}
            <div className="flex border-b border-[rgb(var(--color-border))]">
              {sortedTiers.map((tier) => {
                const isActive = selectedTier === tier.tier;
                return (
                  <button
                    key={tier.tier}
                    onClick={() => setSelectedTier(tier.tier)}
                    className={`relative flex-1 py-3.5 text-center text-[13px] font-semibold transition-colors ${
                      isActive ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))]"
                    }`}
                  >
                    {tier.tier}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[rgb(var(--color-primary))]" />
                    )}
                  </button>
                );
              })}
            </div>

            {currentTier && (
              <div className="p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))]">{currentTier.title}</h3>
                  <span className="text-[28px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">₪{currentTier.price}</span>
                </div>
                <p className="mb-2 text-[11px] text-[rgb(var(--color-text-muted))]">כולל מע״מ · המחיר נקבע על ידי הספק</p>
                <p className="mb-5 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{currentTier.description}</p>

                <div className="mb-5 flex items-center gap-5 text-[13px] text-[rgb(var(--color-text-secondary))]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[rgb(var(--color-primary-light))]" />
                    {currentTier.deliveryDays} {currentTier.deliveryDays > 1 ? "ימי אספקה" : "יום אספקה"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowsClockwise className="h-4 w-4 text-[rgb(var(--color-primary-light))]" />
                    {currentTier.revisions} {currentTier.revisions > 1 ? "תיקונים" : "תיקון"}
                  </span>
                </div>

                <div className="mb-5">
                  {gig.seller?.id ? (
                    <SlotPicker sellerId={gig.seller.id} value={selectedSlot} onChange={setSelectedSlot} />
                  ) : (
                    <p className="rounded-xl bg-[rgb(var(--color-bg))] px-4 py-3 text-[13px] text-[rgb(var(--color-text-secondary))]">
                      לא ניתן לבחור חלון ביקור כרגע.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleOrder}
                  disabled={ordering || gig.seller?.id === session?.user?.id || !selectedSlot}
                  className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:bg-[rgb(var(--color-primary-hover))] hover:shadow-[0_6px_20px_rgba(var(--color-primary),0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {ordering ? "מבצע הזמנה..." : `המשך (₪${currentTier.price})`}
                </button>

                {orderError && (
                  <div role="alert" className="mt-3 rounded-lg bg-[rgba(var(--color-error),0.1)] px-4 py-2.5 text-center text-[13px] text-[rgb(var(--color-error))]">
                    {orderError}
                  </div>
                )}

                {gig.seller?.id === session?.user?.id && (
                  <p className="mt-3 text-center text-[12px] text-[rgb(var(--color-text-muted))]">אי אפשר להזמין את השירות של עצמך</p>
                )}

                <div className="mt-4">
                  <MarketplaceDisclaimer compact />
                </div>

                {/* Contact seller */}
                {session?.user && gig.seller?.id !== session.user.id && (
                  <Link
                    href={`/sellers/${gig.seller?.id}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--color-border))] py-3 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] transition-all hover:border-[rgba(var(--color-primary-light),0.3)] hover:text-[rgb(var(--color-primary))]"
                  >
                    <ChatCircle className="h-4 w-4" />
                    צור קשר עם המוכר
                  </Link>
                )}
              </div>
            )}

            {/* Requirements preview */}
            {gig.requirements.length > 0 && (
              <div className="border-t border-[rgb(var(--color-border))] px-6 py-4">
                <p className="text-[12px] font-semibold text-[rgb(var(--color-text-muted))] mb-2">דרישות לאחר ההזמנה:</p>
                <ul className="space-y-1.5">
                  {gig.requirements.map((req) => (
                    <li key={req.id} className="flex items-start gap-2 text-[13px] text-[rgb(var(--color-text-secondary))]">
                      <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${req.required ? "bg-[rgb(var(--color-error))]" : "bg-[rgb(var(--color-text-muted))]"}`} />
                      {req.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
