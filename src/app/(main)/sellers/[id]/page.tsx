"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { GigCard } from "@/components/gig-card";
import { getServiceBySlug } from "@/lib/services";

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  ratingAttitude: number | null;
  ratingTimeliness: number | null;
  ratingPrice: number | null;
  ratingQuality: number | null;
  sellerResponse: string | null;
  sellerResponseAt: string | null;
  createdAt: string;
  user: { id: string; name: string; city: string | null };
}

interface SellerProfile {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  avgRating: number;
  totalReviews: number;
  completedOrders: number;
  ratingBreakdown: {
    attitude: number;
    timeliness: number;
    price: number;
    quality: number;
    overall: number;
    count: number;
  } | null;
  serviceAreas: { districtCode: number; districtName: string; cityCode: number | null; cityName: string | null }[];
  userServices: { serviceSlug: string }[];
  servicePrices: { serviceSlug: string; price: number; description: string | null }[];
  allReviews: ReviewData[];
  gigs: {
    id: string;
    title: string;
    image: string | null;
    category: { name: string };
    tiers: { price: number }[];
    avgRating: number;
    reviewCount: number;
  }[];
}

function RatingBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? "#00B894" : value >= 6 ? "#FECA57" : value >= 4 ? "#F0932B" : "#FF6B6B";

  return (
    <div className="flex items-center gap-3">
      <span className="text-[16px] w-6 text-center">{icon}</span>
      <span className="w-16 text-[13px] font-medium text-[#636E72]">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-[#F1F3F8] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-left text-[15px] font-bold" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function SellerProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "prices" | "gigs">("reviews");

  useEffect(() => {
    fetch(`/api/sellers/${params.id}`)
      .then((r) => r.json())
      .then(setSeller);
  }, [params.id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgText.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: params.id, content: msgText }),
    });
    if (res.ok) {
      setMsgSent(true);
      setMsgText("");
    }
  }

  if (!seller) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" /></div>;
  }

  const memberSince = new Date(seller.createdAt).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const rb = seller.ratingBreakdown;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-6 overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-white shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
        <div className="relative h-32" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="relative px-8 pb-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-4xl font-bold text-white shadow-lg">
              {seller.name[0]}
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:text-right flex-1">
              <h1 className="text-[24px] font-bold text-[#2D3436]">{seller.name}</h1>
              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[14px] text-[#636E72]">
                {seller.city && <span>{seller.city}</span>}
                <span>חבר מאז {memberSince}</span>
              </div>
            </div>
          </div>
          {seller.bio && <p className="mt-4 text-[14px] leading-relaxed text-[#636E72]">{seller.bio}</p>}

          {/* Service areas */}
          {seller.serviceAreas.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <svg className="h-4 w-4 text-[#00D2D3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-[13px] font-medium text-[#636E72]">אזורי שירות:</span>
              {seller.serviceAreas.map((a, i) => (
                <span key={i} className="rounded-[9999px] bg-[#00D2D3]/10 px-3 py-1 text-[12px] font-medium text-[#00B894]">
                  {a.cityName || a.districtName}
                </span>
              ))}
            </div>
          )}

          {/* Services */}
          {seller.userServices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-[#636E72]">שירותים:</span>
              {seller.userServices.map((us) => {
                const svc = getServiceBySlug(us.serviceSlug);
                return (
                  <span key={us.serviceSlug} className="rounded-[9999px] bg-[#6C5CE7]/10 px-3 py-1 text-[12px] font-medium text-[#6C5CE7]">
                    {svc?.nameHe || us.serviceSlug}
                  </span>
                );
              })}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#6C5CE7]">{seller.completedOrders}</p>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">הזמנות שהושלמו</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#00D2D3]">{seller.totalReviews}</p>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">חוות דעת</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <svg className="h-5 w-5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <p className="text-[24px] font-bold text-[#FECA57]">{seller.avgRating || "--"}</p>
              </div>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">דירוג כללי</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Breakdown — Midrag style */}
      {rb && (
        <div className="mb-6 rounded-[16px] border border-[#E8ECF1] bg-white p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold text-[#2D3436]">דירוג מפורט</h2>
            <span className="text-[13px] text-[#B2BEC3]">מבוסס על {rb.count} חוות דעת</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Big score */}
            <div className="flex flex-col items-center justify-center rounded-[16px] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] p-6 text-white min-w-[140px]">
              <p className="text-[42px] font-bold leading-none">{rb.overall.toFixed(1)}</p>
              <p className="mt-1 text-[13px] text-white/70">מתוך 10</p>
              <p className="mt-2 text-[12px] font-semibold">דירוג כללי</p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-3">
              <RatingBar label="איכות" value={rb.quality} icon="⭐" />
              <RatingBar label="יחס" value={rb.attitude} icon="🤝" />
              <RatingBar label="זמנים" value={rb.timeliness} icon="⏰" />
              <RatingBar label="מחיר" value={rb.price} icon="💰" />
            </div>
          </div>
        </div>
      )}

      {/* Contact Form */}
      {session?.user && session.user.id !== seller.id && (
        <div className="mb-6 rounded-[16px] border border-[#E8ECF1] bg-white p-6">
          <h2 className="mb-4 text-[16px] font-bold text-[#2D3436]">שלח הודעה ל{seller.name}</h2>
          {msgSent ? (
            <div className="rounded-[12px] bg-[#00B894]/10 px-4 py-3 text-[14px] text-[#00B894] font-medium">ההודעה נשלחה בהצלחה!</div>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="היי, אני מתעניין בשירות שלך..."
                className="flex-1 rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
              />
              <button type="submit" disabled={!msgText.trim()} className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1] disabled:opacity-40">שלח</button>
            </form>
          )}
        </div>
      )}

      {/* Tabs: Reviews / Price List / Gigs */}
      <div className="mb-6 flex border-b border-[#E8ECF1]">
        {[
          { key: "reviews" as const, label: "חוות דעת", count: seller.totalReviews },
          { key: "prices" as const, label: "מחירון", count: seller.servicePrices.length },
          { key: "gigs" as const, label: "שירותים", count: seller.gigs.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-[14px] font-semibold border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-[#6C5CE7] text-[#6C5CE7]"
                : "border-transparent text-[#B2BEC3] hover:text-[#636E72]"
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="text-[12px] opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {seller.allReviews.length === 0 ? (
            <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-8 text-center">
              <p className="text-[16px] font-medium text-[#2D3436]">אין חוות דעת עדיין</p>
              <p className="mt-1 text-[14px] text-[#B2BEC3]">היה הראשון לכתוב חוות דעת</p>
            </div>
          ) : (
            seller.allReviews.map((review) => (
              <div key={review.id} className="rounded-[16px] border border-[#E8ECF1] bg-white p-5 transition-all hover:shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0EEFF] text-[13px] font-bold text-[#6C5CE7]">
                      {review.user.name[0]}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#2D3436]">{review.user.name}</p>
                      <p className="text-[12px] text-[#B2BEC3]">
                        {review.user.city && `${review.user.city} · `}
                        {new Date(review.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-[9999px] bg-[#FECA57]/15 px-3 py-1">
                    <svg className="h-3.5 w-3.5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    <span className="text-[13px] font-bold text-[#F0932B]">{review.rating}</span>
                  </div>
                </div>

                <p className="text-[14px] leading-relaxed text-[#636E72] mb-3">{review.comment}</p>

                {/* Per-dimension ratings */}
                {review.ratingAttitude != null && (
                  <div className="flex flex-wrap gap-3 text-[12px] border-t border-[#F1F3F8] pt-3">
                    <span className="flex items-center gap-1 rounded-[8px] bg-[#FAFBFF] px-2.5 py-1 text-[#636E72]">
                      ⭐ איכות: <b className="text-[#2D3436]">{review.ratingQuality}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-[8px] bg-[#FAFBFF] px-2.5 py-1 text-[#636E72]">
                      🤝 יחס: <b className="text-[#2D3436]">{review.ratingAttitude}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-[8px] bg-[#FAFBFF] px-2.5 py-1 text-[#636E72]">
                      ⏰ זמנים: <b className="text-[#2D3436]">{review.ratingTimeliness}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-[8px] bg-[#FAFBFF] px-2.5 py-1 text-[#636E72]">
                      💰 מחיר: <b className="text-[#2D3436]">{review.ratingPrice}</b>
                    </span>
                  </div>
                )}

                {/* Seller response */}
                {review.sellerResponse && (
                  <div className="mt-3 rounded-[12px] bg-[#F0EEFF] p-4">
                    <p className="text-[12px] font-semibold text-[#6C5CE7] mb-1">תגובת בעל המקצוע:</p>
                    <p className="text-[13px] text-[#636E72]">{review.sellerResponse}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Prices Tab */}
      {activeTab === "prices" && (
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white overflow-hidden">
          {seller.servicePrices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[16px] font-medium text-[#2D3436]">המחירון עדיין לא עודכן</p>
              <p className="mt-1 text-[14px] text-[#B2BEC3]">בעל המקצוע טרם הוסיף מחירים</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-[#FAFBFF] border-b border-[#F1F3F8]">
                <h3 className="text-[16px] font-bold text-[#2D3436]">המחירון שלי</h3>
                <p className="text-[12px] text-[#B2BEC3] mt-0.5">המחירים למקרים סטנדרטיים בלבד</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F3F8]">
                    <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#B2BEC3] uppercase tracking-wider">שירות</th>
                    <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#B2BEC3] uppercase tracking-wider">פירוט</th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#B2BEC3] uppercase tracking-wider">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.servicePrices.map((sp, i) => {
                    const svc = getServiceBySlug(sp.serviceSlug);
                    return (
                      <tr key={sp.serviceSlug} className={i < seller.servicePrices.length - 1 ? "border-b border-[#F1F3F8]" : ""}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {svc && <span className="text-[14px]">{svc.categoryIcon}</span>}
                            <span className="text-[14px] font-medium text-[#2D3436]">{svc?.nameHe || sp.serviceSlug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#636E72]">{sp.description || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="text-[15px] font-bold text-[#6C5CE7]">₪{sp.price}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Gigs Tab */}
      {activeTab === "gigs" && (
        <>
          {seller.gigs.length === 0 ? (
            <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-8 text-center">
              <p className="text-[14px] text-[#B2BEC3]">אין שירותים עדיין</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {seller.gigs.map((g) => (
                <GigCard
                  key={g.id}
                  id={g.id}
                  title={g.title}
                  image={g.image}
                  seller={{ name: seller.name, avatar: seller.avatar }}
                  startingPrice={g.tiers[0]?.price || 0}
                  avgRating={g.avgRating}
                  reviewCount={g.reviewCount}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
