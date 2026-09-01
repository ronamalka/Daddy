export const DISPUTE_REASONS = ["NO_SHOW", "DAMAGE", "DIFFERENT_PRICE", "QUALITY"] as const;
export type DisputeReason = (typeof DISPUTE_REASONS)[number];

export const DISPUTABLE_STATUSES = ["IN_PROGRESS", "ON_THE_WAY", "DELIVERED"] as const;
export const OPEN_DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW"] as const;
export const MAX_DISPUTE_PHOTOS = 5;
export const MAX_DISPUTE_DESCRIPTION = 2000;
export const ADMIN_DISPUTE_ACTIONS = ["review", "release", "refund", "split", "close"] as const;

/** True if this order status may receive a new dispute. */
export function isDisputableStatus(status: string): boolean {
  return (DISPUTABLE_STATUSES as readonly string[]).includes(status);
}

/** True if a dispute is still waiting on admin. */
export function isOpenDisputeStatus(status: string): boolean {
  return (OPEN_DISPUTE_STATUSES as readonly string[]).includes(status);
}

/** True if this user is the buyer or the daddy on the order. */
export function isOrderParty(actorId: string, buyerId: string, sellerId: string): boolean {
  return actorId === buyerId || actorId === sellerId;
}

export type DisputeOpenResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/** Checks whether this actor may open a dispute on the order. */
export function canOpenDispute(input: {
  orderStatus: string;
  actorId: string;
  buyerId: string;
  sellerId: string;
  hasOpenDispute: boolean;
}): DisputeOpenResult {
  if (!isOrderParty(input.actorId, input.buyerId, input.sellerId)) {
    return { ok: false, error: "רק הצדדים להזמנה יכולים לפתוח מחלוקת", status: 403 };
  }
  if (!isDisputableStatus(input.orderStatus)) {
    return { ok: false, error: "אפשר לפתוח מחלוקת רק כשהעבודה בעיצומה או אחרי מסירה", status: 400 };
  }
  if (input.hasOpenDispute) {
    return { ok: false, error: "כבר יש מחלוקת פתוחה על ההזמנה הזו", status: 409 };
  }
  return { ok: true };
}

/** True if a photo URL is a stored upload or https image, not a script URL. */
export function isAllowedPhotoUrl(url: string): boolean {
  return url.startsWith("/uploads/") || url.startsWith("https://");
}

export type DisputeInputResult =
  | { ok: true; reason: DisputeReason; description: string; photos: string[] }
  | { ok: false; error: string };

/** Validates reason, description, and up to five photo URLs. */
export function parseDisputeInput(body: {
  reason?: unknown;
  description?: unknown;
  photos?: unknown;
}): DisputeInputResult {
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!(DISPUTE_REASONS as readonly string[]).includes(reason)) {
    return { ok: false, error: "יש לבחור סיבה למחלוקת" };
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return { ok: false, error: "יש לתאר את המחלוקת" };
  }
  if (description.length > MAX_DISPUTE_DESCRIPTION) {
    return { ok: false, error: `התיאור ארוך מדי (עד ${MAX_DISPUTE_DESCRIPTION} תווים)` };
  }

  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  if (rawPhotos.length > MAX_DISPUTE_PHOTOS) {
    return { ok: false, error: `אפשר לצרף עד ${MAX_DISPUTE_PHOTOS} תמונות` };
  }
  const photos: string[] = [];
  for (const photo of rawPhotos) {
    if (typeof photo !== "string" || !photo.trim()) {
      return { ok: false, error: "כתובת תמונה לא תקינה" };
    }
    const url = photo.trim();
    if (!isAllowedPhotoUrl(url)) {
      return { ok: false, error: "כתובת תמונה לא תקינה" };
    }
    if (!photos.includes(url)) photos.push(url);
  }

  return { ok: true, reason: reason as DisputeReason, description, photos };
}

export type ResolveDisputeResult =
  | {
      ok: true;
      status: "UNDER_REVIEW" | "CLOSED" | "RESOLVED_RELEASE" | "RESOLVED_REFUND" | "RESOLVED_SPLIT";
      paymentAction: "RELEASE" | "REFUND" | "SPLIT" | null;
      orderStatus: "COMPLETED" | "CANCELLED" | null;
      splitBuyerAmount: number | null;
    }
  | { ok: false; error: string };

/** Maps an admin action to dispute status, optional payment intent, and order status. */
export function resolveDisputeAction(input: {
  action: string;
  orderPrice: number;
  splitBuyerAmount?: unknown;
}): ResolveDisputeResult {
  if (!(ADMIN_DISPUTE_ACTIONS as readonly string[]).includes(input.action)) {
    return { ok: false, error: "פעולה לא חוקית" };
  }

  if (input.action === "review") {
    return { ok: true, status: "UNDER_REVIEW", paymentAction: null, orderStatus: null, splitBuyerAmount: null };
  }
  if (input.action === "close") {
    return { ok: true, status: "CLOSED", paymentAction: null, orderStatus: null, splitBuyerAmount: null };
  }
  if (input.action === "release") {
    return { ok: true, status: "RESOLVED_RELEASE", paymentAction: "RELEASE", orderStatus: "COMPLETED", splitBuyerAmount: null };
  }
  if (input.action === "refund") {
    return { ok: true, status: "RESOLVED_REFUND", paymentAction: "REFUND", orderStatus: "CANCELLED", splitBuyerAmount: null };
  }

  const split = typeof input.splitBuyerAmount === "number"
    ? input.splitBuyerAmount
    : typeof input.splitBuyerAmount === "string"
      ? Number(input.splitBuyerAmount)
      : NaN;
  if (!Number.isFinite(split) || split < 0 || split > input.orderPrice) {
    return { ok: false, error: "סכום הפיצול חייב להיות בין 0 למחיר ההזמנה" };
  }
  return {
    ok: true,
    status: "RESOLVED_SPLIT",
    paymentAction: "SPLIT",
    orderStatus: "COMPLETED",
    splitBuyerAmount: split,
  };
}
