"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ALL_SERVICES } from "@/lib/services";
import { getServiceBySlug } from "@/lib/services";
import { DISTRICTS } from "@/lib/districts";
import {
  HeroSection,
  StatsSection,
  CategoriesSection,
  FeaturedDaddiesSection,
  WhyChooseSection,
  HowItWorksSection,
  TestimonialsSection,
  CtaSection,
  ResultsView,
  RequestsView,
} from "@/components/home";
import type { Provider, ServiceRequest, FeaturedDaddy, LiveReview } from "@/components/home/types";
import { VisitWindowFields, visitWindowToIso, type VisitWindowValue } from "@/components/visit-window-fields";

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
  const [reqWindow, setReqWindow] = useState<VisitWindowValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [featuredDaddies, setFeaturedDaddies] = useState<FeaturedDaddy[]>([]);
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

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
          setLoadingFeatured(false);
        }
      } catch {
        if (!cancelled) {
          setFetchError("לא הצלחנו לטעון נתונים. נסה לרענן את הדף.");
          setFeaturedDaddies([]);
          setLiveReviews([]);
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
    if (!reqTitle.trim() || !reqDesc.trim() || !reqWindow?.date) return;
    setSubmitting(true);
    const districtName = selectedDistrict ? DISTRICTS[Number(selectedDistrict)] : null;
    const { slotStart, slotEnd } = visitWindowToIso(reqWindow);
    await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: reqTitle,
        description: reqDesc,
        serviceSlug: selectedService || null,
        districtCode: selectedDistrict ? Number(selectedDistrict) : null,
        districtName,
        slotStart,
        slotEnd,
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setReqTitle("");
    setReqDesc("");
    setReqWindow(null);
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
    return (
      <ResultsView
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
        reqWindow={reqWindow}
        setReqWindow={setReqWindow}
        submitting={submitting}
        submitRequest={submitRequest}
        submitted={submitted}
      />
    );
  }

  if (view === "requests") {
    return (
      <RequestsView
        requests={requests}
        loadingRequests={loadingRequests}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        loadRequests={loadRequests}
        resetSearch={resetSearch}
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

      <WhyChooseSection />

      <HowItWorksSection />

      <TestimonialsSection liveReviews={liveReviews} />

      <CtaSection
        session={session}
        setView={setView}
        loadRequests={loadRequests}
      />
    </div>
  );
}
