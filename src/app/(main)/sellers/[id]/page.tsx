"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GigCard } from "@/components/gig-card";
import { AnimatedCounter } from "@/components/home/animated-counter";
import { getServiceBySlug } from "@/lib/services";
import {
  MapPin, Star, Handshake, Clock, Coins, CaretRight,
  House, SealCheck, ChatCircleDots, PaperPlaneTilt,
  CalendarBlank, ShieldCheck, CheckCircle,
} from "@phosphor-icons/react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { DAY_LABELS_HE, minutesToTimeLabel } from "@/lib/availability";
import { SlotPicker, type SlotOption } from "@/components/slot-picker";

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  ratingAttitude: number | null;
  ratingTimeliness: number | null;
  ratingPrice: number | null;
  ratingQuality: number | null;
  sellerResponse: string | null;
  sellerResponseAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; city: string | null };
}

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
  ratingBreakdown: {
    attitude: number;
    timeliness: number;
    price: number;
    quality: number;
    overall: number;
    count: number;
  } | null;
  serviceAreas: { districtCode: number; districtName: string; cityCode: number | null; cityName: string | null }[];
  userServices: { serviceSlug: string }[];
  servicePrices: { serviceSlug: string; price: number; description: string | null }[];
  acceptingJobs?: boolean;
  weeklyHours?: { dayOfWeek: number; startMin: number; endMin: number }[];
  allReviews: ReviewData[];
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

const TABS = [
  { key: "reviews" as const, label: "חוות דעת" },
  { key: "prices" as const, label: "מחירון" },
  { key: "gigs" as const, label: "שירותים" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function RatingBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? "rgb(var(--color-success))" : value >= 6 ? "rgb(var(--color-accent-yellow))" : value >= 4 ? "rgb(var(--color-warning))" : "rgb(var(--color-error))";

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-center text-[rgb(var(--color-primary))]">{icon}</span>
      <span className="w-16 text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-[rgb(var(--color-border-light))] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="w-10 text-left text-[15px] font-bold" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function SellerSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="h-40 animate-pulse bg-[rgba(var(--color-primary),0.08)]" />
        <div className="px-8 pb-8">
          <div className="-mt-14 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
            <div className="h-28 w-28 animate-pulse rounded-full bg-[rgba(var(--color-primary),0.12)]" />
            <div className="mt-4 flex-1 space-y-3 sm:mt-0">
              <div className="h-6 w-40 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
              <div className="h-4 w-56 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[rgba(var(--color-primary),0.05)]" />
            ))}
          </div>
        </div>
      </div>
      <div className="mb-6 flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded bg-[rgba(var(--color-primary),0.08)]" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-[rgba(var(--color-primary),0.05)]" />
        ))}
      </div>
    </div>
  );
}

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");

  const sellerId = typeof params.id === "string" ? params.id : params.id?.[0];

  useEffect(() => {
    if (!sellerId) return;
    setNotFound(false);
    fetch(`/api/sellers/${sellerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.id || data.error) {
          setSeller(null);
          setNotFound(true);
          return;
        }
        setSeller({
          ...data,
          serviceAreas: data.serviceAreas ?? [],
          userServices: data.userServices ?? [],
          servicePrices: data.servicePrices ?? [],
          gigs: Array.isArray(data.gigs) ? data.gigs : [],
          allReviews: Array.isArray(data.allReviews) ? data.allReviews : [],
        });
      })
      .catch(() => {
        setSeller(null);
        setNotFound(true);
      });
  }, [sellerId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgText.trim() || msgSending || !sellerId) return;
    setMsgSending(true);
    setMsgError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: sellerId, content: msgText }),
    });
    if (res.ok) {
      setMsgSent(true);
      setMsgText("");
      router.push(`/inbox/${sellerId}`);
    } else {
      setMsgError("לא הצלחנו לשלוח את ההודעה. נסה שוב.");
    }
    setMsgSending(false);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[18px] font-semibold text-[rgb(var(--color-text))]">הפרופיל לא נמצא</p>
        <p className="mt-2 text-[14px] text-[rgb(var(--color-text-muted))]">יכול להיות שהאבאל׳ה עבר דירה. נסו מישהו אחר.</p>
        <Link href="/" className="mt-6 inline-block text-[14px] font-semibold text-[rgb(var(--color-primary))]">
          חזרה לעיון
        </Link>
      </div>
    );
  }

  if (!seller) return <SellerSkeleton />;

  const memberSince = new Date(seller.createdAt).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const rb = seller.ratingBreakdown;
  const tabCounts: Record<TabKey, number> = {
    reviews: seller.totalReviews,
    prices: seller.servicePrices.length,
    gigs: seller.gigs.length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-[rgb(var(--color-text-muted))]">
        <Link href="/" className="flex items-center gap-1 transition-colors hover:text-[rgb(var(--color-primary))]">
          <House className="h-3.5 w-3.5" />
          ראשי
        </Link>
        <CaretRight className="h-3 w-3" />
        <Link href="/gigs" className="transition-colors hover:text-[rgb(var(--color-primary))]">שירותים</Link>
        <CaretRight className="h-3 w-3" />
        <span className="font-medium text-[rgb(var(--color-text))]">{seller.name}</span>
      </nav>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]"
      >
        <div className="relative h-40 bg-gradient-to-r from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-accent))]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 h-20 w-20 rounded-full bg-white/5" />
          </div>
        </div>

        <div className="relative px-6 pb-8 sm:px-8">
          <div className="flex flex-col items-center -mt-14 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[rgb(var(--color-surface))] bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-4xl font-bold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.25)]">
                {seller.avatar ? (
                  <Image src={seller.avatar} alt={seller.name} fill className="rounded-full object-cover" unoptimized />
                ) : (
                  (seller.name || "א")[0]
                )}
              </div>
              {/* Verified badge */}
              {seller.completedOrders >= 5 && (
                <div className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-surface))] shadow-sm">
                  <SealCheck className="h-6 w-6 text-[rgb(var(--color-primary))]" weight="fill" />
                </div>
              )}
            </div>

            <div className="mt-4 text-center sm:mt-0 sm:text-right flex-1">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-[26px] font-bold text-[rgb(var(--color-text))]">{seller.name}</h1>
                {seller.completedOrders >= 5 && (
                  <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-primary))]">
                    מאומת
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[13px] text-[rgb(var(--color-text-secondary))]">
                {seller.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {seller.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarBlank className="h-3.5 w-3.5" />
                  חבר מאז {memberSince}
                </span>
                {seller.avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
                    {seller.avgRating.toFixed(1)} ({seller.totalReviews})
                  </span>
                )}
              </div>
            </div>
          </div>

          {seller.bio && (
            <p className="mt-5 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{seller.bio}</p>
          )}

          {seller.acceptingJobs === false && (
            <p className="mt-4 rounded-xl bg-[rgba(var(--color-accent-yellow),0.15)] px-4 py-3 text-[13px] font-medium text-[rgb(var(--color-warning))]">
              לא מקבל עבודות השבוע
            </p>
          )}

          {seller.weeklyHours && seller.weeklyHours.length > 0 && (
            <div className="mt-5 rounded-xl border border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))] p-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                <Clock className="h-4 w-4" />
                שעות זמינות
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-[rgb(var(--color-text))] sm:grid-cols-3">
                {seller.weeklyHours.map((row) => (
                  <li key={row.dayOfWeek}>
                    <span className="font-semibold">{DAY_LABELS_HE[row.dayOfWeek]}</span>
                    {" · "}
                    {minutesToTimeLabel(row.startMin)}–{minutesToTimeLabel(row.endMin)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="mt-5 flex flex-wrap gap-3">
            {seller.completedOrders >= 5 && (
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-success),0.1)] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-success))]">
                <ShieldCheck className="h-3.5 w-3.5" />
                בעל מקצוע מאומת
              </span>
            )}
            {seller.completedOrders >= 10 && (
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-primary))]">
                <CheckCircle className="h-3.5 w-3.5" />
                {seller.completedOrders}+ הזמנות שהושלמו
              </span>
            )}
            {seller.avgRating >= 9 && (
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-warning))]">
                <Star className="h-3.5 w-3.5" weight="fill" />
                מדורג גבוה
              </span>
            )}
          </div>

          {/* Service areas */}
          {seller.serviceAreas.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <MapPin className="h-4 w-4 text-[rgb(var(--color-accent))]" />
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">אזורי שירות:</span>
              {seller.serviceAreas.map((a, i) => (
                <span key={i} className="rounded-full bg-[rgba(var(--color-accent),0.1)] px-3 py-1 text-[12px] font-medium text-[rgb(var(--color-success))]">
                  {a.cityName || a.districtName}
                </span>
              ))}
            </div>
          )}

          {/* Services */}
          {seller.userServices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">שירותים:</span>
              {seller.userServices.map((us) => {
                const svc = getServiceBySlug(us.serviceSlug);
                return (
                  <span key={us.serviceSlug} className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[12px] font-medium text-[rgb(var(--color-primary))]">
                    {svc?.nameHe || us.serviceSlug}
                  </span>
                );
              })}
            </div>
          )}

          {/* Stats row with animated counters */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center"
            >
              <p className="text-[28px] font-bold text-[rgb(var(--color-primary))]">
                <AnimatedCounter value={seller.completedOrders} />
              </p>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">הזמנות שהושלמו</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center"
            >
              <p className="text-[28px] font-bold text-[rgb(var(--color-accent))]">
                <AnimatedCounter value={seller.totalReviews} />
              </p>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">חוות דעת</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center"
            >
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
                <p className="text-[28px] font-bold text-[rgb(var(--color-accent-yellow))]">
                  {seller.avgRating ? <AnimatedCounter value={seller.avgRating} /> : "--"}
                </p>
              </div>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">דירוג כללי</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border-light))] p-4 text-center"
            >
              <p className="text-[28px] font-bold text-[rgb(var(--color-success))]">
                {seller.userServices.length}
              </p>
              <p className="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-muted))]">סוגי שירות</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Rating Breakdown */}
      {rb && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold text-[rgb(var(--color-text))]">דירוג מפורט</h2>
            <span className="text-[13px] text-[rgb(var(--color-text-muted))]">מבוסס על {rb.count} חוות דעת</span>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] p-6 text-white min-w-[140px]">
              <p className="text-[42px] font-bold leading-none">
                <AnimatedCounter value={rb.overall} />
              </p>
              <p className="mt-1 text-[13px] text-white/70">מתוך 10</p>
              <p className="mt-2 text-[12px] font-semibold">דירוג כללי</p>
            </div>
            <div className="flex-1 space-y-3">
              <RatingBar label="איכות" value={rb.quality} icon={<Star className="h-4 w-4" />} />
              <RatingBar label="יחס" value={rb.attitude} icon={<Handshake className="h-4 w-4" />} />
              <RatingBar label="זמנים" value={rb.timeliness} icon={<Clock className="h-4 w-4" />} />
              <RatingBar label="מחיר" value={rb.price} icon={<Coins className="h-4 w-4" />} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Contact CTA — Glass Morphism */}
      {session?.user && session.user.id !== seller.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 rounded-2xl border border-[rgba(var(--color-primary),0.2)] bg-[rgba(var(--color-primary),0.04)] p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <ChatCircleDots className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">שלח הודעה ל{seller.name}</h2>
          </div>
          {msgSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-success))] font-medium"
            >
              <CheckCircle className="h-5 w-5" weight="fill" />
              ההודעה נשלחה בהצלחה!
            </motion.div>
          ) : (
            <form onSubmit={sendMessage} className="space-y-3">
              <div className="flex gap-3">
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="היי, אני מתעניין בשירות שלך..."
                  className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <button
                  type="submit"
                  disabled={!msgText.trim() || msgSending}
                  className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] hover:shadow-[0_4px_16px_rgba(var(--color-primary),0.25)] disabled:opacity-40"
                >
                  <PaperPlaneTilt className="h-4 w-4" />
                  שלח
                </button>
              </div>
              {msgError && (
                <p className="text-[13px] text-[rgb(var(--color-error))]">{msgError}</p>
              )}
            </form>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex border-b border-[rgb(var(--color-border))]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-3 text-[14px] font-semibold transition-all ${
              activeTab === tab.key
                ? "text-[rgb(var(--color-primary))]"
                : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))]"
            }`}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className="ms-1.5 text-[12px] opacity-60">({tabCounts[tab.key]})</span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="seller-tab-indicator"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[rgb(var(--color-primary))] rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "reviews" && <ReviewsTab reviews={seller.allReviews} />}
          {activeTab === "prices" && (
            <PricesTab
              prices={seller.servicePrices}
              sellerId={seller.id}
              acceptingJobs={seller.acceptingJobs !== false}
              isOwnProfile={session?.user?.id === seller.id}
              isLoggedIn={Boolean(session?.user)}
            />
          )}
          {activeTab === "gigs" && <GigsTab gigs={seller.gigs} sellerName={seller.name} sellerAvatar={seller.avatar} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: ReviewData[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
        <ChatCircleDots className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--color-text-muted))]" />
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין חוות דעת עדיין</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">היה הראשון לכתוב חוות דעת</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all hover:shadow-[0_2px_8px_rgba(var(--color-primary),0.06)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)] text-[14px] font-bold text-[rgb(var(--color-primary))]">
                {(review.user?.name || "משתמש")[0]}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{review.user?.name || "משתמש"}</p>
                <p className="text-[12px] text-[rgb(var(--color-text-muted))]">
                  {review.user?.city && `${review.user.city} · `}
                  {new Date(review.createdAt).toLocaleDateString("he-IL")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-3 py-1.5">
              <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
              <span className="text-[13px] font-bold text-[rgb(var(--color-warning))]">{review.rating}</span>
            </div>
          </div>

          <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] mb-3">{review.comment}</p>

          {review.ratingAttitude != null && (
            <div className="flex flex-wrap gap-2 text-[12px] border-t border-[rgb(var(--color-border-light))] pt-3">
              <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1.5 text-[rgb(var(--color-text-secondary))]">
                <Star className="h-3.5 w-3.5 text-[rgb(var(--color-accent-yellow))]" /> איכות: <b className="text-[rgb(var(--color-text))]">{review.ratingQuality}</b>
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1.5 text-[rgb(var(--color-text-secondary))]">
                <Handshake className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" /> יחס: <b className="text-[rgb(var(--color-text))]">{review.ratingAttitude}</b>
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1.5 text-[rgb(var(--color-text-secondary))]">
                <Clock className="h-3.5 w-3.5 text-[rgb(var(--color-accent))]" /> זמנים: <b className="text-[rgb(var(--color-text))]">{review.ratingTimeliness}</b>
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-[rgb(var(--color-bg))] px-2.5 py-1.5 text-[rgb(var(--color-text-secondary))]">
                <Coins className="h-3.5 w-3.5 text-[rgb(var(--color-success))]" /> מחיר: <b className="text-[rgb(var(--color-text))]">{review.ratingPrice}</b>
              </span>
            </div>
          )}

          {review.sellerResponse && (
            <div className="mt-3 rounded-xl bg-[rgba(var(--color-primary),0.06)] border border-[rgba(var(--color-primary),0.1)] p-4">
              <p className="text-[12px] font-semibold text-[rgb(var(--color-primary))] mb-1">תגובת בעל המקצוע:</p>
              <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">{review.sellerResponse}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function PricesTab({
  prices,
  sellerId,
  acceptingJobs,
  isOwnProfile,
  isLoggedIn,
}: {
  prices: SellerProfile["servicePrices"];
  sellerId: string;
  acceptingJobs: boolean;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [bookError, setBookError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  async function bookFromPriceList(sp: SellerProfile["servicePrices"][number]) {
    if (!selectedSlot) {
      setBookError("יש לבחור חלון ביקור של שעתיים");
      return;
    }
    setBookingSlug(sp.serviceSlug);
    setBookError("");
    const svc = getServiceBySlug(sp.serviceSlug);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobType: "LOCAL_REQUEST",
        sellerId,
        price: sp.price,
        title: svc?.nameHe || sp.serviceSlug,
        serviceSlug: sp.serviceSlug,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      router.push(`/orders/${data.id}`);
      return;
    }
    setBookError((data as { error?: string }).error || "לא הצלחנו לפתוח הזמנה");
    setBookingSlug(null);
  }
  if (prices.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
        <Coins className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--color-text-muted))]" />
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">המחירון עדיין לא עודכן</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">בעל המקצוע טרם הוסיף מחירים</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
      <div className="px-6 py-4 bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border-light))]">
        <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))]">המחירון שלי</h3>
        <p className="text-[12px] text-[rgb(var(--color-text-muted))] mt-0.5">הזמן לפי מחיר קבוע, או בקש הצעה אם העבודה לא סטנדרטית</p>
        {bookError && <p className="mt-2 text-[13px] text-[rgb(var(--color-error))]">{bookError}</p>}
      </div>
      {!isOwnProfile && isLoggedIn && acceptingJobs && (
        <div className="border-b border-[rgb(var(--color-border-light))] px-6 py-4">
          <SlotPicker sellerId={sellerId} value={selectedSlot} onChange={setSelectedSlot} />
        </div>
      )}
      <div className="divide-y divide-[rgb(var(--color-border-light))]">
        {prices.map((sp, i) => {
          const svc = getServiceBySlug(sp.serviceSlug);
          return (
            <motion.div
              key={sp.serviceSlug}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[rgba(var(--color-primary),0.03)]"
            >
              <div className="flex items-center gap-3">
                {svc && <CategoryIcon slug={svc.category} className="h-5 w-5 text-[rgb(var(--color-primary))]" />}
                <div>
                  <p className="text-[14px] font-medium text-[rgb(var(--color-text))]">{svc?.nameHe || sp.serviceSlug}</p>
                  {sp.description && (
                    <p className="mt-0.5 text-[12px] text-[rgb(var(--color-text-muted))]">{sp.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[17px] font-bold text-[rgb(var(--color-primary))]">₪{sp.price}</span>
                {!isOwnProfile && (
                  isLoggedIn ? (
                    <div className="flex items-center gap-2">
                      {acceptingJobs && (
                        <button
                          type="button"
                          onClick={() => bookFromPriceList(sp)}
                          disabled={bookingSlug !== null || !selectedSlot}
                          className="rounded-lg bg-[rgb(var(--color-primary))] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                        >
                          {bookingSlug === sp.serviceSlug ? "מזמין..." : `הזמן ב-₪${sp.price}`}
                        </button>
                      )}
                      <Link
                        href={`/requests/create?service=${encodeURIComponent(sp.serviceSlug)}`}
                        className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
                      >
                        בקש הצעה
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]"
                    >
                      התחבר להזמנה
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GigsTab({ gigs, sellerName, sellerAvatar }: { gigs: SellerProfile["gigs"]; sellerName: string; sellerAvatar: string | null }) {
  if (gigs.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין שירותים עדיין</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">בעל המקצוע טרם הוסיף שירותים</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {gigs.map((g) => (
        <GigCard
          key={g.id}
          id={g.id}
          title={g.title}
          image={g.image}
          seller={{ name: sellerName, avatar: sellerAvatar }}
          startingPrice={g.tiers?.[0]?.price || 0}
          avgRating={g.avgRating}
          reviewCount={g.reviewCount}
        />
      ))}
    </div>
  );
}
