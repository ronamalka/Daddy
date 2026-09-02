"use client";

import { SectionHeader } from "./section-header";
import { WHY_CHOOSE } from "./data";

/** Grid of reasons to use the marketplace. */
export function WhyChooseSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader title="למה אבאל׳ה?" subtitle='כי יש הבדל בין "מישהו שמכיר מישהו" לבין אבאל׳ה אמיתי' />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_CHOOSE.map((item, i) => (
          <div
            key={i}
            className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] transition-colors group-hover:text-[rgb(var(--color-primary))]">
              {item.icon}
            </div>
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
            <p className="text-sm leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
