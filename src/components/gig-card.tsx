"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, MapPin, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface GigCardProps {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] };
  startingPrice: number;
  avgRating: number;
  reviewCount: number;
  variant?: "grid" | "list";
}

const AVATAR_GRADIENTS = [
  "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]",
  "from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]",
  "from-[rgb(var(--color-error))] to-[rgb(var(--color-accent-yellow))]",
  "from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]",
];

export function GigCard({ id, title, image, seller, startingPrice, avgRating, reviewCount, variant = "grid" }: GigCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const gradientIndex = seller.name.charCodeAt(0) % AVATAR_GRADIENTS.length;

  if (variant === "list") {
    return (
      <motion.div layout layoutId={`gig-${id}`}>
        <Link
          href={`/gigs/${id}`}
          className="group flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)]"
        >
          <div className="relative w-[200px] shrink-0 overflow-hidden bg-[rgba(var(--color-primary),0.1)] sm:w-[240px]">
            {image ? (
              <Image src={image} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="240px" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]">
                <span className="text-4xl font-bold text-white/30">א</span>
              </div>
            )}
            <FavoriteButton isFavorite={isFavorite} onToggle={() => setIsFavorite(!isFavorite)} />
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <h3 className="mb-2 text-[15px] font-semibold leading-snug text-[rgb(var(--color-text))] transition-colors group-hover:text-[rgb(var(--color-primary))]">
                {title}
              </h3>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white",
                  AVATAR_GRADIENTS[gradientIndex]
                )}>
                  {seller.name[0]}
                </div>
                <span className="text-[13px] text-[rgb(var(--color-text-secondary))]">{seller.name}</span>
                {seller.serviceAreas && seller.serviceAreas.length > 0 && (
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
                <span className="text-[13px] font-bold text-[rgb(var(--color-text))]">{avgRating.toFixed(1)}</span>
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
      </motion.div>
    );
  }

  return (
    <motion.div layout layoutId={`gig-${id}`}>
      <Link
        href={`/gigs/${id}`}
        className="group block overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)]"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-[rgba(var(--color-primary),0.1)]">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]">
              <span className="text-5xl font-bold text-white/30">א</span>
            </div>
          )}
          <FavoriteButton isFavorite={isFavorite} onToggle={() => setIsFavorite(!isFavorite)} />
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white",
              AVATAR_GRADIENTS[gradientIndex]
            )}>
              {seller.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">{seller.name}</span>
              {seller.serviceAreas && seller.serviceAreas.length > 0 && (
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
            <span className="text-[13px] font-bold text-[rgb(var(--color-text))]">{avgRating.toFixed(1)}</span>
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">({reviewCount})</span>
          </div>
          <div className="border-t border-[rgb(var(--color-border-light))] pt-3">
            <span className="text-[12px] text-[rgb(var(--color-text-muted))]">החל מ-</span>
            <span className="me-1.5 text-[18px] font-bold text-[rgb(var(--color-text))]">₪{startingPrice}</span>
            <span className="text-[10px] text-[rgb(var(--color-text-muted))]">כולל מע״מ</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FavoriteButton({ isFavorite, onToggle }: { isFavorite: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      whileTap={{ scale: 0.8 }}
      className="absolute top-3 end-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-colors hover:bg-white"
      aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
    >
      <motion.div
        animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn("h-4.5 w-4.5 transition-colors", isFavorite ? "text-[rgb(var(--color-error))]" : "text-[rgb(var(--color-text-muted))]")}
          weight={isFavorite ? "fill" : "regular"}
        />
      </motion.div>
    </motion.button>
  );
}

export function GigCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="w-[200px] shrink-0 animate-pulse bg-[rgba(var(--color-primary),0.08)] sm:w-[240px]">
          <div className="aspect-video" />
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 animate-pulse rounded-full bg-[rgba(var(--color-primary),0.08)]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--color-border-light))] pt-3">
            <div className="h-4 w-20 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
            <div className="h-5 w-16 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
      <div className="aspect-video w-full animate-pulse bg-[rgba(var(--color-primary),0.08)]" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[rgba(var(--color-primary),0.08)]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
        <div className="h-4 w-20 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
        <div className="h-px bg-[rgb(var(--color-border-light))]" />
        <div className="h-5 w-24 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
      </div>
    </div>
  );
}
