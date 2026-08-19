"use client";

import { Check } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { CategoryIcon } from "@/components/ui/category-icon";
import { cn } from "@/lib/utils";

interface ServicePickerProps {
  selected: string[];
  onChange: (services: string[]) => void;
}

export function ServicePicker({ selected, onChange }: ServicePickerProps) {
  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  function toggleCategory(categorySlug: string) {
    const cat = SERVICE_CATEGORIES.find((c) => c.slug === categorySlug);
    if (!cat) return;
    const slugs = cat.services.map((s) => s.slug);
    const allSelected = slugs.every((s) => selected.includes(s));
    if (allSelected) {
      onChange(selected.filter((s) => !slugs.includes(s)));
    } else {
      const newSelected = new Set([...selected, ...slugs]);
      onChange([...newSelected]);
    }
  }

  return (
    <div className="space-y-4">
      {SERVICE_CATEGORIES.map((cat) => {
        const catSlugs = cat.services.map((s) => s.slug);
        const selectedInCat = catSlugs.filter((s) => selected.includes(s)).length;
        const allInCat = selectedInCat === catSlugs.length;

        return (
          <div key={cat.slug} className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(cat.slug)}
              className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CategoryIcon slug={cat.slug} className="h-5 w-5 text-[rgb(var(--color-primary))]" />
                <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{cat.nameHe}</span>
                {selectedInCat > 0 && (
                  <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2 py-0.5 text-[11px] font-bold text-[rgb(var(--color-primary))]">
                    {selectedInCat}
                  </span>
                )}
              </div>
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded border-2 transition-all",
                allInCat
                  ? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]"
                  : selectedInCat > 0
                  ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)]"
                  : "border-[rgb(var(--color-border))]"
              )}>
                {allInCat && <Check className="h-3 w-3 text-white" />}
                {!allInCat && selectedInCat > 0 && (
                  <div className="h-2 w-2 rounded-sm bg-[rgb(var(--color-primary))]" />
                )}
              </div>
            </button>
            <div className="border-t border-[rgb(var(--color-border-light))] px-4 py-2">
              {cat.services.map((svc) => {
                const isSelected = selected.includes(svc.slug);
                return (
                  <button
                    key={svc.slug}
                    type="button"
                    onClick={() => toggle(svc.slug)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-[13px] font-medium",
                        isSelected ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text))]"
                      )}>
                        {svc.nameHe}
                      </p>
                      <p className="text-[11px] text-[rgb(var(--color-text-muted))] truncate">{svc.description}</p>
                    </div>
                    <div className={cn(
                      "ms-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all",
                      isSelected ? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]" : "border-[rgb(var(--color-border))]"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
