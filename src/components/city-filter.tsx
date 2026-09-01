"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface SelectedCity {
  cityCode: number;
  cityName: string;
  districtCode: number;
  districtName: string;
}

interface CityOption {
  code: number;
  name: string;
  districtCode: number;
  districtName: string;
}

interface CityFilterProps {
  value: SelectedCity | null;
  onChange: (city: SelectedCity | null) => void;
  placeholder?: string;
  id?: string;
}

/** Compact city search for buyers — pick a city, not a district. */
export function CityFilter({ value, onChange, placeholder = "באיזה עיר?", id = "city-filter" }: CityFilterProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.cities)) setCities(data.cities);
      })
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    /** Closes the city list when the buyer clicks outside the field. */
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim();
    const list = q ? cities.filter((c) => c.name.includes(q)) : cities;
    return list.slice(0, 12);
  }, [cities, query]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 focus-within:border-[rgb(var(--color-primary-light))] focus-within:ring-2 focus-within:ring-[rgba(var(--color-primary),0.1)]">
        <MapPin className="h-5 w-5 flex-shrink-0 text-[rgb(var(--color-text-muted))]" />
        {value ? (
          <div className="flex flex-1 items-center justify-between py-3">
            <span className="text-sm font-medium text-[rgb(var(--color-text))]">{value.cityName}</span>
            <button
              type="button"
              aria-label="נקה עיר"
              onClick={() => {
                onChange(null);
                setQuery("");
                setOpen(false);
              }}
              className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-label="חיפוש לפי עיר"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full py-3 text-sm bg-transparent text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
          />
        )}
      </div>
      {open && !value && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-xl text-right"
        >
          <li>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-sm text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))]"
              onClick={() => {
                onChange(null);
                setQuery("");
                setOpen(false);
              }}
            >
              כל הארץ
            </button>
          </li>
          {matches.map((c) => (
            <li key={c.code} role="option">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-[rgb(var(--color-surface-elevated))]",
                  "text-[rgb(var(--color-text))]"
                )}
                onClick={() => {
                  onChange({
                    cityCode: c.code,
                    cityName: c.name,
                    districtCode: c.districtCode,
                    districtName: c.districtName,
                  });
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span>{c.name}</span>
                <span className="text-xs text-[rgb(var(--color-text-muted))]">{c.districtName}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-4 py-3 text-sm text-[rgb(var(--color-text-muted))]">לא נמצאו ערים</li>
          )}
        </ul>
      )}
    </div>
  );
}
