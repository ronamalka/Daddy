import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

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
    sitemap: siteUrl("/sitemap.xml"),
  };
}
