"use client";

import { NavigationArrow } from "@phosphor-icons/react";
import { buildWazeNavigateUrl } from "@/lib/waze";

/** Assigned-daddy control: address text plus a Waze search-and-navigate link. */
export function WazeNavigate({
  street,
  cityName,
  districtName,
  floor,
  compact = false,
  showAddress = true,
}: {
  street?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  floor?: string | null;
  compact?: boolean;
  showAddress?: boolean;
}) {
  const href = buildWazeNavigateUrl({ street, cityName, districtName });
  if (!href) return null;

  const place = [street, cityName || districtName].filter(Boolean).join(", ");

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--color-primary))] hover:underline"
      >
        <NavigationArrow className="h-3.5 w-3.5" weight="fill" />
        נווט ב-Waze
      </a>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3">
      {showAddress && (
        <>
          <p className="text-[14px] font-medium text-[rgb(var(--color-text))]">{place}</p>
          {floor ? (
            <p className="mt-0.5 text-[13px] text-[rgb(var(--color-text-secondary))]">קומה {floor}</p>
          ) : null}
        </>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${showAddress ? "mt-3" : ""} inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))]`}
      >
        <NavigationArrow className="h-4 w-4" weight="fill" />
        נווט ב-Waze
      </a>
    </div>
  );
}
