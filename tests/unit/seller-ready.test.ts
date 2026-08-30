import { describe, it, expect } from "vitest";
import { evaluateSellerReadiness as evaluateFromUsers, searchableSellerWhere } from "../../services/users/src/seller-ready";
import {
  evaluateSellerReadiness,
  SELLER_CHECKLIST_ITEMS,
  SELLER_READY_KEYS,
  postRegisterPath,
} from "@/lib/seller-ready";

const completeInput = {
  phone: "050-1234567",
  avatar: "https://example.com/a.jpg",
  serviceAreaCount: 1,
  pricedServiceCount: 1,
  weeklyHoursCount: 2,
};

describe("evaluateSellerReadiness", () => {
  it("is complete when every checklist item is present", () => {
    const result = evaluateSellerReadiness(completeInput);
    expect(result.complete).toBe(true);
    expect(result.completedCount).toBe(5);
    expect(result.percent).toBe(100);
    expect(result.items).toEqual({
      pricedService: true,
      serviceArea: true,
      availability: true,
      phone: true,
      photo: true,
    });
  });

  it("treats a seller with no price as incomplete", () => {
    const result = evaluateSellerReadiness({ ...completeInput, pricedServiceCount: 0 });
    expect(result.complete).toBe(false);
    expect(result.items.pricedService).toBe(false);
    expect(result.completedCount).toBe(4);
    expect(result.percent).toBe(80);
  });

  it("rejects blank phone and photo strings", () => {
    const result = evaluateSellerReadiness({
      ...completeInput,
      phone: "   ",
      avatar: "",
    });
    expect(result.items.phone).toBe(false);
    expect(result.items.photo).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("requires a service area and an availability window", () => {
    const result = evaluateSellerReadiness({
      ...completeInput,
      serviceAreaCount: 0,
      weeklyHoursCount: 0,
    });
    expect(result.items.serviceArea).toBe(false);
    expect(result.items.availability).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("matches the users-service copy of the same rules", () => {
    expect(evaluateFromUsers(completeInput)).toEqual(evaluateSellerReadiness(completeInput));
    expect(evaluateFromUsers({ ...completeInput, pricedServiceCount: 0 })).toEqual(
      evaluateSellerReadiness({ ...completeInput, pricedServiceCount: 0 })
    );
  });
});

describe("searchableSellerWhere", () => {
  it("requires a priced service, area, hours, phone, and photo", () => {
    const where = searchableSellerWhere();
    expect(where.role).toBe("SELLER");
    expect(where.acceptingJobs).toBe(true);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { servicePrices: { some: { price: { gt: 0 } } } },
        { weeklyHours: { some: {} } },
        { serviceAreas: { some: {} } },
        { phone: { not: null } },
        { avatar: { not: null } },
      ])
    );
  });

  it("nests city and service filters with the completeness checks", () => {
    const where = searchableSellerWhere({ service: "tv-mounting", cityCode: "5000" });
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { serviceAreas: { some: { cityCode: 5000 } } },
        { userServices: { some: { serviceSlug: "tv-mounting" } } },
      ])
    );
    expect(where.AND).not.toContainEqual({ serviceAreas: { some: {} } });
  });
});

describe("checklist labels", () => {
  it("covers every readiness key", () => {
    expect(SELLER_CHECKLIST_ITEMS.map((item) => item.key)).toEqual([...SELLER_READY_KEYS]);
  });
});

describe("postRegisterPath", () => {
  it("sends sellers to onboarding", () => {
    expect(postRegisterPath("SELLER", null)).toBe("/onboarding");
  });

  it("sends buyers home", () => {
    expect(postRegisterPath("BUYER", null)).toBe("/");
  });

  it("honors a relative next path and rejects open redirects", () => {
    expect(postRegisterPath("BUYER", "/onboarding")).toBe("/onboarding");
    expect(postRegisterPath("SELLER", "https://evil.example")).toBe("/onboarding");
    expect(postRegisterPath("BUYER", "//evil.example")).toBe("/");
  });
});

