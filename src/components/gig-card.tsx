import Link from "next/link";

interface GigCardProps {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null };
  startingPrice: number;
  avgRating: number;
  reviewCount: number;
}

const AVATAR_GRADIENTS = [
  "from-[#6C5CE7] to-[#A29BFE]",
  "from-[#00D2D3] to-[#00B894]",
  "from-[#FF6B6B] to-[#FECA57]",
  "from-[#A29BFE] to-[#00D2D3]",
];

export function GigCard({ id, title, image, seller, startingPrice, avgRating, reviewCount }: GigCardProps) {
  const gradientIndex = seller.name.charCodeAt(0) % AVATAR_GRADIENTS.length;

  return (
    <Link
      href={`/gigs/${id}`}
      className="group block overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] transition-all hover:shadow-[0_8px_24px_rgba(108,92,231,0.12)] hover:border-[#A29BFE]/40"
    >
      <div className="aspect-video w-full overflow-hidden bg-[#F0EEFF]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}>
            <span className="text-5xl font-bold text-white/30">א</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradientIndex]} text-[12px] font-bold text-white`}>
            {seller.name[0]}
          </div>
          <span className="text-[13px] font-medium text-[#636E72]">{seller.name}</span>
        </div>
        <h3 className="mb-3 line-clamp-2 text-[14px] font-semibold leading-snug text-[#2D3436] transition-colors group-hover:text-[#6C5CE7]">
          {title}
        </h3>
        <div className="mb-3 flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-[13px] font-bold text-[#2D3436]">{avgRating.toFixed(1)}</span>
          <span className="text-[13px] text-[#B2BEC3]">({reviewCount})</span>
        </div>
        <div className="border-t border-[#F1F3F8] pt-3">
          <span className="text-[12px] text-[#B2BEC3]">החל מ-</span>
          <span className="me-1.5 text-[18px] font-bold text-[#2D3436]">₪{startingPrice}</span>
        </div>
      </div>
    </Link>
  );
}
