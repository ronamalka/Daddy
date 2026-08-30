import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Scales, Buildings, CheckCircle, Wrench, FolderOpen, MapPin, Star, Target, Heart, UsersFour } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export const metadata: Metadata = {
  title: "על אבאל׳ה — כל אחד צריך אבא שיסדר",
  description: "כל אחד צריך אבא שיסדר. אנחנו פשוט בנינו אפליקציה בשביל זה. הסיפור, הערכים, והפילוסופיה של אבאל׳ה.",
  openGraph: {
    title: "על אבאל׳ה — כל אחד צריך אבא שיסדר",
    description: "הכל התחיל כשמישהו אמר ׳אבא, הברז מטפטף׳ ואבא אמר ׳שנייה, אני בא׳.",
  },
};

const VALUES: { title: string; desc: string; Icon: PhosphorIcon }[] = [
  { title: "אמינות", desc: "ביקורות אמיתיות, פרופילים שקופים, דירוגים שלא ניתן לעריכה. מה שאתה רואה — זה מה שאתה מקבל.", Icon: Handshake },
  { title: "הוגנות", desc: "ללא עמלות נסתרות, ללא דמי תיווך. האבאל׳ה מגדיר מחיר, אתה משלם את המחיר. נקודה.", Icon: Scales },
  { title: "קהילה", desc: "לא פלטפורמה — משפחה. אנשים עוזרים לאנשים, שכונה שכונה, עיר עיר.", Icon: Buildings },
  { title: "איכות", desc: "דירוג אמין עם 4 קריטריונים מבטיח שהטובים עולים למעלה. אין קיצורי דרך.", Icon: CheckCircle },
  { title: "משפחתיות", desc: "אנחנו לא סטארטאפ — אנחנו משפחה שגדלה. כל אבאל׳ה חדש הוא עוד דוד שמצטרף לשולחן.", Icon: Heart },
  { title: "כבוד", desc: "כל אבאל׳ה מגיע עם שנים של ניסיון וחיוך. תתייחס בהתאם — הוא מגיע לעזור, לא רק לעבוד.", Icon: UsersFour },
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
          <p className="mt-4 text-[18px] text-white/70">הכל התחיל כשמישהו אמר &quot;אבא, הברז מטפטף&quot; ואבא אמר &quot;שנייה, אני בא&quot;</p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 md:p-12">
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] mb-6">הרגע שהכל התחיל</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            <p>
              כל אחד מכיר את הרגע הזה. משהו נשבר בבית — ברז, ארון, חשבון שלא מסתדר. אתה שואל את גיסא של השכנה, מחפש בפייסבוק, ומקבל שלושה שמות שאף אחד לא עונה.
            </p>
            <p>
              ואז אתה נזכר: כשהיית ילד, אבא היה בא, מסתכל על הבעיה, אומר &quot;תן לי רגע&quot; — ופותר. בלי לעשות מזה עניין. בלי לגבות מחיר מופקע. פשוט כי הוא ידע, והוא רצה לעזור.
            </p>
            <p className="text-[rgb(var(--color-text))] font-semibold">
              אז חשבנו — למה שלא לתת לכל אחד גישה לאבאל׳ה כזה?
            </p>
            <p>
              ככה נולד אבאל׳ה. פלטפורמה שמחברת בין אנשים עם ידיים טובות ושנים של ניסיון — לבין אנשים שפשוט צריכים שמישהו יגיד &quot;שנייה, אני בא&quot;. בלי מתווכים, בלי עמלות, בלי הפתעות.
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

      {/* For Dads */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-gradient-to-br from-[rgb(var(--color-surface))] to-[rgba(var(--color-success),0.05)] p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="h-6 w-6 text-[rgb(var(--color-success))]" />
            <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))]">לאבות שקוראים את זה</h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            <p>
              הילדים גדלו. הבית שקט. אבל הידיים עדיין זוכרות. 30 שנות ניסיון לא נעלמות — הן מחכות למישהו שצריך אותן.
            </p>
            <p>
              להיות אבאל׳ה זה לא עבודה. זה להמשיך לעשות את מה שאתה תמיד עשית — לעזור. רק שעכשיו, במקום הילדים והשכנים, יש עוד אלפי אנשים שצריכים בדיוק את מה שאתה יודע.
            </p>
            <p className="text-[rgb(var(--color-text))] font-semibold">
              אתה לא מתחיל מחדש. אתה ממשיך.
            </p>
          </div>
          <Link href="/become-a-daddy" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-success))] px-6 py-3 text-[15px] font-bold text-white transition-all hover:bg-[rgb(var(--color-success))]/90 hover:-translate-y-0.5">
            הצטרף כאבאל׳ה
          </Link>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] mb-6 text-center">למה אבא ולא בעל מקצוע?</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))] text-center max-w-2xl mx-auto">
            <p>
              בעל מקצוע מתקן ויוצא. אבא מתקן, מסביר למה זה נשבר, ומלמד אותך איך למנוע את זה בפעם הבאה.
            </p>
            <p>
              בעל מקצוע גובה. אבא חושב עליך — ואומר לך אם אתה לא באמת צריך את זה.
            </p>
            <p className="text-[rgb(var(--color-text))] font-semibold">
              אבאל׳ה זה לא רק שירות — זה יחס.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">הערכים שלנו</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">רוצה להצטרף למשפחה?</h2>
          <p className="mt-3 text-[15px] text-[rgb(var(--color-text-secondary))]">בין אם אתה צריך אבאל׳ה או רוצה להיות אחד — יש לך מקום בשולחן</p>
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
