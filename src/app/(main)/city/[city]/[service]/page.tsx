import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata, serializeJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import {
  LANDING_CATEGORIES,
  LANDING_CITIES,
  CATEGORY_SLUGS,
  CITY_SLUGS,
  SERVICE_FAQ,
  fetchSellersByCityAndService,
  type SellerCard,
} from "@/lib/landing-pages";

interface PageProps {
  params: Promise<{ city: string; service: string }>;
}

export async function generateStaticParams() {
  const params: { city: string; service: string }[] = [];
  for (const city of CITY_SLUGS) {
    for (const service of CATEGORY_SLUGS) {
      params.push({ city, service });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city: citySlug, service: serviceSlug } = await params;
  const city = LANDING_CITIES[citySlug];
  const cat = LANDING_CATEGORIES[serviceSlug];
  if (!city || !cat) return {};
  return pageMetadata({
    title: `${cat.he} ב${city.he} — מצא בעל מקצוע | אבאל׳ה`,
    description: `${cat.description}. מצא ${cat.he} מדורג ב${city.he} — ביקורות אמיתיות, מחירים שקופים, בלי מתווכים.`,
    path: `/city/${citySlug}/${serviceSlug}`,
  });
}

export default async function CityServicePage({ params }: PageProps) {
  const { city: citySlug, service: serviceSlug } = await params;
  const city = LANDING_CITIES[citySlug];
  const cat = LANDING_CATEGORIES[serviceSlug];
  if (!city || !cat) notFound();

  const sellers = await fetchSellersByCityAndService(serviceSlug, city.he);

  const otherCities = Object.entries(LANDING_CITIES)
    .filter(([s]) => s !== citySlug)
    .slice(0, 5);

  const otherServices = Object.entries(LANDING_CATEGORIES)
    .filter(([s]) => s !== serviceSlug)
    .slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${cat.he} ב${city.he}`,
    description: `${cat.description} ב${city.he}`,
    url: siteUrl(`/city/${citySlug}/${serviceSlug}`),
    areaServed: {
      "@type": "City",
      name: city.he,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.lat,
        longitude: city.lng,
      },
      containedInPlace: { "@type": "Country", name: "Israel" },
    },
    provider: {
      "@type": "Organization",
      name: "אבאל׳ה",
      url: siteUrl("/"),
    },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "ראשי", path: "/" },
    { name: city.he, path: `/city/${citySlug}` },
    { name: cat.he, path: `/city/${citySlug}/${serviceSlug}` },
  ]);

  const faq = faqJsonLd(SERVICE_FAQ);

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
            <Link
              href={`/city/${citySlug}`}
              className="hover:text-white/80 transition-colors"
            >
              {city.he}
            </Link>
            <span>/</span>
            <span className="text-white/80">{cat.he}</span>
          </nav>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">
            {cat.he} ב{city.he}
          </h1>
          <p className="mt-4 text-[18px] text-white/70">
            {cat.description} — מצא בעלי מקצוע מדורגים ב{city.he}
          </p>
          <Link
            href={`/requests/create?service=${serviceSlug}`}
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] shadow-md transition-all hover:shadow-lg"
          >
            מצא {cat.he} ב{city.he}
          </Link>
        </div>
      </section>

      {/* Local Sellers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
            {sellers.length > 0
              ? `בעלי מקצוע מובילים — ${cat.he} ב${city.he}`
              : `${cat.he} ב${city.he}`}
          </h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">
            {sellers.length > 0
              ? "בעלי מקצוע מדורגים עם חוות דעת אמיתיות"
              : "בעלי מקצוע חדשים מצטרפים כל הזמן. פרסם בקשה ותקבל הצעות מהאזור."}
          </p>
        </div>
        {sellers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 text-center transition-all hover:shadow-lg"
              >
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  {seller.avatar ? (
                    <img
                      src={seller.avatar}
                      alt={seller.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    (seller.name || "א")[0]
                  )}
                </div>
                <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                  {seller.name}
                </h3>
                {seller.city && (
                  <p className="mt-1 text-[13px] text-[rgb(var(--color-text-secondary))]">
                    {seller.city}
                  </p>
                )}
                {seller.avgRating > 0 && (
                  <p className="mt-2 text-[13px] font-semibold text-[rgb(var(--color-accent-yellow))]">
                    {seller.avgRating.toFixed(1)}/10 ({seller.totalReviews}{" "}
                    חוות דעת)
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
            <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">
              עדיין אין {cat.he} רשומים ב{city.he}
            </p>
            <p className="mt-2 text-[14px] text-[rgb(var(--color-text-muted))]">
              פרסם בקשה ובעלי מקצוע מהאזור יצרו קשר
            </p>
            <Link
              href={`/requests/create?service=${serviceSlug}`}
              className="mt-6 inline-block rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))]"
            >
              פרסם בקשה
            </Link>
          </div>
        )}
      </section>

      {/* Other Cities for this Service */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] md:text-[28px]">
              {cat.he} בערים נוספות
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {otherCities.map(([s, c]) => (
              <Link
                key={s}
                href={`/city/${s}/${serviceSlug}`}
                className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:shadow-md"
              >
                {cat.he} ב{c.he}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Services in this City */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] md:text-[28px]">
            שירותים נוספים ב{city.he}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {otherServices.map(([s, c]) => (
            <Link
              key={s}
              href={`/city/${citySlug}/${s}`}
              className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:shadow-md"
            >
              {c.he} ב{city.he}
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-link to national service page */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-[14px] text-[rgb(var(--color-text-secondary))]">
          מחפש {cat.he} בכל הארץ?{" "}
          <Link
            href={`/services/${serviceSlug}`}
            className="font-semibold text-[rgb(var(--color-primary))] hover:underline"
          >
            {cat.he} — כל האזורים
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
              שאלות נפוצות
            </h2>
          </div>
          <div className="space-y-3">
            {SERVICE_FAQ.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden"
              >
                <summary className="flex w-full cursor-pointer items-center justify-between p-5 text-right">
                  <span className="text-[15px] font-bold text-[rgb(var(--color-text))]">
                    {item.q}
                  </span>
                  <span className="text-[rgb(var(--color-primary))] transition-transform group-open:rotate-180">
                    &#9660;
                  </span>
                </summary>
                <div className="border-t border-[rgb(var(--color-border))] px-5 pb-5 pt-3">
                  <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))]">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">
            צריך {cat.he} ב{city.he}?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            פרסם בקשה ובעלי מקצוע מנוסים מהאזור יפנו אליך
          </p>
          <Link
            href={`/requests/create?service=${serviceSlug}`}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faq) }}
      />
    </div>
  );
}
