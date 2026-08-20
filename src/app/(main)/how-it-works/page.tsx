"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass, Eye, DeviceMobile, Star, FileText, Envelope, Wrench, Trophy, ShoppingCart, CaretDown } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const BUYER_STEPS: { step: string; title: string; desc: string; Icon: PhosphorIcon }[] = [
  { step: "01", title: "ספר מה צריך", desc: "חפש שירות מתוך 38 אפשרויות, או פרסם בקשה חופשית. בלי טפסים ארוכים, בלי בירוקרטיה — פשוט כתוב מה אתה צריך.", Icon: MagnifyingGlass },
  { step: "02", title: "בחר אבאל׳ה", desc: "עיין בפרופילים, קרא ביקורות אמיתיות עם דירוג אמין (איכות, יחס, זמנים, מחיר), והשווה מחירים.", Icon: Eye },
  { step: "03", title: "תאם וסגור", desc: "שלח הודעה ישירות לאבאל׳ה, תאם זמן שנוח לשניכם, וסגור עסקה. בלי מתווכים.", Icon: DeviceMobile },
  { step: "04", title: "דרג ושתף", desc: "העבודה הסתיימה? תן ביקורת מפורטת ועזור לאחרים לבחור נכון. הדירוג שלך עוזר לכולם.", Icon: Star },
];

const DADDY_STEPS: { step: string; title: string; desc: string; Icon: PhosphorIcon }[] = [
  { step: "01", title: "צור פרופיל", desc: "הרשם בחינם, ספר מה אתה יודע לעשות, הגדר אזורי שירות ומחירים. תוך 5 דקות אתה באוויר.", Icon: FileText },
  { step: "02", title: "קבל פניות", desc: "לקוחות מחפשים שירותים באזור שלך — הם ימצאו אותך בחיפוש או ישלחו בקשה ישירה.", Icon: Envelope },
  { step: "03", title: "עשה את העבודה", desc: "תגיע בזמן, תעשה עבודה טובה, ותשאיר רושם. כמו אבא אמיתי — אמין, מקצועי, ועם חיוך.", Icon: Wrench },
  { step: "04", title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה = יותר הכנסה. המוניטין שלך הוא הנכס הכי חשוב.", Icon: Trophy },
];

const FAQ = [
  { q: "כמה עולה להשתמש באבאל׳ה?", a: "לקונים — חינם לגמרי. חפש, השווה, ושלח הודעות בלי לשלם שקל. לאבאל׳ות — ההרשמה חינם. אנחנו לא לוקחים עמלה מהעבודות שלך." },
  { q: "איך יוצרים קשר עם אבאל׳ה?", a: "דרך המערכת. נכנסים לפרופיל של האבאל׳ה, לוחצים ׳שלח הודעה׳, ומתאמים ישירות. אפשר גם לפרסם בקשת שירות ולתת לאבאל׳ות לפנות אליכם." },
  { q: "מה אם לא מרוצה מהשירות?", a: "קודם כל — דברו עם האבאל׳ה. רוב הבעיות נפתרות בשיחה. אם לא הצלחתם להגיע להסכמה, פנו אלינו דרך עמוד יצירת קשר ונעזור לתווך." },
  { q: "איך עובד הדירוג?", a: "כל ביקורת כוללת 4 קריטריונים נפרדים: איכות העבודה, היחס האישי, עמידה בזמנים, והוגנות המחיר. כל קריטריון מדורג מ-1 עד 10, כך שאתה יודע בדיוק מה לצפות." },
  { q: "האם אפשר לבטל הזמנה?", a: "כל עוד לא התחלתם — כן, בלי בעיה. אם העבודה כבר התחילה, תאמו ביטול ישירות מול האבאל׳ה. אנחנו ממליצים לתקשר כמה שיותר מוקדם." },
  { q: "איך אני יודע שהאבאל׳ה אמין?", a: "כל אבאל׳ה חשוף לביקורות ציבוריות של לקוחות קודמים. הדירוגים לא ניתנים לעריכה או מחיקה. בנוסף, הפרופיל מציג מספר עבודות שהושלמו ואזורי שירות." },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-[rgba(var(--color-primary),0.3)] py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">איך זה עובד?</h1>
          <p className="mt-4 text-[18px] text-white/70">תהליך פשוט לשני הצדדים — מי שצריך עזרה, ומי שיודע לתת אותה</p>
        </div>
      </section>

      {/* Buyers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary),0.1)] px-4 py-1.5 text-[13px] font-bold text-[rgb(var(--color-primary))] mb-4">
            <ShoppingCart className="h-4 w-4" />
            לקונים
          </span>
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">מחפש שירות? ככה זה עובד</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BUYER_STEPS.map((item, i) => (
            <div key={i} className="group relative rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(var(--color-primary),0.3)]">{item.step}</div>
              <div className="mb-3 text-[rgb(var(--color-primary))]">
                <item.Icon className="h-9 w-9" />
              </div>
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daddies */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-success),0.1)] px-4 py-1.5 text-[13px] font-bold text-[rgb(var(--color-success))] mb-4">
              <Wrench className="h-4 w-4" />
              לאבאל׳ות
            </span>
            <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">רוצה להציע שירותים? ככה מתחילים</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DADDY_STEPS.map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-success))] to-[rgb(var(--color-accent))] text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(var(--color-success),0.3)]">{item.step}</div>
                <div className="mb-3 text-[rgb(var(--color-success))]">
                  <item.Icon className="h-9 w-9" />
                </div>
                <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">שאלות נפוצות</h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">התשובות לשאלות שכולם שואלים</p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-right"
              >
                <span className="text-[15px] font-bold text-[rgb(var(--color-text))]">{item.q}</span>
                <CaretDown className={`h-5 w-5 text-[rgb(var(--color-primary))] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="border-t border-[rgb(var(--color-border))] px-5 pb-5 pt-3">
                  <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">מוכן להתחיל?</h2>
          <p className="mt-3 text-[16px] text-white/80">הצטרף לאלפי ישראלים שכבר מצאו את האבאל׳ה שלהם</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5">
              אני מחפש שירות
            </Link>
            <Link href="/become-a-daddy" className="rounded-xl border-2 border-white/40 px-8 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-white/10">
              אני רוצה להיות אבאל׳ה
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
