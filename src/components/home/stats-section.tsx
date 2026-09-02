"use client";

import { STATS } from "./data";
import { AnimatedCounter } from "./animated-counter";

/** Row of marketplace stats with animated numbers. */
export function StatsSection() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
