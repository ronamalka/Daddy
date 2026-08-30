"use client";

import { motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./section-header";
import { FALLBACK_TESTIMONIALS } from "./data";
import type { LiveReview } from "./types";

interface TestimonialsSectionProps {
  liveReviews: LiveReview[];
}

/** Three review cards from live data, or fallback quotes if none exist. */
export function TestimonialsSection({ liveReviews }: TestimonialsSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader title="מה הקהילה אומרת" subtitle="ביקורות אמיתיות מאנשים אמיתיים" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(liveReviews.length > 0 ? liveReviews : FALLBACK_TESTIMONIALS).slice(0, 3).map((review, i) => {
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
                    <Star key={j} className="h-4 w-4 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
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
                      {(isLive ? r.user?.name : r.name)?.[0] ?? "א"}
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
  );
}
