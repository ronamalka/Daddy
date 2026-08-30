import Link from "next/link";

interface MarketplaceDisclaimerProps {
  compact?: boolean;
}

export function MarketplaceDisclaimer({ compact = false }: MarketplaceDisclaimerProps) {
  if (compact) {
    return (
      <p className="text-[11px] leading-relaxed text-[rgb(var(--color-text-muted))]">
        אבאל׳ה מחברת בין צדדים ואינה נותנת את השירות, אינה מבטחת אותו ואינה אחראית לביצועו.{" "}
        <Link href="/terms" className="underline hover:text-[rgb(var(--color-primary))]">תנאי שימוש</Link>
      </p>
    );
  }

  return (
    <aside className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
      <p className="font-semibold text-[rgb(var(--color-text))]">אבאל׳ה היא פלטפורמת תיווך</p>
      <p className="mt-1">
        נותן השירות הוא האבאל׳ה שבחרתם, לא החברה שמפעילה את האתר. האיכות, הבטיחות,
        הרישיונות והביטוח הם בין הלקוח לנותן השירות. התשלום עובר בפלטפורמה: מחיר האבאל׳ה
        פלוס דמי שירות. עבודות חשמל, גז, ביטוח וייעוץ מקצועי מורשה
        אסורות בלי רישיון בתוקף. פירוט ב
        <Link href="/terms" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">תנאי השימוש</Link>
        {" "}וב
        <Link href="/guidelines" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">כללי הקהילה</Link>.
      </p>
    </aside>
  );
}
