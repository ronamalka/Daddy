"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_MS,
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsent,
  type CookieConsentChoice,
  type CookieConsentState,
} from "@/lib/legal";

const SSR_SENTINEL = Symbol("ssr");

let cached: CookieConsentState | null | typeof SSR_SENTINEL = SSR_SENTINEL;
const listeners = new Set<() => void>();

/** Tells all listeners that cookie consent data changed. */
function emit() {
  listeners.forEach((l) => l());
}

/** Reads the saved cookie choice from localStorage. */
function readFromStorage(): CookieConsentState | null {
  try {
    return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

type Snapshot = CookieConsentState | null | "pending";

/** Returns the current cookie choice for the client store. */
function getSnapshot(): Snapshot {
  if (cached === SSR_SENTINEL) {
    cached = readFromStorage();
  }
  return cached;
}

/** Returns a pending placeholder while the server renders. */
function getServerSnapshot(): Snapshot {
  return "pending";
}

/** Subscribes to cookie-consent changes and returns an unsubscribe function. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Saves the cookie choice to localStorage and a cookie, then notifies listeners. */
function persist(state: CookieConsentState) {
  const raw = JSON.stringify(state);
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, raw);
  const maxAge = Math.floor(COOKIE_CONSENT_MAX_AGE_MS / 1000);
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${state.choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
  cached = state;
  emit();
}

/** Stores an accept or reject choice with the current timestamp. */
function saveChoice(choice: CookieConsentChoice) {
  persist({
    choice,
    analytics: choice === "accepted",
    marketing: false,
    ts: Date.now(),
    version: 1,
  });
}

/** Shows a bottom banner asking the user to accept or reject extra cookies. */
export function CookieConsentBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    /** Reloads cookie consent when another tab changes it. */
    function onStorage(e: StorageEvent) {
      if (e.key === COOKIE_CONSENT_STORAGE_KEY) {
        cached = readFromStorage();
        emit();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const reject = useCallback(() => saveChoice("rejected"), []);
  const accept = useCallback(() => saveChoice("accepted"), []);

  useEffect(() => {
    if (consent) return;
    /** Rejects extra cookies when the user presses Escape. */
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") reject();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [consent, reject]);

  if (consent === "pending" || consent) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] p-4 pb-24 md:pb-4"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="cookie-consent-title" className="text-[16px] font-bold text-[rgb(var(--color-text))]">
            עוגיות והסכמה
          </h2>
          <button
            type="button"
            onClick={reject}
            aria-label="דחיית עוגיות שאינן הכרחיות"
            className="rounded-lg px-2 py-1 text-[18px] leading-none text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))]"
          >
            ×
          </button>
        </div>
        <p id="cookie-consent-desc" className="mt-2 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
          אנחנו משתמשים בעוגיות הכרחיות להפעלת האתר (התחברות, אבטחה, CSRF). עוגיות אנליטיקה ושיווק
          יישמרו רק אם תבחרו במפורש ״אישור״. אפשר לדחות בלי לפגוע בשימוש הבסיסי. פירוט ב{" "}
          <Link href="/privacy" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-xl border-2 border-[rgb(var(--color-border))] py-3 text-[14px] font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-elevated))]"
          >
            דחייה
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-xl border-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))] py-3 text-[14px] font-bold text-white hover:bg-[rgb(var(--color-primary-hover))]"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
