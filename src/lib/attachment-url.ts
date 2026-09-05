const ATTACHMENT_UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ATTACHMENT_FILENAME_RE = new RegExp(
  `^${ATTACHMENT_UUID}\\.(jpg|jpeg|png|webp|pdf)$`,
  "i"
);
export const ATTACHMENT_PATH_RE = new RegExp(
  `^/uploads/${ATTACHMENT_UUID}\\.(jpg|jpeg|png|webp|pdf)$`,
  "i"
);

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

/**
 * True if this is a valid upload URL — either a same-origin `/uploads/...`
 * path or an external CDN URL whose pathname ends with a UUID-named file.
 * Only https external origins are accepted.
 */
export function isAllowedAttachmentUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;

  // Same-origin /uploads path
  if (ATTACHMENT_PATH_RE.test(url)) return true;

  // External domain (CDN / separate upload origin)
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const filename = parsed.pathname.split("/").pop() || "";
    return ATTACHMENT_FILENAME_RE.test(filename);
  } catch {
    return false;
  }
}

/** True if the filename is a UUID plus an allowed image or PDF extension. */
export function isAllowedAttachmentFilename(name: unknown): name is string {
  return typeof name === "string" && ATTACHMENT_FILENAME_RE.test(name);
}

/** True if an allowed attachment should render as an image preview. */
export function isImageAttachment(url: string): boolean {
  return isAllowedAttachmentUrl(url) && /\.(jpg|jpeg|png|webp)$/i.test(url);
}

/** MIME type for an allowlisted upload filename, or null if unknown. */
export function attachmentContentType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? CONTENT_TYPES[ext] ?? null : null;
}
