import Link from "next/link";

const SECTIONS = [
  {
    title: "מידע שאנחנו אוספים",
    content: [
      "**מידע שאתה מספק:** שם, כתובת אימייל, מספר טלפון, עיר מגורים, תיאור עצמי (לנותני שירות), ותמונת פרופיל.",
      "**מידע שנאסף אוטומטית:** כתובת IP, סוג דפדפן, מערכת הפעלה, דפים שנצפו, זמני ביקור, ומזהי קוקיז.",
      "**מידע מצדדים שלישיים:** כאשר נרשמים דרך Google, אנחנו מקבלים את השם, האימייל ותמונת הפרופיל שמשויכים לחשבון.",
    ],
  },
  {
    title: "איך אנחנו משתמשים במידע",
    content: [
      "ניהול החשבון שלך והצגת הפרופיל לגולשים אחרים.",
      "חיבור בין מחפשי שירות לנותני שירות (אבאל׳ות).",
      "שליחת התראות על הודעות, ביקורות, ובקשות שירות.",
      "שיפור השירות, ניתוח שימוש, ומניעת הונאה.",
      "אנחנו לא מוכרים את המידע שלך לצדדים שלישיים. לעולם לא.",
    ],
  },
  {
    title: "קוקיז (Cookies)",
    content: [
      "אנחנו משתמשים בקוקיז הכרחיים לתפעול האתר (ניהול סשן, אימות משתמש).",
      "קוקיז אנליטיים עוזרים לנו להבין איך אנשים משתמשים באתר.",
      "אפשר לחסום קוקיז דרך הגדרות הדפדפן, אבל חלק מהפונקציונליות עלולה להיפגע.",
    ],
  },
  {
    title: "שיתוף מידע עם צדדים שלישיים",
    content: [
      "**ספקי שירות:** שירותי אחסון (ענן), ניתוח נתונים, ושליחת אימיילים. כולם מחויבים בהסכמי סודיות.",
      "**דרישות חוק:** נחשוף מידע אם נידרש לכך על פי צו בית משפט או דרישה חוקית.",
      "**מידע ציבורי:** שם, עיר, שירותים, ביקורות — מוצגים באתר ונגישים לכל גולש. זה חלק מהותי מהשירות.",
    ],
  },
  {
    title: "הזכויות שלך",
    content: [
      "בהתאם לחוק הגנת הפרטיות, התשמ\"א-1981, יש לך זכות לעיין במידע שנשמר עליך, לבקש תיקון או מחיקה.",
      "**עיון:** פנה אלינו ונספק לך עותק מהמידע שנשמר.",
      "**תיקון:** אפשר לעדכן את פרטיך ישירות דרך עמוד הפרופיל.",
      "**מחיקה:** אפשר לבקש מחיקת חשבון. ביקורות שכתבת יישארו אנונימיות.",
      "**הסרה מדיוור:** לחץ ׳הסר׳ בתחתית כל אימייל שיווקי.",
    ],
  },
  {
    title: "אבטחת מידע",
    content: [
      "אנחנו משתמשים בהצפנת SSL/TLS להעברת נתונים.",
      "סיסמאות נשמרות בצורה מוצפנת (hashed) ואינן נגישות לאף אחד, כולל לנו.",
      "גישה למסדי הנתונים מוגבלת ומבוקרת.",
      "למרות כל המאמצים, אף מערכת אינה חסינה לחלוטין. אם מידע נחשף — נודיע לך בהקדם.",
    ],
  },
  {
    title: "יצירת קשר",
    content: [
      "לכל שאלה בנושא פרטיות, פנו אלינו: privacy@abale.co.il",
      "אבאל׳ה בע\"מ, ישראל.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D3436] via-[#2D3436] to-[#6C5CE7]/20 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[42px]">מדיניות פרטיות</h1>
          <p className="mt-3 text-[15px] text-white/60">עדכון אחרון: אוגוסט 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[#E8ECF1] bg-white p-8 md:p-12">
          <p className="text-[15px] leading-relaxed text-[#636E72] mb-8">
            אבאל׳ה (&quot;אנחנו&quot;, &quot;שלנו&quot;) מחויבת להגנה על פרטיות המשתמשים שלה. מדיניות זו מסבירה אילו נתונים אנחנו אוספים, למה, ומה הזכויות שלך. המדיניות נכתבה בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981 ותקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז-2017.
          </p>

          <div className="space-y-8">
            {SECTIONS.map((section, i) => (
              <div key={i}>
                <h2 className="text-[18px] font-bold text-[#2D3436] mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEFF] text-[12px] font-extrabold text-[#6C5CE7]">{i + 1}</span>
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.content.map((item, j) => (
                    <li key={j} className="text-[14px] leading-relaxed text-[#636E72] pr-4 relative before:content-['•'] before:absolute before:right-0 before:text-[#6C5CE7]">
                      {item.split("**").map((part, k) =>
                        k % 2 === 1 ? <strong key={k} className="text-[#2D3436]">{part}</strong> : <span key={k}>{part}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[14px] text-[#6C5CE7] font-semibold hover:underline">← חזרה לדף הבית</Link>
        </div>
      </section>
    </div>
  );
}
