import { isRequestPhotoUrl } from "./request-details";

/**
 * Allowed hostnames for user-provided photo URLs.
 * Extend this list when the app adds external storage (S3, CDN, etc.).
 * Loaded once at startup from ALLOWED_UPLOAD_HOSTS env var (comma-separated),
 * falling back to the app's own domain.
 */
const ALLOWED_HOSTS: Set<string> = new Set(
  (process.env.ALLOWED_UPLOAD_HOSTS || "aballeh.com,www.aballeh.com")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

/** IPv4 ranges that must never be reached by user-supplied URLs. */
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,              // loopback
  /^10\./,               // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12
  /^192\.168\./,         // 192.168.0.0/16
  /^0\./,                // 0.0.0.0/8
  /^169\.254\./,         // link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGN 100.64.0.0/10
];

/** Hostnames that resolve to internal addresses. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",        // GCP metadata
  "metadata.google.internal.",
  "instance-data",                    // AWS alias
]);

/** True if the hostname looks like an IPv6 address (bracketed or raw). */
function isIpv6(hostname: string): boolean {
  return hostname.startsWith("[") || hostname.includes("::");
}

/** True if the hostname is a private or loopback IPv4 address. */
function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((re) => re.test(hostname));
}

/** True if the hostname targets the AWS/GCP/Azure metadata endpoint. */
function isMetadataEndpoint(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  // AWS metadata
  if (lower === "169.254.169.254") return true;
  // GCP metadata
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  // Azure metadata
  if (lower === "169.254.169.254") return true;
  return false;
}

export type UrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Validates a user-provided photo URL against SSRF attacks.
 *
 * Accepts:
 *  - Same-origin relative upload paths (/uploads/UUID.ext)
 *  - HTTPS URLs whose hostname is in the allowed list
 *
 * Rejects:
 *  - Non-HTTPS protocols (http, ftp, file, javascript, data, etc.)
 *  - Private/internal IP addresses (127.x, 10.x, 172.16-31.x, 192.168.x)
 *  - Cloud metadata endpoints (169.254.169.254, metadata.google.internal)
 *  - IPv6 addresses (could hide internal targets)
 *  - Hostnames not in the allowed list
 */
export function validatePhotoUrl(url: unknown): UrlValidationResult {
  if (typeof url !== "string" || !url.trim()) {
    return { ok: false, error: "כתובת תמונה לא תקינה" };
  }

  const trimmed = url.trim();

  // Enforce reasonable URL length
  if (trimmed.length > 2048) {
    return { ok: false, error: "כתובת URL ארוכה מדי" };
  }

  // Allow same-origin relative upload paths (/uploads/UUID.ext)
  if (isRequestPhotoUrl(trimmed)) {
    return { ok: true, url: trimmed };
  }

  // Parse as absolute URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "כתובת URL לא תקינה" };
  }

  // Only HTTPS is allowed
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "רק כתובות HTTPS מותרות" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block IPv6 addresses
  if (isIpv6(hostname)) {
    return { ok: false, error: "כתובת URL לא תקינה" };
  }

  // Block private/internal IPs
  if (isPrivateIp(hostname)) {
    return { ok: false, error: "כתובת URL לא תקינה" };
  }

  // Block metadata endpoints
  if (isMetadataEndpoint(hostname)) {
    return { ok: false, error: "כתובת URL לא תקינה" };
  }

  // Block blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, error: "כתובת URL לא תקינה" };
  }

  // Only allow known hosts
  if (!ALLOWED_HOSTS.has(hostname)) {
    return { ok: false, error: "ניתן להעלות תמונות רק מדומיינים מורשים" };
  }

  return { ok: true, url: trimmed };
}

/**
 * Convenience wrapper: validates a photo URL and returns true/false.
 * Use validatePhotoUrl() when you need the error message.
 */
export function isSafePhotoUrl(url: unknown): url is string {
  return validatePhotoUrl(url).ok;
}
