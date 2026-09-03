import type { MetadataRoute } from "next";
import { GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import {
  collectPublicGigs,
  collectPublicSellers,
  MARKETING_SITEMAP_ENTRIES,
} from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import {
  LANDING_CATEGORIES,
  LANDING_CITIES,
  CATEGORY_SLUGS,
  CITY_SLUGS,
} from "@/lib/landing-pages";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = MARKETING_SITEMAP_ENTRIES.map((entry) => ({
    url: siteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  /* --- SEO landing pages: /services/[slug] --- */
  const servicePages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: siteUrl(`/services/${slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  /* --- SEO landing pages: /city/[city] --- */
  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((city) => ({
    url: siteUrl(`/city/${city}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  /* --- SEO landing pages: /city/[city]/[service] --- */
  const cityServicePages: MetadataRoute.Sitemap = CITY_SLUGS.flatMap((city) =>
    CATEGORY_SLUGS.map((service) => ({
      url: siteUrl(`/city/${city}/${service}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  );

  let sellerPages: MetadataRoute.Sitemap = [];
  try {
    const sellers = await collectPublicSellers(USERS_SERVICE);
    sellerPages = sellers.map((seller) => ({
      url: siteUrl(`/sellers/${seller.id}`),
      lastModified: seller.createdAt ? new Date(seller.createdAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    sellerPages = [];
  }

  let gigPages: MetadataRoute.Sitemap = [];
  try {
    const gigs = await collectPublicGigs(GIGS_SERVICE);
    gigPages = gigs.map((gig) => ({
      url: siteUrl(`/gigs/${gig.id}`),
      lastModified: gig.updatedAt ? new Date(gig.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    gigPages = [];
  }

  /* --- Blog posts --- */
  const blogPosts = getAllPosts();
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];
  const blogPostPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: siteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...servicePages,
    ...cityPages,
    ...cityServicePages,
    ...blogIndex,
    ...blogPostPages,
    ...sellerPages,
    ...gigPages,
  ];
}
