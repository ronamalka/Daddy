import Link from "next/link";
import { pageMetadata, serializeJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import { LANDING_CATEGORIES } from "@/lib/landing-pages";

export const metadata = pageMetadata({
  title: "שירותים לבית — אבאל׳ה",
  description:
    "מצא בעלי מקצוע מנוסים לכל סוג שירות: אינסטלטור, חשמלאי, שיפוצניק, נגר, הובלות ועוד. חינם, בלי מתווכים.",
  path: "/services",
});

/** Lists all service categories as cards with links to individual landing pages. */
export default function ServicesIndexPage() {
  const entries = Object.entries(LANDING_CATEGORIES);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "שירותים לבית — אבאל׳ה",
    url: siteUrl("/services"),
    numberOfItems: entries.length,
    itemListElement: entries.map(([slug, cat], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cat.he,
      url: siteUrl(`/services/${slug}`),
    })),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "ראשי", path: "/" },
    { name: "שירותים", path: "/services" },
  ]);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">
            כל השירותים לבית
          </h1>
          <p className="mt-4 text-[18px] text-white/70">
            מצא אבאל׳ה מנוסה לכל תחום — מאינסטלציה ועד הובלות
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([slug, cat]) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="group rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 transition-all hover:shadow-lg"
            >
              <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))] mb-2 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                {cat.he}
              </h2>
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

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">
            לא מצאת את מה שחיפשת?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            פרסם בקשה חופשית ותן לבעלי מקצוע לפנות אליך
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
