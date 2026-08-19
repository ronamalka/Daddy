"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Search, X, ArrowLeft, Star, CheckCircle2, Users, Wrench, MapPin,
  Zap, BarChart3, Coins, User, PenLine, MessageSquare, Trophy,
  Send, Sparkles, ChevronLeft,
} from "lucide-react";
import { SERVICE_CATEGORIES, ALL_SERVICES, getServiceBySlug } from "@/lib/services";
import { DISTRICTS } from "@/lib/districts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  services: string[];
  serviceAreas: { districtName: string; cityName: string | null; districtCode: number }[];
  completedOrders: number;
  reviewCount: number;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  serviceSlug: string | null;
  districtName: string | null;
  cityName: string | null;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string };
  _count: { responses: number };
}

interface FeaturedDaddy {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  services: string[];
  serviceAreas: { districtName: string; cityName: string | null }[];
  completedOrders: number;
  reviewCount: number;
  avgRating: number;
  startingPrice: number | null;
}

interface LiveReview {
  id: string;
  rating: number;
  comment: string;
  ratingAttitude: number | null;
  ratingTimeliness: number | null;
  ratingPrice: number | null;
  ratingQuality: number | null;
  createdAt: string;
  user: { name: string; city: string | null };
  gig: { title: string; user: { name: string } };
}

const DISTRICT_LIST = Object.entries(DISTRICTS).map(([code, name]) => ({ code: Number(code), name }));

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "assembly-and-installation": <Wrench className="h-6 w-6" />,
  "home-maintenance": <Wrench className="h-6 w-6" />,
  "moving-and-delivery": <Send className="h-6 w-6" />,
  "tech-and-digital": <Zap className="h-6 w-6" />,
  "errands-and-help": <Users className="h-6 w-6" />,
  "financial-help": <Coins className="h-6 w-6" />,
  "automotive": <Wrench className="h-6 w-6" />,
  "events": <Sparkles className="h-6 w-6" />,
};

const STATS = [
  { number: 1200, suffix: "+", label: "אבאל׳ות רשומים", icon: <Users className="h-5 w-5" /> },
  { number: 8500, suffix: "+", label: "עבודות שהושלמו", icon: <CheckCircle2 className="h-5 w-5" /> },
  { number: 4.8, suffix: "", label: "דירוג ממוצע", icon: <Star className="h-5 w-5" /> },
  { number: 38, suffix: "", label: "שירותים שונים", icon: <Wrench className="h-5 w-5" /> },
];

const BUYER_STEPS = [
  { title: "ספר מה צריך", desc: "חפש שירות או פרסם בקשה. בלי טפסים, בלי בירוקרטיה.", icon: <Search className="h-6 w-6" /> },
  { title: "בחר אבאל׳ה", desc: "דפדף, קרא ביקורות, השווה מחירים — ותבחר את המתאים.", icon: <Users className="h-6 w-6" /> },
  { title: "תאם וסגור", desc: "שלח הודעה, תאם זמן, ותתחיל לנוח.", icon: <MessageSquare className="h-6 w-6" /> },
  { title: "דרג ושתף", desc: "העבודה הסתיימה? תן ביקורת ועזור לאחרים לבחור נכון.", icon: <Star className="h-6 w-6" /> },
];

const DADDY_STEPS = [
  { title: "צור פרופיל", desc: "הרשם, ספר מה אתה יודע לעשות, ואיפה אתה עובד.", icon: <PenLine className="h-6 w-6" /> },
  { title: "קבל פניות", desc: "לקוחות מחפשים — הגב לבקשות או תן להם למצוא אותך.", icon: <MessageSquare className="h-6 w-6" /> },
  { title: "עשה את העבודה", desc: "תגיע, תסדר, ותשאיר רושם. כמו אבא אמיתי.", icon: <Wrench className="h-6 w-6" /> },
  { title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה. פשוט ככה.", icon: <Trophy className="h-6 w-6" /> },
];

const WHY_CHOOSE = [
  { title: "אבאל׳ות אמיתיים", desc: "לא חברות ענק. אנשים אמיתיים עם ידיים טובות, ניסיון, ורצון לעזור.", icon: <Users className="h-6 w-6" /> },
  { title: "דירוג אמין", desc: "4 קריטריונים: איכות, יחס, זמנים, מחיר. תדע בדיוק מה אתה מקבל.", icon: <BarChart3 className="h-6 w-6" /> },
  { title: "מחירים הוגנים", desc: "ללא עמלות נסתרות. המחיר שאתה רואה — זה המחיר שאתה משלם.", icon: <Coins className="h-6 w-6" /> },
  { title: "כל השירותים", desc: "מהרכבת ארון ועד הוזלת חשבונות. 38 שירותים ב-8 קטגוריות.", icon: <Wrench className="h-6 w-6" /> },
  { title: "לפי אזור", desc: "מצא אבאל׳ה בשכונה שלך. 7 מחוזות, עשרות ערים.", icon: <MapPin className="h-6 w-6" /> },
  { title: "מהיר ופשוט", desc: "חפש, בחר, שלח הודעה. בתוך דקות יש לך אבאל׳ה.", icon: <Zap className="h-6 w-6" /> },
];

const FALLBACK_TESTIMONIALS = [
  { name: "נועם ג׳", text: "הזמנתי הרכבת ארון מאיקאה. האבאל׳ה הגיע עם ארגז כלים, בדיחות יבשות, ושוקולד. הארון עומד עד היום, הבדיחות פחות.", service: "הרכבת רהיטים", daddyName: "משה כ׳", rating: 5 },
  { name: "שירה מ׳", text: "אבא שלי לא מבין בטכנולוגיה אז הזמנתי לו אבאל׳ה שילמד אותו וואטסאפ. עכשיו הוא שולח לי מימס בלי הפסקה.", service: "עזרה טכנית", daddyName: "דוד ל׳", rating: 5 },
  { name: "עידו ק׳", text: "חיפשתי מישהו שיוריד לי את חשבון הסלולר. האבאל׳ה חסך לי 80 שקל בחודש. קוראים לזה ROI של אבא.", service: "הוזלת חשבונות", daddyName: "יוסי ב׳", rating: 5 },
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display = Number.isInteger(value) ? count.toLocaleString() : count.toFixed(1);
  return <span ref={ref}>{display}{suffix}</span>;
}

function SectionHeader({ title, subtitle, className }: { title: string; subtitle: string; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={cn("text-center mb-12", className)}
    >
      <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] md:text-4xl tracking-tight">{title}</h2>
      <p className="mt-3 text-[rgb(var(--color-text-secondary))] text-base max-w-lg mx-auto">{subtitle}</p>
    </motion.div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [view, setView] = useState<"browse" | "results" | "requests">("browse");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [featuredDaddies, setFeaturedDaddies] = useState<FeaturedDaddy[]>([]);
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [howItWorksTab, setHowItWorksTab] = useState<"buyer" | "daddy">("buyer");

  const filteredServices = serviceSearch
    ? ALL_SERVICES.filter((s) => s.nameHe.includes(serviceSearch) || s.description.includes(serviceSearch))
    : selectedCategory
    ? ALL_SERVICES.filter((s) => s.category === selectedCategory)
    : [];

  useEffect(() => {
    let cancelled = false;
    async function fetchHomepageData() {
      try {
        const [daddiesRes, reviewsRes] = await Promise.all([
          fetch("/api/featured-daddies"),
          fetch("/api/recent-reviews"),
        ]);
        const [daddies, reviews] = await Promise.all([daddiesRes.json(), reviewsRes.json()]);
        if (!cancelled) {
          setFeaturedDaddies(Array.isArray(daddies) ? daddies : []);
          setLiveReviews(Array.isArray(reviews) ? reviews : []);
        }
      } catch {
        if (!cancelled) {
          setFetchError("לא הצלחנו לטעון נתונים. נסה לרענן את הדף.");
          setFeaturedDaddies([]);
          setLiveReviews([]);
        }
      }
    }
    fetchHomepageData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    let cancelled = false;
    async function fetchProviders() {
      setLoadingProviders(true);
      const p = new URLSearchParams();
      p.set("service", selectedService);
      if (selectedDistrict) p.set("district", selectedDistrict);
      try {
        const r = await fetch(`/api/providers?${p}`);
        const data = await r.json();
        if (!cancelled) { setProviders(Array.isArray(data) ? data : []); setLoadingProviders(false); setView("results"); }
      } catch { if (!cancelled) setLoadingProviders(false); }
    }
    fetchProviders();
    return () => { cancelled = true; };
  }, [selectedService, selectedDistrict]);

  function loadRequests(district?: string) {
    setLoadingRequests(true);
    const p = new URLSearchParams();
    const d = district !== undefined ? district : selectedDistrict;
    if (d) p.set("district", d);
    fetch(`/api/service-requests?${p}`)
      .then((r) => r.json())
      .then((data) => { setRequests(Array.isArray(data) ? data : []); setLoadingRequests(false); })
      .catch(() => setLoadingRequests(false));
  }

  async function submitRequest() {
    if (!reqTitle.trim() || !reqDesc.trim()) return;
    setSubmitting(true);
    const districtName = selectedDistrict ? DISTRICTS[Number(selectedDistrict)] : null;
    await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: reqTitle, description: reqDesc, serviceSlug: selectedService || null, districtCode: selectedDistrict ? Number(selectedDistrict) : null, districtName }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setReqTitle("");
    setReqDesc("");
    setShowRequestForm(false);
    setTimeout(() => setSubmitted(false), 4000);
  }

  function resetSearch() {
    setView("browse");
    setSelectedCategory("");
    setSelectedService("");
    setServiceSearch("");
    setProviders([]);
    setShowRequestForm(false);
    setSubmitted(false);
  }

  const selectedServiceDef = selectedService ? getServiceBySlug(selectedService) : undefined;

  if (view === "results") {
    return <ResultsView
      providers={providers} loadingProviders={loadingProviders} selectedServiceDef={selectedServiceDef}
      selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict} resetSearch={resetSearch}
      session={session} showRequestForm={showRequestForm} setShowRequestForm={setShowRequestForm}
      reqTitle={reqTitle} setReqTitle={setReqTitle} reqDesc={reqDesc} setReqDesc={setReqDesc}
      submitting={submitting} submitRequest={submitRequest} submitted={submitted}
    />;
  }

  if (view === "requests") {
    return <RequestsView
      requests={requests} loadingRequests={loadingRequests} selectedDistrict={selectedDistrict}
      setSelectedDistrict={setSelectedDistrict} loadRequests={loadRequests} resetSearch={resetSearch}
    />;
  }

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--color-bg))] via-[rgb(var(--color-surface))] to-[rgb(var(--color-bg))]" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-[15%] h-64 w-64 rounded-full bg-[rgba(var(--color-primary),0.06)] blur-3xl" />
          <div className="absolute bottom-20 right-[10%] h-72 w-72 rounded-full bg-[rgba(var(--color-accent),0.04)] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 gap-1.5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--color-primary))]" />
                <span>שוק השירותים הכי ישראלי שיש</span>
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-[rgb(var(--color-text))] md:text-6xl"
            >
              כל אחד צריך
              <br />
              <span className="text-gradient-hero">אבאל׳ה טוב</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-[rgb(var(--color-text-secondary))] md:text-lg"
            >
              בעלי מקצוע מנוסים שיסדרו לך הכל — מהרכבת ארון ועד הוזלת חשבונות. בלי פילטרים, בלי בולשיט.
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto max-w-2xl"
            >
              <div className="relative">
                <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-lg transition-shadow focus-within:shadow-xl focus-within:border-[rgb(var(--color-primary-light))]">
                  <div className="flex flex-1 items-center gap-3 px-5">
                    <Search className="h-5 w-5 flex-shrink-0 text-[rgb(var(--color-text-muted))]" />
                    <input
                      type="text"
                      placeholder='מה אתה צריך? נסה "הרכבת רהיטים" או "תליית טלוויזיה"'
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        if (!e.target.value) { setView("browse"); setSelectedService(""); }
                      }}
                      className="w-full py-4 text-sm bg-transparent text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
                    />
                  </div>
                  {serviceSearch && (
                    <button onClick={() => { setServiceSearch(""); setView("browse"); setSelectedService(""); }} className="px-4 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {serviceSearch && filteredServices.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-xl">
                    {filteredServices.slice(0, 12).map((svc) => (
                      <button
                        key={svc.slug}
                        onClick={() => { setSelectedService(svc.slug); setServiceSearch(svc.nameHe); }}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-right transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
                          {CATEGORY_ICONS[svc.category] || <Wrench className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[rgb(var(--color-text))]">{svc.nameHe}</p>
                          <p className="text-xs text-[rgb(var(--color-text-muted))]">{svc.categoryName} · {svc.description}</p>
                        </div>
                        <ChevronLeft className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-[rgb(var(--color-text-muted))]">פופולרי:</span>
                {["הרכבת רהיטים", "תליית טלוויזיה", "הוזלת חשבונות", "עזרה בהובלה"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setServiceSearch(tag);
                      const match = ALL_SERVICES.find((s) => s.nameHe === tag);
                      if (match) { setSelectedService(match.slug); setServiceSearch(match.nameHe); }
                    }}
                    className="rounded-full border border-[rgb(var(--color-border))] px-3.5 py-1.5 text-xs text-[rgb(var(--color-text-secondary))] transition-all hover:border-[rgb(var(--color-primary-light))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.05)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative z-10 -mt-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="flex items-center gap-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[rgb(var(--color-text))] leading-none">
                    <AnimatedCounter value={stat.number} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {fetchError && (
        <div className="mx-auto max-w-4xl px-4 mt-8">
          <div className="rounded-lg border border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.05)] px-5 py-4 text-center text-sm text-[rgb(var(--color-error))]">
            {fetchError}
          </div>
        </div>
      )}

      {/* ===== CATEGORIES ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-4">
        <div className="mb-10 flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-right">
            <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">מה צריך לסדר?</h2>
            <p className="mt-2 text-[rgb(var(--color-text-secondary))]">תבחר קטגוריה ותראה מה האבאל׳ות יודעים לעשות</p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0 gap-2" asChild>
            <Link href="/gigs">
              עיין בכל השירותים
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SERVICE_CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-5 text-right transition-all duration-300",
                selectedCategory === cat.slug
                  ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] shadow-[var(--shadow-glow)]"
                  : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] hover:border-[rgba(var(--color-primary),0.3)] hover:shadow-md hover:-translate-y-0.5"
              )}
            >
              <div className={cn(
                "mb-3 flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                selectedCategory === cat.slug
                  ? "bg-[rgb(var(--color-primary))] text-white"
                  : "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] group-hover:bg-[rgb(var(--color-primary))] group-hover:text-white"
              )}>
                {CATEGORY_ICONS[cat.slug] || <Wrench className="h-6 w-6" />}
              </div>
              <p className={cn(
                "text-sm font-bold",
                selectedCategory === cat.slug ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text))]"
              )}>
                {cat.nameHe}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                {cat.services.length} שירותים
              </p>
            </motion.button>
          ))}
        </div>

        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                {SERVICE_CATEGORIES.find((c) => c.slug === selectedCategory)?.nameHe}
              </h3>
              <div className="h-px flex-1 bg-[rgb(var(--color-border-light))]" />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_SERVICES.filter((s) => s.category === selectedCategory).map((svc) => (
                <button
                  key={svc.slug}
                  onClick={() => { setSelectedService(svc.slug); setServiceSearch(svc.nameHe); }}
                  className="group flex items-center gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 text-right transition-all hover:border-[rgb(var(--color-primary))] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] transition-colors group-hover:bg-[rgb(var(--color-primary))] group-hover:text-white">
                    {CATEGORY_ICONS[svc.category] || <Wrench className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">{svc.nameHe}</p>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">{svc.description}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))] transition-transform group-hover:-translate-x-1" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ===== FEATURED DADDIES ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col items-center md:flex-row md:justify-between">
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">הכירו את האבאל׳ות שלנו</h2>
              <p className="mt-2 text-[rgb(var(--color-text-secondary))]">בעלי מקצוע מנוסים שכבר הוכיחו את עצמם</p>
            </div>
            <Button variant="outline" className="mt-4 md:mt-0 gap-2" asChild>
              <Link href="/register">
                הצטרף כאבאל׳ה
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(featuredDaddies.length > 0 ? featuredDaddies.slice(0, 6) : []).map((d, i) => {
              const serviceNames = d.services.slice(0, 3).map((slug) => ALL_SERVICES.find((s) => s.slug === slug)?.nameHe || slug);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                >
                  <Link href={`/sellers/${d.id}`} className="group block rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all duration-300 hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)] hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-lg font-bold text-white shadow-md">
                          {d.name[0]}
                        </div>
                        {d.avgRating >= 4.5 && (
                          <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--color-accent-yellow))] shadow-sm">
                            <Star className="h-3 w-3 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{d.name}</p>
                        {d.serviceAreas.length > 0 && (
                          <p className="text-xs text-[rgb(var(--color-text-muted))] truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {d.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}
                          </p>
                        )}
                        {d.avgRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={cn("h-3 w-3", j < Math.round(d.avgRating) ? "text-[rgb(var(--color-accent-yellow))] fill-[rgb(var(--color-accent-yellow))]" : "text-[rgb(var(--color-border))]")} />
                            ))}
                            <span className="text-xs text-[rgb(var(--color-text-muted))] mr-1">({d.reviewCount})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {d.bio && <p className="text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2 leading-relaxed mb-4">{d.bio}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {serviceNames.map((name) => <Badge key={name} variant="default" className="text-[10px]">{name}</Badge>)}
                      {d.services.length > 3 && <Badge variant="secondary" className="text-[10px]">+{d.services.length - 3}</Badge>}
                    </div>
                    <div className="flex items-center justify-between border-t border-[rgb(var(--color-border-light))] pt-3">
                      <div className="flex items-center gap-3 text-xs text-[rgb(var(--color-text-muted))]">
                        <span>{d.completedOrders} עבודות</span>
                        <span>·</span>
                        <span>{d.reviewCount} ביקורות</span>
                      </div>
                      {d.startingPrice && (
                        <span className="text-xs font-bold text-[rgb(var(--color-success))]">החל מ-{d.startingPrice}₪</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            {featuredDaddies.length === 0 && [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-[rgb(var(--color-surface-elevated))]" />
                  <div className="flex-1"><div className="h-4 w-24 rounded bg-[rgb(var(--color-surface-elevated))] mb-2" /><div className="h-3 w-16 rounded bg-[rgb(var(--color-surface-elevated))]" /></div>
                </div>
                <div className="h-3 w-full rounded bg-[rgb(var(--color-surface-elevated))] mb-2" />
                <div className="h-3 w-2/3 rounded bg-[rgb(var(--color-surface-elevated))]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="למה אבאל׳ה?" subtitle='כי יש הבדל בין "מישהו שמכיר מישהו" לבין אבאל׳ה אמיתי' />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] transition-colors group-hover:bg-[rgb(var(--color-primary))] group-hover:text-white">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-[rgb(var(--color-surface-elevated))]">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader title="איך זה עובד?" subtitle="תהליך פשוט, לשני הצדדים" />

          <div className="mx-auto mb-10 flex max-w-sm overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-1">
            {(["buyer", "daddy"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHowItWorksTab(tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all",
                  howItWorksTab === tab
                    ? "bg-[rgb(var(--color-primary))] text-white shadow-sm"
                    : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))]"
                )}
              >
                {tab === "buyer" ? <><Search className="h-4 w-4" /> אני מחפש שירות</> : <><Wrench className="h-4 w-4" /> אני אבאל׳ה</>}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(howItWorksTab === "buyer" ? BUYER_STEPS : DADDY_STEPS).map((item, i) => (
              <motion.div
                key={`${howItWorksTab}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 * i }}
                className="group relative rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="absolute -top-3 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-xs font-extrabold text-white shadow-sm">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader title="מה הקהילה אומרת" subtitle="ביקורות אמיתיות מאנשים אמיתיים" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(liveReviews.length > 0 ? liveReviews.slice(0, 3) : FALLBACK_TESTIMONIALS).map((review, i) => {
              const isLive = "id" in review;
              const r = review as LiveReview & typeof FALLBACK_TESTIMONIALS[0];
              return (
                <motion.div
                  key={isLive ? r.id : i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                  className="relative rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-[rgb(var(--color-accent-yellow))] fill-[rgb(var(--color-accent-yellow))]" />
                    ))}
                  </div>
                  {isLive && (r.ratingQuality || r.ratingAttitude || r.ratingTimeliness || r.ratingPrice) && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {r.ratingQuality && <Badge variant="default" className="text-[10px]">איכות {r.ratingQuality}/10</Badge>}
                      {r.ratingAttitude && <Badge variant="success" className="text-[10px]">יחס {r.ratingAttitude}/10</Badge>}
                      {r.ratingTimeliness && <Badge variant="warning" className="text-[10px]">זמנים {r.ratingTimeliness}/10</Badge>}
                      {r.ratingPrice && <Badge variant="destructive" className="text-[10px]">מחיר {r.ratingPrice}/10</Badge>}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-[rgb(var(--color-text))] mb-4 line-clamp-4">
                    {isLive ? r.comment : r.text}
                  </p>
                  <div className="flex items-center justify-between border-t border-[rgb(var(--color-border-light))] pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-xs font-bold text-white">
                        {isLive ? r.user.name[0] : r.name[0]}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[rgb(var(--color-text))]">{isLive ? r.user.name : r.name}</span>
                        {isLive && r.user.city && <span className="text-[10px] text-[rgb(var(--color-text-muted))] mr-1">· {r.user.city}</span>}
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px] max-w-[120px] truncate">
                      {isLive ? r.gig.title : r.service}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[10px] text-[rgb(var(--color-text-muted))]">
                    על השירות של {isLive ? r.gig.user.name : r.daddyName}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] p-8 md:p-12 text-center relative">
          <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(var(--color-accent),0.1)] translate-x-1/4 translate-y-1/4" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">
              {session?.user?.role === "SELLER"
                ? "יש לך ידיים טובות?"
                : session?.user
                ? "לא מצאת מה שחיפשת?"
                : "מוכן להיות אבאל׳ה?"}
            </h2>
            <p className="mt-3 text-white/70 max-w-md mx-auto">
              {session?.user?.role === "SELLER"
                ? "לקוחות מחפשים עזרה עכשיו. צפה בבקשות פתוחות, הגב, וסגור עבודה."
                : session?.user
                ? "פרסם בקשת שירות ואבאל׳ות מנוסים ייצרו איתך קשר עם הצעות."
                : "הצטרף לקהילה של בעלי מקצוע מנוסים, קבל עבודות, ותעשה את מה שאתה אוהב."}
            </p>
            {session?.user?.role === "SELLER" ? (
              <Button
                variant="secondary"
                size="lg"
                className="mt-6 bg-white text-[rgb(var(--color-primary))] hover:bg-white/90 gap-2"
                onClick={() => { setView("requests"); loadRequests(); }}
              >
                צפה בבקשות פתוחות
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="secondary" size="lg" className="mt-6 bg-white text-[rgb(var(--color-primary))] hover:bg-white/90 gap-2" asChild>
                <Link href={session?.user ? "/requests/create" : "/register"}>
                  {session?.user ? "פרסם בקשה" : "הצטרף עכשיו — בחינם"}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== RESULTS VIEW ===== */
function ResultsView({
  providers, loadingProviders, selectedServiceDef, selectedDistrict, setSelectedDistrict,
  resetSearch, session, showRequestForm, setShowRequestForm,
  reqTitle, setReqTitle, reqDesc, setReqDesc, submitting, submitRequest, submitted,
}: {
  providers: Provider[]; loadingProviders: boolean; selectedServiceDef: ReturnType<typeof getServiceBySlug>;
  selectedDistrict: string; setSelectedDistrict: (v: string) => void; resetSearch: () => void;
  session: ReturnType<typeof useSession>["data"]; showRequestForm: boolean; setShowRequestForm: (v: boolean) => void;
  reqTitle: string; setReqTitle: (v: string) => void; reqDesc: string; setReqDesc: (v: string) => void;
  submitting: boolean; submitRequest: () => void; submitted: boolean;
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            חזרה לכל השירותים
          </button>
          <h1 className="text-2xl font-extrabold text-[rgb(var(--color-text))]">{selectedServiceDef?.nameHe || "תוצאות"}</h1>
          {selectedServiceDef?.description && <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">{selectedServiceDef.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setSelectedDistrict("")} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", !selectedDistrict ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button key={d.code} onClick={() => setSelectedDistrict(String(d.code))} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", selectedDistrict === String(d.code) ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
              {d.name}
            </button>
          ))}
        </div>

        {loadingProviders ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--color-border))] border-t-[rgb(var(--color-primary))]" />
            <p className="mt-4 text-sm text-[rgb(var(--color-text-muted))]">מחפש אבאל׳ות...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Link key={p.id} href={`/sellers/${p.id}`} className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all duration-300 hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-base font-bold text-white shadow-sm">{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{p.name}</p>
                    {p.serviceAreas.length > 0 && <p className="text-xs text-[rgb(var(--color-text-muted))] truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{p.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}</p>}
                  </div>
                </div>
                {p.bio && <p className="mb-4 text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2 leading-relaxed">{p.bio}</p>}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="default">{p.completedOrders} הזמנות</Badge>
                  <Badge variant="warning">{p.reviewCount} ביקורות</Badge>
                  <Badge variant="success">{p.services.length} שירותים</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(var(--color-primary),0.1)]">
              <Search className="h-7 w-7 text-[rgb(var(--color-primary))]" />
            </div>
            <p className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">לא נמצאו אבאל׳ות לשירות הזה</p>
            <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-8 max-w-sm mx-auto">
              {selectedDistrict ? "נסה לחפש בכל הארץ, או פרסם בקשה ואבאל׳ות ייצרו איתך קשר" : "פרסם בקשה ואבאל׳ות באזור שלך ייצרו איתך קשר"}
            </p>
            {session?.user ? (
              !showRequestForm ? (
                <Button onClick={() => setShowRequestForm(true)}>פרסם בקשת שירות</Button>
              ) : (
                <div className="mx-auto max-w-md text-right">
                  <input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="מה אתה צריך? (כותרת קצרה)" className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)]" />
                  <textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="תאר בפירוט מה צריך לעשות, מתי, ותקציב משוער..." rows={4} className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)] resize-none" />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowRequestForm(false)}>ביטול</Button>
                    <Button className="flex-1" onClick={submitRequest} disabled={submitting || !reqTitle.trim() || !reqDesc.trim()}>
                      {submitting ? "שולח..." : "פרסם בקשה"}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <Button asChild><Link href="/register">הירשם כדי לפרסם בקשה</Link></Button>
            )}
          </div>
        )}

        {submitted && (
          <div className="mt-4 rounded-lg bg-[rgba(var(--color-success),0.1)] border border-[rgba(var(--color-success),0.2)] px-5 py-4 text-sm font-medium text-[rgb(var(--color-success))] text-center">
            הבקשה פורסמה בהצלחה! אבאל׳ות באזור שלך יוכלו ליצור איתך קשר.
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== REQUESTS VIEW ===== */
function RequestsView({
  requests, loadingRequests, selectedDistrict, setSelectedDistrict, loadRequests, resetSearch,
}: {
  requests: ServiceRequest[]; loadingRequests: boolean; selectedDistrict: string;
  setSelectedDistrict: (v: string) => void; loadRequests: (d?: string) => void; resetSearch: () => void;
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            חזרה לדף הראשי
          </button>
          <h1 className="text-2xl font-extrabold text-[rgb(var(--color-text))]">בקשות שירות פתוחות</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">לקוחות מחפשים עזרה — הגב, נהל מו״מ, וסגור עבודה</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => { setSelectedDistrict(""); loadRequests(""); }} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", !selectedDistrict ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button key={d.code} onClick={() => { setSelectedDistrict(String(d.code)); loadRequests(String(d.code)); }} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", selectedDistrict === String(d.code) ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
              {d.name}
            </button>
          ))}
        </div>

        {loadingRequests ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--color-border))] border-t-[rgb(var(--color-primary))]" />
            <p className="mt-4 text-sm text-[rgb(var(--color-text-muted))]">טוען בקשות...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => {
              const svc = req.serviceSlug ? getServiceBySlug(req.serviceSlug) : null;
              return (
                <div key={req.id} className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:border-[rgba(var(--color-primary),0.3)]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{req.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[rgb(var(--color-text-muted))]">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.buyer.name}</span>
                        {req.districtName && <span>· {req.cityName || req.districtName}</span>}
                        {svc && <span>· {svc.nameHe}</span>}
                        <span>· {new Date(req.createdAt).toLocaleDateString("he-IL")}</span>
                      </div>
                    </div>
                    <Badge variant="success">{req._count.responses} הצעות</Badge>
                  </div>
                  <p className="text-sm text-[rgb(var(--color-text-secondary))] line-clamp-2 mb-4 leading-relaxed">{req.description}</p>
                  <Link href={`/requests/${req.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
                    צפה בבקשה והגב
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <MessageSquare className="h-10 w-10 text-[rgb(var(--color-text-muted))] mx-auto mb-3" />
            <p className="text-base font-bold text-[rgb(var(--color-text))]">אין בקשות פתוחות כרגע</p>
            <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">בדוק שוב מאוחר יותר</p>
          </div>
        )}
      </div>
    </div>
  );
}
