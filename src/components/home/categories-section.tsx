"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CaretLeft } from "@phosphor-icons/react";
import { SERVICE_CATEGORIES, ALL_SERVICES } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/category-icon";

interface CategoriesSectionProps {
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  setSelectedService: (v: string) => void;
  setServiceSearch: (v: string) => void;
}

/** Category grid on the home page; tapping one opens its services. */
export function CategoriesSection({
  selectedCategory, setSelectedCategory, setSelectedService, setServiceSearch,
}: CategoriesSectionProps) {
  const subServicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCategory && subServicesRef.current) {
      subServicesRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedCategory]);

  const selectedIndex = SERVICE_CATEGORIES.findIndex((c) => c.slug === selectedCategory);

  const mobileInsertAfter = selectedIndex >= 0 ? Math.floor(selectedIndex / 2) * 2 + 1 : -1;
  const desktopInsertAfter = selectedIndex >= 0 ? Math.floor(selectedIndex / 4) * 4 + 3 : -1;

  const items: React.ReactNode[] = [];

  SERVICE_CATEGORIES.forEach((cat, i) => {
    items.push(
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
          <CategoryIcon slug={cat.slug} className="h-6 w-6" />
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
    );

    if (selectedCategory && i === mobileInsertAfter) {
      items.push(
        <div key="sub-mobile" className="col-span-2 md:hidden" ref={subServicesRef}>
          <SubServicesPanel
            category={selectedCategory}
            setSelectedService={setSelectedService}
            setServiceSearch={setServiceSearch}
          />
        </div>
      );
    }

    if (selectedCategory && i === desktopInsertAfter) {
      items.push(
        <div key="sub-desktop" className="hidden md:block col-span-4" ref={mobileInsertAfter === desktopInsertAfter ? undefined : subServicesRef}>
          <SubServicesPanel
            category={selectedCategory}
            setSelectedService={setSelectedService}
            setServiceSearch={setServiceSearch}
          />
        </div>
      );
    }
  });

  return (
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
        {items}
      </div>
    </section>
  );
}

/** List of services inside the selected category. */
function SubServicesPanel({
  category, setSelectedService, setServiceSearch,
}: {
  category: string;
  setSelectedService: (v: string) => void;
  setServiceSearch: (v: string) => void;
}) {
  const services = ALL_SERVICES.filter((s) => s.category === category);
  const categoryName = SERVICE_CATEGORIES.find((c) => c.slug === category)?.nameHe;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="rounded-xl border border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))] p-4 mt-1">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-bold text-[rgb(var(--color-text))]">{categoryName}</h3>
          <div className="h-px flex-1 bg-[rgb(var(--color-border-light))]" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <button
              key={svc.slug}
              onClick={() => { setSelectedService(svc.slug); setServiceSearch(svc.nameHe); }}
              className="group flex items-center gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 text-right transition-all hover:border-[rgb(var(--color-primary))] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] transition-colors group-hover:bg-[rgb(var(--color-primary))] group-hover:text-white">
                <CategoryIcon slug={svc.category} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">{svc.nameHe}</p>
                <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">{svc.description}</p>
              </div>
              <CaretLeft className="h-4 w-4 text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))] transition-transform group-hover:-translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
