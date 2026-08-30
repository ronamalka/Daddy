"use client";

import Link from "next/link";
import { Check, Circle } from "@phosphor-icons/react";
import { SELLER_CHECKLIST_ITEMS, type ProfileReadinessResponse } from "@/lib/seller-ready";

interface ProfileProgressProps {
  readiness: ProfileReadinessResponse;
  variant?: "compact" | "full";
}

/** Shows how many daddy-onboarding items are done, with a meter and optional checklist. */
export function ProfileProgress({ readiness, variant = "full" }: ProfileProgressProps) {
  const { completedCount, total, percent, complete, items } = readiness;

  return (
    <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-[0_4px_16px_rgba(var(--color-primary),0.06)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">
            {complete ? "הפרופיל מוכן לעבודות" : "מוכנות לפרופיל"}
          </h2>
          <p className="mt-0.5 text-[13px] text-[rgb(var(--color-text-secondary))]">
            {complete
              ? "לקוחות יכולים למצוא אותך בחיפוש ובעמוד הבית."
              : `${completedCount} מתוך ${total} — עוד קצת ואתה באוויר. בלי מחיר אין הפתעות בחשבון.`}
          </p>
        </div>
        <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[13px] font-bold text-[rgb(var(--color-primary))]">
          {percent}%
        </span>
      </div>

      <div
        className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--color-border))]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="התקדמות פרופיל אבאל׳ה"
      >
        <div
          className="h-full rounded-full bg-gradient-to-l from-[rgb(var(--color-success))] to-[rgb(var(--color-primary))] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {variant === "compact" ? (
        !complete && (
          <Link
            href="/onboarding"
            className="mt-4 inline-flex text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]"
          >
            השלם את הצ׳קליסט
          </Link>
        )
      ) : (
        <ul className="mt-5 space-y-2">
          {SELLER_CHECKLIST_ITEMS.map((item) => {
            const done = items[item.key];
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-xl border border-[rgb(var(--color-border))] px-4 py-3 transition-all hover:border-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.04)]"
                >
                  {done ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(var(--color-success))]" weight="bold" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(var(--color-text-muted))]" />
                  )}
                  <span>
                    <span className={`block text-[14px] font-semibold ${done ? "text-[rgb(var(--color-text-muted))] line-through" : "text-[rgb(var(--color-text))]"}`}>
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
