"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { GigCard } from "@/components/gig-card";
import { getServiceBySlug } from "@/lib/services";
import { MapPin, Star, Handshake, Clock, Coins } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

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

function RatingBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? "rgb(var(--color-success))" : value >= 6 ? "rgb(var(--color-accent-yellow))" : value >= 4 ? "rgb(var(--color-warning))" : "rgb(var(--color-error))";

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-center text-[rgb(var(--color-primary))]">{icon}</span>
      <span className="w-16 text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-[rgb(var(--color-border-light))] overflow-hidden">
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
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" /></div>;
  }

  const memberSince = new Date(seller.createdAt).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const rb = seller.ratingBreakdown;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-6 overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
        <div className="relative h-32 bg-gradient-to-r from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="relative px-8 pb-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[rgb(var(--color-surface))] bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-4xl font-bold text-white shadow-lg">
              {seller.name[0]}
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:text-right flex-1">
              <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">{seller.name}</h1>
              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[14px] text-[rgb(var(--color-text-secondary))]">
                {seller.city && <span>{seller.city}</span>}
                <span>חבר מאז {memberSince}</span>
              </div>
            </div>
          </div>
          {seller.bio && <p className="mt-4 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{seller.bio}</p>}

          {/* Service areas */}
          {seller.serviceAreas.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <MapPin className="h-4 w-4 text-[rgb(var(--color-accent))]" />
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">אזורי שירות:</span>
              {seller.serviceAreas.map((a, i) => (
                <span key={i} className="rounded-full bg-[rgba(var(--color-accent),0.1)] px-3 py-1 text-[12px] font-medium text-[rgb(var(--color-success))]">
                  {a.cityName || a.districtName}
                </span>
              ))}
            </div>
          )}

          {/* Services */}
          {seller.userServices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">שירותים:</span>
              {seller.userServices.map((us) => {
                const svc = getServiceBySlug(us.serviceSlug);
                return (
                  <span key={us.serviceSlug} className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[12px] font-medium text-[rgb(var(--color-primary))]">
                    {svc?.nameHe || us.serviceSlug}
                  </span>
                );
              })}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <p className="text-[24px] font-bold text-[rgb(var(--color-primary))]">{seller.completedOrders}</p>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">הזמנות שהושלמו</p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <p className="text-[24px] font-bold text-[rgb(var(--color-accent))]">{seller.totalReviews}</p>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">חוות דעת</p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-[rgb(var(--color-accent-yellow))] fill-[rgb(var(--color-accent-yellow))]" />
                <p className="text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">{seller.avgRating || "--"}</p>
              </div>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">דירוג כללי</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Breakdown — Midrag style */}
      {rb && (
        <div className="mb-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold text-[rgb(var(--color-text))]">דירוג מפורט</h2>
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">מבוסס על {rb.count} חוות דעת</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Big score */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] p-6 text-white min-w-[140px]">
              <p className="text-[42px] font-bold leading-none">{rb.overall.toFixed(1)}</p>
              <p className="mt-1 text-[13px] text-white/70">מתוך 10</p>
              <p className="mt-2 text-[12px] font-semibold">דירוג כללי</p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-3">
              <RatingBar label="איכות" value={rb.quality} icon={<Star className="h-4 w-4" />} />
              <RatingBar label="יחס" value={rb.attitude} icon={<Handshake className="h-4 w-4" />} />
              <RatingBar label="זמנים" value={rb.timeliness} icon={<Clock className="h-4 w-4" />} />
              <RatingBar label="מחיר" value={rb.price} icon={<Coins className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      )}

      {/* Contact Form */}
      {session?.user && session.user.id !== seller.id && (
        <div className="mb-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <h2 className="mb-4 text-[16px] font-bold text-[rgb(var(--color-text))]">שלח הודעה ל{seller.name}</h2>
          {msgSent ? (
            <div className="rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-success))] font-medium">ההודעה נשלחה בהצלחה!</div>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="היי, אני מתעניין בשירות שלך..."
                className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
              />
              <button type="submit" disabled={!msgText.trim()} className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40">שלח</button>
            </form>
          )}
        </div>
      )}

      {/* Tabs: Reviews / Price List / Gigs */}
      <div className="mb-6 flex border-b border-[rgb(var(--color-border))]">
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
                ? "border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]"
                : "border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))]"
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
            <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 text-center">
              <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין חוות דעת עדיין</p>
              <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">היה הראשון לכתוב חוות דעת</p>
            </div>
          ) : (
            seller.allReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)] text-[13px] font-bold text-[rgb(var(--color-primary))]">
                      {review.user.name[0]}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{review.user.name}</p>
                      <p className="text-[12px] text-[rgb(var(--color-text-muted))]">
                        {review.user.city && `${review.user.city} · `}
                        {new Date(review.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-3 py-1">
                    <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))] fill-[rgb(var(--color-accent-yellow))]" />
                    <span className="text-[13px] font-bold text-[rgb(var(--color-warning))]">{review.rating}</span>
                  </div>
                </div>

                <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] mb-3">{review.comment}</p>

                {/* Per-dimension ratings */}
                {review.ratingAttitude != null && (
                  <div className="flex flex-wrap gap-3 text-[12px] border-t border-[rgb(var(--color-border-light))] pt-3">
                    <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                      <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" /> איכות: <b className="text-[rgb(var(--color-text))]">{review.ratingQuality}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                      <Handshake className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" /> יחס: <b className="text-[rgb(var(--color-text))]">{review.ratingAttitude}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                      <Clock className="h-3.5 w-3.5 text-[rgb(var(--color-accent))]" /> זמנים: <b className="text-[rgb(var(--color-text))]">{review.ratingTimeliness}</b>
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1 text-[rgb(var(--color-text-secondary))]">
                      <Coins className="h-3.5 w-3.5 text-[rgb(var(--color-success))]" /> מחיר: <b className="text-[rgb(var(--color-text))]">{review.ratingPrice}</b>
                    </span>
                  </div>
                )}

                {/* Seller response */}
                {review.sellerResponse && (
                  <div className="mt-3 rounded-xl bg-[rgba(var(--color-primary),0.1)] p-4">
                    <p className="text-[12px] font-semibold text-[rgb(var(--color-primary))] mb-1">תגובת בעל המקצוע:</p>
                    <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">{review.sellerResponse}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Prices Tab */}
      {activeTab === "prices" && (
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
          {seller.servicePrices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">המחירון עדיין לא עודכן</p>
              <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">בעל המקצוע טרם הוסיף מחירים</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border-light))]">
                <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))]">המחירון שלי</h3>
                <p className="text-[12px] text-[rgb(var(--color-text-muted))] mt-0.5">המחירים למקרים סטנדרטיים בלבד</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgb(var(--color-border-light))]">
                    <th className="px-6 py-3 text-right text-[12px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">שירות</th>
                    <th className="px-6 py-3 text-right text-[12px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">פירוט</th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.servicePrices.map((sp, i) => {
                    const svc = getServiceBySlug(sp.serviceSlug);
                    return (
                      <tr key={sp.serviceSlug} className={i < seller.servicePrices.length - 1 ? "border-b border-[rgb(var(--color-border-light))]" : ""}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {svc && <CategoryIcon slug={svc.category} className="h-4 w-4 text-[rgb(var(--color-primary))]" />}
                            <span className="text-[14px] font-medium text-[rgb(var(--color-text))]">{svc?.nameHe || sp.serviceSlug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[rgb(var(--color-text-secondary))]">{sp.description || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="text-[15px] font-bold text-[rgb(var(--color-primary))]">₪{sp.price}</span>
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
            <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 text-center">
              <p className="text-[14px] text-[rgb(var(--color-text-muted))]">אין שירותים עדיין</p>
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
