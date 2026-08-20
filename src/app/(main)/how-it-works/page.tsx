"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass, Eye, DeviceMobile, Star, FileText, Envelope, Wrench, Trophy, ShoppingCart, CaretDown } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const BUYER_STEPS: { step: string; title: string; desc: string; Icon: PhosphorIcon }[] = [
  { step: "01", title: "ספר מה נשבר", desc: "ספר לנו מה קרה — ברז עקשן, ארון שמסרב להתרכב, או חשבון שגורם לך לבכות. בלי טפסים, בלי בירוקרטיה.", Icon: MagnifyingGlass },
  { step: "02", title: "בחר אבאל׳ה", desc: "קרא ביקורות אמיתיות (לא חבר של חבר), השווה מחירים, ובחר את מי שמרגיש הכי ׳אבא׳.", Icon: Eye },
  { step: "03", title: "תאם וסגור", desc: "שלח הודעה, תאם זמן, וזהו. בלי מתווכים, בלי ׳נחזור אליך׳. כמו לתאם עם אבא — רק שפה הוא באמת מגיע.", Icon: DeviceMobile },
  { step: "04", title: "דרג ושתף", desc: "העבודה בוצעה? תן ביקורת. הדירוג שלך הוא הסיבה שהאבאל׳ה הבא יהיה אפילו יותר טוב.", Icon: Star },
];

const DADDY_STEPS: { step: string; title: string; desc: string; Icon: PhosphorIcon }[] = [
  { step: "01", title: "ספר מה אתה יודע", desc: "הרשם בחינם וספר מה אתה יודע לעשות. תאמין לנו — מישהו שם בחוץ צריך בדיוק את זה. תוך 5 דקות אתה באוויר.", Icon: FileText },
  { step: "02", title: "חכה שיתקשרו", desc: "לקוחות מחפשים באזור שלך — הם ימצאו אותך, ישלחו הודעה, ויגידו ׳אתה האבאל׳ה שלי׳. זה מחמיא, תתרגל.", Icon: Envelope },
  { step: "03", title: "תגיע ותסדר", desc: "תגיע בזמן, תעשה עבודה טובה, ותשאיר רושם. אם תספר גם בדיחה יבשה — בונוס.", Icon: Wrench },
  { step: "04", title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה = יותר כסף. פשוט ככה. המוניטין שלך עובד בשבילך גם כשאתה ישן.", Icon: Trophy },
];

const FAQ = [
  { q: "כמה עולה להשתמש באבאל׳ה?", a: "לקונים — חינם. בלי שקל, בלי ׳תשלום על הצגת טלפון׳, בלי קאצ׳. לאבאל׳ות — גם חינם. אנחנו לא לוקחים עמלה מהעבודות שלך." },
  { q: "איך יוצרים קשר עם אבאל׳ה?", a: "נכנסים לפרופיל, לוחצים ׳שלח הודעה׳, ומתאמים ישירות. אפשר גם לפרסם בקשה ולתת לאבאל׳ות לפנות אליכם. בלי מתווכים, בלי ׳נחזור אליך תוך 3 ימי עסקים׳." },
  { q: "מה אם לא מרוצה מהשירות?", a: "קודם כל — דברו עם האבאל׳ה. רוב הבעיות נפתרות בשיחה (כמו בחיים). אם לא הצלחתם — פנו אלינו ונעזור לתווך." },
  { q: "איך עובד הדירוג?", a: "4 קריטריונים: איכות, יחס, זמנים, מחיר. כל אחד מ-1 עד 10. ככה אתה יודע בדיוק מה אתה מקבל — ולא רק ׳5 כוכבים מדודה רחל׳." },
  { q: "אפשר לבטל?", a: "בטח. אנחנו לא הכבלים. כל עוד העבודה לא התחילה — ביטול חופשי. אם כבר התחילה, תאמו ישירות מול האבאל׳ה." },
  { q: "איך אני יודע שהאבאל׳ה אמין?", a: "ביקורות ציבוריות שלא ניתנות לעריכה או מחיקה. מספר עבודות שהושלמו. אזורי שירות. בקיצור — כל מה שצריך כדי להחליט בלי לשאול את השכנה." },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-[rgba(var(--color-primary),0.3)] py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">איך זה עובד?</h1>
          <p className="mt-4 text-[18px] text-white/70">פשוט כמו לבקש מאבא. רק שפה אתה גם בוחר איזה אבא.</p>
        </div>
      </section>

      {/* Buyers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary),0.1)] px-4 py-1.5 text-[13px] font-bold text-[rgb(var(--color-primary))] mb-4">
            <ShoppingCart className="h-4 w-4" />
            לקונים
          </span>
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">משהו נשבר? ארבעה צעדים וסידרנו</h2>
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
            <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">יש לך ידיים טובות? הגיע הזמן שישלמו לך על זה</h2>
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
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">השאלות שכולם שואלים — עם תשובות שבאמת עוזרות</p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden">
              <h3>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-hiw-${i}`}
                  className="flex w-full items-center justify-between p-5 text-right"
                >
                  <span className="text-[15px] font-bold text-[rgb(var(--color-text))]">{item.q}</span>
                  <CaretDown aria-hidden="true" className={`h-5 w-5 text-[rgb(var(--color-primary))] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
              </h3>
              {openFaq === i && (
                <div id={`faq-hiw-${i}`} role="region" aria-label={item.q} className="border-t border-[rgb(var(--color-border))] px-5 pb-5 pt-3">
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
          <h2 className="text-[28px] font-extrabold md:text-[32px]">נו, אז מה אומרים?</h2>
          <p className="mt-3 text-[16px] text-white/80">אלפי ישראלים כבר מצאו אבאל׳ה. אתה עדיין מנסה לבד?</p>
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
