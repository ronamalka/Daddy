export type QuoteRequest = {
  id: string;
  buyerId: string;
  status: string;
};

export type QuoteResponse = {
  id: string;
  requestId: string;
  sellerId: string;
  proposedPrice: number | null;
};

export type AcceptQuoteResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Checks that this buyer (or admin) can accept this open quote with a price. */
export function validateAcceptQuote(input: {
  actorId: string;
  actorRole: string;
  request: QuoteRequest | null;
  response: QuoteResponse | null;
}): AcceptQuoteResult {
  if (!input.request) {
    return { ok: false, status: 404, error: "הבקשה לא נמצאה" };
  }

  if (input.actorRole !== "BUYER" && input.actorRole !== "ADMIN") {
    return { ok: false, status: 403, error: "רק הלקוח יכול לקבל הצעה" };
  }

  if (input.actorRole !== "ADMIN" && input.request.buyerId !== input.actorId) {
    return { ok: false, status: 403, error: "רק הלקוח יכול לקבל הצעה" };
  }

  if (input.request.status !== "OPEN") {
    return { ok: false, status: 409, error: "הבקשה כבר לא פתוחה" };
  }

  if (!input.response || input.response.requestId !== input.request.id) {
    return { ok: false, status: 404, error: "ההצעה לא נמצאה" };
  }

  if (input.response.proposedPrice == null || input.response.proposedPrice <= 0) {
    return { ok: false, status: 400, error: "לכל הצעה שמתקבלת חייב להיות מחיר" };
  }

  return { ok: true };
}
