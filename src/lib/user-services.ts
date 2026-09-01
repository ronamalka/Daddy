export type UserServiceRow = {
  serviceSlug: string;
  alertsMuted: boolean;
};

/** Reads service slugs (and mute flags) from GET /api/user-services, including the older string[] shape. */
export function parseUserServiceList(data: unknown): UserServiceRow[] {
  if (!Array.isArray(data)) return [];
  const rows: UserServiceRow[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    if (typeof item === "string") {
      const slug = item.trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      rows.push({ serviceSlug: slug, alertsMuted: false });
      continue;
    }
    if (item && typeof item === "object" && typeof (item as { serviceSlug?: unknown }).serviceSlug === "string") {
      const slug = (item as { serviceSlug: string }).serviceSlug.trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      rows.push({
        serviceSlug: slug,
        alertsMuted: Boolean((item as { alertsMuted?: unknown }).alertsMuted),
      });
    }
  }
  return rows;
}

/** Returns just the slugs from a user-services API payload. */
export function userServiceSlugs(data: unknown): string[] {
  return parseUserServiceList(data).map((row) => row.serviceSlug);
}
