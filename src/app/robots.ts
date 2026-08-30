import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://daddy-app-daddy-dev.apps.cluster-x8bxx.x8bxx.sandbox2963.opentlc.com";

/** Tells crawlers which paths they may index and where the sitemap lives. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/profile/", "/inbox/", "/orders/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
