"use client";

import Link from "next/link";
import { CaretLeft, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { type Provider } from "./types";
import { DISTRICT_LIST } from "./data";
import { type getServiceBySlug } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultsViewProps {
  providers: Provider[];
  loadingProviders: boolean;
  selectedServiceDef: ReturnType<typeof getServiceBySlug>;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  resetSearch: () => void;
  session: any;
  showRequestForm: boolean;
  setShowRequestForm: (v: boolean) => void;
  reqTitle: string;
  setReqTitle: (v: string) => void;
  reqDesc: string;
  setReqDesc: (v: string) => void;
  submitting: boolean;
  submitRequest: () => void;
  submitted: boolean;
}

export function ResultsView({
  providers, loadingProviders, selectedServiceDef, selectedDistrict, setSelectedDistrict,
  resetSearch, session, showRequestForm, setShowRequestForm,
  reqTitle, setReqTitle, reqDesc, setReqDesc, submitting, submitRequest, submitted,
}: ResultsViewProps) {
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
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setSelectedDistrict("")} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", !selectedDistrict ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button key={d.code} onClick={() => setSelectedDistrict(String(d.code))} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", selectedDistrict === String(d.code) ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
              {d.name}
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
            {providers.map((p) => (
              <Link key={p.id} href={`/sellers/${p.id}`} className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-all duration-300 hover:shadow-lg hover:border-[rgba(var(--color-primary),0.3)] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-base font-bold text-white shadow-sm">{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{p.name}</p>
                    {p.serviceAreas.length > 0 && <p className="text-xs text-[rgb(var(--color-text-muted))] truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{p.serviceAreas.map((a) => a.cityName || a.districtName).join(", ")}</p>}
                  </div>
                </div>
                {p.bio && <p className="mb-4 text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2 leading-relaxed">{p.bio}</p>}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="default">{p.completedOrders} הזמנות</Badge>
                  <Badge variant="warning">{p.reviewCount} ביקורות</Badge>
                  <Badge variant="success">{p.services.length} שירותים</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(var(--color-primary),0.1)]">
              <MagnifyingGlass className="h-7 w-7 text-[rgb(var(--color-primary))]" />
            </div>
            <p className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">לא נמצאו אבאל׳ות לשירות הזה</p>
            <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-8 max-w-sm mx-auto">
              {selectedDistrict ? "נסה לחפש בכל הארץ, או פרסם בקשה ואבאל׳ות ייצרו איתך קשר" : "פרסם בקשה ואבאל׳ות באזור שלך ייצרו איתך קשר"}
            </p>
            {session?.user ? (
              !showRequestForm ? (
                <Button onClick={() => setShowRequestForm(true)}>פרסם בקשת שירות</Button>
              ) : (
                <div className="mx-auto max-w-md text-right">
                  <input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="מה אתה צריך? (כותרת קצרה)" className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)]" />
                  <textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="תאר בפירוט מה צריך לעשות, מתי, ותקציב משוער..." rows={4} className="mb-3 w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.1)] resize-none" />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowRequestForm(false)}>ביטול</Button>
                    <Button className="flex-1" onClick={submitRequest} disabled={submitting || !reqTitle.trim() || !reqDesc.trim()}>
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
