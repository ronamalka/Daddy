"use client";

import Link from "next/link";

interface LegalConsentFieldsProps {
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  confirmedAge18: boolean;
  onConfirmedAge18Change: (value: boolean) => void;
  role: string;
  independentContractor: boolean;
  onIndependentContractorChange: (value: boolean) => void;
}

/** Checkboxes for terms, age 18+, and independent-contractor status on sign-up. */
export function LegalConsentFields({
  acceptedTerms,
  onAcceptedTermsChange,
  confirmedAge18,
  onConfirmedAge18Change,
  role,
  independentContractor,
  onIndependentContractorChange,
}: LegalConsentFieldsProps) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4">
      <legend className="px-1 text-[13px] font-semibold text-[rgb(var(--color-text))]">אישורים משפטיים</legend>
      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
        <input
          type="checkbox"
          required
          checked={acceptedTerms}
          onChange={(e) => onAcceptedTermsChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--color-primary))]"
        />
        <span>
          קראתי ואני מסכים/ה ל
          <Link href="/terms" target="_blank" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">תנאי השימוש</Link>
          {" "}ול
          <Link href="/privacy" target="_blank" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">מדיניות הפרטיות</Link>
          , כולל לכך שאבאל׳ה היא פלטפורמת תיווך בלבד ואינה נותנת את השירות בשטח.
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
        <input
          type="checkbox"
          required
          checked={confirmedAge18}
          onChange={(e) => onConfirmedAge18Change(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--color-primary))]"
        />
        <span>אני בן/בת 18 ומעלה, וכשיר/ה להתקשר בחוזה לפי דיני מדינת ישראל.</span>
      </label>
      {role === "SELLER" && (
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
          <input
            type="checkbox"
            required
            checked={independentContractor}
            onChange={(e) => onIndependentContractorChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--color-primary))]"
          />
          <span>
            אני מצהיר/ה שאני עוסק עצמאי (או אהיה כזה לפני מתן שירות), לא עובד/ת של אבאל׳ה,
            אחראי/ת למיסים ולביטוח לאומי שלי, ולא אבצע עבודה טעונת רישיון בלי רישיון בתוקף.
          </span>
        </label>
      )}
    </fieldset>
  );
}
