import { describe, it, expect } from "vitest";
import {
  SERVICE_CATEGORIES,
  canonicalizeCategorySlug,
  catalogBrowsePath,
  categorySlugForService,
  categoriesFromPricedServices,
} from "@/lib/services";

describe("local catalog taxonomy", () => {
  it("has eight neighborhood categories", () => {
    expect(SERVICE_CATEGORIES.map((c) => c.slug)).toEqual([
      "assembly-and-installation",
      "home-maintenance",
      "moving-and-organization",
      "garden-and-outdoor",
      "tech-support",
      "car-and-errands",
      "admin-and-bureaucracy",
      "events-and-family",
    ]);
  });

  it("keeps current local slugs and maps leftover Fiverr gig slugs", () => {
    expect(canonicalizeCategorySlug("home-maintenance")).toBe("home-maintenance");
    expect(canonicalizeCategorySlug("car-transport")).toBe("car-and-errands");
    expect(canonicalizeCategorySlug("garden-yard")).toBe("garden-and-outdoor");
    expect(canonicalizeCategorySlug("moving-lifting")).toBe("moving-and-organization");
    expect(canonicalizeCategorySlug("negotiation-bureaucracy")).toBe("admin-and-bureaucracy");
    expect(canonicalizeCategorySlug("consulting-training")).toBe("home-maintenance");
    expect(canonicalizeCategorySlug("not-a-category")).toBeNull();
  });

  it("sends /gigs browse traffic to the homepage catalog", () => {
    expect(catalogBrowsePath()).toBe("/");
    expect(catalogBrowsePath("car-transport")).toBe("/?category=car-and-errands");
    expect(catalogBrowsePath("tech-support")).toBe("/?category=tech-support");
  });

  it("limits package categories to the daddy's priced services", () => {
    const categories = categoriesFromPricedServices([
      "furniture-assembly",
      "lawn-mowing",
      "car-test",
    ]);
    expect(categories.map((c) => c.slug)).toEqual([
      "assembly-and-installation",
      "garden-and-outdoor",
      "car-and-errands",
    ]);
    expect(categorySlugForService("bill-negotiation")).toBe("admin-and-bureaucracy");
    expect(categorySlugForService("unknown-service")).toBeNull();
  });
});
