import type { MetadataRoute } from "next";
import { GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import {
  collectPublicGigs,
  collectPublicSellers,
  MARKETING_SITEMAP_ENTRIES,
} from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/** Builds the public sitemap: marketing pages, searchable daddies, and package URLs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = MARKETING_SITEMAP_ENTRIES.map((entry) => ({
    url: siteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

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

  return [...staticPages, ...sellerPages, ...gigPages];
}
