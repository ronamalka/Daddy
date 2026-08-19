"use client";

import Link from "next/link";
import { useState } from "react";

const BUYER_STEPS = [
  { step: "01", title: "ספר מה צריך", desc: "חפש שירות מתוך 38 אפשרויות, או פרסם בקשה חופשית. בלי טפסים ארוכים, בלי בירוקרטיה — פשוט כתוב מה אתה צריך.", icon: "🔍" },
  { step: "02", title: "בחר אבאל׳ה", desc: "עיין בפרופילים, קרא ביקורות אמיתיות עם דירוג אמין (איכות, יחס, זמנים, מחיר), והשווה מחירים.", icon: "👀" },
  { step: "03", title: "תאם וסגור", desc: "שלח הודעה ישירות לאבאל׳ה, תאם זמן שנוח לשניכם, וסגור עסקה. בלי מתווכים.", icon: "📱" },
  { step: "04", title: "דרג ושתף", desc: "העבודה הסתיימה? תן ביקורת מפורטת ועזור לאחרים לבחור נכון. הדירוג שלך עוזר לכולם.", icon: "⭐" },
];

const DADDY_STEPS = [
  { step: "01", title: "צור פרופיל", desc: "הרשם בחינם, ספר מה אתה יודע לעשות, הגדר אזורי שירות ומחירים. תוך 5 דקות אתה באוויר.", icon: "📝" },
  { step: "02", title: "קבל פניות", desc: "לקוחות מחפשים שירותים באזור שלך — הם ימצאו אותך בחיפוש או ישלחו בקשה ישירה.", icon: "📩" },
  { step: "03", title: "עשה את העבודה", desc: "תגיע בזמן, תעשה עבודה טובה, ותשאיר רושם. כמו אבא אמיתי — אמין, מקצועי, ועם חיוך.", icon: "🔧" },
  { step: "04", title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה = יותר הכנסה. המוניטין שלך הוא הנכס הכי חשוב.", icon: "🏆" },
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
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D3436] via-[#2D3436] to-[#6C5CE7]/30 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">איך זה עובד?</h1>
          <p className="mt-4 text-[18px] text-white/70">תהליך פשוט לשני הצדדים — מי שצריך עזרה, ומי שיודע לתת אותה</p>
        </div>
      </section>

      {/* Buyers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-[#F0EEFF] px-4 py-1.5 text-[13px] font-bold text-[#6C5CE7] mb-4">🛒 לקונים</span>
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">מחפש שירות? ככה זה עובד</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BUYER_STEPS.map((item, i) => (
            <div key={i} className="group relative rounded-2xl bg-white border border-[#E8ECF1] p-6 transition-all hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)] hover:-translate-y-1">
              <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(108,92,231,0.3)]">{item.step}</div>
              <span className="text-[36px] block mb-3">{item.icon}</span>
              <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#636E72]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daddies */}
      <section className="bg-[#F8F7FF] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-[#E8F8F8] px-4 py-1.5 text-[13px] font-bold text-[#00B894] mb-4">🔧 לאבאל׳ות</span>
            <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">רוצה להציע שירותים? ככה מתחילים</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DADDY_STEPS.map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-white border border-[#E8ECF1] p-6 transition-all hover:shadow-[0_8px_30px_rgba(0,184,148,0.1)] hover:-translate-y-1">
                <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00B894] to-[#00D2D3] text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(0,184,148,0.3)]">{item.step}</div>
                <span className="text-[36px] block mb-3">{item.icon}</span>
                <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#636E72]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">שאלות נפוצות</h2>
          <p className="mt-2 text-[15px] text-[#636E72]">התשובות לשאלות שכולם שואלים</p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-right"
              >
                <span className="text-[15px] font-bold text-[#2D3436]">{item.q}</span>
                <svg className={`h-5 w-5 text-[#6C5CE7] transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="border-t border-[#E8ECF1] px-5 pb-5 pt-3">
                  <p className="text-[14px] leading-relaxed text-[#636E72]">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">מוכן להתחיל?</h2>
          <p className="mt-3 text-[16px] text-white/80">הצטרף לאלפי ישראלים שכבר מצאו את האבאל׳ה שלהם</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[#6C5CE7] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5">
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
