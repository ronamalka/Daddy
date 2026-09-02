"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Check, X, Crown, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

interface SubscriptionData {
  tier: string;
  startedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  price: number;
  benefits: string[];
  allBenefits: { free: string[]; premium: string[] };
}

const PREMIUM_PRICE = 79;

/** Subscription management page for sellers. */
export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSub(data);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "SELLER") {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [session?.user?.role, fetchSubscription]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בעמוד זה.</p>
      </div>
    );
  }

  if (session.user.role !== "SELLER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">עמוד זה זמין לבעלי מקצוע בלבד.</p>
        <button
          onClick={() => router.push("/profile")}
          className="mt-4 text-[rgb(var(--color-primary))] hover:underline"
        >
          חזרה לפרופיל
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-[rgb(var(--color-border-light))]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 rounded-2xl bg-[rgb(var(--color-border-light))]" />
            <div className="h-96 rounded-2xl bg-[rgb(var(--color-border-light))]" />
          </div>
        </div>
      </div>
    );
  }

  const isPremium = sub?.tier === "PREMIUM" && sub?.isActive;

  async function handleAction(action: "subscribe" | "cancel" | "renew") {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/subscription/${action}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await fetchSubscription();
      } else {
        setMessage({ text: data.error || "שגיאה בביצוע הפעולה", type: "error" });
      }
    } catch {
      setMessage({ text: "שגיאה בביצוע הפעולה", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const freeBenefits = sub?.allBenefits?.free ?? [
    "הצגה בתוצאות חיפוש",
    "קבלת הזמנות",
    "צ'אט עם לקוחות",
  ];

  const premiumBenefits = sub?.allBenefits?.premium ?? [
    "מיקום מועדף בתוצאות חיפוש",
    "גישה מוקדמת להזמנות חדשות",
    "תג בעל מקצוע מוביל",
    "עמלה מופחתת",
    "חשבוניות אוטומטיות",
    "ניתוח ביצועים",
    "תמיכה בעדיפות",
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/profile"
          className="rounded-full border border-[rgb(var(--color-border))] p-2 hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">מנוי פרימיום</h1>
          <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">שדרג את הפרופיל שלך וקבל יותר לקוחות</p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 text-[14px] font-medium ${
            message.type === "success"
              ? "bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]"
              : "bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div
          className={`relative rounded-2xl border p-6 transition-all ${
            !isPremium
              ? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface))] shadow-md"
              : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
          }`}
        >
          {!isPremium && (
            <div className="absolute -top-3 right-6 rounded-full bg-[rgb(var(--color-primary))] px-3 py-0.5 text-[12px] font-semibold text-white">
              המנוי הנוכחי
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">חינמי</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[32px] font-bold text-[rgb(var(--color-text))]">0</span>
              <span className="text-[16px] text-[rgb(var(--color-text-secondary))]">&#8362;/חודש</span>
            </div>
          </div>
          <ul className="space-y-3">
            {freeBenefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[14px] text-[rgb(var(--color-text))]">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(var(--color-success))]" weight="bold" />
                {b}
              </li>
            ))}
            {premiumBenefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[14px] text-[rgb(var(--color-text-muted))]">
                <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(var(--color-text-muted))]" weight="bold" />
                <span className="line-through">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Tier */}
        <div
          className={`relative rounded-2xl border p-6 transition-all ${
            isPremium
              ? "border-[rgb(var(--color-accent-yellow))] bg-[rgb(var(--color-surface))] shadow-md"
              : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent-yellow))] hover:shadow-md"
          }`}
        >
          {isPremium && (
            <div className="absolute -top-3 right-6 rounded-full bg-accent-yellow px-3 py-0.5 text-[12px] font-semibold text-white">
              המנוי הנוכחי
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-[rgb(var(--color-accent-yellow))]" weight="fill" />
              <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">פרימיום</h2>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[32px] font-bold text-[rgb(var(--color-accent-yellow))]">{PREMIUM_PRICE}</span>
              <span className="text-[16px] text-[rgb(var(--color-text-secondary))]">&#8362;/חודש</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {freeBenefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[14px] text-[rgb(var(--color-text))]">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(var(--color-success))]" weight="bold" />
                {b}
              </li>
            ))}
            {premiumBenefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[14px] text-[rgb(var(--color-text))]">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(var(--color-accent-yellow))]" weight="bold" />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>

          {isPremium && sub?.expiresAt && (
            <div className="mb-4 rounded-xl bg-[rgba(var(--color-accent-yellow),0.08)] p-3 text-[13px] text-[rgb(var(--color-text-secondary))]">
              המנוי פעיל עד{" "}
              <span className="font-semibold text-[rgb(var(--color-text))]">
                {new Date(sub.expiresAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {!isPremium && (
              <button
                onClick={() => handleAction("subscribe")}
                disabled={actionLoading}
                className="w-full rounded-xl bg-accent-yellow py-3 text-[15px] font-bold text-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {actionLoading ? "מעבד..." : "שדרג לפרימיום"}
              </button>
            )}
            {isPremium && (
              <>
                <button
                  onClick={() => handleAction("renew")}
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-accent-yellow py-3 text-[15px] font-bold text-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {actionLoading ? "מעבד..." : "חדש מנוי"}
                </button>
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading}
                  className="w-full rounded-xl border border-[rgb(var(--color-border))] py-3 text-[15px] font-medium text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-error))] hover:text-[rgb(var(--color-error))] transition-all disabled:opacity-50"
                >
                  {actionLoading ? "מעבד..." : "בטל מנוי"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
