import Link from "next/link";
import { BUSINESS_DISCLOSURE, LEGAL_CONTACTS, TERMS_VERSION } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של אבאל׳ה לפי חוק הגנת הפרטיות ותיקון 13.",
  path: "/privacy",
});

const SECTIONS = [
  {
    title: "מי אנחנו ומה הבסיס החוקי",
    content: [
      `האחראי לעיבוד: ${BUSINESS_DISCLOSURE.name}, ${BUSINESS_DISCLOSURE.address}. פניות: ${LEGAL_CONTACTS.privacy}.`,
      "מדיניות זו נכתבה לפי חוק הגנת הפרטיות, התשמ״א-1981, תקנות אבטחת מידע התשע״ז-2017, ותיקון 13 (בתוקף מ־14 באוגוסט 2025). תיקון 13 מרחיב את הגדרת מידע אישי גם לכתובת IP, מיקום גאוגרפי ומזהים מקוונים.",
      "זו טיוטה לתפעול. לפני השקה לציבור יש לאשרה אצל עורך דין לפרטיות ולאשר האם חלה חובת מינוי ממונה הגנת פרטיות.",
    ],
  },
  {
    title: "הודעה בעת איסוף (סעיף 11)",
    content: [
      "מסירת שם, אימייל, טלפון, עיר ושירותים היא וולונטרית, אך בלי פרטים אלה לא ניתן לפתוח חשבון או לחבר בין משתמשים.",
      "המטרות: ניהול חשבון, הצגת פרופיל ציבורי לספקים, תיווך בין לקוח לספק, אבטחה, מניעת הונאה, ופניות משפטיות.",
      "הנמענים: צוות אבאל׳ה לפי הצורך, ספקי ענן ואחסון, ספק אימות (Google אם נבחר), ולפי דין — רשויות.",
    ],
  },
  {
    title: "מידע שאנחנו אוספים",
    content: [
      "**מידע שאתה מספק:** שם, אימייל, טלפון, עיר, תיאור, תמונה, שירותים, מחירים, הודעות, ביקורות.",
      "**מידע אוטומטי:** כתובת IP, סוג דפדפן, מערכת הפעלה, דפים שנצפו, זמני ביקור, מזהי עוגיות וסשן. אלה מידע אישי לפי תיקון 13.",
      "**צדדים שלישיים:** בהרשמה עם Google — שם, אימייל ותמונה מהחשבון.",
      "אנחנו לא מבקשים במודע מידע על קטינים. השימוש לבני 18+ בלבד.",
    ],
  },
  {
    title: "עוגיות והסכמה",
    content: [
      "**הכרחיות (בלי הסכמה נפרדת):** סשן התחברות, CSRF, והעדפת נגישות. בלי אלה האתר לא עובד.",
      "**אנליטיקה ושיווק:** רק אחרי אישור מפורש בבאנר. דחייה ו־Escape / סגירה נחשבות לדחייה. נבקש שוב כעבור 12 חודשים.",
      "אין חוק עוגיות ייעודי בישראל; ההסכמה נשענת על חוק הגנת הפרטיות והנחיות הרשות להגנת הפרטיות. אישור ודחייה מוצגים במשקל חזותי דומה.",
    ],
  },
  {
    title: "איך אנחנו משתמשים במידע",
    content: [
      "ניהול חשבון והצגת פרופיל ספק לציבור.",
      "חיבור בין מחפשי שירות לנותני שירות.",
      "אבטחה, מניעת בוטים והונאה, וציות לדין.",
      "שיפור השירות — כולל אנליטיקה רק בהסכמה.",
      "אנחנו לא מוכרים מידע אישי.",
    ],
  },
  {
    title: "שיתוף והעברה לחו״ל",
    content: [
      "**ספקי עיבוד:** אחסון ענן, דוא״ל, אימות. נדרש הסכם עיבוד מתאים.",
      "**העברה מחוץ לישראל:** מותרת למדינות ברשימת הנאותות לפי תקנות העברת מידע למאגרי מידע מחוץ לישראל (לרבות מדינות האיחוד), או בחוזה מתאים, או בהסכמה. החלטת הנאותות של האיחוד מכסה העברה מהאיחוד לישראל — לא להפך.",
      "**דין:** צו בית משפט או דרישת רשות מוסמכת.",
      "**מידע ציבורי בפרופיל ספק:** שם, עיר, שירותים וביקורות נגישים לכל גולש. זה חלק מהשירות.",
    ],
  },
  {
    title: "הזכויות שלך ולוח הזמנים",
    content: [
      "עיון (סעיף 13), תיקון או מחיקה של מידע שאינו מדויק (סעיף 14) — מענה תוך 30 יום. אי־מענה מאפשר פנייה לבית משפט השלום.",
      "משיכת הסכמה צריכה להיות קלה כמו נתינתה (תיקון 13).",
      "הסרה מדיוור שיווקי לפי סעיף 30א לחוק התקשורת.",
      "פניות: " + LEGAL_CONTACTS.privacy + ". אין לדרוש צילום ת.ז. לבקשת עיון בפרופיל בסיסי.",
    ],
  },
  {
    title: "אבטחה ודיווח על אירוע",
    content: [
      "הצפנת תעבורה (TLS), סיסמאות בגיבוב, והגבלת גישה למסד הנתונים.",
      "אירוע אבטחה חמור מדווח לרשות להגנת הפרטיות **מיד** עם היוודע האירוע — דיווח ראשוני, לא אחרי סיום כל הבדיקות. אין מועד של 72 שעות בדין הישראלי.",
      "יידוע הנפגעים ייעשה אם הרשות תורה על כך.",
    ],
  },
  {
    title: "שמירה ומחיקה",
    content: [
      "נשמור מידע כל עוד החשבון פעיל, ואחר כך לפי חובות חוק (התיישנות, מס, הליכים).",
      "ביקורות עשויות להישאר באופן מצומצם לשמירת אמינות הפלטפורמה, בכפוף לדין.",
    ],
  },
  {
    title: "יצירת קשר",
    content: [
      `פרטיות: ${LEGAL_CONTACTS.privacy}. משפטי: ${LEGAL_CONTACTS.legal}.`,
      `${BUSINESS_DISCLOSURE.name}, ${BUSINESS_DISCLOSURE.country}. ${BUSINESS_DISCLOSURE.registration}.`,
      `גרסת מדיניות: ${TERMS_VERSION}.`,
    ],
  },
];

/** Shows the privacy policy. */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-surface-elevated))]">
      <section className="bg-gradient-to-br from-[rgb(var(--color-text))] via-[rgb(var(--color-text))] to-[rgba(var(--color-primary),0.2)] py-16 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[42px]">מדיניות פרטיות</h1>
          <p className="mt-3 text-[15px] text-white/60">גרסה {TERMS_VERSION} · עדכון אחרון: אוגוסט 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 md:p-12">
          <p className="mb-8 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
            אבאל׳ה מחויבת להגנה על פרטיות המשתמשים. מדיניות זו מסבירה איזה מידע נאסף, למה, ומה הזכויות שלך.
            היא אינה ייעוץ משפטי.
          </p>

          <div className="space-y-8">
            {SECTIONS.map((section, i) => (
              <div key={section.title}>
                <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-[rgb(var(--color-text))]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(var(--color-primary),0.1)] text-[12px] font-extrabold text-[rgb(var(--color-primary))]">{i + 1}</span>
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.content.map((item) => (
                    <li key={item.slice(0, 40)} className="relative pr-4 text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] before:absolute before:right-0 before:content-['•'] before:text-[rgb(var(--color-primary))]">
                      {item.split("**").map((part, k) =>
                        k % 2 === 1 ? <strong key={k} className="text-[rgb(var(--color-text))]">{part}</strong> : <span key={k}>{part}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[14px] font-semibold text-[rgb(var(--color-primary))] hover:underline">← חזרה לדף הבית</Link>
        </div>
      </section>
    </div>
  );
}
