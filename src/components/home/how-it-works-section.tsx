"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, Wrench } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import { BUYER_STEPS, DADDY_STEPS } from "./data";

export function HowItWorksSection() {
  const [howItWorksTab, setHowItWorksTab] = useState<"buyer" | "daddy">("buyer");

  return (
    <section className="py-20 bg-[rgb(var(--color-surface-elevated))]">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader title="איך זה עובד?" subtitle="תהליך פשוט, לשני הצדדים" />

        <div className="mx-auto mb-10 flex w-full max-w-md overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-1">
          {(["buyer", "daddy"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={howItWorksTab === tab}
              onClick={() => setHowItWorksTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-bold transition-all sm:gap-2 sm:text-sm",
                howItWorksTab === tab
                  ? "bg-[rgb(var(--color-primary))] text-white shadow-sm"
                  : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))]"
              )}
            >
              {tab === "buyer" ? <><MagnifyingGlass className="h-4 w-4" /> אני מחפש שירות</> : <><Wrench className="h-4 w-4" /> אני אבאל׳ה</>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {(howItWorksTab === "buyer" ? BUYER_STEPS : DADDY_STEPS).map((item, i) => (
            <motion.div
              key={`${howItWorksTab}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 * i }}
              className="group relative rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="absolute -top-3 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-xs font-extrabold text-white shadow-sm">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
              <p className="text-xs leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
