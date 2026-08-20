"use client";

import Link from "next/link";
import { CaretLeft, User, Chat, ArrowLeft } from "@phosphor-icons/react";
import { type ServiceRequest } from "./types";
import { DISTRICT_LIST } from "./data";
import { getServiceBySlug } from "@/lib/services";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestsViewProps {
  requests: ServiceRequest[];
  loadingRequests: boolean;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  loadRequests: (d?: string) => void;
  resetSearch: () => void;
}

export function RequestsView({
  requests, loadingRequests, selectedDistrict, setSelectedDistrict, loadRequests, resetSearch,
}: RequestsViewProps) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button onClick={resetSearch} className="mb-3 flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
            <CaretLeft className="h-4 w-4 rotate-180" />
            חזרה לדף הראשי
          </button>
          <h1 className="text-2xl font-extrabold text-[rgb(var(--color-text))]">בקשות שירות פתוחות</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">לקוחות מחפשים עזרה — הגב, נהל מו״מ, וסגור עבודה</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => { setSelectedDistrict(""); loadRequests(""); }} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", !selectedDistrict ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
            כל הארץ
          </button>
          {DISTRICT_LIST.map((d) => (
            <button key={d.code} onClick={() => { setSelectedDistrict(String(d.code)); loadRequests(String(d.code)); }} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all", selectedDistrict === String(d.code) ? "bg-[rgb(var(--color-primary))] text-white shadow-sm" : "border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]")}>
              {d.name}
            </button>
          ))}
        </div>

        {loadingRequests ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--color-border))] border-t-[rgb(var(--color-primary))]" />
            <p className="mt-4 text-sm text-[rgb(var(--color-text-muted))]">טוען בקשות...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => {
              const svc = req.serviceSlug ? getServiceBySlug(req.serviceSlug) : null;
              return (
                <div key={req.id} className="group rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-md hover:border-[rgba(var(--color-primary),0.3)]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{req.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[rgb(var(--color-text-muted))]">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.buyer.name}</span>
                        {req.districtName && <span>· {req.cityName || req.districtName}</span>}
                        {svc && <span>· {svc.nameHe}</span>}
                        <span>· {new Date(req.createdAt).toLocaleDateString("he-IL")}</span>
                      </div>
                    </div>
                    <Badge variant="success">{req._count.responses} הצעות</Badge>
                  </div>
                  <p className="text-sm text-[rgb(var(--color-text-secondary))] line-clamp-2 mb-4 leading-relaxed">{req.description}</p>
                  <Link href={`/requests/${req.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] transition-colors">
                    צפה בבקשה והגב
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <Chat className="h-10 w-10 text-[rgb(var(--color-text-muted))] mx-auto mb-3" />
            <p className="text-base font-bold text-[rgb(var(--color-text))]">אין בקשות פתוחות כרגע</p>
            <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">בדוק שוב מאוחר יותר</p>
          </div>
        )}
      </div>
    </div>
  );
}
