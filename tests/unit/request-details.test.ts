import { describe, it, expect } from "vitest";
import {
  MAX_REQUEST_PHOTOS,
  canSeeRequestStreet,
  isRequestPhotoUrl,
  parseRequestDetails,
  preferredWindowLabel,
  redactRequestStreet,
} from "@/lib/request-details";

const photo = "/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg";

const request = {
  buyerId: "buyer-1",
  selectedResponseId: "quote-1",
  street: "הרצל 12",
  responses: [{ id: "quote-1", sellerId: "seller-1", selected: true }],
};

describe("parseRequestDetails", () => {
  it("accepts street, floor, time-of-day, and up to four uploaded photos", () => {
    const result = parseRequestDetails({
      street: "  הרצל 12  ",
      floor: "3",
      preferredWindow: "MORNING",
      photos: [photo, "/uploads/11111111-2222-3333-4444-555555555555.png"],
    });
    expect(result).toEqual({
      ok: true,
      value: {
        street: "הרצל 12",
        floor: "3",
        preferredWindow: "MORNING",
        photos: [photo, "/uploads/11111111-2222-3333-4444-555555555555.png"],
      },
    });
  });

  it("treats missing extras as empty optional fields", () => {
    expect(parseRequestDetails({})).toEqual({
      ok: true,
      value: { street: null, floor: null, preferredWindow: null, photos: [] },
    });
  });

  it("rejects a remote or PDF photo URL", () => {
    expect(parseRequestDetails({ photos: ["https://example.com/leak.jpg"] }).ok).toBe(false);
    expect(parseRequestDetails({ photos: [photo.replace(".jpg", ".pdf")] }).ok).toBe(false);
  });

  it("rejects more than four photos", () => {
    const photos = Array.from(
      { length: MAX_REQUEST_PHOTOS + 1 },
      (_, i) => `/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}.jpg`
    );
    const result = parseRequestDetails({ photos });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/4/);
  });

  it("rejects an unknown preferred window", () => {
    const result = parseRequestDetails({ preferredWindow: "NIGHT" });
    expect(result.ok).toBe(false);
  });
});

describe("isRequestPhotoUrl", () => {
  it("allows jpeg/png/webp uploads and rejects pdf", () => {
    expect(isRequestPhotoUrl(photo)).toBe(true);
    expect(isRequestPhotoUrl("/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp")).toBe(true);
    expect(isRequestPhotoUrl("/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf")).toBe(false);
  });
});

describe("canSeeRequestStreet", () => {
  it("lets the buyer, admin, and accepted seller see the street", () => {
    expect(canSeeRequestStreet({ id: "buyer-1", role: "BUYER" }, request)).toBe(true);
    expect(canSeeRequestStreet({ id: "admin-1", role: "ADMIN" }, request)).toBe(true);
    expect(canSeeRequestStreet({ id: "seller-1", role: "SELLER" }, request)).toBe(true);
  });

  it("hides the street from other quoting sellers until accept", () => {
    const open = { ...request, selectedResponseId: null, responses: [{ id: "quote-2", sellerId: "seller-2", selected: false }] };
    expect(canSeeRequestStreet({ id: "seller-2", role: "SELLER" }, open)).toBe(false);
    expect(canSeeRequestStreet({ id: "seller-9", role: "SELLER" }, request)).toBe(false);
  });
});

describe("redactRequestStreet", () => {
  it("blanks street for a seller who has not been accepted", () => {
    const redacted = redactRequestStreet(request, { id: "seller-9", role: "SELLER" });
    expect(redacted.street).toBeNull();
    expect(redacted.streetVisible).toBe(false);
    expect(redacted.hasStreet).toBe(true);
  });

  it("keeps street for the buyer", () => {
    const redacted = redactRequestStreet(request, { id: "buyer-1", role: "BUYER" });
    expect(redacted.street).toBe("הרצל 12");
    expect(redacted.streetVisible).toBe(true);
    expect(redacted.hasStreet).toBe(true);
  });
});

describe("preferredWindowLabel", () => {
  it("returns Hebrew labels", () => {
    expect(preferredWindowLabel("MORNING")).toBe("בוקר");
    expect(preferredWindowLabel("AFTERNOON")).toBe("אחר הצהריים");
    expect(preferredWindowLabel("WEEKEND")).toBe("סוף שבוע");
    expect(preferredWindowLabel(null)).toBe("");
  });
});
