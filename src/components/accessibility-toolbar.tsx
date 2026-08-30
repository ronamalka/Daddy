"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WheelchairMotion, X, MagnifyingGlassPlus, MagnifyingGlassMinus, HighlighterCircle, Cursor, TextT, Pause, ArrowCounterClockwise, LinkSimple } from "@phosphor-icons/react";

interface A11yState {
  fontSize: number;
  contrast: "off" | "high" | "invert" | "mono";
  largerCursor: boolean;
  highlightLinks: boolean;
  pauseAnimations: boolean;
  lineHeight: boolean;
}

const DEFAULT_STATE: A11yState = {
  fontSize: 100,
  contrast: "off",
  largerCursor: false,
  highlightLinks: false,
  pauseAnimations: false,
  lineHeight: false,
};

const STORAGE_KEY = "a11y-settings";

const CONTRAST_CYCLE: A11yState["contrast"][] = ["off", "high", "invert", "mono"];
const CONTRAST_LABELS: Record<A11yState["contrast"], string> = {
  off: "כבוי",
  high: "גבוהה",
  invert: "הפוך",
  mono: "שחור-לבן",
};

export const A11Y_BOOTSTRAP_SCRIPT = `(function(){try{var c=document.documentElement.classList;c.remove('a11y-highlight-headings');var raw=localStorage.getItem('${STORAGE_KEY}');if(!raw)return;var s=JSON.parse(raw);var st=document.documentElement.style;if(s.fontSize&&s.fontSize!==100)st.fontSize=s.fontSize+'%';c.toggle('a11y-high-contrast',s.contrast==='high');c.toggle('a11y-contrast-invert',s.contrast==='invert');c.toggle('a11y-contrast-mono',s.contrast==='mono');c.toggle('a11y-large-cursor',!!s.largerCursor);c.toggle('a11y-highlight-links',!!s.highlightLinks);c.toggle('a11y-pause-animations',!!s.pauseAnimations);c.toggle('a11y-line-height',!!s.lineHeight)}catch(e){}})()`;

/** Shows a panel to change font size, contrast, and other accessibility settings. */
export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT_STATE);
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<A11yState> & { highlightHeadings?: boolean };
        const next: A11yState = {
          fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULT_STATE.fontSize,
          contrast: CONTRAST_CYCLE.includes(parsed.contrast as A11yState["contrast"])
            ? (parsed.contrast as A11yState["contrast"])
            : DEFAULT_STATE.contrast,
          largerCursor: !!parsed.largerCursor,
          highlightLinks: !!parsed.highlightLinks,
          pauseAnimations: !!parsed.pauseAnimations,
          lineHeight: !!parsed.lineHeight,
        };
        setState(next);
        applySettings(next);
        if ("highlightHeadings" in parsed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    /** Toggles the accessibility toolbar with Alt+A. */
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    /** Closes the toolbar when the user presses Escape. */
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(msg));
  }, []);

  const persist = useCallback((next: A11yState) => {
    setState(next);
    applySettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const reset = useCallback(() => {
    persist(DEFAULT_STATE);
    announce("כל הגדרות הנגישות אופסו");
  }, [persist, announce]);

  const update = useCallback((key: keyof A11yState, value: boolean | number | string) => {
    const next = { ...state, [key]: value };
    persist(next);
  }, [state, persist]);

  const cycleContrast = useCallback(() => {
    const idx = CONTRAST_CYCLE.indexOf(state.contrast);
    const next = CONTRAST_CYCLE[(idx + 1) % CONTRAST_CYCLE.length];
    update("contrast", next);
    announce(`ניגודיות: ${CONTRAST_LABELS[next]}`);
  }, [state.contrast, update, announce]);

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <button
        id="a11y-trigger"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 start-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary),0.3)]"
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-keyshortcuts="Alt+A"
      >
        <WheelchairMotion className="h-7 w-7" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-label="הגדרות נגישות"
          aria-modal="true"
          tabIndex={-1}
          className="fixed bottom-24 start-5 z-[91] w-80 rounded-2xl bg-[rgb(var(--color-surface))] p-5 shadow-2xl border border-[rgb(var(--color-border))]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[rgb(var(--color-text))]">נגישות</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
              aria-label="סגור תפריט נגישות"
            >
              <X className="h-5 w-5 text-[rgb(var(--color-text-muted))]" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[rgb(var(--color-text))]">
                <TextT className="inline h-4 w-4 me-1.5" aria-hidden="true" />
                גודל טקסט ({state.fontSize}%)
              </span>
              <div className="flex gap-1">
                <ToolbarButton
                  onClick={() => {
                    const next = Math.max(80, state.fontSize - 10);
                    update("fontSize", next);
                    announce(`גודל טקסט: ${next}%`);
                  }}
                  label="הקטן טקסט"
                >
                  <MagnifyingGlassMinus className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const next = Math.min(200, state.fontSize + 10);
                    update("fontSize", next);
                    announce(`גודל טקסט: ${next}%`);
                  }}
                  label="הגדל טקסט"
                >
                  <MagnifyingGlassPlus className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </div>

            <button
              onClick={cycleContrast}
              aria-label={`ניגודיות: ${CONTRAST_LABELS[state.contrast]}`}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                state.contrast !== "off"
                  ? "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]"
                  : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true"><HighlighterCircle className="h-4 w-4" /></span>
                ניגודיות: {CONTRAST_LABELS[state.contrast]}
              </span>
            </button>

            <ToggleOption
              icon={<Cursor className="h-4 w-4" />}
              label="סמן מוגדל"
              active={state.largerCursor}
              onToggle={() => {
                update("largerCursor", !state.largerCursor);
                announce(state.largerCursor ? "סמן מוגדל כבוי" : "סמן מוגדל פעיל");
              }}
            />

            <ToggleOption
              icon={<LinkSimple className="h-4 w-4" />}
              label="הדגשת קישורים"
              active={state.highlightLinks}
              onToggle={() => {
                update("highlightLinks", !state.highlightLinks);
                announce(state.highlightLinks ? "הדגשת קישורים כבויה" : "הדגשת קישורים פעילה");
              }}
            />

            <ToggleOption
              icon={<Pause className="h-4 w-4" />}
              label="עצירת אנימציות"
              active={state.pauseAnimations}
              onToggle={() => {
                update("pauseAnimations", !state.pauseAnimations);
                announce(state.pauseAnimations ? "אנימציות פעילות" : "אנימציות מושבתות");
              }}
            />

            <ToggleOption
              icon={<TextT className="h-4 w-4" />}
              label="מרווח שורות מוגדל"
              active={state.lineHeight}
              onToggle={() => {
                update("lineHeight", !state.lineHeight);
                announce(state.lineHeight ? "מרווח שורות רגיל" : "מרווח שורות מוגדל");
              }}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgb(var(--color-border))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
            >
              <ArrowCounterClockwise className="h-4 w-4" aria-hidden="true" />
              איפוס
            </button>
            <a
              href="/accessibility"
              className="flex-1 rounded-lg bg-[rgb(var(--color-primary))] px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              הצהרת נגישות
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/** Small square button used for font-size and contrast actions in the toolbar. */
function ToolbarButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
    >
      {children}
    </button>
  );
}

/** On/off row for one accessibility setting, with a switch control. */
function ToggleOption({ icon, label, active, onToggle }: { icon: React.ReactNode; label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]"
          : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))]"
      }`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`h-5 w-9 rounded-full transition-colors ${active ? "bg-[rgb(var(--color-primary))]" : "bg-[rgb(var(--color-border))]"}`}
      >
        <span className={`block h-4 w-4 mt-0.5 rounded-full bg-white transition-transform ${active ? "translate-x-[-16px]" : "translate-x-[-2px]"}`} />
      </span>
    </button>
  );
}

/** Applies font size and accessibility classes on the document root. */
function applySettings(s: A11yState) {
  const root = document.documentElement;
  root.style.fontSize = s.fontSize === 100 ? "" : `${s.fontSize}%`;
  root.classList.toggle("a11y-high-contrast", s.contrast === "high");
  root.classList.toggle("a11y-contrast-invert", s.contrast === "invert");
  root.classList.toggle("a11y-contrast-mono", s.contrast === "mono");
  root.classList.toggle("a11y-large-cursor", s.largerCursor);
  root.classList.toggle("a11y-highlight-links", s.highlightLinks);
  root.classList.toggle("a11y-pause-animations", s.pauseAnimations);
  root.classList.toggle("a11y-line-height", s.lineHeight);
  root.classList.remove("a11y-highlight-headings");
}
