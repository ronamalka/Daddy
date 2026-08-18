"use client";

import { useEffect, useState, useCallback } from "react";
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

const DISTRICT_LIST = Object.entries(DISTRICTS).map(([code, name]) => ({ code: Number(code), name }));

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

  const filteredServices = serviceSearch
    ? ALL_SERVICES.filter((s) => s.nameHe.includes(serviceSearch) || s.description.includes(serviceSearch))
    : selectedCategory
    ? ALL_SERVICES.filter((s) => s.category === selectedCategory)
    : [];

  const searchProviders = useCallback(() => {
    if (!selectedService) return;
    setLoadingProviders(true);
    const p = new URLSearchParams();
    p.set("service", selectedService);
    if (selectedDistrict) p.set("district", selectedDistrict);

    fetch(`/api/providers?${p}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(Array.isArray(data) ? data : []);
        setLoadingProviders(false);
        setView("results");
      })
      .catch(() => setLoadingProviders(false));
  }, [selectedService, selectedDistrict]);

  useEffect(() => {
    if (selectedService) {
      searchProviders();
    }
  }, [selectedService, selectedDistrict, searchProviders]);

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

  const selectedServiceDef = selectedService ? getServiceBySlug(selectedService) : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 40%, #00D2D3 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <h1 className="mb-3 text-[32px] font-bold leading-tight tracking-[-0.02em] text-white md:text-[44px]">
            מה אתה צריך היום? 🫡
          </h1>
          <p className="mb-8 text-[16px] text-white/70 md:text-[18px]">
            חפש שירות, בחר אזור, ומצא אבאל׳ה שיסדר לך הכל
          </p>

          {/* Service search bar */}
          <div className="flex max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
            <div className="flex flex-1 items-center gap-3 px-5">
              <svg className="h-5 w-5 flex-shrink-0 text-[#B2BEC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder='חפש שירות... "הרכבת רהיטים", "תליית טלוויזיה"'
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
              <button onClick={() => { setServiceSearch(""); setView("browse"); setSelectedService(""); }} className="px-4 text-[#B2BEC3] hover:text-[#636E72]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search autocomplete dropdown */}
          {serviceSearch && filteredServices.length > 0 && (
            <div className="relative max-w-2xl">
              <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-[12px] border border-[#E8ECF1] bg-white shadow-xl">
                {filteredServices.slice(0, 15).map((svc) => (
                  <button
                    key={svc.slug}
                    onClick={() => {
                      setSelectedService(svc.slug);
                      setServiceSearch(svc.nameHe);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-[#F0EEFF] transition-colors"
                  >
                    <span className="text-[16px]">{svc.categoryIcon}</span>
                    <div>
                      <p className="text-[14px] font-medium text-[#2D3436]">{svc.nameHe}</p>
                      <p className="text-[11px] text-[#B2BEC3]">{svc.categoryName} · {svc.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-white/50">פופולרי:</span>
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
                className="rounded-[9999px] border border-white/20 px-3.5 py-1.5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Browse mode — service categories */}
        {view === "browse" && !serviceSearch && (
          <>
            <h2 className="mb-6 text-[20px] font-bold text-[#2D3436]">מה אתה מחפש?</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
                  className={`group rounded-[16px] border-2 p-5 text-right transition-all ${
                    selectedCategory === cat.slug
                      ? "border-[#6C5CE7] bg-[#F0EEFF] shadow-[0_4px_16px_rgba(108,92,231,0.15)]"
                      : "border-[#E8ECF1] bg-white hover:border-[#A29BFE]/40 hover:shadow-[0_4px_16px_rgba(108,92,231,0.08)]"
                  }`}
                >
                  <span className="text-[28px]">{cat.icon}</span>
                  <p className={`mt-2 text-[15px] font-semibold ${selectedCategory === cat.slug ? "text-[#6C5CE7]" : "text-[#2D3436]"}`}>
                    {cat.nameHe}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#B2BEC3]">{cat.services.length} שירותים</p>
                </button>
              ))}
            </div>

            {/* Services under selected category */}
            {selectedCategory && (
              <div className="mt-6">
                <h3 className="mb-4 text-[16px] font-bold text-[#2D3436]">
                  {SERVICE_CATEGORIES.find((c) => c.slug === selectedCategory)?.nameHe}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ALL_SERVICES.filter((s) => s.category === selectedCategory).map((svc) => (
                    <button
                      key={svc.slug}
                      onClick={() => {
                        setSelectedService(svc.slug);
                        setServiceSearch(svc.nameHe);
                      }}
                      className="group flex items-center gap-3 rounded-[12px] border border-[#E8ECF1] bg-white p-4 text-right transition-all hover:border-[#6C5CE7] hover:shadow-[0_4px_12px_rgba(108,92,231,0.1)]"
                    >
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#2D3436] group-hover:text-[#6C5CE7]">{svc.nameHe}</p>
                        <p className="text-[12px] text-[#B2BEC3]">{svc.description}</p>
                      </div>
                      <svg className="h-5 w-5 text-[#B2BEC3] group-hover:text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service requests section for sellers */}
            {session?.user?.role === "SELLER" && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[20px] font-bold text-[#2D3436]">בקשות שירות פתוחות</h2>
                  <button
                    onClick={() => { setView("requests"); loadRequests(); }}
                    className="text-[13px] font-semibold text-[#6C5CE7] hover:text-[#5A4BD1]"
                  >
                    הצג הכל ←
                  </button>
                </div>
                <p className="text-[14px] text-[#636E72]">לקוחות מחפשים עזרה — הגב וסגור עבודה</p>
              </div>
            )}
          </>
        )}

        {/* Results mode — providers list */}
        {view === "results" && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <button onClick={resetSearch} className="text-[13px] text-[#6C5CE7] hover:text-[#5A4BD1] mb-2">→ חזרה לכל השירותים</button>
                <h2 className="text-[20px] font-bold text-[#2D3436]">
                  {selectedServiceDef?.nameHe || "תוצאות"}
                </h2>
                <p className="text-[14px] text-[#636E72]">{selectedServiceDef?.description}</p>
              </div>
            </div>

            {/* Area filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDistrict("")}
                className={`rounded-[9999px] px-4 py-2 text-[13px] font-semibold transition-all ${
                  !selectedDistrict ? "bg-[#6C5CE7] text-white" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7]"
                }`}
              >
                כל הארץ
              </button>
              {DISTRICT_LIST.map((d) => (
                <button
                  key={d.code}
                  onClick={() => setSelectedDistrict(String(d.code))}
                  className={`rounded-[9999px] px-4 py-2 text-[13px] font-semibold transition-all ${
                    selectedDistrict === String(d.code) ? "bg-[#6C5CE7] text-white" : "border border-[#E8ECF1] bg-white text-[#636E72] hover:text-[#6C5CE7]"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {loadingProviders ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
              </div>
            ) : providers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/sellers/${p.id}`}
                    className="group rounded-[16px] border border-[#E8ECF1] bg-white p-5 transition-all hover:shadow-[0_8px_24px_rgba(108,92,231,0.12)] hover:border-[#A29BFE]/40"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[16px] font-bold text-white">
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#2D3436] group-hover:text-[#6C5CE7]">{p.name}</p>
                        {p.serviceAreas.length > 0 && (
                          <p className="text-[12px] text-[#B2BEC3] truncate">
                            {p.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    {p.bio && <p className="mb-3 text-[13px] text-[#636E72] line-clamp-2">{p.bio}</p>}
                    <div className="flex items-center gap-4 text-[12px] text-[#B2BEC3]">
                      <span>{p.completedOrders} הזמנות</span>
                      <span>{p.reviewCount} ביקורות</span>
                      <span>{p.services.length} שירותים</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EEFF]">
                  <svg className="h-8 w-8 text-[#A29BFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                </div>
                <p className="text-[16px] font-semibold text-[#2D3436] mb-1">לא נמצאו אבאל׳ות לשירות הזה</p>
                <p className="text-[14px] text-[#636E72] mb-6">
                  {selectedDistrict ? "נסה לחפש בכל הארץ, או פרסם בקשה ואבאל׳ות ייצרו איתך קשר" : "פרסם בקשה ואבאל׳ות באזור שלך ייצרו איתך קשר"}
                </p>

                {session?.user ? (
                  !showRequestForm ? (
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]"
                    >
                      פרסם בקשת שירות
                    </button>
                  ) : (
                    <div className="mx-auto max-w-md text-right">
                      <input
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder="מה אתה צריך? (כותרת קצרה)"
                        className="mb-3 w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none"
                      />
                      <textarea
                        value={reqDesc}
                        onChange={(e) => setReqDesc(e.target.value)}
                        placeholder="תאר בפירוט מה צריך לעשות, מתי, ותקציב משוער..."
                        rows={4}
                        className="mb-3 w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[14px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none resize-none"
                      />
                      <div className="flex gap-3">
                        <button onClick={() => setShowRequestForm(false)} className="flex-1 rounded-[12px] border border-[#E8ECF1] py-2.5 text-[14px] font-medium text-[#636E72]">ביטול</button>
                        <button
                          onClick={submitRequest}
                          disabled={submitting || !reqTitle.trim() || !reqDesc.trim()}
                          className="flex-1 rounded-[12px] bg-[#6C5CE7] py-2.5 text-[14px] font-semibold text-white hover:bg-[#5A4BD1] disabled:opacity-40"
                        >
                          {submitting ? "שולח..." : "פרסם בקשה"}
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <Link href="/register" className="rounded-[12px] bg-[#6C5CE7] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#5A4BD1]">
                    הירשם כדי לפרסם בקשה
                  </Link>
                )}
              </div>
            )}

            {submitted && (
              <div className="mt-4 rounded-[12px] bg-[#00B894]/10 px-4 py-3 text-[14px] font-medium text-[#00B894] text-center">
                הבקשה פורסמה בהצלחה! אבאל׳ות באזור שלך יוכלו ליצור איתך קשר.
              </div>
            )}
          </>
        )}

        {/* Requests mode — for sellers */}
        {view === "requests" && (
          <>
            <div className="mb-6">
              <button onClick={resetSearch} className="text-[13px] text-[#6C5CE7] hover:text-[#5A4BD1] mb-2">→ חזרה לדף הראשי</button>
              <h2 className="text-[20px] font-bold text-[#2D3436]">בקשות שירות פתוחות</h2>
              <p className="text-[14px] text-[#636E72]">לקוחות מחפשים עזרה — הגב, נהל מו״מ, וסגור עבודה</p>
            </div>

            {/* Area filter for requests */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedDistrict(""); loadRequests(""); }}
                className={`rounded-[9999px] px-4 py-2 text-[13px] font-semibold transition-all ${
                  !selectedDistrict ? "bg-[#6C5CE7] text-white" : "border border-[#E8ECF1] bg-white text-[#636E72]"
                }`}
              >
                כל הארץ
              </button>
              {DISTRICT_LIST.map((d) => (
                <button
                  key={d.code}
                  onClick={() => { setSelectedDistrict(String(d.code)); loadRequests(String(d.code)); }}
                  className={`rounded-[9999px] px-4 py-2 text-[13px] font-semibold transition-all ${
                    selectedDistrict === String(d.code) ? "bg-[#6C5CE7] text-white" : "border border-[#E8ECF1] bg-white text-[#636E72]"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
              </div>
            ) : requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((req) => {
                  const svc = req.serviceSlug ? getServiceBySlug(req.serviceSlug) : null;
                  return (
                    <div key={req.id} className="rounded-[16px] border border-[#E8ECF1] bg-white p-5 transition-all hover:shadow-[0_4px_12px_rgba(108,92,231,0.08)]">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-[16px] font-semibold text-[#2D3436]">{req.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[12px] text-[#B2BEC3]">
                            <span>{req.buyer.name}</span>
                            {req.districtName && <span>· {req.cityName || req.districtName}</span>}
                            {svc && <span>· {svc.nameHe}</span>}
                            <span>· {new Date(req.createdAt).toLocaleDateString("he-IL")}</span>
                          </div>
                        </div>
                        <span className="rounded-[9999px] bg-[#00D2D3]/10 px-3 py-1 text-[11px] font-semibold text-[#00B894]">
                          {req._count.responses} הצעות
                        </span>
                      </div>
                      <p className="text-[14px] text-[#636E72] line-clamp-3 mb-3">{req.description}</p>
                      <Link
                        href={`/requests/${req.id}`}
                        className="text-[13px] font-semibold text-[#6C5CE7] hover:text-[#5A4BD1]"
                      >
                        צפה בבקשה והגב ←
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] border border-[#E8ECF1] bg-white p-8 text-center">
                <p className="text-[16px] font-medium text-[#2D3436]">אין בקשות פתוחות כרגע</p>
                <p className="mt-1 text-[14px] text-[#B2BEC3]">בדוק שוב מאוחר יותר</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
