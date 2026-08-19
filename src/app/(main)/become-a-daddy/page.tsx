import Link from "next/link";

const BENEFITS = [
  { title: "הרשמה חינם", desc: "אין דמי הצטרפות, אין מנויים חודשיים. נרשמת, מתחיל לעבוד.", icon: "🆓" },
  { title: "אתה קובע מחיר", desc: "אין לנו מחירון. אתה מגדיר כמה אתה גובה — לפי שעה, לפי פרויקט, לפי מה שמתאים לך.", icon: "💰" },
  { title: "בנה מוניטין", desc: "כל עבודה טובה = ביקורת טובה = יותר לקוחות. המוניטין שלך נשאר איתך.", icon: "⭐" },
  { title: "גמישות מלאה", desc: "עובד מתי שאתה רוצה, איפה שאתה רוצה, כמה שאתה רוצה. בלי בוס, בלי משמרות.", icon: "🕐" },
  { title: "לקוחות מהשכונה", desc: "אנשים מהאזור שלך מחפשים בדיוק את מה שאתה יודע לעשות. בלי נסיעות מיותרות.", icon: "📍" },
  { title: "פלטפורמה פשוטה", desc: "פרופיל, הודעות, ביקורות. בלי אפליקציות מסובכות, בלי הכשרות חובה. פשוט עובד.", icon: "✨" },
];

const STEPS = [
  { step: "01", title: "צור חשבון", desc: "הרשם עם אימייל, בחר ׳אני נותן שירות׳, ומלא את הפרטים הבסיסיים. לוקח דקה.", icon: "📝", color: "from-[#6C5CE7] to-[#A29BFE]" },
  { step: "02", title: "הגדר שירותים", desc: "בחר מה אתה יודע לעשות (אינסטלציה? חשמל? הובלות?), הגדר אזורי שירות ומחירים. תוך 5 דקות אתה באוויר.", icon: "⚙️", color: "from-[#00B894] to-[#00D2D3]" },
  { step: "03", title: "התחל לעבוד", desc: "לקוחות ימצאו אותך בחיפוש או ישלחו בקשות. הגב, תאם, ועשה את מה שאתה הכי טוב בו.", icon: "🚀", color: "from-[#FECA57] to-[#FF6B6B]" },
];

const TESTIMONIALS = [
  { name: "משה כהן", city: "באר שבע", service: "אינסטלציה", text: "תוך שבוע מההרשמה כבר היו לי 3 עבודות. המערכת פשוטה, הלקוחות מגיעים לבד, ואני סוגר את החודש עם הכנסה נוספת יפה.", rating: 5 },
  { name: "יוסי לוי", city: "חיפה", service: "חשמל", text: "עבדתי שנים בלי פרסום — רק דרך מכרים. מאז שנרשמתי לאבאל׳ה, הטלפון לא מפסיק. וזה חינם! אין סיבה לא להירשם.", rating: 5 },
  { name: "אבי ישראלי", city: "תל אביב", service: "הרכבת רהיטים", text: "אני עושה את זה כהכנסה נוספת אחרי העבודה. 2-3 הזמנות בשבוע, הכל מהאזור, בלי לנסוע רחוק. מושלם בשבילי.", rating: 5 },
];

export default function BecomeADaddyPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D3436] via-[#2D3436] to-[#00B894]/30 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-bold text-[#00D2D3] mb-6">🔧 הצטרף למשפחה</span>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">הפוך לאבאל׳ה</h1>
          <p className="mt-4 text-[18px] text-white/70 max-w-2xl mx-auto">
            יש לך ידיים טובות? ניסיון? כלי עבודה? הגיע הזמן להרוויח מזה. הצטרף לפלטפורמה שמחברת בין אנשים שצריכים עזרה לאנשים שיודעים לתת אותה.
          </p>
          <Link href="/register" className="mt-8 inline-block rounded-xl bg-gradient-to-r from-[#00B894] to-[#00D2D3] px-8 py-4 text-[16px] font-bold text-white shadow-[0_4px_16px_rgba(0,184,148,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(0,184,148,0.4)] hover:-translate-y-0.5">
            הירשם עכשיו — בחינם
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">למה להצטרף?</h2>
          <p className="mt-2 text-[15px] text-[#636E72]">6 סיבות טובות (חוץ מזה שזה חינם)</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-[#E8ECF1] bg-white p-6 transition-all hover:shadow-[0_8px_30px_rgba(0,184,148,0.1)] hover:-translate-y-1">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8F8] text-[28px] transition-colors group-hover:bg-gradient-to-br group-hover:from-[#00B894] group-hover:to-[#00D2D3]">
                {item.icon}
              </div>
              <h3 className="text-[16px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#636E72]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to start */}
      <section className="bg-[#F8F7FF] py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">איך מתחילים?</h2>
            <p className="mt-2 text-[15px] text-[#636E72]">שלושה צעדים ואתה באוויר</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-white border border-[#E8ECF1] p-7 text-center transition-all hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)] hover:-translate-y-1">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-[32px] shadow-lg`}>
                  {item.icon}
                </div>
                <div className="text-[11px] font-extrabold text-[#B2BEC3] mb-2">שלב {item.step}</div>
                <h3 className="text-[18px] font-bold text-[#2D3436] mb-2">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#636E72]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[#2D3436] md:text-[32px]">אבאל׳ות מספרים</h2>
          <p className="mt-2 text-[15px] text-[#636E72]">מה אומרים נותני השירות שכבר הצטרפו</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,184,148,0.06)] border border-[#E8ECF1]/60">
              <div className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#00D2D3] text-[14px] font-bold text-white shadow-sm">&ldquo;</div>
              <div className="flex gap-0.5 mb-3 mt-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <svg key={j} className="h-4 w-4 text-[#FECA57]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[14px] leading-relaxed text-[#2D3436] mb-4">{t.text}</p>
              <div className="flex items-center justify-between border-t border-[#E8ECF1] pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00B894] to-[#00D2D3] text-[12px] font-bold text-white">{t.name[0]}</div>
                  <div>
                    <span className="text-[13px] font-semibold text-[#2D3436]">{t.name}</span>
                    <span className="text-[11px] text-[#B2BEC3] mr-1">· {t.city}</span>
                  </div>
                </div>
                <span className="rounded-full bg-[#E8F8F8] px-3 py-1 text-[11px] font-semibold text-[#00B894]">{t.service}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#00B894] to-[#00D2D3] py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">מוכן להתחיל?</h2>
          <p className="mt-3 text-[16px] text-white/80">ההרשמה לוקחת דקה. אפס עלות. אפס התחייבות.</p>
          <Link href="/register" className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-[16px] font-bold text-[#00B894] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5">
            הירשם כאבאל׳ה עכשיו
          </Link>
        </div>
      </section>
    </div>
  );
}
