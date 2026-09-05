import { z } from "zod";
import {
  MAX_REQUEST_PHOTOS,
  MAX_STREET_LENGTH,
  MAX_FLOOR_LENGTH,
  PREFERRED_WINDOWS,
} from "../../../shared/request-details";

/** Photo URL must be a same-origin uploaded image path. */
const REQUEST_PHOTO_RE =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

/**
 * Zod schema for the POST /service-requests body.
 *
 * Validates all incoming fields up-front so the handler does not need
 * manual if/else checks.  Error messages are in Hebrew to match the
 * existing API surface.
 */
export const createServiceRequestSchema = z
  .object({
    title: z
      .string({ error: "הכותרת חייבת להיות טקסט" })
      .trim()
      .min(1, "הכותרת חובה"),

    description: z
      .string({ error: "התיאור חייב להיות טקסט" })
      .trim()
      .min(1, "התיאור חובה"),

    serviceSlug: z.string().nullish(),

    districtCode: z
      .union([z.number().int(), z.string().transform(Number)])
      .nullish(),

    districtName: z.string().nullish(),

    cityCode: z
      .union([z.number().int(), z.string().transform(Number)])
      .nullish(),

    cityName: z.string().nullish(),

    slotStart: z.string({ error: "חלון ביקור חובה" }).min(1, "חלון ביקור חובה"),

    slotEnd: z.string({ error: "חלון ביקור חובה" }).min(1, "חלון ביקור חובה"),

    street: z
      .string()
      .max(MAX_STREET_LENGTH, `הרחוב ארוך מדי (עד ${MAX_STREET_LENGTH} תווים)`)
      .nullish(),

    floor: z
      .string()
      .max(MAX_FLOOR_LENGTH, `הקומה ארוכה מדי (עד ${MAX_FLOOR_LENGTH} תווים)`)
      .nullish(),

    preferredWindow: z.enum(PREFERRED_WINDOWS, {
      error: "חלון מועדף לא תקין",
    }).nullish(),

    photos: z
      .array(
        z.string().regex(REQUEST_PHOTO_RE, "כתובת תמונה לא תקינה")
      )
      .max(MAX_REQUEST_PHOTOS, `אפשר לצרף עד ${MAX_REQUEST_PHOTOS} תמונות`)
      .default([]),

    unlisted: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.slotStart);
      const end = new Date(data.slotEnd);
      return (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end > start
      );
    },
    { message: "חלון ביקור לא תקין", path: ["slotStart"] }
  );

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
