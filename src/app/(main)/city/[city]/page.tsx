import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata, serializeJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import {
  LANDING_CATEGORIES,
  LANDING_CITIES,
  CITY_SLUGS,
} from "@/lib/landing-pages";

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = LANDING_CITIES[citySlug];
  if (!city) return {};
  return pageMetadata({
    title: `בעלי מקצוע ב${city.he} | אבאל׳ה`,
    description: `מצא בעלי מקצוע מנוסים ב${city.he} — אינסטלטור, חשמלאי, שיפוצניק ועוד. ביקורות אמיתיות, מחירים שקופים, בלי מתווכים.`,
    path: `/city/${citySlug}`,
  });
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params;
  const city = LANDING_CITIES[citySlug];
  if (!city) notFound();

  const categoryEntries = Object.entries(LANDING_CATEGORIES);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `בעלי מקצוע ב${city.he}`,
    description: `מצא בעלי מקצוע מנוסים ב${city.he} דרך אבאל׳ה`,
    url: siteUrl(`/city/${citySlug}`),
    about: {
      "@type": "City",
      name: city.he,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.lat,
        longitude: city.lng,
      },
      containedInPlace: { "@type": "Country", name: "Israel" },
    },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "ראשי", path: "/" },
    { name: city.he, path: `/city/${citySlug}` },
  ]);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-6 flex items-center justify-center gap-2 text-[13px] text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">
              ראשי
            </Link>
            <span>/</span>
            <span className="text-white/80">{city.he}</span>
          </nav>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">
            בעלי מקצוע ב{city.he}
          </h1>
          <p className="mt-4 text-[18px] text-white/70">
            מצא אבאל׳ה מנוסה ב{city.he} לכל עבודה — תיקונים, הרכבות, שיפוצים
            ועוד
          </p>
        </div>
      </section>

      {/* Service Categories for this City */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
            שירותים זמינים ב{city.he}
          </h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">
            בחר תחום ומצא בעלי מקצוע מדורגים באזורך
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoryEntries.map(([slug, cat]) => (
            <Link
              key={slug}
              href={`/city/${citySlug}/${slug}`}
              className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-lg"
            >
              <h3 className="text-[20px] font-bold text-[rgb(var(--color-text))] mb-2 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                {cat.he} ב{city.he}
              </h3>
              <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
                {cat.description}
              </p>
              <span className="mt-4 inline-block text-[13px] font-semibold text-[rgb(var(--color-primary))]">
                מצא בעלי מקצוע &larr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Other Cities */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] md:text-[28px]">
              ערים נוספות
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(LANDING_CITIES)
              .filter(([s]) => s !== citySlug)
              .map(([s, c]) => (
                <Link
                  key={s}
                  href={`/city/${s}`}
                  className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:shadow-md"
                >
                  {c.he}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">
            צריך עזרה ב{city.he}?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            פרסם בקשה ובעלי מקצוע מהאזור יפנו אליך
          </p>
          <Link
            href="/requests/create"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] shadow-md transition-all hover:shadow-lg"
          >
            פרסם בקשה
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </div>
  );
}
