import Link from "next/link";
import { Wrench, House, MagnifyingGlass, Envelope } from "@phosphor-icons/react/dist/ssr";
import { LEGAL_CONTACTS } from "@/lib/legal";

/** Shows a friendly 404 screen when a page does not exist. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[rgb(var(--color-bg))] px-4 text-center">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)]">
              <Wrench className="h-14 w-14 text-[rgb(var(--color-primary))]" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-accent-yellow))] text-lg font-bold shadow-md">
              ?
            </span>
          </div>
        </div>

        <h1 className="mb-3 text-[32px] font-extrabold leading-tight text-[rgb(var(--color-text))] md:text-[40px]">
          אופס. גם לאבא לפעמים נופל המפתח
        </h1>

        <p className="mb-8 text-[16px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
          העמוד שחיפשת לא נמצא. אולי הוא ברח כמו הבורג האחרון בארון מאיקאה.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.2)] transition-all hover:bg-[rgb(var(--color-primary-hover))] hover:shadow-[0_8px_24px_rgba(var(--color-primary),0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <House className="h-5 w-5" />
            חזור הביתה — אבא מחכה
          </Link>
          <Link
            href="/?search=true"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-6 py-3.5 text-[16px] font-semibold text-[rgb(var(--color-text))] transition-all hover:bg-[rgb(var(--color-surface-elevated))] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <MagnifyingGlass className="h-5 w-5" />
            חפש שירות
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href={`mailto:${LEGAL_CONTACTS.support}`}
            className="inline-flex items-center gap-1.5 text-[14px] text-[rgb(var(--color-text-muted))] transition-colors hover:text-[rgb(var(--color-primary))]"
          >
            <Envelope className="h-4 w-4" />
            או פשוט ספר לנו מה קרה
          </Link>
        </div>

        <p className="mt-12 text-[13px] text-[rgb(var(--color-text-muted))]">
          שגיאה 404 — העמוד לא נמצא
        </p>
      </div>
    </div>
  );
}
