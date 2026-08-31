const ATTACHMENT_UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
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

/** True if this is a same-origin upload path our chat APIs may persist. */
export function isAllowedAttachmentUrl(url: unknown): url is string {
  return typeof url === "string" && url.length <= 200 && ATTACHMENT_PATH_RE.test(url);
}

/** True if the filename is a UUID plus an allowed image or PDF extension. */
export function isAllowedAttachmentFilename(name: unknown): name is string {
  return typeof name === "string" && isAllowedAttachmentUrl(`/uploads/${name}`);
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
