import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "איך זה עובד — ספר מה נשבר, קבל אבאל׳ה, הוא יסדר",
  description: "שלושה צעדים פשוטים: ספר מה צריך לתקן, קבל אבאל׳ה מהאזור שלך, והוא יסדר. בלי סיבוכים, בלי הפתעות.",
  openGraph: {
    title: "איך זה עובד — ספר מה נשבר, קבל אבאל׳ה, הוא יסדר",
    description: "שלושה צעדים פשוטים: ספר מה צריך לתקן, קבל אבאל׳ה מהאזור שלך, והוא יסדר.",
  },
};

/** Sets the title and description for the how-it-works page. */
export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
