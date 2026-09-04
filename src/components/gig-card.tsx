"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface GigCardProps {
  id: string;
  title: string;
  image: string | null;
  seller?: { name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] };
  startingPrice: number;
  avgRating: number;
  reviewCount: number;
  variant?: "grid" | "list";
}


/** Card that shows a gig's photo, seller, price, and rating, as a grid or list item. */
export function GigCard({ id, title, image, seller, startingPrice, avgRating, reviewCount, variant = "grid" }: GigCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const sellerName = seller?.name || "משתמש";

  const handleFavoriteToggle = async () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    trackEvent("favorite_toggled", { gigId: id, action: newState ? "add" : "remove" });
    try {
      await fetch("/api/favorites", {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: id }),
      });
    } catch {
      setIsFavorite(!newState);
    }
  };

  if (variant === "list") {
    return (
      <div>
        <Link
          href={`/gigs/${id}`}
          className="group flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-lg"
        >
          <div className="relative w-[200px] shrink-0 overflow-hidden bg-[rgb(var(--color-surface-elevated))] sm:w-[240px]">
            {image ? (
              <Image src={image} alt={title} fill className="object-cover" sizes="240px" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[rgb(var(--color-surface-elevated))]">
                <span className="text-4xl font-bold text-[rgb(var(--color-text-muted))]">א</span>
              </div>
            )}
            <FavoriteButton isFavorite={isFavorite} onToggle={handleFavoriteToggle} />
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <h3 className="mb-2 text-[15px] font-semibold leading-snug text-[rgb(var(--color-text))] transition-colors group-hover:text-[rgb(var(--color-primary))]">
                {title}
              </h3>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-[11px] font-bold text-white">
                  {sellerName[0]}
                </div>
                <span className="text-[13px] text-[rgb(var(--color-text-secondary))]">{sellerName}</span>
                {seller?.serviceAreas && seller.serviceAreas.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--color-text-muted))]">
                    <MapPin className="h-3 w-3" />
                    {seller.serviceAreas.slice(0, 3).map((a) => a.cityName || a.districtName).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--color-border-light))] pt-3">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
                <span className="text-[13px] font-bold text-[rgb(var(--color-text))]">{(avgRating ?? 0).toFixed(1)}/10</span>
                <span className="text-[13px] text-[rgb(var(--color-text-muted))]">({reviewCount})</span>
              </div>
              <div>
                <span className="text-[12px] text-[rgb(var(--color-text-muted))]">החל מ-</span>
                <span className="text-[18px] font-bold text-[rgb(var(--color-text))]">₪{startingPrice}</span>
                <span className="ms-1 text-[10px] text-[rgb(var(--color-text-muted))]">כולל מע״מ</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/gigs/${id}`}
        className="group block overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-lg"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-[rgb(var(--color-surface-elevated))]">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[rgb(var(--color-surface-elevated))]">
              <span className="text-5xl font-bold text-[rgb(var(--color-text-muted))]">א</span>
            </div>
          )}
          <FavoriteButton isFavorite={isFavorite} onToggle={handleFavoriteToggle} />
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-[12px] font-bold text-white">
              {sellerName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">{sellerName}</span>
              {seller?.serviceAreas && seller.serviceAreas.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--color-text-muted))] truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {seller.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}
                </div>
              )}
            </div>
          </div>
          <h3 className="mb-3 line-clamp-2 text-[14px] font-semibold leading-snug text-[rgb(var(--color-text))] transition-colors group-hover:text-[rgb(var(--color-primary))]">
            {title}
          </h3>
          <div className="mb-3 flex items-center gap-1.5">
            <Star className="h-4 w-4 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
            <span className="text-[13px] font-bold text-[rgb(var(--color-text))]">{(avgRating ?? 0).toFixed(1)}/10</span>
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">({reviewCount})</span>
          </div>
          <div className="border-t border-[rgb(var(--color-border-light))] pt-3">
            <span className="text-[12px] text-[rgb(var(--color-text-muted))]">החל מ-</span>
            <span className="me-1.5 text-[18px] font-bold text-[rgb(var(--color-text))]">₪{startingPrice}</span>
            <span className="text-[10px] text-[rgb(var(--color-text-muted))]">כולל מע״מ</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/** Heart button that adds or removes a gig from favorites without leaving the card. */
function FavoriteButton({ isFavorite, onToggle }: { isFavorite: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="absolute top-3 end-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
      aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
    >
      <Heart
        className={cn("h-4.5 w-4.5 transition-colors", isFavorite ? "text-[rgb(var(--color-error))]" : "text-[rgb(var(--color-text-muted))]")}
        weight={isFavorite ? "fill" : "regular"}
      />
    </button>
  );
}

/** Placeholder card shown while gig results are loading. */
export function GigCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="w-[200px] shrink-0 animate-pulse bg-[rgb(var(--color-border-light))] sm:w-[240px]">
          <div className="aspect-video" />
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 animate-pulse rounded-full bg-[rgb(var(--color-border-light))]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--color-border-light))] pt-3">
            <div className="h-4 w-20 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
            <div className="h-5 w-16 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
      <div className="aspect-video w-full animate-pulse bg-[rgb(var(--color-border-light))]" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[rgb(var(--color-border-light))]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
        <div className="h-4 w-20 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
        <div className="h-px bg-[rgb(var(--color-border-light))]" />
        <div className="h-5 w-24 animate-pulse rounded bg-[rgb(var(--color-border-light))]" />
      </div>
    </div>
  );
}
