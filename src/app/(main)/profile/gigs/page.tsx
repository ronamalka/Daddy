"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface GigItem {
  id: string;
  title: string;
  image: string | null;
  status: string;
  category: { name: string } | null;
  tiers: { tier: string; price: number }[];
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export default function MyGigsPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<GigItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/gigs?sellerId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setGigs(data.gigs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  if (!session || session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[#636E72]">גישה למוכרים בלבד</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#2D3436]">השירותים שלי</h1>
          <p className="mt-1 text-[14px] text-[#636E72]">נהל את השירותים שאתה מציע</p>
        </div>
        <Link
          href="/gigs/create"
          className="rounded-[12px] bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1] shadow-[0_4px_16px_rgba(108,92,231,0.3)]"
        >
          + צור שירות חדש
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-12 text-center shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EEFF]">
            <svg className="h-8 w-8 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#2D3436] mb-2">עדיין לא יצרת שירותים</h2>
          <p className="text-[14px] text-[#636E72] mb-6">צור את השירות הראשון שלך והתחל לקבל הזמנות</p>
          <Link
            href="/gigs/create"
            className="inline-block rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]"
          >
            צור שירות ראשון
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => {
            const minPrice = gig.tiers.length > 0
              ? Math.min(...gig.tiers.map((t) => t.price))
              : null;

            return (
              <div
                key={gig.id}
                className="group rounded-[16px] border border-[#E8ECF1] bg-white p-5 transition-all hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)]"
              >
                <div className="flex gap-5">
                  {gig.image ? (
                    <img
                      src={gig.image}
                      alt={gig.title}
                      className="h-24 w-32 rounded-[12px] object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-32 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#6C5CE7]/10 to-[#A29BFE]/10">
                      <svg className="h-8 w-8 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[16px] font-bold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">
                          {gig.title}
                        </h3>
                        {gig.category && (
                          <span className="mt-1 inline-block rounded-[9999px] bg-[#6C5CE7]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#6C5CE7]">
                            {gig.category.name}
                          </span>
                        )}
                      </div>
                      {minPrice !== null && (
                        <span className="text-[16px] font-bold text-[#6C5CE7] whitespace-nowrap">
                          החל מ-₪{minPrice}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[13px] text-[#636E72]">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-[#FECA57]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {gig.avgRating > 0 ? gig.avgRating.toFixed(1) : "--"}
                        <span className="text-[#B2BEC3]">({gig.reviewCount})</span>
                      </span>
                      <span>{gig.tiers.length} חבילות</span>
                      <span>{new Date(gig.createdAt).toLocaleDateString("he-IL")}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/gigs/${gig.id}`}
                        className="rounded-[8px] border border-[#E8ECF1] px-3 py-1.5 text-[12px] font-medium text-[#636E72] transition-all hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                      >
                        צפייה
                      </Link>
                      <Link
                        href={`/gigs/${gig.id}/edit`}
                        className="rounded-[8px] border border-[#E8ECF1] px-3 py-1.5 text-[12px] font-medium text-[#636E72] transition-all hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                      >
                        עריכה
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
