import { describe, it, expect } from "vitest";
import { createGigSchema } from "@/lib/gig-create";

const validBody = {
  title: "הרכבת ארון",
  description: "מרכיב ארונות מאיקאה במקום.",
  categoryId: "home-maintenance",
  image: null,
  tiers: [
    {
      tier: "BASIC",
      title: "Basic",
      description: "רהיט אחד",
      price: 150,
      deliveryDays: 1,
      revisions: 1,
    },
  ],
  faqs: [],
  requirements: [],
};

describe("createGigSchema", () => {
  it("accepts the create-gig form payload", () => {
    expect(createGigSchema.parse(validBody)).toMatchObject({
      title: validBody.title,
      categoryId: "home-maintenance",
    });
  });

  it("rejects the old category field the form never sent", () => {
    const result = createGigSchema.safeParse({
      ...validBody,
      category: "home-maintenance",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing price package", () => {
    const result = createGigSchema.safeParse({ ...validBody, tiers: [] });
    expect(result.success).toBe(false);
  });
});
