import { pageMetadata, faqJsonLd, breadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "איך זה עובד — ספר מה נשבר, קבל אבאל׳ה, הוא יסדר",
  description: "שלושה צעדים פשוטים: ספר מה צריך לתקן, קבל אבאל׳ה מהאזור שלך, והוא יסדר. בלי סיבוכים, בלי הפתעות.",
  path: "/how-it-works",
});

const HOW_IT_WORKS_FAQ = [
  { q: "כמה עולה להשתמש באבאל׳ה?", a: "לקונים — חינם. בלי שקל, בלי ׳תשלום על הצגת טלפון׳, בלי קאצ׳. לאבאל׳ות — גם חינם. אנחנו לא לוקחים עמלה מהעבודות שלך." },
  { q: "איך יוצרים קשר עם אבאל׳ה?", a: "נכנסים לפרופיל, לוחצים ׳שלח הודעה׳, ומתאמים ישירות. אפשר גם לפרסם בקשה ולתת לאבאל׳ות לפנות אליכם. בלי מתווכים." },
  { q: "מה אם לא מרוצה מהשירות?", a: "דברו עם האבאל׳ה. אם לא הצלחתם — פתחו מחלוקת מדף ההזמנה. צוות אבאל׳ה יעזור לתווך." },
  { q: "איך עובד הדירוג?", a: "4 קריטריונים: איכות, יחס, זמנים, מחיר. כל אחד מ-1 עד 10." },
  { q: "אפשר לבטל?", a: "עד 24 שעות לפני חלון הביקור הביטול חינם. אחר כך נרשמים דמי ביטול קטנים." },
  { q: "איך אני יודע שהאבאל׳ה אמין?", a: "ביקורות ציבוריות שלא ניתנות לעריכה או מחיקה. מספר עבודות שהושלמו. אזורי שירות." },
  { q: "מי אחראי אם משהו משתבש בעבודה?", a: "נותן השירות בשטח — האבאל׳ה שבחרתם. אבאל׳ה היא פלטפורמת תיווך: לא מעסיקה, לא מבטחת, ולא מבצעת את העבודה." },
];

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faq = faqJsonLd(HOW_IT_WORKS_FAQ);
  const breadcrumb = breadcrumbJsonLd([
    { name: "ראשי", path: "/" },
    { name: "איך זה עובד", path: "/how-it-works" },
  ]);

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  );
}
