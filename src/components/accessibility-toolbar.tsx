"use client";

import { useState, useEffect, useCallback } from "react";
import { WheelchairMotion, X, MagnifyingGlassPlus, MagnifyingGlassMinus, HighlighterCircle, Cursor, TextT, Pause } from "@phosphor-icons/react";

interface A11yState {
  fontSize: number;
  highContrast: boolean;
  largerCursor: boolean;
  highlightLinks: boolean;
  pauseAnimations: boolean;
  lineHeight: boolean;
}

const DEFAULT_STATE: A11yState = {
  fontSize: 100,
  highContrast: false,
  largerCursor: false,
  highlightLinks: false,
  pauseAnimations: false,
  lineHeight: false,
};

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("a11y-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);
        applySettings(parsed);
      }
    } catch {}
  }, []);

  const persist = useCallback((next: A11yState) => {
    setState(next);
    applySettings(next);
    try { localStorage.setItem("a11y-settings", JSON.stringify(next)); } catch {}
  }, []);

  const reset = useCallback(() => {
    persist(DEFAULT_STATE);
  }, [persist]);

  const update = useCallback((key: keyof A11yState, value: boolean | number) => {
    persist({ ...state, [key]: value });
  }, [state, persist]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 start-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary),0.3)]"
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <WheelchairMotion className="h-7 w-7" />
      </button>

      {open && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label="הגדרות נגישות"
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
                  onClick={() => update("fontSize", Math.max(80, state.fontSize - 10))}
                  label="הקטן טקסט"
                >
                  <MagnifyingGlassMinus className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => update("fontSize", Math.min(200, state.fontSize + 10))}
                  label="הגדל טקסט"
                >
                  <MagnifyingGlassPlus className="h-4 w-4" />
                </ToolbarButton>
              </div>
            </div>

            <ToggleOption
              icon={<HighlighterCircle className="h-4 w-4" />}
              label="ניגודיות גבוהה"
              active={state.highContrast}
              onToggle={() => update("highContrast", !state.highContrast)}
            />

            <ToggleOption
              icon={<Cursor className="h-4 w-4" />}
              label="סמן מוגדל"
              active={state.largerCursor}
              onToggle={() => update("largerCursor", !state.largerCursor)}
            />

            <ToggleOption
              icon={<TextT className="h-4 w-4" />}
              label="הדגשת קישורים"
              active={state.highlightLinks}
              onToggle={() => update("highlightLinks", !state.highlightLinks)}
            />

            <ToggleOption
              icon={<Pause className="h-4 w-4" />}
              label="עצירת אנימציות"
              active={state.pauseAnimations}
              onToggle={() => update("pauseAnimations", !state.pauseAnimations)}
            />

            <ToggleOption
              icon={<TextT className="h-4 w-4" />}
              label="מרווח שורות מוגדל"
              active={state.lineHeight}
              onToggle={() => update("lineHeight", !state.lineHeight)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={reset}
              className="flex-1 rounded-lg border border-[rgb(var(--color-border))] px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
            >
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

function applySettings(s: A11yState) {
  const root = document.documentElement;
  root.style.fontSize = s.fontSize === 100 ? "" : `${s.fontSize}%`;
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-large-cursor", s.largerCursor);
  root.classList.toggle("a11y-highlight-links", s.highlightLinks);
  root.classList.toggle("a11y-pause-animations", s.pauseAnimations);
  root.classList.toggle("a11y-line-height", s.lineHeight);
}
