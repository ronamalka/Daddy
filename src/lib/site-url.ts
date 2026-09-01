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

/**
 * Like getSiteUrl(), but uses the incoming request Host header as a last
 * resort before falling back to localhost. Call this from generateMetadata()
 * or other server-side contexts where next/headers is available.
 */
export async function getRequestSiteUrl(): Promise<string> {
  const envUrl = process.env["NEXT_PUBLIC_BASE_URL"] || process.env["AUTH_URL"];
  if (envUrl) return envUrl.replace(/\/+$/, "");

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost")) {
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is unavailable during static generation; fall through
  }

  return LOCAL_FALLBACK;
}

/** Joins the public origin with a path (`/` is the origin with no extra slash). */
export function siteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
