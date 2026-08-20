"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GigCard } from "@/components/gig-card";
import { Heart } from "@phosphor-icons/react";

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
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Heart className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות במועדפים.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">המועדפים שלי</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">{gigs.length} {gigs.length !== 1 ? "שירותים" : "שירות"} שמורים</p>
      </div>

      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-20">
          <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-5 mb-4">
            <Heart className="h-10 w-10 text-[rgb(var(--color-error))]" />
          </div>
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">הלב ריק. בוא נמלא אותו.</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">לחץ על הלב באבאל׳ות שאהבת כדי לשמור אותם לפעם הבאה</p>
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
