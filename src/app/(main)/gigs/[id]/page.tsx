"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface GigDetail {
  id: string;
  title: string;
  description: string;
  image: string | null;
  seller: { id: string; name: string; avatar: string | null; bio: string | null; createdAt: string };
  category: { name: string };
  tiers: { id: string; tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }[];
  reviews: { id: string; rating: number; comment: string; createdAt: string; user: { name: string; avatar: string | null } }[];
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

  useEffect(() => {
    fetch(`/api/gigs/${params.id}`)
      .then((r) => r.json())
      .then(setGig);
  }, [params.id]);

  async function handleOrder() {
    if (!session) {
      router.push("/login");
      return;
    }
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-[9999px] bg-[#F0EEFF] px-3 py-1 text-[12px] font-semibold text-[#6C5CE7]">
              {gig.category.name}
            </span>
          </div>
          <h1 className="mb-5 text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#2D3436] md:text-[28px]">
            {gig.title}
          </h1>

          {/* Seller Info */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[14px] font-bold text-white">
              {gig.seller.name[0]}
            </div>
            <div>
              <p className="font-semibold text-[#2D3436]">{gig.seller.name}</p>
              <div className="flex items-center gap-2 text-[13px]">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-bold text-[#2D3436]">{gig.avgRating.toFixed(1)}</span>
                </div>
                <span className="text-[#B2BEC3]">({gig.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Gig Image */}
          {gig.image && (
            <div className="mb-8 overflow-hidden rounded-[16px] border border-[#E8ECF1]">
              <img src={gig.image} alt={gig.title} className="w-full object-cover" />
            </div>
          )}

          {/* Description */}
          <div className="mb-8 rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6">
            <h2 className="mb-3 text-[18px] font-bold text-[#2D3436]">על השירות הזה</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#636E72]">{gig.description}</p>
          </div>

          {/* Reviews */}
          {gig.reviews.length > 0 && (
            <div className="rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] overflow-hidden">
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
                    <p className="text-[14px] leading-relaxed text-[#636E72]">{review.comment}</p>
                  </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
