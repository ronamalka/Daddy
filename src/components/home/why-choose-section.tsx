"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "./section-header";
import { WHY_CHOOSE } from "./data";

export function WhyChooseSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader title="למה אבאל׳ה?" subtitle='כי יש הבדל בין "מישהו שמכיר מישהו" לבין אבאל׳ה אמיתי' />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_CHOOSE.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] transition-colors group-hover:bg-[rgb(var(--color-primary))] group-hover:text-white">
              {item.icon}
            </div>
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
            <p className="text-sm leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
