"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ALL_SERVICES, canonicalizeCategorySlug, getServiceBySlug } from "@/lib/services";
import {
  HeroSection,
  StatsSection,
  CategoriesSection,
  FeaturedDaddiesSection,
  OpenRequestsTeaser,
  WhyChooseSection,
  HowItWorksSection,
  TestimonialsSection,
  CtaSection,
  ResultsView,
} from "@/components/home";
import type { Provider, FeaturedDaddy, LiveReview, RequestTeaser } from "@/components/home/types";
import { PRICE_PRESETS } from "@/components/home/data";
import type { PricingFilter, ProviderSort } from "@/components/home/results-view";
import { visitWindowToIso, type VisitWindowValue } from "@/components/visit-window-fields";
import type { SelectedCity } from "@/components/city-filter";

/** Shows the home page with search, featured daddies, and how the site works. */
export function HomePage() {
  const { data: session } = useSession();
  const [view, setView] = useState<"browse" | "results">("browse");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [sortBy, setSortBy] = useState<ProviderSort>("distance");
  const [pricing, setPricing] = useState<PricingFilter>("all");
  const [pricePreset, setPricePreset] = useState("any");
  const [serviceSearch, setServiceSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqWindow, setReqWindow] = useState<VisitWindowValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [featuredDaddies, setFeaturedDaddies] = useState<FeaturedDaddy[]>([]);
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [requestTeasers, setRequestTeasers] = useState<RequestTeaser[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const slug = canonicalizeCategorySlug(new URLSearchParams(window.location.search).get("category"));
    if (slug) setSelectedCategory(slug);
  }, []);

  const filteredServices = serviceSearch
    ? ALL_SERVICES.filter((s) => s.nameHe.includes(serviceSearch) || s.description.includes(serviceSearch))
    : selectedCategory
    ? ALL_SERVICES.filter((s) => s.category === selectedCategory)
    : [];

  useEffect(() => {
    let cancelled = false;
    /** Loads featured daddies, recent reviews, and the public request teaser. */
    async function fetchHomepageData() {
      try {
        const [daddies, reviews, teasers] = await Promise.all([
          fetch("/api/featured-daddies").then((r) => r.json()).catch(() => []),
          fetch("/api/recent-reviews").then((r) => r.json()).catch(() => []),
          fetch("/api/service-requests/teaser").then((r) => r.json()).catch(() => []),
        ]);
        if (!cancelled) {
          setFeaturedDaddies(Array.isArray(daddies) ? daddies : []);
          setLiveReviews(Array.isArray(reviews) ? reviews : []);
          setRequestTeasers(Array.isArray(teasers) ? teasers : []);
          setLoadingFeatured(false);
        }
      } catch {
        if (!cancelled) {
          setFetchError("לא הצלחנו לטעון נתונים. נסה לרענן את הדף.");
          setFeaturedDaddies([]);
          setLiveReviews([]);
          setRequestTeasers([]);
          setLoadingFeatured(false);
        }
      }
    }
    fetchHomepageData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    let cancelled = false;
    /** Fetches providers that match the selected service, city, price, and sort. */
    async function fetchProviders() {
      setLoadingProviders(true);
      const p = new URLSearchParams();
      p.set("service", selectedService);
      if (selectedCity) {
        p.set("cityCode", String(selectedCity.cityCode));
        p.set("district", String(selectedCity.districtCode));
      }
      p.set("sortBy", sortBy);
      if (pricing !== "all") p.set("pricing", pricing);
      const preset = PRICE_PRESETS.find((row) => row.id === pricePreset);
      if (preset?.min != null) p.set("minPrice", String(preset.min));
      if (preset?.max != null) p.set("maxPrice", String(preset.max));
      try {
        const r = await fetch(`/api/providers?${p}`);
        const data = await r.json();
        if (!cancelled) { setProviders(Array.isArray(data) ? data : []); setLoadingProviders(false); setView("results"); }
      } catch { if (!cancelled) setLoadingProviders(false); }
    }
    fetchProviders();
    return () => { cancelled = true; };
  }, [selectedService, selectedCity, sortBy, pricing, pricePreset]);

  /** Sends a new service request from the homepage form. */
  async function submitRequest() {
    if (!reqTitle.trim() || !reqDesc.trim() || !reqWindow?.date) return;
    setSubmitting(true);
    const { slotStart, slotEnd } = visitWindowToIso(reqWindow);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reqTitle,
          description: reqDesc,
          serviceSlug: selectedService || null,
          districtCode: selectedCity?.districtCode ?? null,
          districtName: selectedCity?.districtName ?? null,
          cityCode: selectedCity?.cityCode ?? null,
          cityName: selectedCity?.cityName ?? null,
          slotStart,
          slotEnd,
        }),
      });
      if (!res.ok) {
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setReqTitle("");
      setReqDesc("");
      setReqWindow(null);
      setShowRequestForm(false);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      // Keep the form open so the buyer can retry.
    }
    setSubmitting(false);
  }

  /** Clears the current search and returns to the browse view. */
  function resetSearch() {
    setView("browse");
    setSelectedCategory("");
    setSelectedService("");
    setSelectedCity(null);
    setSortBy("distance");
    setPricing("all");
    setPricePreset("any");
    setServiceSearch("");
    setProviders([]);
    setShowRequestForm(false);
    setSubmitted(false);
  }

  const selectedServiceDef = selectedService ? getServiceBySlug(selectedService) : undefined;

  if (view === "results") {
    return (
      <ResultsView
        providers={providers}
        loadingProviders={loadingProviders}
        selectedServiceDef={selectedServiceDef}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        sortBy={sortBy}
        setSortBy={setSortBy}
        pricing={pricing}
        setPricing={setPricing}
        pricePreset={pricePreset}
        setPricePreset={setPricePreset}
        resetSearch={resetSearch}
        session={session}
        showRequestForm={showRequestForm}
        setShowRequestForm={setShowRequestForm}
        reqTitle={reqTitle}
        setReqTitle={setReqTitle}
        reqDesc={reqDesc}
        setReqDesc={setReqDesc}
        reqWindow={reqWindow}
        setReqWindow={setReqWindow}
        submitting={submitting}
        submitRequest={submitRequest}
        submitted={submitted}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <HeroSection
        serviceSearch={serviceSearch}
        setServiceSearch={setServiceSearch}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        setView={setView}
        filteredServices={filteredServices}
      />

      <StatsSection />

      {fetchError && (
        <div className="mx-auto max-w-4xl px-4 mt-8">
          <div role="alert" className="rounded-lg border border-[rgba(var(--color-error),0.2)] bg-[rgba(var(--color-error),0.05)] px-5 py-4 text-center text-sm text-[rgb(var(--color-error))]">
            {fetchError}
          </div>
        </div>
      )}

      <CategoriesSection
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setSelectedService={setSelectedService}
        setServiceSearch={setServiceSearch}
      />

      <FeaturedDaddiesSection featuredDaddies={featuredDaddies} loading={loadingFeatured} />

      <OpenRequestsTeaser
        teasers={requestTeasers}
        loading={loadingFeatured}
        canOpenDetail={session?.user?.role === "SELLER" || session?.user?.role === "ADMIN"}
        signedIn={Boolean(session?.user)}
      />

      <WhyChooseSection />

      <HowItWorksSection />

      <TestimonialsSection liveReviews={liveReviews} />

      <CtaSection session={session} />
    </div>
  );
}
