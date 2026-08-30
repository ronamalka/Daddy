import { describe, it, expect } from "vitest";
import { validateAcceptQuote } from "@/lib/accept-quote";

const request = {
  id: "req-1",
  buyerId: "buyer-1",
  status: "OPEN",
};

const quote = {
  id: "quote-1",
  requestId: "req-1",
  sellerId: "seller-1",
  proposedPrice: 180,
};

describe("validateAcceptQuote", () => {
  it("allows the buyer to accept an open priced quote", () => {
    expect(
      validateAcceptQuote({
        actorId: "buyer-1",
        actorRole: "BUYER",
        request,
        response: quote,
      })
    ).toEqual({ ok: true });
  });

  it("rejects a seller trying to accept", () => {
    const result = validateAcceptQuote({
      actorId: "seller-1",
      actorRole: "SELLER",
      request,
      response: quote,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("rejects a different buyer", () => {
    const result = validateAcceptQuote({
      actorId: "buyer-2",
      actorRole: "BUYER",
      request,
      response: quote,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("rejects when the request is no longer open", () => {
    const result = validateAcceptQuote({
      actorId: "buyer-1",
      actorRole: "BUYER",
      request: { ...request, status: "IN_PROGRESS" },
      response: quote,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("rejects a quote without a price", () => {
    const result = validateAcceptQuote({
      actorId: "buyer-1",
      actorRole: "BUYER",
      request,
      response: { ...quote, proposedPrice: null },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a missing quote", () => {
    const result = validateAcceptQuote({
      actorId: "buyer-1",
      actorRole: "BUYER",
      request,
      response: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("allows an admin to accept on behalf of the buyer", () => {
    expect(
      validateAcceptQuote({
        actorId: "admin-1",
        actorRole: "ADMIN",
        request,
        response: quote,
      })
    ).toEqual({ ok: true });
  });
});
