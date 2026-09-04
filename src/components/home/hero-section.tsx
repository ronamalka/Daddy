"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MagnifyingGlass, X, CaretLeft } from "@phosphor-icons/react";
import { ALL_SERVICES } from "@/lib/services";
import { POPULAR_SEARCHES } from "./data";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CityFilter, type SelectedCity } from "@/components/city-filter";
import { trackEvent } from "@/lib/analytics";

interface HeroSectionProps {
  serviceSearch: string;
  setServiceSearch: (v: string) => void;
  selectedService: string;
  setSelectedService: (v: string) => void;
  selectedCity: SelectedCity | null;
  setSelectedCity: (v: SelectedCity | null) => void;
  setView: (v: "browse" | "results") => void;
  filteredServices: typeof ALL_SERVICES;
}

/** Home hero with logo, slogan, and a service search box. */
export function HeroSection({
  serviceSearch, setServiceSearch, setSelectedService, selectedCity, setSelectedCity, setView, filteredServices,
}: HeroSectionProps) {
  return (
    <section className="bg-[rgb(var(--color-bg))]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-5xl px-4 pt-20 pb-24 md:pt-32 md:pb-32"
      >
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/logo.jpeg"
              alt="אבאל׳ה"
              width={160}
              height={160}
              className="mx-auto rounded-full shadow-md"
              priority
              unoptimized
            />
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-[rgb(var(--color-text))] md:text-6xl">
            <span className="text-[rgb(var(--color-primary))]">כל אחד צריך אבאל׳ה</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-[rgb(var(--color-text-secondary))] md:text-lg">
            אבא תמיד יודע לסדר. גם אם הוא לא שלך. מהרכבת ארון שסירב להתרכב ועד הוזלת חשבונות שגרמו לך לבכות.
          </p>

          <div className="mx-auto max-w-2xl">
            <div className="space-y-2">
              <div className="relative">
                <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-sm transition-shadow focus-within:border-[rgb(var(--color-primary-light))]">
                <div className="flex flex-1 items-center gap-3 px-5">
                  <MagnifyingGlass className="h-5 w-5 flex-shrink-0 text-[rgb(var(--color-text-muted))]" />
                  <input
                    type="text"
                    aria-label="חיפוש שירותים"
                    placeholder="מה נשבר הפעם?"
                    value={serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      if (!e.target.value) { setView("browse"); setSelectedService(""); }
                    }}
                    className="w-full py-4 text-sm bg-transparent text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
                  />
                </div>
                {serviceSearch && (
                  <button aria-label="נקה חיפוש" onClick={() => { setServiceSearch(""); setView("browse"); setSelectedService(""); }} className="px-4 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {serviceSearch && filteredServices.length > 0 && (
                <div className="absolute z-20 top-full mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-xl">
                  {filteredServices.slice(0, 12).map((svc) => (
                    <button
                      key={svc.slug}
                      onClick={() => { setSelectedService(svc.slug); setServiceSearch(svc.nameHe); trackEvent("search_performed", { query: svc.nameHe, category: svc.category }); }}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-right transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
                        <CategoryIcon slug={svc.category} className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[rgb(var(--color-text))]">{svc.nameHe}</p>
                        <p className="text-xs text-[rgb(var(--color-text-muted))]">{svc.categoryName} · {svc.description}</p>
                      </div>
                      <CaretLeft className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />
                    </button>
                  ))}
                </div>
              )}
              </div>

              <CityFilter value={selectedCity} onChange={setSelectedCity} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-[rgb(var(--color-text-muted))]">פופולרי:</span>
              {POPULAR_SEARCHES.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => {
                    setServiceSearch(tag.query);
                    const match = ALL_SERVICES.find((s) => s.nameHe === tag.query);
                    if (match) setSelectedService(match.slug);
                  }}
                  className="rounded-full border border-[rgb(var(--color-border))] px-3.5 py-1.5 text-xs text-[rgb(var(--color-text-secondary))] transition-all hover:border-[rgb(var(--color-primary-light))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.05)]"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
