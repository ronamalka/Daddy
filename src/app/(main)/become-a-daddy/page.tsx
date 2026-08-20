import Link from "next/link";
import { Gift, Coins, Star, Clock, MapPin, Sparkle, FileText, GearSix, Rocket, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const BENEFITS: { title: string; desc: string; Icon: PhosphorIcon }[] = [
  { title: "שמור על הקצב", desc: "פרישה לא אומרת לשבת בבית. תשאיר את הידיים עסוקות, את הראש חד, ואת הארנק מרוצה.", Icon: Gift },
  { title: "אתה קובע הכל", desc: "מתי, איפה, כמה, ובכמה. בלי בוס, בלי משמרות. אתה האבא של העסק שלך.", Icon: Coins },
  { title: "תעשה מה שאתה אוהב", desc: "30 שנה תיקנת כי היית חייב. עכשיו תתקן כי אתה רוצה — ותקבל על זה תודה (וכסף).", Icon: Star },
  { title: "לקוחות מהשכונה", desc: "אנשים מהאזור שלך צריכים בדיוק את מה שאתה יודע. בלי נסיעות ארוכות, בלי פקקים.", Icon: MapPin },
  { title: "תלמד את הדור הבא", desc: "הלקוח שלך בן 28 ולא יודע מה זה מפתח אלן. תראה לו. תלמד אותו. תרוויח מזה.", Icon: Clock },
  { title: "פשוט כמו שיחת טלפון", desc: "פרופיל, הודעות, ביקורות. בלי אפליקציות מסובכות. אם אתה יודע לשלוח וואטסאפ — אתה יודע להשתמש באבאל׳ה.", Icon: Sparkle },
];

const STEPS: { step: string; title: string; desc: string; Icon: PhosphorIcon; color: string }[] = [
  { step: "01", title: "ספר מה אתה יודע", desc: "הרשם עם אימייל וספר על עצמך. 30 שנות ניסיון? תכתוב את זה. לקוחות אוהבים לדעת שמגיע אליהם מישהו שעשה את זה אלף פעם.", Icon: FileText, color: "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]" },
  { step: "02", title: "הגדר שירותים", desc: "בחר מה אתה עושה — אינסטלציה, חשמל, הובלות, או כל דבר אחר שאתה טוב בו. הגדר מחירים שמתאימים לך.", Icon: GearSix, color: "from-[rgb(var(--color-success))] to-[rgb(var(--color-accent))]" },
  { step: "03", title: "תתחיל לקבל טלפונים", desc: "לקוחות מהאזור שלך ימצאו אותך וישלחו הודעות. תגיע, תסדר, ותרוויח. כמו פעם, רק עם יותר ׳תודה רבה׳.", Icon: Rocket, color: "from-[rgb(var(--color-accent-yellow))] to-[rgb(var(--color-error))]" },
];

const TESTIMONIALS = [
  { name: "משה כהן, 62", city: "באר שבע", service: "אינסטלציה", text: "פרשתי מחברת החשמל לפני שנתיים. ישבתי בבית, השתגעתי. עכשיו אני עושה 3-4 עבודות בשבוע ומרגיש שוב שימושי. והנכדים חושבים שאני גיבור.", rating: 5 },
  { name: "יוסי לוי, 58", city: "חיפה", service: "חשמל", text: "הילדים עפו מהבית, הבית שקט מדי. התחלתי לתקן דברים לשכנים, ואז נרשמתי לאבאל׳ה. הטלפון לא מפסיק. אני שוב מרגיש שצריכים אותי.", rating: 5 },
  { name: "אבי ישראלי, 55", city: "תל אביב", service: "הרכבת רהיטים", text: "30 שנה בנגרות. אמרו לי ׳תנוח, מגיע לך׳. אבל מה אני אעשה — אשב מול הטלוויזיה? עכשיו אני מרכיב ארונות לזוגות צעירים, ותמיד יוצא עם בדיחה טובה.", rating: 5 },
];

export default function BecomeADaddyPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-[rgba(var(--color-success),0.3)] py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-bold text-[rgb(var(--color-accent))] mb-6">
            <Wrench className="h-4 w-4" />
            הצטרף למשפחה
          </span>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">הפוך לאבאל׳ה</h1>
          <p className="mt-4 text-[18px] text-white/70 max-w-2xl mx-auto">
            הילדים גדלו, יש לך 30 שנות ניסיון, והידיים עדיין זוכרות הכל. הגיע הזמן שמישהו ייהנה מזה — ושאתה תרוויח מזה.
          </p>
          <Link href="/register" className="mt-8 inline-block rounded-xl bg-gradient-to-r from-[rgb(var(--color-success))] to-[rgb(var(--color-accent))] px-8 py-4 text-[16px] font-bold text-white shadow-[0_4px_16px_rgba(var(--color-success),0.3)] transition-all hover:shadow-[0_8px_24px_rgba(var(--color-success),0.4)] hover:-translate-y-0.5">
            הירשם עכשיו — בחינם
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">למה שווה להצטרף?</h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">כי יש דברים שרק ניסיון של שנים יודע לפתור</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))] transition-colors group-hover:bg-gradient-to-br group-hover:from-[rgb(var(--color-success))] group-hover:to-[rgb(var(--color-accent))] group-hover:text-white">
                <item.Icon className="h-7 w-7" />
              </div>
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
              <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to start */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">איך מתחילים?</h2>
            <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">שלושה צעדים ואתה באוויר</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] p-7 text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                  <item.Icon className="h-8 w-8" />
                </div>
                <div className="text-[11px] font-extrabold text-[rgb(var(--color-text-muted))] mb-2">שלב {item.step}</div>
                <h3 className="text-[18px] font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">אבאל׳ות מספרים</h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">אבות שחזרו למשחק — ולא מתכוונים לעצור</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-2xl bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-md)] border border-[rgb(var(--color-border))]/60">
              <div className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-accent))] text-[14px] font-bold text-white shadow-sm">&ldquo;</div>
              <div className="flex gap-0.5 mb-3 mt-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-[rgb(var(--color-accent-yellow))] " weight="fill" />
                ))}
              </div>
              <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text))] mb-4">{t.text}</p>
              <div className="flex items-center justify-between border-t border-[rgb(var(--color-border))] pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-success))] to-[rgb(var(--color-accent))] text-[12px] font-bold text-white">{t.name[0]}</div>
                  <div>
                    <span className="text-[13px] font-semibold text-[rgb(var(--color-text))]">{t.name}</span>
                    <span className="text-[11px] text-[rgb(var(--color-text-muted))] mr-1">· {t.city}</span>
                  </div>
                </div>
                <span className="rounded-full bg-[rgba(var(--color-success),0.1)] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--color-success))]">{t.service}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[rgb(var(--color-success))] to-[rgb(var(--color-accent))] py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">הידיים שלך עוד זוכרות</h2>
          <p className="mt-3 text-[16px] text-white/80">הגיע הזמן שמישהו ייהנה מזה. הרשמה בדקה, בלי עלות, בלי התחייבות.</p>
          <Link href="/register" className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-[16px] font-bold text-[rgb(var(--color-success))] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5">
            הירשם כאבאל׳ה עכשיו
          </Link>
        </div>
      </section>
    </div>
  );
}
