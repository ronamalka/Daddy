"use client";

import { ShieldCheck, Phone, IdentificationCard, Certificate } from "@phosphor-icons/react";

interface VerificationBadgeProps {
  phoneVerified?: boolean;
  identityStatus?: string;
  licenseStatus?: string;
  licenseType?: string;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: {
    bg: "bg-[rgba(var(--color-success),0.1)]",
    text: "text-[rgb(var(--color-success))]",
    label: "מאומת",
  },
  PENDING: {
    bg: "bg-[rgba(var(--color-accent-yellow),0.15)]",
    text: "text-[rgb(var(--color-warning))]",
    label: "ממתין לאישור",
  },
  REJECTED: {
    bg: "bg-[rgba(var(--color-error),0.1)]",
    text: "text-[rgb(var(--color-error))]",
    label: "נדחה",
  },
};

/** Displays verification badges for phone, identity, and license status. */
export function VerificationBadge({
  phoneVerified,
  identityStatus,
  licenseStatus,
  licenseType,
  compact = false,
}: VerificationBadgeProps) {
  const badges: { icon: React.ReactNode; label: string; bg: string; text: string }[] = [];

  if (phoneVerified) {
    badges.push({
      icon: <Phone className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />,
      label: "טלפון מאומת",
      bg: "bg-[rgba(var(--color-success),0.1)]",
      text: "text-[rgb(var(--color-success))]",
    });
  }

  if (identityStatus && identityStatus !== "NONE") {
    const style = STATUS_STYLES[identityStatus] || STATUS_STYLES.PENDING;
    badges.push({
      icon: <IdentificationCard className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />,
      label: `ת.ז. ${style.label}`,
      bg: style.bg,
      text: style.text,
    });
  }

  if (licenseStatus && licenseStatus !== "NONE") {
    const style = STATUS_STYLES[licenseStatus] || STATUS_STYLES.PENDING;
    badges.push({
      icon: <Certificate className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />,
      label: licenseType ? `${licenseType} ${style.label}` : `רישיון ${style.label}`,
      bg: style.bg,
      text: style.text,
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge, i) => (
        <span
          key={i}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${compact ? "text-[11px]" : "text-[12px]"} font-medium ${badge.bg} ${badge.text}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  );
}

/** A single prominent "verified seller" badge with a shield icon. */
export function VerifiedSellerBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-success),0.1)] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-success))] ${className}`}>
      <ShieldCheck className="h-3.5 w-3.5" />
      בעל מקצוע מאומת
    </span>
  );
}
