"use client";

import { SERVICE_CATEGORIES } from "@/lib/services";

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
          <div key={cat.slug} className="rounded-[12px] border border-[#E8ECF1] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(cat.slug)}
              className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[#FAFBFF] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[18px]">{cat.icon}</span>
                <span className="text-[14px] font-semibold text-[#2D3436]">{cat.nameHe}</span>
                {selectedInCat > 0 && (
                  <span className="rounded-[9999px] bg-[#6C5CE7]/10 px-2 py-0.5 text-[11px] font-bold text-[#6C5CE7]">
                    {selectedInCat}
                  </span>
                )}
              </div>
              <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                allInCat
                  ? "border-[#6C5CE7] bg-[#6C5CE7]"
                  : selectedInCat > 0
                  ? "border-[#6C5CE7] bg-[#F0EEFF]"
                  : "border-[#D1D5DB]"
              }`}>
                {allInCat && (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {!allInCat && selectedInCat > 0 && (
                  <div className="h-2 w-2 rounded-sm bg-[#6C5CE7]" />
                )}
              </div>
            </button>
            <div className="border-t border-[#F1F3F8] px-4 py-2">
              {cat.services.map((svc) => {
                const isSelected = selected.includes(svc.slug);
                return (
                  <button
                    key={svc.slug}
                    type="button"
                    onClick={() => toggle(svc.slug)}
                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-right hover:bg-[#FAFBFF] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium ${isSelected ? "text-[#6C5CE7]" : "text-[#2D3436]"}`}>
                        {svc.nameHe}
                      </p>
                      <p className="text-[11px] text-[#B2BEC3] truncate">{svc.description}</p>
                    </div>
                    <div className={`ms-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                      isSelected ? "border-[#6C5CE7] bg-[#6C5CE7]" : "border-[#D1D5DB]"
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
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
