import { describe, it, expect } from "vitest";
import {
  evaluateBuyerCancel as evaluateFromOrders,
  buyerCancelPatch as buyerCancelFromOrders,
  lateCancellationFeeNis as feeFromOrders,
} from "../../services/orders/src/lib/cancellation";
import {
  BUYER_CANCEL_DISPUTE_ERROR,
  CANCELLATION_FEE_CAP_NIS,
  DEFAULT_VISIT_HOURS,
  FREE_CANCEL_HOURS,
  buyerCancelPatch,
  evaluateBuyerCancel,
  freeCancelCutoffAt,
  hourOfWorkNis,
  lateCancellationFeeNis,
  sellerDeclinePatch,
  visitHours,
} from "@/lib/cancellation";

const slotStart = new Date("2026-09-10T10:00:00.000Z");
const slotEnd = new Date("2026-09-10T12:00:00.000Z");
const twoDaysBefore = new Date("2026-09-08T10:00:00.000Z");
const twelveHoursBefore = new Date("2026-09-09T22:00:00.000Z");

const pending = {
  status: "PENDING",
  price: 200,
  slotStart,
  slotEnd,
};

describe("freeCancelCutoffAt", () => {
  it(`is ${FREE_CANCEL_HOURS} hours before the booked window`, () => {
    expect(freeCancelCutoffAt(slotStart)).toEqual(new Date("2026-09-09T10:00:00.000Z"));
  });

  it("returns null when there is no slot", () => {
    expect(freeCancelCutoffAt(null)).toBeNull();
  });
});

describe("lateCancellationFeeNis", () => {
  it("charges one hour of a two-hour visit when that hour is under the cap", () => {
    expect(visitHours(slotStart, slotEnd)).toBe(DEFAULT_VISIT_HOURS);
    expect(hourOfWorkNis(80, slotStart, slotEnd)).toBe(40);
    expect(lateCancellationFeeNis(80, slotStart, slotEnd)).toBe(40);
  });

  it(`caps the fee at ₪${CANCELLATION_FEE_CAP_NIS} when one hour costs more`, () => {
    expect(hourOfWorkNis(200, slotStart, slotEnd)).toBe(100);
    expect(lateCancellationFeeNis(200, slotStart, slotEnd)).toBe(CANCELLATION_FEE_CAP_NIS);
  });

  it("uses the two-hour default when the slot is missing", () => {
    expect(lateCancellationFeeNis(80, null, null)).toBe(40);
  });
});

describe("evaluateBuyerCancel", () => {
  it("is free more than 24 hours before the slot", () => {
    expect(evaluateBuyerCancel({ ...pending, now: twoDaysBefore })).toMatchObject({
      kind: "FREE",
      allowed: true,
      fee: 0,
    });
  });

  it("charges a recorded fee inside the 24-hour window", () => {
    expect(evaluateBuyerCancel({ ...pending, now: twelveHoursBefore })).toMatchObject({
      kind: "LATE_FEE",
      allowed: true,
      fee: CANCELLATION_FEE_CAP_NIS,
    });
  });

  it("is free when PENDING has no slot", () => {
    expect(evaluateBuyerCancel({
      status: "PENDING",
      price: 200,
      slotStart: null,
      slotEnd: null,
      now: twelveHoursBefore,
    })).toMatchObject({ kind: "FREE", allowed: true, fee: 0 });
  });

  it("blocks unilateral cancel after work starts", () => {
    const result = evaluateBuyerCancel({ ...pending, status: "IN_PROGRESS", now: twoDaysBefore });
    expect(result).toMatchObject({
      kind: "DISPUTE_ONLY",
      allowed: false,
      fee: 0,
      error: BUYER_CANCEL_DISPUTE_ERROR,
    });
  });

  it("blocks cancel on delivered and completed jobs", () => {
    expect(evaluateBuyerCancel({ ...pending, status: "DELIVERED" }).kind).toBe("DISPUTE_ONLY");
    expect(evaluateBuyerCancel({ ...pending, status: "COMPLETED" }).kind).toBe("NOT_CANCELLABLE");
    expect(evaluateBuyerCancel({ ...pending, status: "CANCELLED" }).kind).toBe("NOT_CANCELLABLE");
  });
});

describe("buyerCancelPatch", () => {
  it("records an owed fee on a late cancel even without escrow", () => {
    const result = buyerCancelPatch({
      ...pending,
      actorId: "buyer-1",
      now: twelveHoursBefore,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        status: "CANCELLED",
        cancelledById: "buyer-1",
        cancellationFee: CANCELLATION_FEE_CAP_NIS,
        cancellationFeeStatus: "OWED",
      });
    }
  });

  it("records no fee on a free cancel", () => {
    const result = buyerCancelPatch({
      ...pending,
      actorId: "buyer-1",
      now: twoDaysBefore,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cancellationFee).toBe(0);
      expect(result.data.cancellationFeeStatus).toBe("NONE");
    }
  });

  it("rejects cancel after work starts", () => {
    const result = buyerCancelPatch({
      ...pending,
      status: "IN_PROGRESS",
      actorId: "buyer-1",
    });
    expect(result).toEqual({
      ok: false,
      error: BUYER_CANCEL_DISPUTE_ERROR,
      status: 403,
    });
  });
});

describe("sellerDeclinePatch", () => {
  it("declines PENDING with no fee", () => {
    const result = sellerDeclinePatch({ status: "PENDING", actorId: "seller-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cancellationFee).toBe(0);
      expect(result.data.cancellationFeeStatus).toBe("NONE");
    }
  });

  it("rejects a decline after work starts", () => {
    expect(sellerDeclinePatch({ status: "IN_PROGRESS", actorId: "seller-1" }).ok).toBe(false);
  });
});

describe("orders-service copy", () => {
  it("matches the Next.js copy of the same rules", () => {
    expect(evaluateFromOrders({ ...pending, now: twoDaysBefore })).toEqual(
      evaluateBuyerCancel({ ...pending, now: twoDaysBefore })
    );
    expect(evaluateFromOrders({ ...pending, now: twelveHoursBefore })).toEqual(
      evaluateBuyerCancel({ ...pending, now: twelveHoursBefore })
    );
    expect(feeFromOrders(80, slotStart, slotEnd)).toBe(lateCancellationFeeNis(80, slotStart, slotEnd));
    expect(buyerCancelFromOrders({ ...pending, actorId: "b", now: twelveHoursBefore })).toEqual(
      buyerCancelPatch({ ...pending, actorId: "b", now: twelveHoursBefore })
    );
  });
});
