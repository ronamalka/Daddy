import Link from "next/link";
import { Wrench, FileText, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <span className="text-gradient-hero text-xl font-extrabold">אבאל׳ה</span>
            <p className="text-sm text-[rgb(var(--color-text-muted))] mt-2 max-w-xs">
              שוק השירותים של ישראל. בעלי מקצוע מנוסים, דירוגים אמיתיים, מחירים הוגנים.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text))]">
                <Wrench className="h-3.5 w-3.5" />
                פלטפורמה
              </span>
              <FooterLink href="/">עיון</FooterLink>
              <FooterLink href="/how-it-works">איך זה עובד</FooterLink>
              <FooterLink href="/become-a-daddy">הפוך לאבאל׳ה</FooterLink>
              <FooterLink href="/about">אודות</FooterLink>
            </div>
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text))]">
                <Shield className="h-3.5 w-3.5" />
                חשבון
              </span>
              <FooterLink href="/register">הרשמה</FooterLink>
              <FooterLink href="/login">התחברות</FooterLink>
            </div>
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text))]">
                <FileText className="h-3.5 w-3.5" />
                משפטי
              </span>
              <FooterLink href="/terms">תנאי שימוש</FooterLink>
              <FooterLink href="/privacy">מדיניות פרטיות</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgb(var(--color-border-light))] pt-6 text-center">
          <p className="text-xs text-[rgb(var(--color-text-muted))]">
            © {new Date().getFullYear()} אבאל׳ה. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
    >
      {children}
    </Link>
  );
}
