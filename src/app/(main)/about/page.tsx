import Link from "next/link";
import { Handshake, Scales, Buildings, CheckCircle, Wrench, FolderOpen, MapPin, Star, Target } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const VALUES: { title: string; desc: string; Icon: PhosphorIcon }[] = [
  { title: "אמינות", desc: "ביקורות אמיתיות, פרופילים שקופים, דירוגים שלא ניתן לעריכה. מה שאתה רואה — זה מה שאתה מקבל.", Icon: Handshake },
  { title: "הוגנות", desc: "ללא עמלות נסתרות, ללא דמי תיווך. האבאל׳ה מגדיר מחיר, אתה משלם את המחיר. נקודה.", Icon: Scales },
  { title: "קהילה", desc: "לא פלטפורמה — משפחה. אנשים עוזרים לאנשים, שכונה שכונה, עיר עיר.", Icon: Buildings },
  { title: "איכות", desc: "דירוג אמין עם 4 קריטריונים מבטיח שהטובים עולים למעלה. אין קיצורי דרך.", Icon: CheckCircle },
];

const STATS: { value: string; label: string; Icon: PhosphorIcon }[] = [
  { value: "38", label: "שירותים", Icon: Wrench },
  { value: "8", label: "קטגוריות", Icon: FolderOpen },
  { value: "7", label: "מחוזות", Icon: MapPin },
  { value: "4", label: "קריטריוני דירוג", Icon: Star },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-[rgba(var(--color-primary),0.3)] py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">על אבאל׳ה</h1>
          <p className="mt-4 text-[18px] text-white/70">הסיפור של הפלטפורמה שמחברת בין ידיים טובות לאנשים שצריכים עזרה</p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 md:p-12">
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] mb-6">למה בנינו את זה?</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            <p>
              כולנו מכירים את זה. הברז נוטף, המזגן לא עובד, הארון מאיקאה מחכה בקרטון כבר שבועיים. אז מה עושים? שואלים את גיסא של השכנה אם היא מכירה מישהו. או מחפשים בפייסבוק ומקווים לטוב.
            </p>
            <p>
              הבעיה? ה&quot;מישהו&quot; הזה תמיד עסוק, לא עונה, או גובה מחיר שלא שמעתם עליו מראש. ואין לכם שום דרך לדעת אם הוא באמת טוב — או שפשוט הוא היחיד שהגיסא הכירה.
            </p>
            <p className="text-[rgb(var(--color-text))] font-semibold">
              אז בנינו את אבאל׳ה.
            </p>
            <p>
              פלטפורמה שמחברת בין אנשים שיודעים לעשות דברים — אינסטלטורים, חשמלאים, מובילים, מרכיבי רהיטים, ועוד עשרות בעלי מקצוע — לבין אנשים שצריכים את העזרה שלהם. בלי מתווכים, בלי עמלות, בלי הפתעות.
            </p>
            <p>
              למה &quot;אבאל׳ה&quot;? כי אבא תמיד יודע לסדר. לא משנה מה נשבר — אבא בא, מסתכל, אומר &quot;תן לי רגע&quot;, ופותר את הבעיה. אנחנו רוצים לתת לכל אחד גישה לאבאל׳ה כזה, גם אם הוא לא בן משפחה.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary),0.1)] px-4 py-1.5 text-[13px] font-bold text-[rgb(var(--color-primary))] mb-6">
            <Target className="h-4 w-4" />
            המשימה שלנו
          </span>
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] md:text-[28px] max-w-2xl mx-auto">
            לחבר בין אנשים מיומנים לאנשים שצריכים עזרה — שכונה שכונה, עיר עיר, בכל הארץ
          </h2>
          <p className="mt-4 text-[15px] text-[rgb(var(--color-text-secondary))] max-w-xl mx-auto">
            אנחנו מאמינים שבכל שכונה יש אנשים מוכשרים שיכולים לעזור. הם פשוט צריכים דרך להתחבר לאנשים שמחפשים אותם. זה מה שאנחנו עושים.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">הערכים שלנו</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 flex justify-center text-[rgb(var(--color-primary))]">
                <item.Icon className="h-10 w-10" />
              </div>
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-2">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center text-white">
                <div className="mb-1 flex justify-center">
                  <stat.Icon className="h-7 w-7" />
                </div>
                <div className="text-[36px] font-extrabold">{stat.value}</div>
                <div className="text-[13px] text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">רוצה להיות חלק?</h2>
          <p className="mt-3 text-[15px] text-[rgb(var(--color-text-secondary))]">בין אם אתה מחפש עזרה או רוצה לעזור — יש לך מקום פה</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] transition-all hover:shadow-[0_8px_24px_rgba(var(--color-primary),0.4)] hover:-translate-y-0.5">
              הירשם עכשיו
            </Link>
            <Link href="/how-it-works" className="rounded-xl border-2 border-[rgb(var(--color-primary))] px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] transition-all hover:bg-[rgb(var(--color-primary))] hover:text-white">
              איך זה עובד?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
