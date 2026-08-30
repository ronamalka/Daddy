"use client";

import Link from "next/link";
import Image from "next/image";
import { Wrench, FileText, Shield } from "@phosphor-icons/react";
import { BUSINESS_DISCLOSURE, LEGAL_CONTACTS } from "@/lib/legal";

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/logo.jpeg" alt="אבאל׳ה" width={36} height={36} className="rounded-full" />
              <span className="text-gradient-hero text-xl font-extrabold">אבאל׳ה</span>
            </div>
            <p className="text-sm text-[rgb(var(--color-text-muted))] mt-2 max-w-xs">
              פלטפורמה לחיבור בין לקוחות לנותני שירות עצמאיים. אבאל׳ה אינה נותנת את השירות בשטח ואינה מעסיקה את האבאל׳ות.
            </p>
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-3 max-w-xs leading-relaxed">
              {BUSINESS_DISCLOSURE.name}<br />
              {BUSINESS_DISCLOSURE.registration}<br />
              {BUSINESS_DISCLOSURE.address}<br />
              <a href={`mailto:${LEGAL_CONTACTS.legal}`} className="hover:text-[rgb(var(--color-primary))]" dir="ltr">{LEGAL_CONTACTS.legal}</a>
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
              <FooterLink href="/guidelines">כללי קהילה</FooterLink>
              <FooterLink href="/accessibility">נגישות</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgb(var(--color-border-light))] pt-6 text-center">
          <p className="text-xs text-[rgb(var(--color-text-muted))]">
            © {new Date().getFullYear()} {BUSINESS_DISCLOSURE.name}. כל הזכויות שמורות. המחירים באתר כוללים מע״מ כדין, אלא אם צוין שהספק עוסק פטור.
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
