"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { GigCard } from "@/components/gig-card";

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
  serviceAreas: { districtCode: number; districtName: string; cityCode: number | null; cityName: string | null }[];
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

export default function SellerProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-white shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
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

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#6C5CE7]">{seller.completedOrders}</p>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">הזמנות שהושלמו</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <p className="text-[24px] font-bold text-[#00D2D3]">{seller.totalReviews}</p>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">ביקורות</p>
            </div>
            <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <svg className="h-5 w-5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <p className="text-[24px] font-bold text-[#FECA57]">{seller.avgRating || "--"}</p>
              </div>
              <p className="mt-1 text-[12px] font-medium text-[#B2BEC3]">דירוג</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      {session?.user && session.user.id !== seller.id && (
        <div className="mb-8 rounded-[16px] border border-[#E8ECF1] bg-white p-6">
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

      {/* Seller's Gigs */}
      <h2 className="mb-4 text-[18px] font-bold text-[#2D3436]">השירותים של {seller.name}</h2>
      {seller.gigs.length === 0 ? (
        <p className="text-[14px] text-[#B2BEC3]">אין שירותים עדיין</p>
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
    </div>
  );
}
