"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";

interface CtaSectionProps {
  session: Session | null;
}

/** Bottom call-to-action that changes copy based on whether the user is signed in. */
export function CtaSection({ session }: CtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] p-8 md:p-12 text-center relative">
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(var(--color-accent),0.1)] translate-x-1/4 translate-y-1/4" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white md:text-3xl">
            {session?.user?.role === "SELLER"
              ? "הידיים שלך מגרדות? יש מי שמחכה להן"
              : session?.user
              ? "משהו נשבר? ספר לנו, נשלח אבאל׳ה"
              : "אבא, הארון לא מתרכב. — שנייה, אני בא."}
          </h2>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            {session?.user?.role === "SELLER"
              ? "לקוחות באזור שלך צריכים עזרה עכשיו. תעיף מבט, תגיב, ותרוויח — כמו פעם, רק עם יותר ׳תודה רבה׳."
              : session?.user
              ? "תפרסם בקשה, תשב בנוח, ותחכה שאבאל׳ה מנוסה יגיד ׳אני מסדר׳."
              : "הצטרף למשפחה של אבאל׳ות שיודעים לסדר הכל — ומרוויחים מזה."}
          </p>
          {session?.user?.role === "SELLER" ? (
            <Button
              variant="secondary"
              size="lg"
              className="mt-6 bg-white text-[rgb(var(--color-primary))] hover:bg-white/90 gap-2"
              asChild
            >
              <Link href="/requests">
                צפה בבקשות פתוחות
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" size="lg" className="mt-6 bg-white text-[rgb(var(--color-primary))] hover:bg-white/90 gap-2" asChild>
              <Link href={session?.user ? "/requests/create" : "/register"}>
                {session?.user ? "פרסם בקשה" : "הצטרף עכשיו — בחינם"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
