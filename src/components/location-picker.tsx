"use client";

import { useEffect, useState, useCallback } from "react";

interface District {
  code: number;
  name: string;
}

interface City {
  code: number;
  name: string;
  districtCode: number;
  districtName: string;
}

interface ServiceAreaEntry {
  districtCode: number;
  districtName: string;
  cityCode?: number;
  cityName?: string;
}

interface LocationPickerProps {
  mode: "single" | "multi";
  value?: { cityCode?: number; cityName?: string; districtCode?: number };
  areas?: ServiceAreaEntry[];
  onChange?: (val: { cityCode: number; cityName: string; districtCode: number; districtName: string }) => void;
  onAreasChange?: (areas: ServiceAreaEntry[]) => void;
  label?: string;
}

export function LocationPicker({ mode, value, areas = [], onChange, onAreasChange, label }: LocationPickerProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(value?.districtCode ?? null);
  const [citySearch, setCitySearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => {
        setDistricts(data.districts);
        setAllCities(data.cities);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cities = selectedDistrict
    ? allCities.filter((c) => c.districtCode === selectedDistrict)
    : allCities;

  const filteredCities = citySearch
    ? cities.filter((c) => c.name.includes(citySearch))
    : cities;

  const handleDistrictClick = useCallback((d: District) => {
    if (mode === "multi") {
      const alreadyHasDistrict = areas.some((a) => a.districtCode === d.code && !a.cityCode);
      if (alreadyHasDistrict) {
        onAreasChange?.(areas.filter((a) => a.districtCode !== d.code));
      } else {
        const withoutCitiesInDistrict = areas.filter((a) => a.districtCode !== d.code);
        onAreasChange?.([...withoutCitiesInDistrict, { districtCode: d.code, districtName: d.name }]);
      }
    } else {
      setSelectedDistrict(selectedDistrict === d.code ? null : d.code);
    }
  }, [mode, areas, onAreasChange, selectedDistrict]);

  const handleCityClick = useCallback((c: City) => {
    if (mode === "multi") {
      const districtFullySelected = areas.some((a) => a.districtCode === c.districtCode && !a.cityCode);
      if (districtFullySelected) return;

      const exists = areas.some((a) => a.cityCode === c.code);
      if (exists) {
        onAreasChange?.(areas.filter((a) => a.cityCode !== c.code));
      } else {
        onAreasChange?.([...areas, {
          districtCode: c.districtCode,
          districtName: c.districtName,
          cityCode: c.code,
          cityName: c.name,
        }]);
      }
    } else {
      onChange?.({
        cityCode: c.code,
        cityName: c.name,
        districtCode: c.districtCode,
        districtName: c.districtName,
      });
    }
  }, [mode, areas, onAreasChange, onChange]);

  const isDistrictSelected = (code: number) =>
    areas.some((a) => a.districtCode === code && !a.cityCode);

  const isCitySelected = (code: number) =>
    areas.some((a) => a.cityCode === code);

  const isDistrictPartial = (code: number) =>
    !isDistrictSelected(code) && areas.some((a) => a.districtCode === code && a.cityCode);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  return (
    <div>
      {label && <label className="mb-2 block text-[13px] font-semibold text-[#636E72]">{label}</label>}

      {/* Districts */}
      <div className="mb-3">
        <p className="mb-2 text-[12px] font-medium text-[#B2BEC3]">אזור</p>
        <div className="flex flex-wrap gap-2">
          {districts.map((d) => {
            const selected = mode === "multi" ? isDistrictSelected(d.code) : selectedDistrict === d.code;
            const partial = mode === "multi" && isDistrictPartial(d.code);
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => handleDistrictClick(d)}
                className={`rounded-[9999px] px-4 py-2 text-[13px] font-semibold transition-all ${
                  selected
                    ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_rgba(108,92,231,0.3)]"
                    : partial
                    ? "border-2 border-[#6C5CE7] bg-[#F0EEFF] text-[#6C5CE7]"
                    : "border border-[#E8ECF1] bg-white text-[#636E72] hover:border-[#A29BFE]/30 hover:text-[#6C5CE7]"
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* City search + list */}
      {(mode === "single" ? selectedDistrict : true) && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[12px] font-medium text-[#B2BEC3]">עיר</p>
            {mode === "multi" && areas.length > 0 && (
              <span className="rounded-[9999px] bg-[#F0EEFF] px-2 py-0.5 text-[11px] font-semibold text-[#6C5CE7]">
                {areas.length} נבחרו
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="חפש עיר..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="mb-2 w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-2.5 text-[13px] text-[#2D3436] placeholder-[#B2BEC3] focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
          />
          <div className="max-h-48 overflow-y-auto rounded-[12px] border border-[#E8ECF1] bg-white">
            {filteredCities.slice(0, 100).map((c) => {
              const selected = mode === "multi"
                ? isCitySelected(c.code) || isDistrictSelected(c.districtCode)
                : value?.cityCode === c.code;
              const disabledByDistrict = mode === "multi" && isDistrictSelected(c.districtCode);
              return (
                <button
                  key={c.code}
                  type="button"
                  disabled={disabledByDistrict}
                  onClick={() => handleCityClick(c)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-[13px] transition-colors ${
                    selected
                      ? "bg-[#F0EEFF] text-[#6C5CE7] font-medium"
                      : "text-[#2D3436] hover:bg-[#FAFBFF]"
                  } ${disabledByDistrict ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span>{c.name}</span>
                  <span className="text-[11px] text-[#B2BEC3]">{c.districtName}</span>
                </button>
              );
            })}
            {filteredCities.length === 0 && (
              <p className="px-4 py-3 text-[13px] text-[#B2BEC3]">לא נמצאו ערים</p>
            )}
            {filteredCities.length > 100 && (
              <p className="px-4 py-2 text-[11px] text-[#B2BEC3] text-center">מציג 100 מתוך {filteredCities.length} — חפש כדי לסנן</p>
            )}
          </div>
        </div>
      )}

      {/* Selected areas summary (multi mode) */}
      {mode === "multi" && areas.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-medium text-[#B2BEC3]">אזורי שירות שנבחרו:</p>
          <div className="flex flex-wrap gap-1.5">
            {areas.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-[9999px] bg-[#F0EEFF] px-3 py-1 text-[12px] font-medium text-[#6C5CE7]"
              >
                {a.cityName || a.districtName}
                <button
                  type="button"
                  onClick={() => onAreasChange?.(areas.filter((_, j) => j !== i))}
                  className="text-[#A29BFE] hover:text-[#6C5CE7]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
