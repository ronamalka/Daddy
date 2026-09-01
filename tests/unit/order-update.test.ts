import { describe, it, expect } from "vitest";
import { updateOrderSchema } from "@/lib/order-update";

const photo = "/uploads/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg";

describe("updateOrderSchema", () => {
  it("accepts the seller accept-order payload", () => {
    expect(updateOrderSchema.parse({ status: "IN_PROGRESS" })).toEqual({
      status: "IN_PROGRESS",
    });
  });

  it("accepts the other order-page status values without extra fields", () => {
    for (const status of ["COMPLETED", "CANCELLED"]) {
      expect(updateOrderSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("requires 1–6 uploaded photos when marking delivered", () => {
    expect(updateOrderSchema.safeParse({ status: "DELIVERED" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ status: "DELIVERED", photos: [] }).success).toBe(false);
    expect(
      updateOrderSchema.parse({ status: "DELIVERED", photos: [photo], note: "החלפתי את הברז" })
    ).toEqual({
      status: "DELIVERED",
      photos: [photo],
      note: "החלפתי את הברז",
    });
  });

  it("rejects extra keys on a non-delivery status", () => {
    expect(
      updateOrderSchema.safeParse({ status: "IN_PROGRESS", photos: [photo] }).success
    ).toBe(false);
  });

  it("rejects a remote photo URL on deliver", () => {
    expect(
      updateOrderSchema.safeParse({
        status: "DELIVERED",
        photos: ["https://example.com/leak.jpg"],
      }).success
    ).toBe(false);
  });

  it("rejects the old lowercase statuses that blocked accept", () => {
    expect(updateOrderSchema.safeParse({ status: "in_progress" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ status: "accepted" }).success).toBe(false);
  });
});
