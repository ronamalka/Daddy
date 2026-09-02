"use client";

import Link from "next/link";
import { ArrowLeft, Clock, MapPin } from "@phosphor-icons/react";
import { getServiceBySlug } from "@/lib/services";
import { relativeTimeHe } from "@/lib/request-teaser";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./section-header";
import type { RequestTeaser } from "./types";

interface OpenRequestsTeaserProps {
  teasers: RequestTeaser[];
  loading?: boolean;
  /** Signed-in sellers can open the full request; guests go to login. */
  canOpenDetail?: boolean;
  signedIn?: boolean;
  /** Homepage hides the block when there is nothing to show. `/requests` always renders. */
  alwaysShow?: boolean;
}

/** Public cards for recent OPEN requests: title, service, city, and relative age only. */
export function OpenRequestsTeaser({
  teasers,
  loading,
  canOpenDetail,
  signedIn,
  alwaysShow,
}: OpenRequestsTeaserProps) {
  if (!alwaysShow && !loading && teasers.length === 0) {
    return null;
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          title="בקשות פתוחות עכשיו"
          subtitle="כותרת, שירות ועיר בלבד — בלי כתובת, בלי תמונות, בלי שם. התחברו כדי להגיב או לפרסם."
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--color-border))] border-t-[rgb(var(--color-primary))]" />
          </div>
        ) : teasers.length === 0 ? (
          <p className="text-center text-sm text-[rgb(var(--color-text-secondary))]">
            אין כרגע בקשות פתוחות להצגה. התחברו או הירשמו כדי לפרסם אחת.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teasers.map((req) => {
              const svc = req.serviceSlug ? getServiceBySlug(req.serviceSlug) : null;
              const place = req.cityName || req.districtName;
              const href = canOpenDetail ? `/requests/${req.id}` : `/login?next=/requests/${req.id}`;
              return (
                <Link
                  key={req.id}
                  href={href}
                  className="group block rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 transition-shadow duration-200 hover:shadow-md hover:border-[rgba(var(--color-primary),0.3)]"
                >
                  <h3 className="text-base font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                    {req.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-text-muted))]">
                    {svc && <Badge variant="default" className="text-[10px]">{svc.nameHe}</Badge>}
                    {place && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {place}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeTimeHe(req.createdAt)}
                    </span>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[rgb(var(--color-primary))]">
                    {canOpenDetail ? "צפה בבקשה והגב" : "התחבר כדי להגיב"}
                    <ArrowLeft className="h-4 w-4" />
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {signedIn ? (
            <>
              <Link
                href="/requests"
                className="inline-flex items-center justify-center rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[rgb(var(--color-primary-hover))]"
              >
                לכל הבקשות
              </Link>
              <Link
                href="/requests/create"
                className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-6 py-3 text-sm font-bold text-[rgb(var(--color-text))] hover:border-[rgba(var(--color-primary),0.3)]"
              >
                פרסמו בקשה
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?next=/requests"
                className="inline-flex items-center justify-center rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[rgb(var(--color-primary-hover))]"
              >
                התחברו כדי להגיב להצעה
              </Link>
              <Link
                href="/register?next=/requests/create"
                className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-6 py-3 text-sm font-bold text-[rgb(var(--color-text))] hover:border-[rgba(var(--color-primary),0.3)]"
              >
                הירשמו כדי לפרסם בקשה
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
