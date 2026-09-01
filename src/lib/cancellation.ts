/** Free-cancel window before the booked visit, in hours. */
export const FREE_CANCEL_HOURS = 24;
/** Late-cancel fee never exceeds this amount, in NIS. */
export const CANCELLATION_FEE_CAP_NIS = 50;
/** Assumed visit length when the order has no slot (platform default is two hours). */
export const DEFAULT_VISIT_HOURS = 2;

export const CANCELLATION_FEE_STATUSES = ["NONE", "OWED", "COLLECTED", "WAIVED"] as const;
export type CancellationFeeStatus = (typeof CANCELLATION_FEE_STATUSES)[number];

export type BuyerCancelKind = "FREE" | "LATE_FEE" | "DISPUTE_ONLY" | "NOT_CANCELLABLE";

export const CANCELLATION_FEE_STATUS_LABELS: Record<CancellationFeeStatus, string> = {
  NONE: "אין חוב",
  OWED: "חוב רשום",
  COLLECTED: "נגבה",
  WAIVED: "ויתור",
};

/** Short checkout / booking disclosure. Home visits are not generic 14-day cooling-off. */
export const CANCELLATION_CHECKOUT_NOTE =
  "ביטול חינם עד 24 שעות לפני חלון הביקור. אחר כך דמי ביטול: שעת עבודה אחת או ₪50 — הנמוך מביניהם (החוב נרשם גם בלי סליקה בפלטפורמה). אחרי תחילת העבודה אי אפשר לבטל לבד — פותחים מחלוקת. ביקור בית במועד שנקבע אינו 14 ימי ביטול של מכר מרחוק.";

export const BUYER_CANCEL_DISPUTE_ERROR = "אחרי תחילת העבודה אי אפשר לבטל — אפשר לפתוח מחלוקת";
export const BUYER_CANCEL_BLOCKED_ERROR = "לא ניתן לבטל הזמנה זו";
export const SELLER_DECLINE_BLOCKED_ERROR = "אפשר לדחות הזמנה רק לפני תחילת העבודה";

export type DateLike = Date | string | null | undefined;

export type CancelPatchData = {
  status: "CANCELLED";
  cancelledAt: Date;
  cancelledById: string;
  cancellationFee: number;
  cancellationFeeStatus: CancellationFeeStatus;
};

export type CancelPatchResult =
  | { ok: true; data: CancelPatchData }
  | { ok: false; error: string; status: number };

/** Parses a slot timestamp. Returns null if missing or invalid. */
export function asSlotDate(value: DateLike): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Rounds a NIS amount to agorot. */
export function roundNis(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100) / 100;
}

/** Instant when free cancel ends: 24 hours before the booked window start. */
export function freeCancelCutoffAt(slotStart: DateLike): Date | null {
  const start = asSlotDate(slotStart);
  if (!start) return null;
  return new Date(start.getTime() - FREE_CANCEL_HOURS * 60 * 60 * 1000);
}

/** Visit length in hours, falling back to the two-hour platform slot. */
export function visitHours(slotStart: DateLike, slotEnd: DateLike): number {
  const start = asSlotDate(slotStart);
  const end = asSlotDate(slotEnd);
  if (!start || !end) return DEFAULT_VISIT_HOURS;
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours > 0 ? hours : DEFAULT_VISIT_HOURS;
}

/** One hour of the booked work, from the order price and visit length. */
export function hourOfWorkNis(price: number, slotStart: DateLike, slotEnd: DateLike): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return roundNis(price / visitHours(slotStart, slotEnd));
}

/** Late-cancel fee: one hour of work or ₪50, whichever is lower. */
export function lateCancellationFeeNis(price: number, slotStart: DateLike, slotEnd: DateLike): number {
  return roundNis(Math.min(hourOfWorkNis(price, slotStart, slotEnd), CANCELLATION_FEE_CAP_NIS));
}

export type BuyerCancelEvaluation = {
  kind: BuyerCancelKind;
  allowed: boolean;
  fee: number;
  cutoffAt: Date | null;
  error?: string;
};

/** Decides whether a buyer may cancel and what fee (if any) to record. */
export function evaluateBuyerCancel(input: {
  status: string;
  price: number;
  slotStart: DateLike;
  slotEnd: DateLike;
  now?: Date;
}): BuyerCancelEvaluation {
  const cutoffAt = freeCancelCutoffAt(input.slotStart);

  if (input.status === "COMPLETED" || input.status === "CANCELLED") {
    return { kind: "NOT_CANCELLABLE", allowed: false, fee: 0, cutoffAt, error: BUYER_CANCEL_BLOCKED_ERROR };
  }

  if (input.status !== "PENDING") {
    return { kind: "DISPUTE_ONLY", allowed: false, fee: 0, cutoffAt, error: BUYER_CANCEL_DISPUTE_ERROR };
  }

  const now = input.now ?? new Date();
  if (!cutoffAt || now.getTime() < cutoffAt.getTime()) {
    return { kind: "FREE", allowed: true, fee: 0, cutoffAt };
  }

  return {
    kind: "LATE_FEE",
    allowed: true,
    fee: lateCancellationFeeNis(input.price, input.slotStart, input.slotEnd),
    cutoffAt,
  };
}

/** Prisma fields for a buyer cancel from PENDING, including a recorded fee when late. */
export function buyerCancelPatch(input: {
  status: string;
  price: number;
  slotStart: DateLike;
  slotEnd: DateLike;
  actorId: string;
  now?: Date;
}): CancelPatchResult {
  const now = input.now ?? new Date();
  const evaluation = evaluateBuyerCancel({ ...input, now });
  if (!evaluation.allowed) {
    return { ok: false, error: evaluation.error || BUYER_CANCEL_BLOCKED_ERROR, status: 403 };
  }
  return {
    ok: true,
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancelledById: input.actorId,
      cancellationFee: evaluation.fee,
      cancellationFeeStatus: evaluation.fee > 0 ? "OWED" : "NONE",
    },
  };
}

/** Prisma fields for a daddy declining a PENDING order — no fee. */
export function sellerDeclinePatch(input: {
  status: string;
  actorId: string;
  now?: Date;
}): CancelPatchResult {
  if (input.status !== "PENDING") {
    return { ok: false, error: SELLER_DECLINE_BLOCKED_ERROR, status: 403 };
  }
  const now = input.now ?? new Date();
  return {
    ok: true,
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancelledById: input.actorId,
      cancellationFee: 0,
      cancellationFeeStatus: "NONE",
    },
  };
}
