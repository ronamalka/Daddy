import Link from "next/link";
import { CANCELLATION_CHECKOUT_NOTE } from "@/lib/cancellation";

interface CancellationPolicyNoteProps {
  compact?: boolean;
}

/** Tells buyers the 24-hour free window, late fee, and that a booked visit is not 14-day cooling-off. */
export function CancellationPolicyNote({ compact = false }: CancellationPolicyNoteProps) {
  if (compact) {
    return (
      <p className="text-[11px] leading-relaxed text-[rgb(var(--color-text-muted))]">
        {CANCELLATION_CHECKOUT_NOTE}{" "}
        <Link href="/terms" className="underline hover:text-[rgb(var(--color-primary))]">תנאי שימוש</Link>
      </p>
    );
  }

  return (
    <aside className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
      <p className="font-semibold text-[rgb(var(--color-text))]">מדיניות ביטול</p>
      <p className="mt-1">{CANCELLATION_CHECKOUT_NOTE}</p>
    </aside>
  );
}
