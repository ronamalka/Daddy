"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Wrench, CalendarBlank, FileText, CheckCircle, Lock } from "@phosphor-icons/react";

interface MaintenancePlan {
  id: string;
  planType: string;
  priceMonthly: number;
  status: string;
  nextVisitAt: string | null;
  startedAt: string;
  visits: MaintenanceVisit[];
}

interface MaintenanceVisit {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  report: string | null;
}

const PLAN_FEATURES = [
  "ביקור תחזוקה רבעוני (2 שעות)",
  "בעל מקצוע מאומת",
  "דוח ביקור מפורט",
  "תיאום מראש",
  "ביטול בכל עת",
];

/** Landing page for maintenance plan subscriptions. */
export default function MaintenancePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/maintenance")
      .then((r) => {
        if (r.status === 404) return null;
        return r.json();
      })
      .then((data) => {
        if (data && data.id) setPlan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  async function handleSubscribe() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setSubscribing(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "BASIC" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה בהרשמה לתוכנית";
        setError(msg);
        return;
      }
      setPlan(data);
    } catch {
      setError("שגיאה בהרשמה לתוכנית");
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold">
            <Wrench className="h-4 w-4" />
            תוכנית תחזוקה
          </div>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">הבית שלך, תמיד מטופל</h1>
          <p className="mt-4 text-[18px] text-white/70">
            ביקור תחזוקה רבעוני מבעל מקצוע מאומת. בלי להתקשר, בלי לחפש, בלי לשכוח.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Active plan card */}
        {plan && plan.status === "ACTIVE" ? (
          <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-[rgba(var(--color-success),0.1)] p-3">
                <CheckCircle className="h-6 w-6 text-[rgb(var(--color-success))]" weight="fill" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">התוכנית שלך פעילה</h2>
                <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
                  תוכנית {plan.planType === "BASIC" ? "בסיסית" : plan.planType} - {plan.priceMonthly}₪/חודש
                </p>
              </div>
            </div>

            {plan.nextVisitAt && (
              <div className="mb-6 rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4">
                <div className="flex items-center gap-2 text-[14px] text-[rgb(var(--color-text-secondary))]">
                  <CalendarBlank className="h-5 w-5 text-[rgb(var(--color-primary))]" />
                  <span className="font-semibold text-[rgb(var(--color-text))]">ביקור הבא:</span>
                  {new Date(plan.nextVisitAt).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            )}

            <Link
              href="/profile/maintenance"
              className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))]"
            >
              צפה בפרטי התוכנית
            </Link>
          </div>
        ) : (
          <>
            {/* Plan card */}
            <div className="rounded-2xl border-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface))] overflow-hidden shadow-md">
              <div className="bg-primary px-8 py-5">
                <h2 className="text-[20px] font-bold text-white">תוכנית בסיסית</h2>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[36px] font-extrabold text-white">99₪</span>
                  <span className="text-[16px] text-white/80">/חודש</span>
                </div>
              </div>

              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-[rgb(var(--color-success))]" weight="fill" />
                      <span className="text-[15px] text-[rgb(var(--color-text))]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {error && (
                  <div className="mb-4 rounded-xl bg-[rgba(var(--color-error),0.1)] border border-[rgba(var(--color-error),0.2)] px-4 py-3 text-[14px] text-[rgb(var(--color-error))]">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[16px] font-bold text-white shadow-md transition-all hover:bg-[rgb(var(--color-primary-hover))]  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribing ? "מעבד..." : "הרשם לתוכנית"}
                </button>

                {!session?.user && (
                  <p className="mt-3 text-center text-[13px] text-[rgb(var(--color-text-muted))] flex items-center justify-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    יש להתחבר כדי להירשם
                  </p>
                )}
              </div>
            </div>

            {/* Cancelled plan note */}
            {plan && plan.status === "CANCELLED" && (
              <div className="mt-6 rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-4 text-center">
                <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
                  תוכנית קודמת בוטלה ב-{new Date(plan.startedAt).toLocaleDateString("he-IL")}. ניתן להירשם מחדש.
                </p>
              </div>
            )}
          </>
        )}

        {/* Benefits section */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-primary),0.1)]">
              <ShieldCheck className="h-7 w-7 text-[rgb(var(--color-primary))]" />
            </div>
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">בעלי מקצוע מאומתים</h3>
            <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
              כל אבאל׳ה עובר תהליך אימות. שקט נפשי מובטח.
            </p>
          </div>

          <div className="rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-accent),0.1)]">
              <CalendarBlank className="h-7 w-7 text-[rgb(var(--color-accent))]" />
            </div>
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">תיאום אוטומטי</h3>
            <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
              ביקורים מתוזמנים כל 90 יום. בלי להתקשר, בלי לזכור.
            </p>
          </div>

          <div className="rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-success),0.1)]">
              <FileText className="h-7 w-7 text-[rgb(var(--color-success))]" />
            </div>
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">דוח מפורט</h3>
            <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
              אחרי כל ביקור תקבלו דוח מפורט עם תמונות.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
