import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface GigCardProps {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] };
  startingPrice: number;
  avgRating: number;
  reviewCount: number;
}

const AVATAR_GRADIENTS = [
  "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]",
  "from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]",
  "from-[rgb(var(--color-error))] to-[rgb(var(--color-accent-yellow))]",
  "from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]",
];

export function GigCard({ id, title, image, seller, startingPrice, avgRating, reviewCount }: GigCardProps) {
  const gradientIndex = seller.name.charCodeAt(0) % AVATAR_GRADIENTS.length;

  return (
    <Link
      href={`/gigs/${id}`}
      className="group block overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)]"
    >
      <div className="aspect-video w-full overflow-hidden bg-[rgba(var(--color-primary),0.1)]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]">
            <span className="text-5xl font-bold text-white/30">א</span>
          </div>
        )}
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
          <Star className="h-4 w-4 text-[rgb(var(--color-accent-yellow))] fill-[rgb(var(--color-accent-yellow))]" />
          <span className="text-[13px] font-bold text-[rgb(var(--color-text))]">{avgRating.toFixed(1)}</span>
          <span className="text-[13px] text-[rgb(var(--color-text-muted))]">({reviewCount})</span>
        </div>
        <div className="border-t border-[rgb(var(--color-border-light))] pt-3">
          <span className="text-[12px] text-[rgb(var(--color-text-muted))]">החל מ-</span>
          <span className="me-1.5 text-[18px] font-bold text-[rgb(var(--color-text))]">₪{startingPrice}</span>
        </div>
      </div>
    </Link>
  );
}
