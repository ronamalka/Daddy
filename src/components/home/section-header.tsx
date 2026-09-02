"use client";

import { cn } from "@/lib/utils";

/** Centered title and subtitle used above home-page sections. */
export function SectionHeader({ title, subtitle, className }: { title: string; subtitle: string; className?: string }) {
  return (
    <div className={cn("text-center mb-12", className)}>
      <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] md:text-4xl tracking-tight">{title}</h2>
      <p className="mt-3 text-[rgb(var(--color-text-secondary))] text-base max-w-lg mx-auto">{subtitle}</p>
    </div>
  );
}
