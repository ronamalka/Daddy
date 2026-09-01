export const REQUEST_TEASER_TAKE = 8;

/** Prisma `select` for the public teaser — never include description, buyer, street, or photos. */
export const REQUEST_TEASER_SELECT = {
  id: true,
  title: true,
  serviceSlug: true,
  cityName: true,
  districtName: true,
  createdAt: true,
} as const;

export type RequestTeaser = {
  id: string;
  title: string;
  serviceSlug: string | null;
  cityName: string | null;
  districtName: string | null;
  createdAt: string;
};

/** Open, listed requests only. `acceptingJobs` is a seller flag and must not be used here. */
export function requestTeaserWhere(): { status: "OPEN"; unlisted: false } {
  return { status: "OPEN", unlisted: false };
}

/** Strips a request row down to public teaser fields. Returns null if required fields are missing. */
export function toRequestTeaser(row: Record<string, unknown> | null | undefined): RequestTeaser | null {
  if (!row || typeof row.id !== "string" || typeof row.title !== "string") {
    return null;
  }

  let createdAt: string | null = null;
  if (row.createdAt instanceof Date) {
    createdAt = row.createdAt.toISOString();
  } else if (typeof row.createdAt === "string") {
    createdAt = row.createdAt;
  }
  if (!createdAt) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    serviceSlug: typeof row.serviceSlug === "string" ? row.serviceSlug : null,
    cityName: typeof row.cityName === "string" ? row.cityName : null,
    districtName: typeof row.districtName === "string" ? row.districtName : null,
    createdAt,
  };
}

/** Maps a service payload to teasers, dropping anything that is not a valid public row. */
export function mapRequestTeasers(rows: unknown): RequestTeaser[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => (row && typeof row === "object" ? toRequestTeaser(row as Record<string, unknown>) : null))
    .filter((row): row is RequestTeaser => row !== null)
    .slice(0, REQUEST_TEASER_TAKE);
}
