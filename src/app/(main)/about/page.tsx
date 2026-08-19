import Link from "next/link";

const VALUES = [
  { title: "אמינות", desc: "ביקורות אמיתיות, פרופילים שקופים, דירוגים שלא ניתן לעריכה. מה שאתה רואה — זה מה שאתה מקבל.", icon: "🤝" },
  { title: "הוגנות", desc: "ללא עמלות נסתרות, ללא דמי תיווך. האבאל׳ה מגדיר מחיר, אתה משלם את המחיר. נקודה.", icon: "⚖️" },
  { title: "קהילה", desc: "לא פלטפורמה — משפחה. אנשים עוזרים לאנשים, שכונה שכונה, עיר עיר.", icon: "🏘️" },
  { title: "איכות", desc: "דירוג אמין עם 4 קריטריונים מבטיח שהטובים עולים למעלה. אין קיצורי דרך.", icon: "✅" },
];

const STATS = [
  { value: "38", label: "שירותים", icon: "🛠️" },
  { value: "8", label: "קטגוריות", icon: "📂" },
  { value: "7", label: "מחוזות", icon: "📍" },
  { value: "4", label: "קריטריוני דירוג", icon: "⭐" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D3436] via-[#2D3436] to-[#6C5CE7]/30 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">על אבאל׳ה</h1>
          <p className="mt-4 text-[18px] text-white/70">הסיפור של הפלטפורמה שמחברת בין ידיים טובות לאנשים שצריכים עזרה</p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[#E8ECF1] bg-white p-8 md:p-12">
          <h2 className="text-[24px] font-extrabold text-[#2D3436] mb-6">למה בנינו את זה?</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[#636E72]">
            <p>
              כולנו מכירים את זה. הברז נוטף, המזגן לא עובד, הארון מאיקאה מחכה בקרטון כבר שבועיים. אז מה עושים? שואלים את גיסא של השכנה אם היא מכירה מישהו. או מחפשים בפייסבוק ומקווים לטוב.
            </p>
            <p>
              הבעיה? ה&quot;מישהו&quot; הזה תמיד עסוק, לא עונה, או גובה מחיר שלא שמעתם עליו מראש. ואין לכם שום דרך לדעת אם הוא באמת טוב — או שפשוט הוא היחיד שהגיסא הכירה.
            </p>
            <p className="text-[#2D3436] font-semibold">
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
      <section className="bg-[#F8F7FF] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full bg-[#F0EEFF] px-4 py-1.5 text-[13px] font-bold text-[#6C5CE7] mb-6">🎯 המשימה שלנו</span>
          <h2 className="text-[24px] font-extrabold text-[#2D3436] md:text-[28px] max-w-2xl mx-auto">
            לחבר בין אנשים מיומנים לאנשים שצריכים עזרה — שכונה שכונה, עיר עיר, בכל הארץ
          </h2>
          <p className="mt-4 text-[15px] text-[#636E72] max-w-xl mx-auto">
            אנחנו מאמינים שבכל שכונה יש אנשים מוכשרים שיכולים לעזור. הם פשוט צריכים דרך להתחבר לאנשים שמחפשים אותם. זה מה שאנחנו עושים.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">הערכים שלנו</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-[#E8ECF1] bg-white p-6 text-center transition-all hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)] hover:-translate-y-1">
              <span className="text-[40px] block mb-4">{item.icon}</span>
              <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#636E72]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center text-white">
                <span className="text-[28px] block mb-1">{stat.icon}</span>
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
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">רוצה להיות חלק?</h2>
          <p className="mt-3 text-[15px] text-[#636E72]">בין אם אתה מחפש עזרה או רוצה לעזור — יש לך מקום פה</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(108,92,231,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(108,92,231,0.4)] hover:-translate-y-0.5">
              הירשם עכשיו
            </Link>
            <Link href="/how-it-works" className="rounded-xl border-2 border-[#6C5CE7] px-8 py-3.5 text-[15px] font-bold text-[#6C5CE7] transition-all hover:bg-[#6C5CE7] hover:text-white">
              איך זה עובד?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
