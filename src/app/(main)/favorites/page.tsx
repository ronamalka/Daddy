"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { GigCard } from "@/components/gig-card";
import { Heart, User, MapPin } from "@phosphor-icons/react";

interface Gig {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null };
  tiers: { price: number }[];
  avgRating: number;
  reviewCount: number;
}

interface FavoriteSeller {
  id: string;
  sellerId: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string | null;
    city: string | null;
  };
}

type Tab = "gigs" | "sellers";

/** Shows the gigs and sellers the user has saved as favorites. */
export default function FavoritesPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [sellers, setSellers] = useState<FavoriteSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("gigs");

  useEffect(() => {
    Promise.all([
      fetch("/api/favorites").then((r) => r.json()).catch(() => []),
      fetch("/api/favorite-sellers").then((r) => r.json()).catch(() => []),
    ]).then(([gigsData, sellersData]) => {
      setGigs(Array.isArray(gigsData) ? gigsData : []);
      setSellers(Array.isArray(sellersData) ? sellersData : []);
      setLoading(false);
    });
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
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
          {gigs.length} {gigs.length !== 1 ? "שירותים" : "שירות"} שמורים
          {" · "}
          {sellers.length} {sellers.length !== 1 ? "אבאל׳ות" : "אבאל׳ה"} מועדפים
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("gigs")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            tab === "gigs"
              ? "bg-[rgb(var(--color-primary))] text-white"
              : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
          }`}
        >
          <Heart className="h-4 w-4" />
          שירותים ({gigs.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("sellers")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            tab === "sellers"
              ? "bg-[rgb(var(--color-primary))] text-white"
              : "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
          }`}
        >
          <User className="h-4 w-4" />
          אבאל׳ות מועדפים ({sellers.length})
        </button>
      </div>

      {tab === "gigs" && (
        <>
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
        </>
      )}

      {tab === "sellers" && (
        <>
          {sellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-20">
              <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-5 mb-4">
                <User className="h-10 w-10 text-[rgb(var(--color-primary))]" />
              </div>
              <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">עוד לא שמרת אבאל׳ות מועדפים</p>
              <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">לחץ על הלב בפרופיל של אבאל׳ה כדי לשמור אותו כמועדף</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {sellers.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/sellers/${fav.seller.id}`}
                  className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:shadow-md hover:border-[rgba(var(--color-primary),0.3)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-white">
                      {fav.seller.avatar ? (
                        <Image
                          src={fav.seller.avatar}
                          alt={fav.seller.name}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        (fav.seller.name || "א")[0]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">
                        {fav.seller.name}
                      </p>
                      {fav.seller.city && (
                        <p className="mt-1 flex items-center gap-1 text-[13px] text-[rgb(var(--color-text-muted))]">
                          <MapPin className="h-3.5 w-3.5" />
                          {fav.seller.city}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
