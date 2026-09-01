export const MAX_REQUEST_PHOTOS = 4;
export const MAX_STREET_LENGTH = 120;
export const MAX_FLOOR_LENGTH = 20;

export const PREFERRED_WINDOWS = ["MORNING", "AFTERNOON", "WEEKEND"] as const;
export type PreferredWindow = (typeof PREFERRED_WINDOWS)[number];

export const PREFERRED_WINDOW_LABELS: Record<PreferredWindow, string> = {
  MORNING: "בוקר",
  AFTERNOON: "אחר הצהריים",
  WEEKEND: "סוף שבוע",
};

const REQUEST_PHOTO_RE =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export type RequestStreetViewer = {
  id: string;
  role: string;
};

export type RequestStreetSource = {
  buyerId: string;
  selectedResponseId?: string | null;
  street?: string | null;
  responses?: { id: string; sellerId: string; selected?: boolean }[];
};

export type ParsedRequestDetails = {
  street: string | null;
  floor: string | null;
  preferredWindow: PreferredWindow | null;
  photos: string[];
};

export type ParseRequestDetailsResult =
  | { ok: true; value: ParsedRequestDetails }
  | { ok: false; error: string };

/** True if this is a same-origin uploaded image (not PDF or a remote URL). */
export function isRequestPhotoUrl(url: unknown): url is string {
  return typeof url === "string" && url.length <= 200 && REQUEST_PHOTO_RE.test(url);
}

/** True if this string is one of the three preferred visit windows. */
export function isPreferredWindow(value: unknown): value is PreferredWindow {
  return typeof value === "string" && (PREFERRED_WINDOWS as readonly string[]).includes(value);
}

/** Hebrew label for a preferred window, or empty if the value is missing. */
export function preferredWindowLabel(value: string | null | undefined): string {
  if (!value || !isPreferredWindow(value)) return "";
  return PREFERRED_WINDOW_LABELS[value];
}

/** True if this viewer is the buyer, an admin, or the seller whose quote was accepted. */
export function canSeeRequestStreet(viewer: RequestStreetViewer, request: RequestStreetSource): boolean {
  if (viewer.role === "ADMIN") return true;
  if (viewer.id === request.buyerId) return true;
  const selected = request.responses?.find(
    (row) => row.selected || row.id === request.selectedResponseId
  );
  return Boolean(selected && selected.sellerId === viewer.id);
}

/** Copies a request row and blanks `street` unless this viewer may see it. */
export function redactRequestStreet<T extends RequestStreetSource>(
  request: T,
  viewer: RequestStreetViewer
): T & { streetVisible: boolean; hasStreet: boolean } {
  const hasStreet = Boolean(request.street?.trim());
  const streetVisible = canSeeRequestStreet(viewer, request);
  if (streetVisible) {
    return { ...request, streetVisible, hasStreet };
  }
  return { ...request, street: null, streetVisible, hasStreet };
}

/** Reads optional street, floor, time-of-day, and up to four photo URLs from a create body. */
export function parseRequestDetails(body: {
  street?: unknown;
  floor?: unknown;
  preferredWindow?: unknown;
  photos?: unknown;
}): ParseRequestDetailsResult {
  const street = typeof body.street === "string" ? body.street.trim() : "";
  if (typeof body.street === "string" && street.length > MAX_STREET_LENGTH) {
    return { ok: false, error: `הרחוב ארוך מדי (עד ${MAX_STREET_LENGTH} תווים)` };
  }

  const floor = typeof body.floor === "string" ? body.floor.trim() : "";
  if (typeof body.floor === "string" && floor.length > MAX_FLOOR_LENGTH) {
    return { ok: false, error: `הקומה ארוכה מדי (עד ${MAX_FLOOR_LENGTH} תווים)` };
  }

  const rawWindow = body.preferredWindow;
  if (rawWindow != null && rawWindow !== "") {
    if (!isPreferredWindow(rawWindow)) {
      return { ok: false, error: "חלון מועדף לא תקין" };
    }
  }
  const preferredWindow = isPreferredWindow(rawWindow) ? rawWindow : null;

  if (body.photos != null && !Array.isArray(body.photos)) {
    return { ok: false, error: "כתובת תמונה לא תקינה" };
  }
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  if (rawPhotos.length > MAX_REQUEST_PHOTOS) {
    return { ok: false, error: `אפשר לצרף עד ${MAX_REQUEST_PHOTOS} תמונות` };
  }
  const photos: string[] = [];
  for (const photo of rawPhotos) {
    if (typeof photo !== "string" || !photo.trim()) {
      return { ok: false, error: "כתובת תמונה לא תקינה" };
    }
    const url = photo.trim();
    if (!isRequestPhotoUrl(url)) {
      return { ok: false, error: "כתובת תמונה לא תקינה" };
    }
    if (!photos.includes(url)) photos.push(url);
  }

  return {
    ok: true,
    value: {
      street: street || null,
      floor: floor || null,
      preferredWindow,
      photos,
    },
  };
}
