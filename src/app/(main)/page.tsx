"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SERVICE_CATEGORIES, ALL_SERVICES, getServiceBySlug } from "@/lib/services";
import { DISTRICTS } from "@/lib/districts";

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

const DAD_QUOTES = [
  "מי צריך יוטיוב כשיש אבאל׳ה?",
  "תירגע, אני אסדר את זה.",
  "אני לא חשמלאי, אבל אני יודע להחליף נורה.",
  "יש לי חבר שמכיר חבר... או שאני פשוט אעשה את זה בעצמי.",
  "זה לא מסובך, צריך רק פטיש ואמונה.",
];

const STATS = [
  { number: "1,200+", label: "אבאל׳ות רשומים", icon: "👨‍🔧" },
  { number: "8,500+", label: "עבודות שהושלמו", icon: "✅" },
  { number: "4.8", label: "דירוג ממוצע", icon: "⭐" },
  { number: "38", label: "שירותים שונים", icon: "🛠️" },
];

const FALLBACK_TESTIMONIALS = [
  {
    name: "נועם ג׳",
    text: "הזמנתי הרכבת ארון מאיקאה. האבאל׳ה הגיע עם ארגז כלים, בדיחות יבשות, ושוקולד. הארון עומד עד היום, הבדיחות פחות.",
    service: "הרכבת רהיטים",
    daddyName: "משה כ׳",
    rating: 5,
  },
  {
    name: "שירה מ׳",
    text: "אבא שלי לא מבין בטכנולוגיה אז הזמנתי לו אבאל׳ה שילמד אותו וואטסאפ. עכשיו הוא שולח לי מימס בלי הפסקה.",
    service: "עזרה טכנית",
    daddyName: "דוד ל׳",
    rating: 5,
  },
  {
    name: "עידו ק׳",
    text: "חיפשתי מישהו שיוריד לי את חשבון הסלולר. האבאל׳ה חסך לי 80 שקל בחודש. קוראים לזה ROI של אבא.",
    service: "הוזלת חשבונות",
    daddyName: "יוסי ב׳",
    rating: 5,
  },
];

const BUYER_STEPS = [
  { step: "01", title: "ספר מה צריך", desc: "חפש שירות או פרסם בקשה. בלי טפסים, בלי בירוקרטיה.", icon: "🔍" },
  { step: "02", title: "בחר אבאל׳ה", desc: "דפדף, קרא ביקורות, השווה מחירים — ותבחר את המתאים.", icon: "👀" },
  { step: "03", title: "תאם וסגור", desc: "שלח הודעה, תאם זמן, ותתחיל לנוח.", icon: "📱" },
  { step: "04", title: "דרג ושתף", desc: "העבודה הסתיימה? תן ביקורת ועזור לאחרים לבחור נכון.", icon: "⭐" },
];

const DADDY_STEPS = [
  { step: "01", title: "צור פרופיל", desc: "הרשם, ספר מה אתה יודע לעשות, ואיפה אתה עובד.", icon: "📝" },
  { step: "02", title: "קבל פניות", desc: "לקוחות מחפשים — הגב לבקשות או תן להם למצוא אותך.", icon: "📩" },
  { step: "03", title: "עשה את העבודה", desc: "תגיע, תסדר, ותשאיר רושם. כמו אבא אמיתי.", icon: "🔧" },
  { step: "04", title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה. פשוט ככה.", icon: "🏆" },
];

const WHY_CHOOSE = [
  {
    title: "אבאל׳ות אמיתיים",
    desc: "לא חברות ענק. אנשים אמיתיים עם ידיים טובות, ניסיון, ורצון לעזור.",
    icon: "🤙",
  },
  {
    title: "דירוג אמין",
    desc: "4 קריטריונים: איכות, יחס, זמנים, מחיר. תדע בדיוק מה אתה מקבל.",
    icon: "📊",
  },
  {
    title: "מחירים הוגנים",
    desc: "ללא עמלות נסתרות. המחיר שאתה רואה — זה המחיר שאתה משלם.",
    icon: "💰",
  },
  {
    title: "כל השירותים",
    desc: "מהרכבת ארון ועד הוזלת חשבונות. 38 שירותים ב-8 קטגוריות.",
    icon: "🛠️",
  },
  {
    title: "לפי אזור",
    desc: "מצא אבאל׳ה בשכונה שלך. 7 מחוזות, עשרות ערים.",
    icon: "📍",
  },
  {
    title: "מהיר ופשוט",
    desc: "חפש, בחר, שלח הודעה. בתוך דקות יש לך אבאל׳ה.",
    icon: "⚡",
  },
];

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

  const [dadQuote] = useState(() => DAD_QUOTES[Math.floor(Math.random() * DAD_QUOTES.length)]);
  const [featuredDaddies, setFeaturedDaddies] = useState<FeaturedDaddy[]>([]);
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
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
        // fallback data already shown
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
        if (!cancelled) {
          setProviders(Array.isArray(data) ? data : []);
          setLoadingProviders(false);
          setView("results");
        }
      } catch {
        if (!cancelled) setLoadingProviders(false);
      }
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
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoadingRequests(false);
      })
      .catch(() => setLoadingRequests(false));
  }

  async function submitRequest() {
    if (!reqTitle.trim() || !reqDesc.trim()) return;
    setSubmitting(true);
    const districtName = selectedDistrict ? DISTRICTS[Number(selectedDistrict)] : null;
    await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: reqTitle,
        description: reqDesc,
        serviceSlug: selectedService || null,
        districtCode: selectedDistrict ? Number(selectedDistrict) : null,
        districtName,
      }),
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
      providers={providers}
      loadingProviders={loadingProviders}
      selectedServiceDef={selectedServiceDef}
      selectedDistrict={selectedDistrict}
      setSelectedDistrict={setSelectedDistrict}
      resetSearch={resetSearch}
      session={session}
      showRequestForm={showRequestForm}
      setShowRequestForm={setShowRequestForm}
      reqTitle={reqTitle}
      setReqTitle={setReqTitle}
      reqDesc={reqDesc}
      setReqDesc={setReqDesc}
      submitting={submitting}
      submitRequest={submitRequest}
      submitted={submitted}
    />;
  }

  if (view === "requests") {
    return <RequestsView
      requests={requests}
      loadingRequests={loadingRequests}
      selectedDistrict={selectedDistrict}
      setSelectedDistrict={setSelectedDistrict}
      loadRequests={loadRequests}
      resetSearch={resetSearch}
    />;
  }

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1333 0%, #2D1B69 30%, #6C5CE7 70%, #00D2D3 100%)" }} />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-[10%] h-72 w-72 rounded-full bg-[#6C5CE7]/20 blur-3xl" />
          <div className="absolute bottom-10 right-[15%] h-64 w-64 rounded-full bg-[#00D2D3]/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#A29BFE]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="text-lg">💬</span>
              <span className="text-[13px] text-white/70 font-medium">&quot;{dadQuote}&quot;</span>
            </div>

            <h1 className="mb-5 text-[38px] font-extrabold leading-[1.15] tracking-tight text-white md:text-[56px]">
              כל אחד צריך
              <br />
              <span className="bg-gradient-to-l from-[#00D2D3] via-[#A29BFE] to-[#FECA57] bg-clip-text text-transparent">
                אבאל׳ה טוב
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-[16px] leading-relaxed text-white/60 md:text-[18px]">
              שוק השירותים הכי ישראלי שיש. בעלי מקצוע מנוסים שיסדרו לך הכל — מהרכבת ארון ועד הוזלת חשבונות. בלי פילטרים, בלי בולשיט.
            </p>

            {/* Search bar */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <div className="flex overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  <div className="flex flex-1 items-center gap-3 px-5">
                    <svg className="h-5 w-5 flex-shrink-0 text-[#B2BEC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      placeholder='מה אתה צריך? נסה "הרכבת רהיטים" או "תליית טלוויזיה"'
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        if (!e.target.value) {
                          setView("browse");
                          setSelectedService("");
                        }
                      }}
                      className="w-full py-4 text-[15px] text-[#2D3436] placeholder-[#B2BEC3] focus:outline-none"
                    />
                  </div>
                  {serviceSearch && (
                    <button onClick={() => { setServiceSearch(""); setView("browse"); setSelectedService(""); }} className="px-4 text-[#B2BEC3] hover:text-[#636E72] transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search autocomplete dropdown */}
                {serviceSearch && filteredServices.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[#E8ECF1] bg-white shadow-2xl">
                    {filteredServices.slice(0, 12).map((svc) => (
                      <button
                        key={svc.slug}
                        onClick={() => {
                          setSelectedService(svc.slug);
                          setServiceSearch(svc.nameHe);
                        }}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-right transition-colors hover:bg-[#F0EEFF]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEFF] text-[18px]">{svc.categoryIcon}</span>
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-[#2D3436]">{svc.nameHe}</p>
                          <p className="text-[12px] text-[#B2BEC3]">{svc.categoryName} · {svc.description}</p>
                        </div>
                        <svg className="h-4 w-4 text-[#B2BEC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick tags */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px]">
                <span className="text-white/40">פופולרי:</span>
                {["הרכבת רהיטים", "תליית טלוויזיה", "הוזלת חשבונות", "עזרה בהובלה", "עזרה טכנית לגיל השלישי"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setServiceSearch(tag);
                      const match = ALL_SERVICES.find((s) => s.nameHe === tag);
                      if (match) {
                        setSelectedService(match.slug);
                        setServiceSearch(match.nameHe);
                      }
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:border-white/25"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="var(--color-bg)" />
          </svg>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="relative z-10 -mt-4">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-[0_4px_20px_rgba(108,92,231,0.08)] border border-[#E8ECF1]/60">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-[20px] font-extrabold text-[#2D3436] leading-none">{stat.number}</p>
                  <p className="text-[12px] text-[#B2BEC3] mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-4">
        <div className="mb-8 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">מה צריך לסדר?</h2>
          <p className="mt-2 text-[15px] text-[#636E72]">תבחר קטגוריה ותראה מה האבאל׳ות יודעים לעשות</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-right transition-all duration-300 ${
                selectedCategory === cat.slug
                  ? "border-[#6C5CE7] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] shadow-[0_8px_30px_rgba(108,92,231,0.25)]"
                  : "border-[#E8ECF1] bg-white hover:border-[#A29BFE]/40 hover:shadow-[0_8px_24px_rgba(108,92,231,0.1)] hover:-translate-y-1"
              }`}
            >
              <div className={`absolute -bottom-6 -left-6 h-24 w-24 rounded-full transition-all duration-300 ${
                selectedCategory === cat.slug ? "bg-white/10" : "bg-[#F0EEFF]/50 group-hover:bg-[#F0EEFF]"
              }`} />
              <span className="relative text-[36px] block mb-3">{cat.icon}</span>
              <p className={`relative text-[15px] font-bold ${selectedCategory === cat.slug ? "text-white" : "text-[#2D3436]"}`}>
                {cat.nameHe}
              </p>
              <p className={`relative mt-1 text-[12px] ${selectedCategory === cat.slug ? "text-white/70" : "text-[#B2BEC3]"}`}>
                {cat.services.length} שירותים
              </p>
            </button>
          ))}
        </div>

        {/* Services under selected category */}
        {selectedCategory && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-[18px] font-bold text-[#2D3436]">
                {SERVICE_CATEGORIES.find((c) => c.slug === selectedCategory)?.nameHe}
              </h3>
              <div className="h-px flex-1 bg-[#E8ECF1]" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_SERVICES.filter((s) => s.category === selectedCategory).map((svc) => (
                <button
                  key={svc.slug}
                  onClick={() => {
                    setSelectedService(svc.slug);
                    setServiceSearch(svc.nameHe);
                  }}
                  className="group flex items-center gap-4 rounded-xl border border-[#E8ECF1] bg-white p-4 text-right transition-all hover:border-[#6C5CE7] hover:shadow-[0_4px_16px_rgba(108,92,231,0.1)] hover:-translate-y-0.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EEFF] text-[20px] transition-colors group-hover:bg-[#6C5CE7] group-hover:text-white group-hover:grayscale-0">
                    {svc.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#2D3436] group-hover:text-[#6C5CE7]">{svc.nameHe}</p>
                    <p className="text-[12px] text-[#B2BEC3] truncate">{svc.description}</p>
                  </div>
                  <svg className="h-5 w-5 text-[#B2BEC3] group-hover:text-[#6C5CE7] transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== MEET OUR TALENTED DADDIES ===== */}
      <section className="bg-gradient-to-br from-[#F0EEFF]/50 via-[#FAFBFF] to-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col items-center md:flex-row md:justify-between">
            <div className="text-center md:text-right">
              <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">הכירו את האבאל׳ות שלנו</h2>
              <p className="mt-2 text-[15px] text-[#636E72]">בעלי מקצוע מנוסים שכבר הוכיחו את עצמם</p>
            </div>
            <Link href="/register" className="mt-4 md:mt-0 inline-flex items-center gap-2 rounded-xl border-2 border-[#6C5CE7] px-5 py-2.5 text-[13px] font-bold text-[#6C5CE7] transition-all hover:bg-[#6C5CE7] hover:text-white">
              הצטרף כאבאל׳ה
              <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {featuredDaddies.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredDaddies.slice(0, 6).map((d) => {
                const serviceNames = d.services.slice(0, 3).map((slug) => {
                  const svc = ALL_SERVICES.find((s) => s.slug === slug);
                  return svc?.nameHe || slug;
                });
                return (
                  <Link key={d.id} href={`/sellers/${d.id}`} className="group rounded-2xl border border-[#E8ECF1] bg-white p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(108,92,231,0.12)] hover:border-[#A29BFE]/40 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[22px] font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.25)]">
                          {d.name[0]}
                        </div>
                        {d.avgRating >= 4.5 && (
                          <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FECA57] text-[10px] shadow-sm">⭐</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-bold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">{d.name}</p>
                        {d.serviceAreas.length > 0 && (
                          <p className="text-[12px] text-[#B2BEC3] truncate">{d.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}</p>
                        )}
                        {d.avgRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg key={i} className={`h-3 w-3 ${i < Math.round(d.avgRating) ? "text-[#FECA57]" : "text-[#E8ECF1]"}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[11px] text-[#B2BEC3]">({d.reviewCount})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {d.bio && <p className="text-[13px] text-[#636E72] line-clamp-2 leading-relaxed mb-4">{d.bio}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {serviceNames.map((name) => (
                        <span key={name} className="rounded-full bg-[#F0EEFF] px-2.5 py-1 text-[11px] font-semibold text-[#6C5CE7]">{name}</span>
                      ))}
                      {d.services.length > 3 && (
                        <span className="rounded-full bg-[#E8ECF1] px-2.5 py-1 text-[11px] font-semibold text-[#636E72]">+{d.services.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E8ECF1] pt-3">
                      <div className="flex items-center gap-3 text-[12px] text-[#B2BEC3]">
                        <span>{d.completedOrders} עבודות</span>
                        <span>·</span>
                        <span>{d.reviewCount} ביקורות</span>
                      </div>
                      {d.startingPrice && (
                        <span className="text-[13px] font-bold text-[#00B894]">החל מ-{d.startingPrice}₪</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-[#E8ECF1] bg-white p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-[#F0EEFF]" />
                    <div className="flex-1">
                      <div className="h-4 w-24 rounded bg-[#F0EEFF] mb-2" />
                      <div className="h-3 w-16 rounded bg-[#F0EEFF]" />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded bg-[#F0EEFF] mb-2" />
                  <div className="h-3 w-2/3 rounded bg-[#F0EEFF]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== WHY CHOOSE אבאל׳ה ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">למה אבאל׳ה?</h2>
          <p className="mt-2 text-[15px] text-[#636E72]">כי יש הבדל בין &quot;מישהו שמכיר מישהו&quot; לבין אבאל׳ה אמיתי</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-[#E8ECF1] bg-white p-6 transition-all hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)] hover:-translate-y-1">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EEFF] text-[28px] transition-colors group-hover:bg-gradient-to-br group-hover:from-[#6C5CE7] group-hover:to-[#A29BFE]">
                {item.icon}
              </div>
              <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#636E72]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS — BUYERS & DADDIES ===== */}
      <section className="bg-[#F8F7FF] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">איך זה עובד?</h2>
            <p className="mt-2 text-[15px] text-[#636E72]">תהליך פשוט, לשני הצדדים</p>
          </div>

          {/* Tab switcher */}
          <div className="mx-auto mb-10 flex max-w-sm overflow-hidden rounded-xl border border-[#E8ECF1] bg-white p-1">
            <button
              onClick={() => setHowItWorksTab("buyer")}
              className={`flex-1 rounded-lg py-3 text-[14px] font-bold transition-all ${
                howItWorksTab === "buyer"
                  ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]"
                  : "text-[#636E72] hover:text-[#6C5CE7]"
              }`}
            >
              🛒 אני מחפש שירות
            </button>
            <button
              onClick={() => setHowItWorksTab("daddy")}
              className={`flex-1 rounded-lg py-3 text-[14px] font-bold transition-all ${
                howItWorksTab === "daddy"
                  ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]"
                  : "text-[#636E72] hover:text-[#6C5CE7]"
              }`}
            >
              🔧 אני אבאל׳ה
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(howItWorksTab === "buyer" ? BUYER_STEPS : DADDY_STEPS).map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-white border border-[#E8ECF1] p-6 transition-all hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)] hover:-translate-y-1">
                <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(108,92,231,0.3)]">
                  {item.step}
                </div>
                <span className="text-[36px] block mb-3">{item.icon}</span>
                <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#636E72]">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -left-3 -translate-y-1/2 text-[#E8ECF1]">
                    <svg className="h-5 w-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT OUR COMMUNITY SAYS ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">מה הקהילה אומרת</h2>
            <p className="mt-2 text-[15px] text-[#636E72]">ביקורות אמיתיות מאנשים אמיתיים (כולל בדיחות יבשות)</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(liveReviews.length > 0 ? liveReviews.slice(0, 3) : []).map((review) => (
              <div key={review.id} className="relative rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(108,92,231,0.06)] border border-[#E8ECF1]/60">
                <div className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#FECA57] text-[14px] font-bold shadow-sm">&ldquo;</div>
                <div className="flex gap-0.5 mb-3 mt-1">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {(review.ratingQuality || review.ratingAttitude || review.ratingTimeliness || review.ratingPrice) && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {review.ratingQuality && <span className="rounded-full bg-[#F0EEFF] px-2 py-0.5 text-[10px] font-semibold text-[#6C5CE7]">איכות {review.ratingQuality}/10</span>}
                    {review.ratingAttitude && <span className="rounded-full bg-[#E8F8F8] px-2 py-0.5 text-[10px] font-semibold text-[#00B894]">יחס {review.ratingAttitude}/10</span>}
                    {review.ratingTimeliness && <span className="rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[10px] font-semibold text-[#D4A600]">זמנים {review.ratingTimeliness}/10</span>}
                    {review.ratingPrice && <span className="rounded-full bg-[#FDF0ED] px-2 py-0.5 text-[10px] font-semibold text-[#E17055]">מחיר {review.ratingPrice}/10</span>}
                  </div>
                )}
                <p className="text-[14px] leading-relaxed text-[#2D3436] mb-4 line-clamp-4">{review.comment}</p>
                <div className="flex items-center justify-between border-t border-[#E8ECF1] pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[12px] font-bold text-white">{review.user.name[0]}</div>
                    <div>
                      <span className="text-[13px] font-semibold text-[#2D3436]">{review.user.name}</span>
                      {review.user.city && <span className="text-[11px] text-[#B2BEC3] mr-1">· {review.user.city}</span>}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#F0EEFF] px-3 py-1 text-[10px] font-semibold text-[#6C5CE7] truncate max-w-[120px]">{review.gig.title}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#B2BEC3]">על השירות של {review.gig.user.name}</p>
              </div>
            ))}
            {/* Fallback testimonials when no live reviews */}
            {liveReviews.length === 0 && FALLBACK_TESTIMONIALS.map((t, i) => (
              <div key={i} className="relative rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(108,92,231,0.06)] border border-[#E8ECF1]/60">
                <div className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#FECA57] text-[14px] font-bold shadow-sm">&ldquo;</div>
                <div className="flex gap-0.5 mb-3 mt-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[14px] leading-relaxed text-[#2D3436] mb-4">{t.text}</p>
                <div className="flex items-center justify-between border-t border-[#E8ECF1] pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[12px] font-bold text-white">{t.name[0]}</div>
                    <span className="text-[13px] font-semibold text-[#2D3436]">{t.name}</span>
                  </div>
                  <span className="rounded-full bg-[#F0EEFF] px-3 py-1 text-[11px] font-semibold text-[#6C5CE7]">{t.service}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#B2BEC3]">על השירות של {t.daddyName}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA / OPEN REQUESTS FOR SELLERS ===== */}
      {session?.user?.role === "SELLER" ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1B69] to-[#6C5CE7] p-8 md:p-12 text-center relative">
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#00D2D3]/10 translate-x-1/4 translate-y-1/4" />
            <div className="relative">
              <h2 className="text-[24px] font-extrabold text-white md:text-[28px]">יש לך ידיים טובות?</h2>
              <p className="mt-3 text-[15px] text-white/60 max-w-md mx-auto">
                לקוחות מחפשים עזרה עכשיו. צפה בבקשות פתוחות, הגב, וסגור עבודה.
              </p>
              <button
                onClick={() => { setView("requests"); loadRequests(); }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[#6C5CE7] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
              >
                צפה בבקשות פתוחות
                <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1B69] to-[#6C5CE7] p-8 md:p-12 text-center relative">
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#00D2D3]/10 translate-x-1/4 translate-y-1/4" />
            <div className="relative">
              <h2 className="text-[24px] font-extrabold text-white md:text-[28px]">
                {session?.user ? "לא מצאת מה שחיפשת?" : "מוכן להיות אבאל׳ה?"}
              </h2>
              <p className="mt-3 text-[15px] text-white/60 max-w-md mx-auto">
                {session?.user
                  ? "פרסם בקשת שירות ואבאל׳ות מנוסים ייצרו איתך קשר עם הצעות."
                  : "הצטרף לקהילה של בעלי מקצוע מנוסים, קבל עבודות, ותעשה את מה שאתה אוהב."
                }
              </p>
              <Link
                href={session?.user ? "/requests/create" : "/register"}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[#6C5CE7] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
              >
                {session?.user ? "פרסם בקשה" : "הצטרף עכשיו — בחינם"}
                <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

/* ===== RESULTS VIEW ===== */
function ResultsView({
  providers, loadingProviders, selectedServiceDef, selectedDistrict, setSelectedDistrict,
  resetSearch, session, showRequestForm, setShowRequestForm,
  reqTitle, setReqTitle, reqDesc, setReqDesc, submitting, submitRequest, submitted,
}: {
  providers: Provider[];
  loadingProviders: boolean;
  selectedServiceDef: ReturnType<typeof getServiceBySlug>;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  resetSearch: () => void;
  session: ReturnType<typeof useSession>["data"];
  showRequestForm: boolean;
  setShowRequestForm: (v: boolean) => void;
  reqTitle: string;
  setReqTitle: (v: string) => void;
  reqDesc: string;
  setReqDesc: (v: string) => void;
  submitting: boolean;
  submitRequest: () => void;
  submitted: boolean;
}) {
  return (
    <div className="min-h-screen">
      {/* Results header */}
      <div className="border-b border-[#E8ECF1] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-[13px] text-[#6C5CE7] hover:text-[#5A4BD1] transition-colors">
            <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            חזרה לכל השירותים
          </button>
          <h1 className="text-[24px] font-extrabold text-[#2D3436]">
            {selectedServiceDef?.nameHe || "תוצאות"}
          </h1>
          {selectedServiceDef?.description && (
            <p className="text-[14px] text-[#636E72] mt-1">{selectedServiceDef.description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Area filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDistrict("")}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              !selectedDistrict ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7] hover:border-[#A29BFE]/40"
            }`}
          >
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button
              key={d.code}
              onClick={() => setSelectedDistrict(String(d.code))}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                selectedDistrict === String(d.code) ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7] hover:border-[#A29BFE]/40"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {loadingProviders ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
            <p className="mt-4 text-[14px] text-[#B2BEC3]">מחפש אבאל׳ות...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Link
                key={p.id}
                href={`/sellers/${p.id}`}
                className="group rounded-2xl border border-[#E8ECF1] bg-white p-5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(108,92,231,0.12)] hover:border-[#A29BFE]/40 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[18px] font-bold text-white shadow-[0_4px_12px_rgba(108,92,231,0.2)]">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">{p.name}</p>
                    {p.serviceAreas.length > 0 && (
                      <p className="text-[12px] text-[#B2BEC3] truncate">
                        {p.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {p.bio && <p className="mb-4 text-[13px] text-[#636E72] line-clamp-2 leading-relaxed">{p.bio}</p>}
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EEFF] px-2.5 py-1 text-[#6C5CE7] font-semibold">
                    {p.completedOrders} הזמנות
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E6] px-2.5 py-1 text-[#D4A600] font-semibold">
                    {p.reviewCount} ביקורות
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8F8] px-2.5 py-1 text-[#00B894] font-semibold">
                    {p.services.length} שירותים
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8ECF1] bg-white p-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F0EEFF]">
              <span className="text-[36px]">🤷‍♂️</span>
            </div>
            <p className="text-[18px] font-bold text-[#2D3436] mb-2">לא נמצאו אבאל׳ות לשירות הזה</p>
            <p className="text-[14px] text-[#636E72] mb-8 max-w-sm mx-auto">
              {selectedDistrict ? "נסה לחפש בכל הארץ, או פרסם בקשה ואבאל׳ות ייצרו איתך קשר" : "פרסם בקשה ואבאל׳ות באזור שלך ייצרו איתך קשר"}
            </p>

            {session?.user ? (
              !showRequestForm ? (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6C5CE7] px-6 py-3 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1] hover:shadow-[0_8px_24px_rgba(108,92,231,0.4)]"
                >
                  פרסם בקשת שירות
                </button>
              ) : (
                <div className="mx-auto max-w-md text-right">
                  <input
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="מה אתה צריך? (כותרת קצרה)"
                    className="mb-3 w-full rounded-xl border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/10"
                  />
                  <textarea
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    placeholder="תאר בפירוט מה צריך לעשות, מתי, ותקציב משוער..."
                    rows={4}
                    className="mb-3 w-full rounded-xl border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/10 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowRequestForm(false)} className="flex-1 rounded-xl border border-[#E8ECF1] py-2.5 text-[14px] font-medium text-[#636E72] hover:bg-[#FAFBFF]">ביטול</button>
                    <button
                      onClick={submitRequest}
                      disabled={submitting || !reqTitle.trim() || !reqDesc.trim()}
                      className="flex-1 rounded-xl bg-[#6C5CE7] py-2.5 text-[14px] font-bold text-white hover:bg-[#5A4BD1] disabled:opacity-40 transition-all"
                    >
                      {submitting ? "שולח..." : "פרסם בקשה"}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#6C5CE7] px-6 py-3 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:bg-[#5A4BD1]">
                הירשם כדי לפרסם בקשה
              </Link>
            )}
          </div>
        )}

        {submitted && (
          <div className="mt-4 rounded-xl bg-[#00B894]/10 border border-[#00B894]/20 px-5 py-4 text-[14px] font-medium text-[#00B894] text-center">
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
  requests: ServiceRequest[];
  loadingRequests: boolean;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  loadRequests: (d?: string) => void;
  resetSearch: () => void;
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[#E8ECF1] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-[13px] text-[#6C5CE7] hover:text-[#5A4BD1] transition-colors">
            <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            חזרה לדף הראשי
          </button>
          <h1 className="text-[24px] font-extrabold text-[#2D3436]">בקשות שירות פתוחות</h1>
          <p className="text-[14px] text-[#636E72] mt-1">לקוחות מחפשים עזרה — הגב, נהל מו״מ, וסגור עבודה</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Area filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedDistrict(""); loadRequests(""); }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              !selectedDistrict ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7]"
            }`}
          >
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button
              key={d.code}
              onClick={() => { setSelectedDistrict(String(d.code)); loadRequests(String(d.code)); }}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                selectedDistrict === String(d.code) ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7]"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {loadingRequests ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
            <p className="mt-4 text-[14px] text-[#B2BEC3]">טוען בקשות...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => {
              const svc = req.serviceSlug ? getServiceBySlug(req.serviceSlug) : null;
              return (
                <div key={req.id} className="group rounded-2xl border border-[#E8ECF1] bg-white p-6 transition-all hover:shadow-[0_8px_24px_rgba(108,92,231,0.08)] hover:border-[#A29BFE]/40">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#2D3436] group-hover:text-[#6C5CE7] transition-colors">{req.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#B2BEC3]">
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                          </svg>
                          {req.buyer.name}
                        </span>
                        {req.districtName && <span>· {req.cityName || req.districtName}</span>}
                        {svc && <span>· {svc.nameHe}</span>}
                        <span>· {new Date(req.createdAt).toLocaleDateString("he-IL")}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#00D2D3]/10 px-3 py-1.5 text-[11px] font-bold text-[#00B894]">
                      {req._count.responses} הצעות
                    </span>
                  </div>
                  <p className="text-[14px] text-[#636E72] line-clamp-2 mb-4 leading-relaxed">{req.description}</p>
                  <Link
                    href={`/requests/${req.id}`}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-[#6C5CE7] hover:text-[#5A4BD1] transition-colors"
                  >
                    צפה בבקשה והגב
                    <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8ECF1] bg-white p-12 text-center">
            <span className="text-[40px] block mb-3">📭</span>
            <p className="text-[16px] font-bold text-[#2D3436]">אין בקשות פתוחות כרגע</p>
            <p className="mt-1 text-[14px] text-[#B2BEC3]">בדוק שוב מאוחר יותר</p>
          </div>
        )}
      </div>
    </div>
  );
}
