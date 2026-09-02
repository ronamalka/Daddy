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
  RebookableSection,
} from "@/components/home";
import type { Provider, FeaturedDaddy, LiveReview, RequestTeaser } from "@/components/home/types";
import { PRICE_PRESETS } from "@/components/home/data";
import type { PricingFilter, ProviderSort } from "@/components/home/results-view";
import { visitWindowToIso, type VisitWindowValue } from "@/components/visit-window-fields";
import type { SelectedCity } from "@/components/city-filter";

interface HomePageProps {
  initialFeaturedDaddies: FeaturedDaddy[];
  initialLiveReviews: LiveReview[];
  initialRequestTeasers: RequestTeaser[];
}

export function HomePage({ initialFeaturedDaddies, initialLiveReviews, initialRequestTeasers }: HomePageProps) {
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
  const featuredDaddies = initialFeaturedDaddies;
  const liveReviews = initialLiveReviews;
  const requestTeasers = initialRequestTeasers;
  const [rebookableSellers, setRebookableSellers] = useState<{ sellerId: string; seller: { id: string; name: string; avatar: string | null }; lastOrder: { id: string; title: string | null; price: number; completedAt: string; jobType: string }; orderCount: number }[]>([]);
  const [loadingRebookable, setLoadingRebookable] = useState(false);

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
    if (!session?.user) return;
    let cancelled = false;
    setLoadingRebookable(true);
    fetch("/api/orders/rebookable")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setRebookableSellers(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRebookableSellers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRebookable(false);
      });
    return () => { cancelled = true; };
  }, [session?.user]);

  useEffect(() => {
    if (!selectedService) return;
    let cancelled = false;
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

      <CategoriesSection
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setSelectedService={setSelectedService}
        setServiceSearch={setServiceSearch}
      />

      <FeaturedDaddiesSection featuredDaddies={featuredDaddies} loading={false} />

      {session?.user && (
        <RebookableSection sellers={rebookableSellers} loading={loadingRebookable} />
      )}

      <OpenRequestsTeaser
        teasers={requestTeasers}
        loading={false}
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
