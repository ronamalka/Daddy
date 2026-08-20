import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { AccessibilityToolbar, A11Y_BOOTSTRAP_SCRIPT } from "@/components/accessibility-toolbar";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://daddy-app-daddy-dev.apps.cluster-x8bxx.x8bxx.sandbox2963.opentlc.com";

export const metadata: Metadata = {
  title: {
    default: "אבאל׳ה — שוק שירותים ופרילנסרים",
    template: "%s | אבאל׳ה",
  },
  description: "מצא לך אבאל׳ה שיעזור עם מה שאתה צריך היום — הובלות, הרכבות, שיפוצים, ניקיון ועוד",
  keywords: ["פרילנסרים", "שירותים", "הובלות", "שיפוצים", "הרכבת רהיטים", "ניקיון", "אבאלה", "ישראל"],
  authors: [{ name: "אבאל׳ה" }],
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "/" },
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: BASE_URL,
    siteName: "אבאל׳ה",
    title: "אבאל׳ה — שוק שירותים ופרילנסרים",
    description: "מצא לך אבאל׳ה שיעזור עם מה שאתה צריך היום",
    images: [{ url: "/logo.jpeg", width: 1792, height: 2390, alt: "אבאל׳ה" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "אבאל׳ה — שוק שירותים ופרילנסרים",
    description: "מצא לך אבאל׳ה שיעזור עם מה שאתה צריך היום",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "אבאל׳ה",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.jpeg`,
  description: "שוק שירותים ופרילנסרים — מצא בעלי מקצוע מנוסים בישראל",
  areaServed: {
    "@type": "Country",
    name: "Israel",
  },
  inLanguage: "he",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${heebo.className} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[100] focus:rounded-lg focus:bg-[rgb(var(--color-primary))] focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          דלג לתוכן הראשי
        </a>
        <SessionProvider>
          {children}
          <AccessibilityToolbar />
        </SessionProvider>
      </body>
    </html>
  );
}
