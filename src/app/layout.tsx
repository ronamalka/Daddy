import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { AccessibilityToolbar, A11Y_BOOTSTRAP_SCRIPT } from "@/components/accessibility-toolbar";
import { CsrfProvider } from "@/components/csrf-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { HOME_DESCRIPTION, HOME_TITLE, serializeJsonLd } from "@/lib/seo";
import { getSiteUrl, getRequestSiteUrl } from "@/lib/site-url";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

/** Site-wide defaults; `metadataBase` is resolved at request time from the env host. */
export async function generateMetadata(): Promise<Metadata> {
  const base = await getRequestSiteUrl();
  return {
    title: {
      default: HOME_TITLE,
      template: "%s | אבאל׳ה",
    },
    description: HOME_DESCRIPTION,
    keywords: ["אבאלה", "שירותים לבית", "הרכבת רהיטים", "תיקונים", "הובלות", "הוזלת חשבונות", "בעלי מקצוע", "ישראל"],
    authors: [{ name: "אבאל׳ה" }],
    metadataBase: new URL(base),
    icons: {
      icon: "/logo.jpeg",
      apple: "/logo.jpeg",
    },
    openGraph: {
      type: "website",
      locale: "he_IL",
      url: base,
      siteName: "אבאל׳ה",
      title: HOME_TITLE,
      description: "מצא אבאל׳ה מנוסה שיסדר לך הכל — מהרכבת ארון ועד הוזלת חשבונות. בלי מתווכים, בלי הפתעות.",
      images: [{ url: "/logo.jpeg", width: 1792, height: 2390, alt: "אבאל׳ה — כל אחד צריך אבאל׳ה" }],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: "מצא אבאל׳ה מנוסה שיסדר לך הכל — מהרכבת ארון ועד הוזלת חשבונות.",
    },
    robots: { index: true, follow: true },
  };
}

/** Wraps every page with fonts, session, cookies, and shared UI. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const base = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "אבאל׳ה",
    url: base,
    logo: `${base}/logo.jpeg`,
    description: "אבא תמיד יודע לסדר. מצא אבאל׳ה מנוסה לכל מה שצריך — תיקונים, הרכבות, הובלות ועוד. פלטפורמת תיווך: נותן השירות הוא הספק העצמאי, לא אבאל׳ה.",
    areaServed: {
      "@type": "Country",
      name: "Israel",
    },
    inLanguage: "he",
  };

  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${heebo.className} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
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
          <CsrfProvider />
          {children}
          <CookieConsentBanner />
          <AccessibilityToolbar />
        </SessionProvider>
      </body>
    </html>
  );
}
