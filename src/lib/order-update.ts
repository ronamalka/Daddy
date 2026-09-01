import { z } from "zod";
import {
  MAX_DELIVERY_NOTE,
  MAX_DELIVERY_PHOTOS,
  MIN_DELIVERY_PHOTOS,
  isRequestPhotoUrl,
} from "@/lib/delivery-photos";

const deliveryPhotoUrl = z.string().refine(isRequestPhotoUrl, "כתובת תמונה לא תקינה");

const deliveredSchema = z
  .object({
    status: z.literal("DELIVERED"),
    photos: z
      .array(deliveryPhotoUrl)
      .min(MIN_DELIVERY_PHOTOS, "יש לצרף לפחות תמונה אחת")
      .max(MAX_DELIVERY_PHOTOS, `אפשר לצרף עד ${MAX_DELIVERY_PHOTOS} תמונות`),
    note: z
      .string()
      .max(MAX_DELIVERY_NOTE, `ההערה ארוכה מדי (עד ${MAX_DELIVERY_NOTE} תווים)`)
      .optional(),
  })
  .strict();

const onTheWaySchema = z
  .object({
    status: z.literal("ON_THE_WAY"),
    eta: z.string().max(200).optional(),
  })
  .strict();

const otherStatusSchema = z
  .object({
    status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  })
  .strict();

/** Body for PATCH /api/orders/:id. Mark-delivered requires 1–6 uploaded photos. */
export const updateOrderSchema = z.union([deliveredSchema, onTheWaySchema, otherStatusSchema]);
