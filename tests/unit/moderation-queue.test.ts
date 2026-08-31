import { describe, it, expect } from "vitest";
import {
  mergeQueueItems,
  filterQueueItems,
  resolveFlagAction,
  flagToQueueItem,
  disputeToQueueItem,
} from "@/lib/moderation-queue";

const names = {
  "buyer-1": "קונה",
  "seller-1": "אבא",
  "flagger-1": "מדווח",
};

describe("mergeQueueItems", () => {
  it("includes existing review flags so they appear in the admin queue", () => {
    const items = mergeQueueItems(
      [],
      [{
        id: "flag-1",
        status: "OPEN",
        createdAt: "2026-08-01T10:00:00.000Z",
        reason: "spam",
        userId: "flagger-1",
        reviewId: "rev-1",
        review: { comment: "מעולה", userId: "buyer-1", gig: { title: "הרכבה", sellerId: "seller-1" } },
      }],
      names
    );
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("REVIEW_FLAG");
    expect(items[0].status).toBe("OPEN");
    expect(items[0].subjectUser?.id).toBe("buyer-1");
  });

  it("sorts newest first across types", () => {
    const items = mergeQueueItems(
      [{
        id: "d1",
        status: "OPEN",
        createdAt: "2026-08-01T09:00:00.000Z",
        reason: "QUALITY",
        description: "עקום",
        orderId: "ord-1",
        openerId: "buyer-1",
        order: { price: 150, buyerId: "buyer-1", sellerId: "seller-1", title: "ארון" },
      }],
      [{
        id: "f1",
        status: "OPEN",
        createdAt: "2026-08-01T12:00:00.000Z",
        reason: "fake",
        userId: "flagger-1",
        reviewId: "rev-1",
      }],
      names
    );
    expect(items.map((i) => i.id)).toEqual(["f1", "d1"]);
  });
});

describe("filterQueueItems", () => {
  const mixed = [
    disputeToQueueItem({
      id: "d-open",
      status: "OPEN",
      createdAt: "2026-08-01T09:00:00.000Z",
      reason: "NO_SHOW",
      description: "לא הגיע",
      orderId: "ord-1",
      openerId: "buyer-1",
      order: { price: 80, buyerId: "buyer-1", sellerId: "seller-1" },
    }, names),
    flagToQueueItem({
      id: "f-closed",
      status: "DISMISSED",
      createdAt: "2026-08-01T08:00:00.000Z",
      reason: "ok",
      userId: "flagger-1",
      reviewId: "rev-1",
    }, names),
  ];

  it("keeps only open disputes", () => {
    const openDisputes = filterQueueItems(mixed, "DISPUTE", "OPEN");
    expect(openDisputes.map((i) => i.id)).toEqual(["d-open"]);
  });

  it("keeps closed flags", () => {
    const closed = filterQueueItems(mixed, "REVIEW_FLAG", "CLOSED");
    expect(closed.map((i) => i.id)).toEqual(["f-closed"]);
  });

  it("returns no ID checks until that flow exists", () => {
    expect(filterQueueItems(mixed, "ID_CHECK", "ALL")).toEqual([]);
  });
});

describe("resolveFlagAction", () => {
  it("hides the review when the flag is upheld", () => {
    expect(resolveFlagAction("hide")).toEqual({ ok: true, status: "RESOLVED", hideReview: true });
  });

  it("dismisses without hiding", () => {
    expect(resolveFlagAction("dismiss")).toEqual({ ok: true, status: "DISMISSED", hideReview: false });
  });

  it("rejects an unknown action", () => {
    expect(resolveFlagAction("explode").ok).toBe(false);
  });
});
