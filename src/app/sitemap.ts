import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://daddy-app-daddy-dev.apps.cluster-x8bxx.x8bxx.sandbox2963.opentlc.com";

/** Builds the public sitemap: homepage catalog plus package detail URLs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/become-a-daddy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/accessibility`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/guidelines`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  let gigPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${process.env.GIGS_SERVICE_URL || "http://localhost:4002"}/gigs`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : payload?.gigs ?? [];
      gigPages = list.map((gig: { id: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/gigs/${gig.id}`,
        lastModified: gig.updatedAt ? new Date(gig.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {}

  return [...staticPages, ...gigPages];
}
