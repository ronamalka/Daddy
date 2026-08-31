const ATTACHMENT_UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const ATTACHMENT_PATH_RE = new RegExp(
  `^/uploads/${ATTACHMENT_UUID}\\.(jpg|jpeg|png|webp|pdf)$`,
  "i"
);

/** True if this is a same-origin upload path our chat APIs may persist. */
export function isAllowedAttachmentUrl(url: unknown): url is string {
  return typeof url === "string" && url.length <= 200 && ATTACHMENT_PATH_RE.test(url);
}

/** True if an allowed attachment should render as an image preview. */
export function isImageAttachment(url: string): boolean {
  return isAllowedAttachmentUrl(url) && /\.(jpg|jpeg|png|webp)$/i.test(url);
}
