const LOCAL_FALLBACK = "http://localhost:3000";

/**
 * Public site origin for canonical URLs, sitemap, and Open Graph.
 * Prefer NEXT_PUBLIC_BASE_URL; AUTH_URL is the runtime fallback so Docker
 * images built once still pick up the daddy-dev / stg / prod host.
 */
export function getSiteUrl(): string {
  const raw = process.env["NEXT_PUBLIC_BASE_URL"] || process.env["AUTH_URL"] || LOCAL_FALLBACK;
  return raw.replace(/\/+$/, "");
}

/** Joins the public origin with a path (`/` is the origin with no extra slash). */
export function siteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
