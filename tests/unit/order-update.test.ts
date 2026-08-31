import { describe, it, expect } from "vitest";
import { updateOrderSchema } from "@/lib/order-update";

describe("updateOrderSchema", () => {
  it("accepts the seller accept-order payload", () => {
    expect(updateOrderSchema.parse({ status: "IN_PROGRESS" })).toEqual({
      status: "IN_PROGRESS",
    });
  });

  it("accepts the other order-page status values", () => {
    for (const status of ["DELIVERED", "COMPLETED", "CANCELLED", "REVISION"]) {
      expect(updateOrderSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects the old lowercase statuses that blocked accept", () => {
    expect(updateOrderSchema.safeParse({ status: "in_progress" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ status: "accepted" }).success).toBe(false);
  });
});
