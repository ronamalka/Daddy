"use client";

/** Shows a gold "leading professional" badge for Premium sellers. */
export function PremiumBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const classes =
    size === "md"
      ? "inline-flex items-center gap-1.5 rounded-full bg-accent-yellow px-3 py-1 text-[13px] font-semibold text-white shadow-sm"
      : "inline-flex items-center gap-1 rounded-full bg-accent-yellow px-2 py-0.5 text-[11px] font-semibold text-white";

  return (
    <span className={classes}>
      <span aria-hidden="true">&#11088;</span>
      <span>בעל מקצוע מוביל</span>
    </span>
  );
}
