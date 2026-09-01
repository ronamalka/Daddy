import Link from "next/link";
import { LEGAL_CONTACTS } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "כללי קהילה ועבודות אסורות",
  description: "מה מותר ומה אסור באבאל׳ה — כדי להגן על משתמשים ולהקטין חשיפה משפטית.",
  path: "/guidelines",
});

const ALLOWED = [
  "הרכבת רהיטים, תליית מדפים ותמונות, כוונון דלתות וארונות.",
  "תיקונים קטנים שאינם דורשים רישיון (ידיות, צירים, סיליקון, נגיעות צבע).",
  "עזרה בהובלה ואריזה, סידור מחסן, כיסוח דשא וגינון בסיסי.",
  "עזרה במחשב, רשת ביתית בסיסית, והגדרת מכשירים — בלי פריצת מערכות.",
  "ליווי לסידורים, שטיפת רכב, החלפת גלגל והתנעה — בזהירות ובלי ייעוץ מקצועי מורשה.",
];

const FORBIDDEN = [
  "עבודות חשמל השמורות לחשמלאי מוסמך: לוחות, נקודות כוח, תשתית, חיבור קבוע לרשת.",
  "חיבור, ניתוק או תיקון מערכות גז בלי מתקין מוסמך.",
  "עבודות אינסטלציה של מערכת הבניין, ביוב או מים ראשיים בלי בעל מקצוע מורשה כשנדרש.",
  "ייעוץ או מכירת ביטוח בלי רישיון סוכן. ייעוץ משפטי, מס או פנסיוני בלי רישיון מתאים.",
  "שירות רפואי, טיפול, או כל עיסוק בריאותי מפוקח.",
  "עבודה בגובה / על גג בלי ציוד והסמכה כנדרש.",
  "פעילות פלילית, הונאה, הטרדה, פגיעה בקטינים, או תוכן בלתי חוקי.",
];

/** Shows what work is allowed and forbidden on the site. */
export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-surface-elevated))]">
      <section className="bg-gradient-to-br from-[rgb(var(--color-text))] via-[rgb(var(--color-text))] to-[rgba(var(--color-primary),0.2)] py-16 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[42px]">כללי קהילה</h1>
          <p className="mt-3 text-[15px] text-white/60">מה מותר, מה אסור, ומתי חייבים רישיון</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8">
          <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">למה זה קיים</h2>
          <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            אבאל׳ה מחברת בין אנשים. היא לא מעסיקה את נותני השירות ולא מבצעת את העבודה.
            כללים אלה מגנים על לקוחות, על ספקים ועל הפלטפורמה מפני עבודה בלתי חוקית או מסוכנת.
            פירוט משפטי מלא ב
            <Link href="/terms" className="font-semibold text-[rgb(var(--color-primary))] hover:underline">תנאי השימוש</Link>.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8">
          <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">מותר — עזרה ביתית שאינה מקצוע מפוקח</h2>
          <ul className="space-y-2">
            {ALLOWED.map((item) => (
              <li key={item} className="relative pr-4 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] before:absolute before:right-0 before:content-['•'] before:text-[rgb(var(--color-success))]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8">
          <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">אסור בלי רישיון בתוקף — וחלק אסור בכלל</h2>
          <ul className="space-y-2">
            {FORBIDDEN.map((item) => (
              <li key={item} className="relative pr-4 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] before:absolute before:right-0 before:content-['•'] before:text-[rgb(var(--color-error))]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8">
          <h2 className="mb-4 text-[18px] font-bold text-[rgb(var(--color-text))]">חובת הספק לפני תחילת עבודה</h2>
          <ul className="space-y-2 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            <li>להציג ללקוח רישיון אם העבודה טעונת רישיון.</li>
            <li>להחזיק ביטוח אחריות מתאים או לגלות שאין ביטוח.</li>
            <li>לסרב לעבודה שהוא אינו מוסמך לבצע.</li>
            <li>להנפיק חשבונית/קבלה ולדווח לרשויות המס בעצמו.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8">
          <h2 className="mb-3 text-[18px] font-bold text-[rgb(var(--color-text))]">דיווח</h2>
          <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            חשד לעבודה בלתי חוקית, הונאה או פגיעה:{" "}
            <a href={`mailto:${LEGAL_CONTACTS.abuse}`} className="font-semibold text-[rgb(var(--color-primary))] hover:underline" dir="ltr">
              {LEGAL_CONTACTS.abuse}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
