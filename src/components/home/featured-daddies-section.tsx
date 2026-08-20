"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin } from "@phosphor-icons/react";
import { ALL_SERVICES } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeaturedDaddy } from "./types";

interface FeaturedDaddiesSectionProps {
  featuredDaddies: FeaturedDaddy[];
}

export function FeaturedDaddiesSection({ featuredDaddies }: FeaturedDaddiesSectionProps) {
  return (
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
                          <Star className="h-3 w-3 text-white" weight="fill" />
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
                            <Star key={j} className={cn("h-3 w-3", j < Math.round(d.avgRating) ? "text-[rgb(var(--color-accent-yellow))]" : "text-[rgb(var(--color-border))]")} weight={j < Math.round(d.avgRating) ? "fill" : "regular"} />
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
  );
}
