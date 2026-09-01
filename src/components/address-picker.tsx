"use client";

import { useEffect, useState, useCallback } from "react";
import { House, MapPin, Plus } from "@phosphor-icons/react";

interface SavedAddress {
  id: string;
  label: string;
  cityCode: number | null;
  cityName: string | null;
  districtCode: number | null;
  districtName: string | null;
  street: string | null;
  floor: string | null;
  accessNotes: string | null;
}

interface AddressPickerProps {
  /** Fires when the user selects a saved address. */
  onSelect: (address: SavedAddress) => void;
  /** If set, highlights this address in the list. */
  selectedId?: string | null;
  /** Optional class name for the container. */
  className?: string;
}

/** Dropdown that shows the user's saved addresses and a link to add new ones. */
export function AddressPicker({ onSelect, selectedId, className }: AddressPickerProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddresses(data);
      }
    } catch {
      // keep empty
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  if (loading) {
    return (
      <div className={className}>
        <p className="text-[13px] text-[rgb(var(--color-text-muted))]">טוען כתובות...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className={className}>
        <a
          href="/profile/addresses"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-dashed border-[rgb(var(--color-border))] px-4 py-3 text-[13px] font-semibold text-[rgb(var(--color-primary))] transition-all hover:border-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.05)]"
        >
          <Plus className="h-4 w-4" />
          הוסף כתובת שמורה
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
        כתובת שמורה
      </label>
      <div className="space-y-2">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(addr)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-right transition-all ${
                isSelected
                  ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.05)]"
                  : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] hover:border-[rgb(var(--color-primary))]"
              }`}
            >
              <div className={`mt-0.5 rounded-lg p-1.5 ${isSelected ? "bg-[rgba(var(--color-primary),0.15)]" : "bg-[rgba(var(--color-primary),0.1)]"}`}>
                <House className={`h-4 w-4 ${isSelected ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text-muted))]"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-semibold ${isSelected ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text))]"}`}>
                  {addr.label}
                </p>
                {addr.cityName && (
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[rgb(var(--color-text-muted))]">
                    <MapPin className="h-3 w-3" />
                    {addr.cityName}
                    {addr.street ? `, ${addr.street}` : ""}
                  </p>
                )}
              </div>
            </button>
          );
        })}
        <a
          href="/profile/addresses"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-dashed border-[rgb(var(--color-border))] px-4 py-2.5 text-[13px] font-medium text-[rgb(var(--color-text-muted))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
        >
          <Plus className="h-3.5 w-3.5" />
          נהל כתובות
        </a>
      </div>
    </div>
  );
}
