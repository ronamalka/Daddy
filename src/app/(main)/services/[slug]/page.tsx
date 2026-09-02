import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata, serializeJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import { USERS_SERVICE, GIGS_SERVICE, proxyRequest } from "@/lib/gateway";
import {
  LANDING_CATEGORIES,
  LANDING_CITIES,
  CATEGORY_SLUGS,
  SERVICE_FAQ,
} from "@/lib/landing-pages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = LANDING_CATEGORIES[slug];
  if (!cat) return {};
  return pageMetadata({
    title: `${cat.he} — מצא בעל מקצוע מנוסה | אבאל׳ה`,
    description: `${cat.description}. מצא ${cat.he} מדורג באבאל׳ה — ביקורות אמיתיות, מחירים שקופים, בלי מתווכים.`,
    path: `/services/${slug}`,
  });
}

interface SellerCard {
  id: string;
  name: string;
  avatar: string | null;
  city: string | null;
  avgRating: number;
  totalReviews: number;
}

interface ReviewCard {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string; city: string | null };
}

/** Fetches top-rated sellers. Gracefully returns empty on failure. */
async function fetchTopSellers(slug: string): Promise<SellerCard[]> {
  try {
    const { data, status } = await proxyRequest(
      USERS_SERVICE,
      `/providers?take=12`,
    );
    if (status !== 200 || !Array.isArray(data)) return [];
    return data
      .filter(
        (s: Record<string, unknown>) =>
          s &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          Array.isArray(s.userServices) &&
          (s.userServices as { serviceSlug: string }[]).some(
            (us) =>
              us.serviceSlug === slug ||
              us.serviceSlug.includes(slug.replace(/-/g, "")),
          ),
      )
      .slice(0, 8)
      .map((s: Record<string, unknown>) => ({
        id: s.id as string,
        name: s.name as string,
        avatar: typeof s.avatar === "string" ? s.avatar : null,
        city: typeof s.city === "string" ? s.city : null,
        avgRating: typeof s.avgRating === "number" ? s.avgRating : 0,
        totalReviews:
          typeof s.totalReviews === "number" ? s.totalReviews : 0,
      }));
  } catch {
    return [];
  }
}

/** Fetches recent reviews. Gracefully returns empty on failure. */
async function fetchRecentReviews(slug: string): Promise<ReviewCard[]> {
  try {
    const { data, status } = await proxyRequest(
      GIGS_SERVICE,
      `/reviews?take=6`,
    );
    if (status !== 200 || !Array.isArray(data)) return [];
    return data.slice(0, 6).map((r: Record<string, unknown>) => ({
      id: (r.id as string) || String(Math.random()),
      rating: typeof r.rating === "number" ? r.rating : 0,
      comment: typeof r.comment === "string" ? r.comment : "",
      createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
      user:
        r.user && typeof r.user === "object"
          ? {
              name:
                typeof (r.user as Record<string, unknown>).name === "string"
                  ? ((r.user as Record<string, unknown>).name as string)
                  : "משתמש",
              city:
                typeof (r.user as Record<string, unknown>).city === "string"
                  ? ((r.user as Record<string, unknown>).city as string)
                  : null,
            }
          : undefined,
    }));
  } catch {
    return [];
  }
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = LANDING_CATEGORIES[slug];
  if (!cat) notFound();

  const [sellers, reviews] = await Promise.all([
    fetchTopSellers(slug),
    fetchRecentReviews(slug),
  ]);

  const cityEntries = Object.entries(LANDING_CITIES).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: cat.he,
    description: cat.description,
    url: siteUrl(`/services/${slug}`),
    areaServed: { "@type": "Country", name: "Israel" },
    provider: {
      "@type": "Organization",
      name: "אבאל׳ה",
      url: siteUrl("/"),
    },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "ראשי", path: "/" },
    { name: "שירותים", path: "/services" },
    { name: cat.he, path: `/services/${slug}` },
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
              href="/services"
              className="hover:text-white/80 transition-colors"
            >
              שירותים
            </Link>
            <span>/</span>
            <span className="text-white/80">{cat.he}</span>
          </nav>
          <h1 className="text-[36px] font-extrabold md:text-[48px]">
            {cat.he}
          </h1>
          <p className="mt-4 text-[18px] text-white/70">{cat.description}</p>
          <Link
            href={`/requests/create?service=${slug}`}
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] shadow-md transition-all hover:shadow-lg"
          >
            מצא {cat.he} עכשיו
          </Link>
        </div>
      </section>

      {/* Top Sellers */}
      {sellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
              בעלי מקצוע מובילים — {cat.he}
            </h2>
            <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">
              בעלי מקצוע מדורגים עם חוות דעת אמיתיות
            </p>
          </div>
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
        </section>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <section className="bg-[rgb(var(--color-surface-elevated))] py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
                חוות דעת אחרונות
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)] text-[13px] font-bold text-[rgb(var(--color-primary))]">
                        {(review.user?.name || "מ")[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[rgb(var(--color-text))]">
                          {review.user?.name || "משתמש"}
                        </p>
                        {review.user?.city && (
                          <p className="text-[11px] text-[rgb(var(--color-text-muted))]">
                            {review.user.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="rounded-full bg-[rgba(var(--color-accent-yellow),0.15)] px-2.5 py-1 text-[12px] font-bold text-[rgb(var(--color-warning))]">
                      {review.rating}/10
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-[rgb(var(--color-text-secondary))] line-clamp-3">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* City Links */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-extrabold text-[rgb(var(--color-text))] md:text-[32px]">
            {cat.he} לפי עיר
          </h2>
          <p className="mt-2 text-[15px] text-[rgb(var(--color-text-secondary))]">
            מצא בעלי מקצוע קרובים אליך
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {cityEntries.map(([citySlug, city]) => (
            <Link
              key={citySlug}
              href={`/city/${citySlug}/${slug}`}
              className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:shadow-md"
            >
              {cat.he} ב{city.he}
            </Link>
          ))}
        </div>
      </section>

      {/* Other Service Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-[24px] font-extrabold text-[rgb(var(--color-text))] md:text-[28px]">
            שירותים נוספים
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(LANDING_CATEGORIES)
            .filter(([s]) => s !== slug)
            .map(([s, c]) => (
              <Link
                key={s}
                href={`/services/${s}`}
                className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 text-center text-[14px] font-medium text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] hover:shadow-md"
              >
                {c.he}
              </Link>
            ))}
        </div>
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
            צריך {cat.he}?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            פרסם בקשה חופשית ובעלי מקצוע מנוסים יפנו אליך
          </p>
          <Link
            href={`/requests/create?service=${slug}`}
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
