import { describe, it, expect } from "vitest";
import {
  MAX_DELIVERY_NOTE,
  MAX_DELIVERY_PHOTOS,
  parseDeliveryEvidence,
} from "@/lib/delivery-photos";

const photo = "/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg";
const photo2 = "/uploads/11111111-2222-3333-4444-555555555555.png";

describe("parseDeliveryEvidence", () => {
  it("accepts 1–6 uploaded photos and an optional note", () => {
    expect(parseDeliveryEvidence({ photos: [photo], note: "  החלפתי את הברז  " })).toEqual({
      ok: true,
      value: { photos: [photo], note: "החלפתי את הברז" },
    });
    expect(parseDeliveryEvidence({ photos: [photo, photo2] })).toEqual({
      ok: true,
      value: { photos: [photo, photo2], note: null },
    });
  });

  it("rejects zero photos", () => {
    const result = parseDeliveryEvidence({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/תמונה/);
  });

  it("rejects more than six photos", () => {
    const photos = Array.from(
      { length: MAX_DELIVERY_PHOTOS + 1 },
      (_, i) => `/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}.jpg`
    );
    const result = parseDeliveryEvidence({ photos });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/6/);
  });

  it("rejects a remote URL, PDF, or javascript photo", () => {
    expect(parseDeliveryEvidence({ photos: ["https://example.com/leak.jpg"] }).ok).toBe(false);
    expect(parseDeliveryEvidence({ photos: [photo.replace(".jpg", ".pdf")] }).ok).toBe(false);
    expect(parseDeliveryEvidence({ photos: ["javascript:alert(1)"] }).ok).toBe(false);
  });

  it("deduplicates photo URLs", () => {
    expect(parseDeliveryEvidence({ photos: [photo, photo] })).toEqual({
      ok: true,
      value: { photos: [photo], note: null },
    });
  });

  it("rejects a note that is too long", () => {
    const result = parseDeliveryEvidence({ photos: [photo], note: "א".repeat(MAX_DELIVERY_NOTE + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/280/);
  });
});
