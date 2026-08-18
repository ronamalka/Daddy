"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GigCard } from "@/components/gig-card";

interface Gig {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null };
  tiers: { price: number }[];
  avgRating: number;
  reviewCount: number;
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        setGigs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[#F0EEFF] p-4 mb-4">
          <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <p className="text-[16px] text-[#636E72]">התחבר כדי לצפות במועדפים.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">המועדפים שלי</h1>
        <p className="mt-1 text-[14px] text-[#636E72]">{gigs.length} {gigs.length !== 1 ? "שירותים" : "שירות"} שמורים</p>
      </div>

      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF1] bg-white py-20">
          <div className="rounded-full bg-[#FF6B6B]/10 p-5 mb-4">
            <svg className="h-10 w-10 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#2D3436]">אין מועדפים עדיין</p>
          <p className="mt-1 text-[14px] text-[#B2BEC3]">לחץ על הלב בשירותים שאהבת כדי לשמור אותם</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
      )}
    </div>
  );
}
