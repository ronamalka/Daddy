"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { GigCard } from "@/components/gig-card";

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
    user: { name: string; avatar: string | null };
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
    fetch(`/api/gigs/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setGig(data);
        setFavorited(data.isFavorited);
      });
    fetch(`/api/gigs/${params.id}/related`)
      .then((r) => r.json())
      .then(setRelated)
      .catch(() => {});
  }, [params.id]);

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
    setOrdering(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gigId: gig!.id, tier: selectedTier }),
    });
    if (res.ok) {
      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } else {
      const data = await res.json();
      alert(data.error || "ביצוע ההזמנה נכשל");
      setOrdering(false);
    }
  }

  if (!gig) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  const currentTier = gig.tiers.find((t) => t.tier === selectedTier) || gig.tiers[0];
  const sortedTiers = [...gig.tiers].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  const allImages = gig.images.length > 0 ? gig.images.map((i) => i.url) : gig.image ? [gig.image] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-[9999px] bg-[#F0EEFF] px-3 py-1 text-[12px] font-semibold text-[#6C5CE7]">
              {gig.category.name}
            </span>
            {gig.seller.id === session?.user?.id && (
              <Link
                href={`/gigs/${gig.id}/edit`}
                className="rounded-[9999px] bg-[#FECA57]/15 px-3 py-1 text-[12px] font-semibold text-[#E67E22] hover:bg-[#FECA57]/25 transition-colors"
              >
                ערוך שירות
              </Link>
            )}
          </div>
          <div className="mb-5 flex items-start justify-between gap-4">
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#2D3436] md:text-[28px]">
              {gig.title}
            </h1>
            <button onClick={toggleFavorite} className="flex-shrink-0 mt-1 transition-transform hover:scale-110">
              <svg className={`h-6 w-6 ${favorited ? "text-[#FF6B6B] fill-[#FF6B6B]" : "text-[#B2BEC3]"}`} fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Seller Info */}
          <Link href={`/sellers/${gig.seller.id}`} className="mb-6 flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[14px] font-bold text-white">
              {gig.seller.name[0]}
            </div>
            <div>
              <p className="font-semibold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">{gig.seller.name}</p>
              <div className="flex items-center gap-2 text-[13px]">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-bold text-[#2D3436]">{gig.avgRating.toFixed(1)}</span>
                </div>
                <span className="text-[#B2BEC3]">({gig.reviewCount} ביקורות)</span>
                {gig.seller.city && <span className="text-[#B2BEC3]">· {gig.seller.city}</span>}
              </div>
            </div>
          </Link>

          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="mb-8">
              <div className="overflow-hidden rounded-[16px] border border-[#E8ECF1]">
                <img src={allImages[activeImage]} alt={gig.title} className="w-full object-cover max-h-[400px]" />
              </div>
              {allImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-[8px] border-2 transition-all ${
                        activeImage === i ? "border-[#6C5CE7]" : "border-[#E8ECF1] hover:border-[#A29BFE]"
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
          <div className="mb-8 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6">
            <h2 className="mb-3 text-[18px] font-bold text-[#2D3436]">על השירות הזה</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#636E72]">{gig.description}</p>
          </div>

          {/* FAQ Accordion */}
          {gig.faqs.length > 0 && (
            <div className="mb-8 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#E8ECF1] px-6 py-4">
                <h2 className="text-[16px] font-bold text-[#2D3436]">שאלות נפוצות</h2>
                <span className="rounded-[9999px] bg-[#F0EEFF] px-2.5 py-0.5 text-[12px] font-semibold text-[#6C5CE7]">
                  {gig.faqs.length}
                </span>
              </div>
              <div className="divide-y divide-[#F1F3F8]">
                {gig.faqs.map((faq) => (
                  <div key={faq.id}>
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="flex w-full items-center justify-between px-6 py-4 text-right transition-colors hover:bg-[#FAFBFF]"
                    >
                      <span className="text-[14px] font-semibold text-[#2D3436]">{faq.question}</span>
                      <svg
                        className={`h-5 w-5 flex-shrink-0 text-[#B2BEC3] transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-[14px] leading-relaxed text-[#636E72]">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {gig.reviews.length > 0 && (
            <div className="mb-8 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#E8ECF1] px-6 py-4">
                <svg className="h-5 w-5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <h2 className="text-[16px] font-bold text-[#2D3436]">ביקורות</h2>
                <span className="rounded-[9999px] bg-[#FECA57]/15 px-2.5 py-0.5 text-[12px] font-semibold text-[#E67E22]">
                  {gig.reviewCount}
                </span>
              </div>
              <div className="divide-y divide-[#F1F3F8] p-6">
                {gig.reviews.map((review) => (
                  <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00D2D3] to-[#00B894] text-[12px] font-bold text-white">
                        {review.user.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#2D3436]">{review.user.name}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "text-[#FECA57]" : "text-[#E8ECF1]"}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-[12px] text-[#B2BEC3]">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Sub-ratings */}
                    {(review.communicationRating || review.qualityRating || review.timelinessRating) && (
                      <div className="mb-2 flex flex-wrap gap-3 text-[12px]">
                        {review.communicationRating && (
                          <span className="text-[#636E72]">תקשורת: <span className="font-semibold text-[#2D3436]">{review.communicationRating}/5</span></span>
                        )}
                        {review.qualityRating && (
                          <span className="text-[#636E72]">איכות: <span className="font-semibold text-[#2D3436]">{review.qualityRating}/5</span></span>
                        )}
                        {review.timelinessRating && (
                          <span className="text-[#636E72]">עמידה בזמנים: <span className="font-semibold text-[#2D3436]">{review.timelinessRating}/5</span></span>
                        )}
                      </div>
                    )}

                    <p className="text-[14px] leading-relaxed text-[#636E72]">{review.comment}</p>

                    {/* Seller response */}
                    {review.sellerResponse && (
                      <div className="mt-3 rounded-[12px] bg-[#F0EEFF] p-4 ms-6">
                        <p className="text-[12px] font-semibold text-[#6C5CE7] mb-1">תגובת המוכר:</p>
                        <p className="text-[13px] leading-relaxed text-[#636E72]">{review.sellerResponse}</p>
                      </div>
                    )}

                    {/* Flag review */}
                    {session && gig.seller.id !== (session.user as { id: string }).id && !flaggedReviews.has(review.id) && (
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
                      <p className="mt-2 text-[11px] text-[#00B894]">✓ הדיווח נשלח</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Gigs */}
          {related.length > 0 && (
            <div>
              <h2 className="mb-4 text-[18px] font-bold text-[#2D3436]">אבאל׳ות נוספים שאולי יעניינו אותך</h2>
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
          <div className="sticky top-4 overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
            {/* Tier Tabs */}
            <div className="flex border-b border-[#E8ECF1]">
              {sortedTiers.map((tier) => {
                const isActive = selectedTier === tier.tier;
                return (
                  <button
                    key={tier.tier}
                    onClick={() => setSelectedTier(tier.tier)}
                    className={`relative flex-1 py-3.5 text-center text-[13px] font-semibold transition-colors ${
                      isActive ? "text-[#6C5CE7]" : "text-[#B2BEC3] hover:text-[#636E72]"
                    }`}
                  >
                    {tier.tier}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#6C5CE7]" />
                    )}
                  </button>
                );
              })}
            </div>

            {currentTier && (
              <div className="p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-[#2D3436]">{currentTier.title}</h3>
                  <span className="text-[28px] font-bold tracking-[-0.01em] text-[#2D3436]">₪{currentTier.price}</span>
                </div>
                <p className="mb-5 text-[14px] leading-relaxed text-[#636E72]">{currentTier.description}</p>

                <div className="mb-5 flex items-center gap-5 text-[13px] text-[#636E72]">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {currentTier.deliveryDays} {currentTier.deliveryDays > 1 ? "ימי אספקה" : "יום אספקה"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    {currentTier.revisions} {currentTier.revisions > 1 ? "תיקונים" : "תיקון"}
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={ordering || gig.seller.id === session?.user?.id}
                  className="w-full rounded-[12px] bg-[#6C5CE7] py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_6px_20px_rgba(108,92,231,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {ordering ? "מבצע הזמנה..." : `המשך (₪${currentTier.price})`}
                </button>

                {gig.seller.id === session?.user?.id && (
                  <p className="mt-3 text-center text-[12px] text-[#B2BEC3]">אי אפשר להזמין את השירות של עצמך</p>
                )}

                {/* Contact seller */}
                {session?.user && gig.seller.id !== session.user.id && (
                  <Link
                    href={`/sellers/${gig.seller.id}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E8ECF1] py-3 text-[14px] font-medium text-[#636E72] transition-all hover:border-[#A29BFE]/30 hover:text-[#6C5CE7]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    צור קשר עם המוכר
                  </Link>
                )}
              </div>
            )}

            {/* Requirements preview */}
            {gig.requirements.length > 0 && (
              <div className="border-t border-[#E8ECF1] px-6 py-4">
                <p className="text-[12px] font-semibold text-[#B2BEC3] mb-2">דרישות לאחר ההזמנה:</p>
                <ul className="space-y-1.5">
                  {gig.requirements.map((req) => (
                    <li key={req.id} className="flex items-start gap-2 text-[13px] text-[#636E72]">
                      <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${req.required ? "bg-[#FF6B6B]" : "bg-[#B2BEC3]"}`} />
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
