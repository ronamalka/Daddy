"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wrench } from "@phosphor-icons/react";
import { ProfileProgress } from "@/components/profile-progress";
import { LegalConsentFields } from "@/components/legal-consent-fields";
import type { ProfileReadinessResponse } from "@/lib/seller-ready";

/** Daddy onboarding checklist: register as seller, then finish items until searchable. */
export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [readiness, setReadiness] = useState<ProfileReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAge18, setConfirmedAge18] = useState(false);
  const [independentContractor, setIndependentContractor] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/register?role=SELLER&next=/onboarding");
      return;
    }
    let cancelled = false;
    fetch("/api/profile/readiness")
      .then((res) => {
        if (!res.ok) throw new Error("readiness");
        return res.json();
      })
      .then((data: ProfileReadinessResponse) => {
        if (!cancelled) setReadiness(data);
      })
      .catch(() => {
        if (!cancelled) setError("לא ניתן לטעון את מצב הפרופיל");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, status, router]);

  /** Turns a buyer into a seller after the independent-contractor confirmation. */
  async function handleBecomeSeller() {
    if (!acceptedTerms || !confirmedAge18) {
      setError("יש לאשר את תנאי השימוש ומדיניות הפרטיות, ולאשר שאתה מעל גיל 18.");
      return;
    }
    if (!independentContractor) {
      setError("נותן שירות חייב לאשר שהוא עצמאי ושלא יבצע עבודה טעונת רישיון בלי רישיון.");
      return;
    }
    setConverting(true);
    setError("");
    try {
      const res = await fetch("/api/profile/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ independentContractor: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "לא ניתן להפוך לאבאל׳ה");
        return;
      }
      await update({ role: "SELLER" });
      const readyRes = await fetch("/api/profile/readiness");
      if (readyRes.ok) {
        setReadiness(await readyRes.json());
      }
    } catch {
      setError("לא ניתן להפוך לאבאל׳ה");
    } finally {
      setConverting(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const role = readiness?.role || session.user.role;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-success),0.12)] px-3 py-1 text-[12px] font-bold text-[rgb(var(--color-success))]">
          <Wrench className="h-4 w-4" />
          הצ׳קליסט של אבאל׳ה
        </span>
        <h1 className="mt-3 text-[28px] font-extrabold text-[rgb(var(--color-text))]">מוכן לקבל עבודות?</h1>
        <p className="mt-2 text-[14px] text-[rgb(var(--color-text-secondary))]">
          לא מופיעים בחיפוש עד שיש מחיר, אזור, זמינות, טלפון ותמונה. בלי הפתעות בחשבון.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-error))]">
          {error}
        </div>
      )}

      {role === "ADMIN" && (
        <p className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 text-[14px] text-[rgb(var(--color-text-secondary))]">
          חשבון מנהל לא עובר צ׳קליסט אבאל׳ה.
        </p>
      )}

      {role === "BUYER" && (
        <div className="space-y-5 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            יש לך כבר חשבון. אשר שאתה עצמאי — ואז נשלים יחד את הפרופיל עד שיהיה אפשר למצוא אותך.
          </p>
          <LegalConsentFields
            acceptedTerms={acceptedTerms}
            onAcceptedTermsChange={setAcceptedTerms}
            confirmedAge18={confirmedAge18}
            onConfirmedAge18Change={setConfirmedAge18}
            role="SELLER"
            independentContractor={independentContractor}
            onIndependentContractorChange={setIndependentContractor}
          />
          <button
            type="button"
            onClick={handleBecomeSeller}
            disabled={converting}
            className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50"
          >
            {converting ? "מעדכן..." : "הפוך לאבאל׳ה"}
          </button>
        </div>
      )}

      {role === "SELLER" && readiness && (
        <div className="space-y-5">
          <ProfileProgress readiness={readiness} />
          {readiness.complete && (
            <Link
              href="/"
              className="block rounded-xl bg-[rgb(var(--color-success))] py-3.5 text-center text-[15px] font-bold text-white"
            >
              יוצאים לחפש עבודות
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
