import type { Metadata, MetadataRoute } from "next";
import { GIGS_SERVICE, USERS_SERVICE, proxyRequest } from "@/lib/gateway";
import { getServiceBySlug } from "@/lib/services";
import { siteUrl } from "@/lib/site-url";

export const HOME_TITLE = "אבאל׳ה — אבא תמיד יודע לסדר. גם אם הוא לא שלך.";
export const HOME_DESCRIPTION =
  "אבא תמיד יודע לסדר. גם אם הוא לא שלך. מצא אבאל׳ה מנוסה שיעזור עם הרכבות, תיקונים, הובלות, הוזלת חשבונות ועוד.";

export const MARKETING_SITEMAP_ENTRIES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/become-a-daddy", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/services", changeFrequency: "weekly", priority: 0.8 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/guidelines", changeFrequency: "yearly", priority: 0.2 },
];

const SITEMAP_PAGE_SIZE = 50;
const SITEMAP_MAX_PAGES = 100;

export interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** Skip the root "%s | אבאל׳ה" template (homepage already includes the brand). */
  absoluteTitle?: boolean;
  images?: { url: string; alt?: string }[];
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const url = siteUrl(input.path);
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
      languages: {
        he: input.path,
        "x-default": input.path,
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      ...(input.images?.length ? { images: input.images } : {}),
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function faqJsonLd(
  items: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function truncateMeta(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export interface ListedGig {
  id: string;
  sellerId?: string;
  updatedAt?: string;
}

export function parseGigsList(payload: unknown): ListedGig[] {
  const wrapped = payload as { gigs?: unknown[] } | undefined;
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(wrapped?.gigs)
      ? wrapped.gigs
      : [];
  return rows.flatMap((raw) => {
    const row = raw as Record<string, unknown>;
    if (!row || typeof row !== "object") return [];
    if (typeof row.id !== "string" || !row.id) return [];
    return [{
      id: row.id,
      ...(typeof row.sellerId === "string" ? { sellerId: row.sellerId } : {}),
      ...(typeof row.updatedAt === "string" ? { updatedAt: row.updatedAt } : {}),
    }];
  });
}

export function gigsListHasMore(payload: unknown, pageSize: number): boolean {
  if (Array.isArray(payload)) return false;
  const wrapped = payload as { hasMore?: boolean } | undefined;
  if (wrapped && typeof wrapped === "object" && typeof wrapped.hasMore === "boolean") {
    return wrapped.hasMore;
  }
  return parseGigsList(payload).length >= pageSize;
}

export interface ListedSeller {
  id: string;
  createdAt?: string;
}

export function parseProvidersList(payload: unknown): ListedSeller[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((raw) => {
    const row = raw as Record<string, unknown>;
    if (!row || typeof row !== "object") return [];
    if (typeof row.id !== "string" || !row.id) return [];
    return [{ id: row.id, ...(typeof row.createdAt === "string" ? { createdAt: row.createdAt } : {}) }];
  });
}

type SitemapFetcher = (url: string) => Promise<unknown>;

async function defaultSitemapFetch(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export async function collectPublicGigs(
  gigsServiceUrl: string,
  fetchFn: SitemapFetcher = defaultSitemapFetch,
): Promise<ListedGig[]> {
  const all: ListedGig[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < SITEMAP_MAX_PAGES; page++) {
    const skip = page * SITEMAP_PAGE_SIZE;
    const payload = await fetchFn(`${gigsServiceUrl}/gigs?skip=${skip}&take=${SITEMAP_PAGE_SIZE}`);
    const list = parseGigsList(payload);
    const fresh = list.filter((g) => !seen.has(g.id));
    if (fresh.length === 0) break;
    for (const g of fresh) {
      seen.add(g.id);
      all.push(g);
    }
    if (!gigsListHasMore(payload, SITEMAP_PAGE_SIZE) || list.length < SITEMAP_PAGE_SIZE) break;
  }
  return all;
}

export async function collectPublicSellers(
  usersServiceUrl: string,
  fetchFn: SitemapFetcher = defaultSitemapFetch,
): Promise<ListedSeller[]> {
  const all: ListedSeller[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < SITEMAP_MAX_PAGES; page++) {
    const skip = page * SITEMAP_PAGE_SIZE;
    const payload = await fetchFn(`${usersServiceUrl}/providers?skip=${skip}&take=${SITEMAP_PAGE_SIZE}`);
    const list = parseProvidersList(payload);
    const fresh = list.filter((s) => !seen.has(s.id));
    if (fresh.length === 0) break;
    for (const s of fresh) {
      seen.add(s.id);
      all.push(s);
    }
    if (list.length < SITEMAP_PAGE_SIZE) break;
  }
  return all;
}

export interface SellerSeo {
  id: string;
  name: string;
  bio: string | null;
  city: string | null;
  avatar: string | null;
  role?: string;
  userServices: { serviceSlug: string }[];
  avgRating: number;
  totalReviews: number;
}

export async function loadSellerSeo(id: string): Promise<SellerSeo | null> {
  const { data, status } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
  if (status !== 200 || !data?.id || typeof data.name !== "string") return null;

  const reviewsRes = await proxyRequest(GIGS_SERVICE, `/reviews/by-seller/${id}`).catch(() => ({
    data: null,
    status: 502,
  }));
  const reviewCount = typeof reviewsRes.data?.reviewCount === "number" ? reviewsRes.data.reviewCount : 0;
  const avgRating = typeof reviewsRes.data?.avgRating === "number" ? reviewsRes.data.avgRating : 0;

  return {
    id: data.id,
    name: data.name,
    bio: typeof data.bio === "string" ? data.bio : null,
    city: typeof data.city === "string" ? data.city : null,
    avatar: typeof data.avatar === "string" ? data.avatar : null,
    role: typeof data.role === "string" ? data.role : undefined,
    userServices: Array.isArray(data.userServices) ? data.userServices : [],
    avgRating,
    totalReviews: reviewCount,
  };
}

export function sellerPageMetadata(seller: SellerSeo): Metadata {
  const services = seller.userServices
    .map((us) => getServiceBySlug(us.serviceSlug)?.nameHe)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);
  const where = seller.city ? ` ב${seller.city}` : "";
  const serviceBit = services.length ? ` — ${services.join(", ")}` : "";
  const description = seller.bio
    ? truncateMeta(seller.bio)
    : truncateMeta(`${seller.name} הוא אבאל׳ה${where}${serviceBit}. מצאו דירוגים, מחירים וזמינות באבאל׳ה.`);
  return pageMetadata({
    title: seller.name,
    description,
    path: `/sellers/${seller.id}`,
    images: seller.avatar ? [{ url: seller.avatar, alt: seller.name }] : undefined,
  });
}

export function sellerJsonLd(seller: SellerSeo): Record<string, unknown> {
  const url = siteUrl(`/sellers/${seller.id}`);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Person", "LocalBusiness"],
    "@id": url,
    name: seller.name,
    url,
    description: seller.bio ? truncateMeta(seller.bio, 300) : undefined,
    image: seller.avatar || undefined,
    areaServed: { "@type": "Country", name: "Israel" },
  };
  if (seller.city) {
    node.address = {
      "@type": "PostalAddress",
      addressLocality: seller.city,
      addressCountry: "IL",
    };
  }
  if (seller.totalReviews > 0 && seller.avgRating > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: seller.avgRating,
      bestRating: 10,
      worstRating: 1,
      ratingCount: seller.totalReviews,
    };
  }
  return node;
}

export interface GigSeo {
  id: string;
  title: string;
  description: string;
  image: string | null;
  sellerId?: string;
  sellerName?: string;
  avgRating: number;
  reviewCount: number;
  startingPrice: number | null;
}

export async function loadGigSeo(id: string): Promise<GigSeo | null> {
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
  if (status !== 200 || !data?.id || typeof data.title !== "string") return null;

  let sellerName: string | undefined;
  if (typeof data.sellerId === "string") {
    const sellerRes = await proxyRequest(USERS_SERVICE, `/sellers/${data.sellerId}`).catch(() => ({
      data: null,
      status: 502,
    }));
    if (typeof sellerRes.data?.name === "string") sellerName = sellerRes.data.name;
  }

  const tiers = Array.isArray(data.tiers) ? data.tiers : [];
  const startingPrice = typeof tiers[0]?.price === "number" ? tiers[0].price : null;

  return {
    id: data.id,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    image: typeof data.image === "string" ? data.image : null,
    sellerId: typeof data.sellerId === "string" ? data.sellerId : undefined,
    sellerName,
    avgRating: typeof data.avgRating === "number" ? data.avgRating : 0,
    reviewCount: typeof data.reviewCount === "number" ? data.reviewCount : 0,
    startingPrice,
  };
}

export function gigPageMetadata(gig: GigSeo): Metadata {
  const by = gig.sellerName ? ` מאת ${gig.sellerName}` : "";
  const description = gig.description
    ? truncateMeta(gig.description)
    : truncateMeta(`${gig.title}${by} באבאל׳ה.`);
  return pageMetadata({
    title: gig.title,
    description,
    path: `/gigs/${gig.id}`,
    images: gig.image ? [{ url: gig.image, alt: gig.title }] : undefined,
  });
}

export function gigJsonLd(gig: GigSeo): Record<string, unknown> {
  const url = siteUrl(`/gigs/${gig.id}`);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: gig.title,
    description: gig.description ? truncateMeta(gig.description, 300) : undefined,
    url,
    image: gig.image || undefined,
    areaServed: { "@type": "Country", name: "Israel" },
  };
  if (gig.sellerName) {
    node.provider = {
      "@type": "Person",
      name: gig.sellerName,
      ...(gig.sellerId ? { url: siteUrl(`/sellers/${gig.sellerId}`) } : {}),
    };
  }
  if (gig.startingPrice != null) {
    node.offers = {
      "@type": "Offer",
      price: gig.startingPrice,
      priceCurrency: "ILS",
    };
  }
  if (gig.reviewCount > 0 && gig.avgRating > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: gig.avgRating,
      bestRating: 10,
      worstRating: 1,
      ratingCount: gig.reviewCount,
    };
  }
  return node;
}

// Escapes `</script>` in user text to prevent tag breakout
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
