import { describe, it, expect } from "vitest";
import { standingJobPatchSchema, standingJobWriteSchema } from "@/lib/standing-job-api";

describe("standingJobWriteSchema", () => {
  const valid = {
    sellerId: "seed-user-seller1",
    serviceSlug: "lawn-mowing",
    frequency: "WEEKLY" as const,
    weekday: 0,
    startMin: 16 * 60,
  };

  it("accepts a weekly standing job from a price list", () => {
    expect(standingJobWriteSchema.parse(valid)).toMatchObject(valid);
  });

  it("rejects an unknown frequency", () => {
    expect(standingJobWriteSchema.safeParse({ ...valid, frequency: "DAILY" }).success).toBe(false);
  });

  it("rejects extra payment-hold fields so the series cannot be one giant charge", () => {
    expect(standingJobWriteSchema.safeParse({ ...valid, prepaidTotal: 960 }).success).toBe(false);
  });
});

describe("standingJobPatchSchema", () => {
  it("accepts pause, resume, and cancel", () => {
    expect(standingJobPatchSchema.parse({ action: "pause" }).action).toBe("pause");
    expect(standingJobPatchSchema.parse({ action: "resume" }).action).toBe("resume");
    expect(standingJobPatchSchema.parse({ action: "cancel" }).action).toBe("cancel");
  });
});
