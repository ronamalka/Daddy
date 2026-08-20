import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של אתר אבאל׳ה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות ותקן IS 5568",
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text))] mb-8">הצהרת נגישות</h1>

      <div className="space-y-6 text-[rgb(var(--color-text-secondary))] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">מחויבות לנגישות</h2>
          <p>
            אבאל׳ה מחויבת להנגשת האתר לאנשים עם מוגבלות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות,
            התשנ״ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013,
            ובהתאם לתקן הישראלי ת״י 5568 המבוסס על הנחיות WCAG 2.1 ברמת AA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">התאמות הנגישות שבוצעו</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>התאמה לניווט באמצעות מקלדת בלבד (Tab, Enter, Escape, חצים)</li>
            <li>תמיכה בקוראי מסך — שימוש ב-ARIA ו-HTML סמנטי</li>
            <li>ניגודיות צבעים ברמת AA (יחס 4.5:1 לטקסט רגיל, 3:1 לטקסט גדול)</li>
            <li>אפשרות להגדלת טקסט עד 200% ללא אובדן תוכן</li>
            <li>כפתור &quot;דלג לתוכן הראשי&quot; בראש כל עמוד</li>
            <li>תוויות (labels) לכל שדות הטפסים</li>
            <li>טקסט חלופי (alt) לתמונות</li>
            <li>תמיכה מלאה בכיוון RTL (ימין לשמאל) לעברית</li>
            <li>סרגל נגישות עם אפשרויות התאמה אישית</li>
            <li>כיבוד הגדרת prefers-reduced-motion של המערכת</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">סרגל הנגישות</h2>
          <p>
            בצד שמאל למטה של כל עמוד באתר מופיע כפתור נגישות (♿) המאפשר:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>שינוי גודל הטקסט (הגדלה והקטנה)</li>
            <li>הפעלת ניגודיות גבוהה</li>
            <li>הגדלת הסמן</li>
            <li>הדגשת קישורים</li>
            <li>עצירת אנימציות</li>
            <li>הגדלת מרווח שורות</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">דפדפנים וטכנולוגיות מסייעות</h2>
          <p>
            האתר נבדק ותומך בדפדפנים Chrome, Firefox, Safari ו-Edge בגרסאותיהם האחרונות,
            ותואם לקוראי המסך NVDA, JAWS ו-VoiceOver.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">רכיבים שעדיין בתהליך הנגשה</h2>
          <p>
            אנו עובדים באופן שוטף לשיפור הנגישות. ייתכן שחלק מהתכנים של צדדים שלישיים
            (כגון מפות, סרטונים חיצוניים) אינם נגישים במלואם. אנו פועלים לתקן זאת.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">פנייה בנושא נגישות</h2>
          <p>
            נתקלתם בבעיית נגישות? אנא צרו קשר עם רכז/ת הנגישות שלנו:
          </p>
          <div className="mt-3 rounded-xl bg-[rgb(var(--color-surface-elevated))] p-5 space-y-2">
            <p><strong className="text-[rgb(var(--color-text))]">רכז נגישות:</strong> צוות אבאל׳ה</p>
            <p><strong className="text-[rgb(var(--color-text))]">דוא״ל:</strong>{" "}
              <a href="mailto:accessibility@abale.co.il" className="text-[rgb(var(--color-primary))] hover:underline" dir="ltr">
                accessibility@abale.co.il
              </a>
            </p>
            <p><strong className="text-[rgb(var(--color-text))]">טלפון:</strong>{" "}
              <a href="tel:+972-3-000-0000" className="text-[rgb(var(--color-primary))] hover:underline" dir="ltr">
                03-000-0000
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">תאריך עדכון</h2>
          <p>הצהרת נגישות זו עודכנה לאחרונה בתאריך: אוגוסט 2026.</p>
        </section>
      </div>
    </div>
  );
}
