import { describe, it, expect } from "vitest";
import {
  canOpenDispute,
  isDisputableStatus,
  isOpenDisputeStatus,
  parseDisputeInput,
  resolveDisputeAction,
  orderHasOpenDispute,
  MAX_DISPUTE_PHOTOS,
} from "@/lib/disputes";

describe("isDisputableStatus", () => {
  it("allows in-progress and delivered jobs", () => {
    expect(isDisputableStatus("IN_PROGRESS")).toBe(true);
    expect(isDisputableStatus("DELIVERED")).toBe(true);
  });

  it("rejects other statuses", () => {
    expect(isDisputableStatus("PENDING")).toBe(false);
    expect(isDisputableStatus("COMPLETED")).toBe(false);
    expect(isDisputableStatus("CANCELLED")).toBe(false);
  });
});

describe("canOpenDispute", () => {
  const base = {
    orderStatus: "IN_PROGRESS",
    actorId: "buyer-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    hasOpenDispute: false,
  };

  it("allows the buyer on an in-progress order", () => {
    expect(canOpenDispute(base)).toEqual({ ok: true });
  });

  it("allows the daddy on a delivered order", () => {
    expect(canOpenDispute({ ...base, actorId: "seller-1", orderStatus: "DELIVERED" })).toEqual({ ok: true });
  });

  it("rejects a third party", () => {
    const result = canOpenDispute({ ...base, actorId: "stranger" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("rejects completed jobs", () => {
    const result = canOpenDispute({ ...base, orderStatus: "COMPLETED" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a second open dispute", () => {
    const result = canOpenDispute({ ...base, hasOpenDispute: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

describe("parseDisputeInput", () => {
  it("accepts a valid quality dispute with photos", () => {
    const result = parseDisputeInput({
      reason: "QUALITY",
      description: "הדלת עקומה",
      photos: ["/uploads/a.jpg", "/uploads/b.png"],
    });
    expect(result).toEqual({
      ok: true,
      reason: "QUALITY",
      description: "הדלת עקומה",
      photos: ["/uploads/a.jpg", "/uploads/b.png"],
    });
  });

  it("rejects a missing reason", () => {
    const result = parseDisputeInput({ description: "בעיה" });
    expect(result.ok).toBe(false);
  });

  it("rejects javascript photo URLs", () => {
    const result = parseDisputeInput({
      reason: "DAMAGE",
      description: "שבר",
      photos: ["javascript:alert(1)"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects more than five photos", () => {
    const result = parseDisputeInput({
      reason: "NO_SHOW",
      description: "לא הגיע",
      photos: Array.from({ length: MAX_DISPUTE_PHOTOS + 1 }, (_, i) => `/uploads/${i}.jpg`),
    });
    expect(result.ok).toBe(false);
  });

  it("dedupes photo URLs", () => {
    const result = parseDisputeInput({
      reason: "DIFFERENT_PRICE",
      description: "ביקש תוספת במקום",
      photos: ["/uploads/a.jpg", "/uploads/a.jpg"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.photos).toEqual(["/uploads/a.jpg"]);
  });
});

describe("resolveDisputeAction", () => {
  it("maps release to completed with a payment intent", () => {
    expect(resolveDisputeAction({ action: "release", orderPrice: 200 })).toEqual({
      ok: true,
      status: "RESOLVED_RELEASE",
      paymentAction: "RELEASE",
      orderStatus: "COMPLETED",
      splitBuyerAmount: null,
    });
  });

  it("maps refund to cancelled", () => {
    expect(resolveDisputeAction({ action: "refund", orderPrice: 200 })).toMatchObject({
      status: "RESOLVED_REFUND",
      paymentAction: "REFUND",
      orderStatus: "CANCELLED",
    });
  });

  it("rejects a split above the order price", () => {
    const result = resolveDisputeAction({ action: "split", orderPrice: 100, splitBuyerAmount: 150 });
    expect(result.ok).toBe(false);
  });

  it("accepts a split within the price", () => {
    const result = resolveDisputeAction({ action: "split", orderPrice: 100, splitBuyerAmount: 40 });
    expect(result).toMatchObject({
      ok: true,
      status: "RESOLVED_SPLIT",
      splitBuyerAmount: 40,
    });
  });
});

describe("isOpenDisputeStatus", () => {
  it("treats open and under-review as open", () => {
    expect(isOpenDisputeStatus("OPEN")).toBe(true);
    expect(isOpenDisputeStatus("UNDER_REVIEW")).toBe(true);
    expect(isOpenDisputeStatus("CLOSED")).toBe(false);
  });
});

describe("orderHasOpenDispute", () => {
  it("is true when any dispute is still waiting on admin", () => {
    expect(orderHasOpenDispute([{ status: "CLOSED" }, { status: "OPEN" }])).toBe(true);
  });

  it("is false with no disputes or only resolved ones", () => {
    expect(orderHasOpenDispute(undefined)).toBe(false);
    expect(orderHasOpenDispute([])).toBe(false);
    expect(orderHasOpenDispute([{ status: "RESOLVED_REFUND" }])).toBe(false);
  });
});
