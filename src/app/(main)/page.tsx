"use client";

import { useEffect, useState } from "react";
import { GigCard } from "@/components/gig-card";

interface Gig {
  id: string;
  title: string;
  image: string | null;
  seller: { name: string; avatar: string | null };
  category: { name: string; slug: string };
  tiers: { price: number }[];
  avgRating: number;
  reviewCount: number;
}

const CATEGORIES = [
  { label: "הכל", slug: "" },
  { label: "🔧 תיקונים ותחזוקה", slug: "home-maintenance" },
  { label: "🚗 רכב ותחבורה", slug: "car-transport" },
  { label: "📞 מיקוח ובירוקרטיה", slug: "negotiation-bureaucracy" },
  { label: "🌿 גינון וארגון", slug: "garden-yard" },
  { label: "🎓 ייעוץ והדרכה", slug: "consulting-training" },
  { label: "📦 הובלות ושינוע", slug: "moving-lifting" },
  { label: "💻 טכנולוגיה", slug: "tech-support" },
];

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    setLoading(true);
    fetch(`/api/gigs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setGigs(data);
        setLoading(false);
      });
  }, [search, category]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 40%, #00D2D3 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <h1 className="mb-3 text-[36px] font-bold leading-tight tracking-[-0.02em] text-white md:text-[48px]">
            מצא לך אבאל׳ה שיעזור
            <br />
            עם מה שאתה צריך היום 🫡
          </h1>
          <p className="mb-8 text-[16px] text-white/70 md:text-[18px]">
            אבאל׳ות מנוסים שיסדרו לך הכל – מהברגה ועד בירוקרטיה
          </p>

          <div className="flex max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
            <div className="flex flex-1 items-center gap-3 px-5">
              <svg className="h-5 w-5 flex-shrink-0 text-[#B2BEC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder='נסה "הרכבת רהיטים" או "בדיקת דירה"'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-4 text-[15px] text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none"
              />
            </div>
            <button className="bg-[#6C5CE7] px-8 text-[14px] font-semibold text-white transition-colors hover:bg-[#5A4BD1]">
              חפש
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-white/50">פופולרי:</span>
            {["הרכבת ארון", "תליית טלוויזיה", "טסט לרכב", "הוזלת חשבונות"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="rounded-[9999px] border border-white/20 px-3.5 py-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Pills + Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`rounded-[9999px] px-5 py-2 text-[13px] font-semibold transition-all ${
                category === cat.slug
                  ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]"
                  : "border border-[#E8ECF1] bg-[#FFFFFF] text-[#636E72] hover:border-[#A29BFE]/30 hover:text-[#6C5CE7]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
          </div>
        ) : gigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] py-20">
            <div className="rounded-full bg-[#F0EEFF] p-5 mb-4">
              <svg className="h-10 w-10 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-[16px] font-medium text-[#2D3436]">לא נמצאו שירותים</p>
            <p className="mt-1 text-[14px] text-[#B2BEC3]">נסה חיפוש או קטגוריה אחרת</p>
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
    </div>
  );
}
