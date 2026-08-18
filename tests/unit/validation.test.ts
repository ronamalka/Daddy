import { describe, it, expect } from "vitest";

function validateRegistration(data: {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}) {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push("name is required");
  if (!data.email?.trim()) errors.push("email is required");
  if (data.email && !data.email.includes("@")) errors.push("invalid email format");
  if (!data.password) errors.push("password is required");
  if (data.password && data.password.length < 6) errors.push("password must be at least 6 characters");
  if (data.role && !["BUYER", "SELLER"].includes(data.role)) errors.push("invalid role");
  return errors;
}

function validateGigCreation(data: {
  title?: string;
  description?: string;
  categoryId?: string;
  tiers?: { tier: string; price: number; deliveryDays: number }[];
}) {
  const errors: string[] = [];
  if (!data.title?.trim()) errors.push("title is required");
  if (!data.description?.trim()) errors.push("description is required");
  if (!data.categoryId?.trim()) errors.push("categoryId is required");
  if (!data.tiers?.length) errors.push("at least one tier is required");
  if (data.tiers) {
    const validTiers = ["BASIC", "STANDARD", "PREMIUM"];
    for (const t of data.tiers) {
      if (!validTiers.includes(t.tier)) errors.push(`invalid tier: ${t.tier}`);
      if (t.price <= 0) errors.push(`price must be positive for ${t.tier}`);
      if (t.deliveryDays < 1) errors.push(`deliveryDays must be >= 1 for ${t.tier}`);
    }
  }
  return errors;
}

function validateOrderCreation(data: {
  gigId?: string;
  tier?: string;
  buyerId?: string;
  sellerId?: string;
}) {
  const errors: string[] = [];
  if (!data.gigId) errors.push("gigId is required");
  if (!data.tier) errors.push("tier is required");
  if (data.tier && !["BASIC", "STANDARD", "PREMIUM"].includes(data.tier))
    errors.push("invalid tier");
  if (data.buyerId && data.sellerId && data.buyerId === data.sellerId)
    errors.push("cannot order your own gig");
  return errors;
}

function validateReview(data: { rating?: number; comment?: string }) {
  const errors: string[] = [];
  if (data.rating === undefined) errors.push("rating is required");
  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5))
    errors.push("rating must be between 1 and 5");
  if (!data.comment?.trim()) errors.push("comment is required");
  return errors;
}

describe("Registration Validation", () => {
  it("passes with valid data", () => {
    const errors = validateRegistration({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "BUYER",
    });
    expect(errors).toEqual([]);
  });

  it("fails with missing name", () => {
    const errors = validateRegistration({
      email: "test@example.com",
      password: "password123",
    });
    expect(errors).toContain("name is required");
  });

  it("fails with missing email", () => {
    const errors = validateRegistration({
      name: "Test",
      password: "password123",
    });
    expect(errors).toContain("email is required");
  });

  it("fails with invalid email format", () => {
    const errors = validateRegistration({
      name: "Test",
      email: "not-an-email",
      password: "password123",
    });
    expect(errors).toContain("invalid email format");
  });

  it("fails with short password", () => {
    const errors = validateRegistration({
      name: "Test",
      email: "test@example.com",
      password: "123",
    });
    expect(errors).toContain("password must be at least 6 characters");
  });

  it("fails with invalid role", () => {
    const errors = validateRegistration({
      name: "Test",
      email: "test@example.com",
      password: "password123",
      role: "SUPERADMIN",
    });
    expect(errors).toContain("invalid role");
  });

  it("accepts SELLER role", () => {
    const errors = validateRegistration({
      name: "Test",
      email: "test@example.com",
      password: "password123",
      role: "SELLER",
    });
    expect(errors).toEqual([]);
  });
});

describe("Gig Creation Validation", () => {
  it("passes with valid data", () => {
    const errors = validateGigCreation({
      title: "My Gig",
      description: "A great gig",
      categoryId: "cat-1",
      tiers: [{ tier: "BASIC", price: 25, deliveryDays: 3 }],
    });
    expect(errors).toEqual([]);
  });

  it("fails with no tiers", () => {
    const errors = validateGigCreation({
      title: "My Gig",
      description: "A great gig",
      categoryId: "cat-1",
      tiers: [],
    });
    expect(errors).toContain("at least one tier is required");
  });

  it("fails with invalid tier name", () => {
    const errors = validateGigCreation({
      title: "My Gig",
      description: "desc",
      categoryId: "cat-1",
      tiers: [{ tier: "ULTRA", price: 25, deliveryDays: 3 }],
    });
    expect(errors).toContain("invalid tier: ULTRA");
  });

  it("fails with zero price", () => {
    const errors = validateGigCreation({
      title: "My Gig",
      description: "desc",
      categoryId: "cat-1",
      tiers: [{ tier: "BASIC", price: 0, deliveryDays: 3 }],
    });
    expect(errors).toContain("price must be positive for BASIC");
  });

  it("fails with missing title", () => {
    const errors = validateGigCreation({
      description: "desc",
      categoryId: "cat-1",
      tiers: [{ tier: "BASIC", price: 25, deliveryDays: 3 }],
    });
    expect(errors).toContain("title is required");
  });
});

describe("Order Validation", () => {
  it("passes with valid data", () => {
    const errors = validateOrderCreation({
      gigId: "gig-1",
      tier: "BASIC",
      buyerId: "buyer-1",
      sellerId: "seller-1",
    });
    expect(errors).toEqual([]);
  });

  it("fails when buying own gig", () => {
    const errors = validateOrderCreation({
      gigId: "gig-1",
      tier: "BASIC",
      buyerId: "same-user",
      sellerId: "same-user",
    });
    expect(errors).toContain("cannot order your own gig");
  });

  it("fails with invalid tier", () => {
    const errors = validateOrderCreation({
      gigId: "gig-1",
      tier: "GOLD",
    });
    expect(errors).toContain("invalid tier");
  });
});

describe("Review Validation", () => {
  it("passes with valid data", () => {
    const errors = validateReview({ rating: 5, comment: "Great work!" });
    expect(errors).toEqual([]);
  });

  it("fails with rating out of range", () => {
    const errors = validateReview({ rating: 6, comment: "Great!" });
    expect(errors).toContain("rating must be between 1 and 5");
  });

  it("fails with rating of 0", () => {
    const errors = validateReview({ rating: 0, comment: "Bad" });
    expect(errors).toContain("rating must be between 1 and 5");
  });

  it("fails with empty comment", () => {
    const errors = validateReview({ rating: 4, comment: "" });
    expect(errors).toContain("comment is required");
  });
});
