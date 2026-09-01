import { isRequestPhotoUrl } from "./request-details";

export const MIN_DELIVERY_PHOTOS = 1;
export const MAX_DELIVERY_PHOTOS = 6;
export const MAX_DELIVERY_NOTE = 280;

export type ParsedDeliveryEvidence = {
  photos: string[];
  note: string | null;
};

export type ParseDeliveryEvidenceResult =
  | { ok: true; value: ParsedDeliveryEvidence }
  | { ok: false; error: string };

/** Reads 1–6 uploaded image URLs and an optional short note from a mark-delivered body. */
export function parseDeliveryEvidence(body: {
  photos?: unknown;
  note?: unknown;
}): ParseDeliveryEvidenceResult {
  if (body.photos != null && !Array.isArray(body.photos)) {
    return { ok: false, error: "כתובת תמונה לא תקינה" };
  }
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  if (rawPhotos.length < MIN_DELIVERY_PHOTOS) {
    return { ok: false, error: "יש לצרף לפחות תמונה אחת" };
  }
  if (rawPhotos.length > MAX_DELIVERY_PHOTOS) {
    return { ok: false, error: `אפשר לצרף עד ${MAX_DELIVERY_PHOTOS} תמונות` };
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
  if (photos.length < MIN_DELIVERY_PHOTOS) {
    return { ok: false, error: "יש לצרף לפחות תמונה אחת" };
  }

  if (body.note != null && typeof body.note !== "string") {
    return { ok: false, error: `ההערה ארוכה מדי (עד ${MAX_DELIVERY_NOTE} תווים)` };
  }
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > MAX_DELIVERY_NOTE) {
    return { ok: false, error: `ההערה ארוכה מדי (עד ${MAX_DELIVERY_NOTE} תווים)` };
  }

  return { ok: true, value: { photos, note: note || null } };
}

export { isRequestPhotoUrl };
