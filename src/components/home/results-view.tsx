"use client";

import Link from "next/link";
import { CaretLeft, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { type Provider } from "./types";
import { PRICE_PRESETS } from "./data";
import { type getServiceBySlug } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VisitWindowFields, type VisitWindowValue } from "@/components/visit-window-fields";
import { CityFilter, type SelectedCity } from "@/components/city-filter";
import { TurnstileWidget } from "@/components/turnstile-widget";

export type ProviderSort = "distance" | "price" | "rating";
export type PricingFilter = "all" | "fixed" | "quote";

interface ResultsViewProps {
  providers: Provider[];
  loadingProviders: boolean;
  selectedServiceDef: ReturnType<typeof getServiceBySlug>;
  selectedCity: SelectedCity | null;
  setSelectedCity: (v: SelectedCity | null) => void;
  sortBy: ProviderSort;
  setSortBy: (v: ProviderSort) => void;
  pricing: PricingFilter;
  setPricing: (v: PricingFilter) => void;
  pricePreset: string;
  setPricePreset: (v: string) => void;
  resetSearch: () => void;
  session: { user?: { id?: string } } | null;
  showRequestForm: boolean;
  setShowRequestForm: (v: boolean) => void;
  reqTitle: string;
  setReqTitle: (v: string) => void;
  reqDesc: string;
  setReqDesc: (v: string) => void;
  reqWindow: VisitWindowValue | null;
  setReqWindow: (v: VisitWindowValue) => void;
  submitting: boolean;
  submitRequest: () => void;
  submitted: boolean;
  requestError?: string;
  onTurnstileVerify?: (token: string) => void;
  onTurnstileExpire?: () => void;
}

function distanceLabel(p: Provider): string | null {
  if (p.matchTier === "city") return "בעיר שלך";
  if (p.distanceKm != null) return `${Math.round(p.distanceKm)} ק״מ`;
  if (p.matchTier === "district") return "כל המחוז";
  return null;
}

/** List of matching providers and a form to post a service request. */
export function ResultsView({
  providers, loadingProviders, selectedServiceDef, selectedCity, setSelectedCity,
  sortBy, setSortBy, pricing, setPricing, pricePreset, setPricePreset,
  resetSearch, session, showRequestForm, setShowRequestForm,
  reqTitle, setReqTitle, reqDesc, setReqDesc, reqWindow, setReqWindow, submitting, submitRequest, submitted,
  requestError, onTurnstileVerify, onTurnstileExpire,
}: ResultsViewProps) {
  const locationLabel = selectedCity?.cityName;

  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
            <CaretLeft className="h-4 w-4 rotate-180" />
            חזרה לכל השירותים
          </button>
          <h1 className="text-2xl font-extrabold text-[rgb(var(--color-text))]">{selectedServiceDef?.nameHe || "תוצאות"}</h1>
          {selectedServiceDef?.description && <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">{selectedServiceDef.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <CityFilter value={selectedCity} onChange={setSelectedCity} />
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-secondary))]">
            <span className="whitespace-nowrap">מיון</span>
            <select
              aria-label="מיון תוצאות"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProviderSort)}
              className="h-11 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 text-sm text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
            >
              <option value="distance">מרחק</option>
              <option value="price">מחיר התחלתי</option>
              <option value="rating">דירוג</option>
            </select>
          </label>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPricePreset(preset.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                pricePreset === preset.id
                  ? "bg-[rgb(var(--color-primary))] text-white shadow-sm"
                  : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { id: "all", label: "הכל" },
            { id: "fixed", label: "מחיר קבוע" },
            { id: "quote", label: "הצעת מחיר" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPricing(opt.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                pricing === opt.id
                  ? "bg-[rgb(var(--color-primary))] text-white shadow-sm"
                  : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loadingProviders ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--color-border))] border-t-[rgb(var(--color-primary))]" />
            <p className="mt-4 text-sm text-[rgb(var(--color-text-muted))]">מחפש אבאל׳ות...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const near = distanceLabel(p);
              return (
                <Link key={p.id} href={`/sellers/${p.id}`} className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all duration-300 hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-sm">{p.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{p.name}</p>
                      {p.serviceAreas.length > 0 && <p className="text-xs text-[rgb(var(--color-text-muted))] truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{p.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}</p>}
                      {near && <p className="text-[11px] text-[rgb(var(--color-primary))] mt-0.5">{near}</p>}
                    </div>
                  </div>
                  {p.bio && <p className="mb-4 text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2 leading-relaxed">{p.bio}</p>}
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                    {p.hasFixedPrice ? (
                      <Badge variant="success">מחיר קבוע</Badge>
                    ) : (
                      <Badge variant="secondary">הצעת מחיר</Badge>
                    )}
                    {p.avgRating ? (
                      <Badge variant="warning">{p.avgRating.toFixed(1)}/10 · {p.reviewCount} ביקורות</Badge>
                    ) : (
                      <Badge variant="warning">{p.reviewCount} ביקורות</Badge>
                    )}
                  </div>
                  {p.startingPrice != null && (
                    <p className="text-sm font-bold text-[rgb(var(--color-text))]">
                      החל מ-₪{p.startingPrice}
                      <span className="ms-1 text-[10px] font-medium text-[rgb(var(--color-text-muted))]">כולל מע״מ</span>
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(var(--color-primary),0.1)]">
              <MagnifyingGlass className="h-7 w-7 text-[rgb(var(--color-primary))]" />
            </div>
            <p className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">גם אבא לא מצא. אבל אל תוותר.</p>
            <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-8 max-w-sm mx-auto">
              {locationLabel ? "נסה עיר אחרת או כל הארץ, או פרסם בקשה ואבאל׳ות ייצרו איתך קשר" : "פרסם בקשה ואבאל׳ות באזור שלך ייצרו איתך קשר"}
            </p>
            {session?.user ? (
              !showRequestForm ? (
                <Button onClick={() => setShowRequestForm(true)}>פרסם בקשת שירות</Button>
              ) : (
                <div className="mx-auto max-w-md text-right">
                  <input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="מה אתה צריך? (כותרת קצרה)" className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)]" />
                  <textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="תאר בפירוט מה צריך לעשות ותקציב משוער..." rows={4} className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)] resize-none" />
                  <div className="mb-3 text-right">
                    <VisitWindowFields value={reqWindow} onChange={setReqWindow} />
                  </div>
                  {onTurnstileVerify && (
                    <div className="mb-3">
                      <TurnstileWidget onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
                    </div>
                  )}
                  {requestError && (
                    <p className="mb-3 text-[13px] font-medium text-[rgb(var(--color-error))]">{requestError}</p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowRequestForm(false)}>ביטול</Button>
                    <Button className="flex-1" onClick={submitRequest} disabled={submitting || !reqTitle.trim() || !reqDesc.trim() || !reqWindow?.date}>
                      {submitting ? "שולח..." : "פרסם בקשה"}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <Button asChild><Link href="/register">הירשם כדי לפרסם בקשה</Link></Button>
            )}
          </div>
        )}

        {submitted && (
          <div role="alert" className="mt-4 rounded-lg bg-[rgba(var(--color-success),0.1)] border border-[rgba(var(--color-success),0.2)] px-5 py-4 text-sm font-medium text-[rgb(var(--color-success))] text-center">
            הבקשה פורסמה בהצלחה! אבאל׳ות באזור שלך יוכלו ליצור איתך קשר.
          </div>
        )}
      </div>
    </div>
  );
}
