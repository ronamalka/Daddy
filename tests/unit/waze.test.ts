import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  REQUESTS_SERVICE: "http://requests.test",
}));

import { proxyRequest } from "@/lib/gateway";
import { buildWazeNavigateUrl, canShowSellerWaze } from "@/lib/waze";
import {
  loadOrderVisit,
  visitFromRequest,
  visitVisibleToSeller,
} from "@/lib/order-visit";

const mockedProxy = vi.mocked(proxyRequest);
const seller = { id: "seller-1", email: "s@x.com", name: "יוסי", role: "SELLER" };
const buyer = { id: "buyer-1", email: "b@x.com", name: "דנה", role: "BUYER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildWazeNavigateUrl", () => {
  it("encodes street and city and turns on navigate", () => {
    const url = buildWazeNavigateUrl({ street: "הרצל 12", cityName: "חולון" });
    expect(url).toMatch(/^https:\/\/waze\.com\/ul\?/);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("q")).toBe("הרצל 12, חולון");
    expect(parsed.searchParams.get("navigate")).toBe("yes");
    expect(parsed.searchParams.get("q")).not.toMatch(/קומה/);
  });

  it("falls back to district when city is missing", () => {
    const url = buildWazeNavigateUrl({ street: "הרצל 12", districtName: "המרכז" });
    expect(new URL(url!).searchParams.get("q")).toBe("הרצל 12, המרכז");
  });

  it("returns null without a street", () => {
    expect(buildWazeNavigateUrl({ street: "  ", cityName: "חולון" })).toBeNull();
    expect(buildWazeNavigateUrl({ cityName: "חולון" })).toBeNull();
  });
});

describe("canShowSellerWaze", () => {
  it("shows the link only to the assigned seller after booking", () => {
    expect(canShowSellerWaze({ isSeller: true, street: "הרצל 12", streetVisible: true, status: "PENDING" })).toBe(true);
    expect(canShowSellerWaze({ isSeller: false, street: "הרצל 12", streetVisible: true, status: "PENDING" })).toBe(false);
    expect(canShowSellerWaze({ isSeller: true, street: "הרצל 12", streetVisible: true, status: "CANCELLED" })).toBe(false);
    expect(canShowSellerWaze({ isSeller: true, street: null, streetVisible: false, status: "IN_PROGRESS" })).toBe(false);
  });
});

describe("visitFromRequest / visitVisibleToSeller", () => {
  const visit = visitFromRequest({
    street: "הרצל 12",
    cityName: "חולון",
    floor: "4",
    streetVisible: true,
    hasStreet: true,
  });

  it("copies visit fields from the request", () => {
    expect(visit).toEqual({
      street: "הרצל 12",
      cityName: "חולון",
      districtName: null,
      floor: "4",
      streetVisible: true,
      hasStreet: true,
    });
  });

  it("keeps the address for the assigned seller and blanks it for the buyer", () => {
    expect(visitVisibleToSeller(visit, seller, "seller-1")).toEqual(visit);
    expect(visitVisibleToSeller(visit, buyer, "seller-1")).toBeNull();
    expect(visitVisibleToSeller(visit, { id: "admin-1", role: "ADMIN" }, "seller-1")).toEqual(visit);
  });
});

describe("loadOrderVisit", () => {
  it("reads the redacted request payload", async () => {
    mockedProxy.mockResolvedValue({
      data: {
        request: {
          street: "נחלת בנימין 88",
          cityName: "תל אביב",
          floor: "4",
          streetVisible: true,
          hasStreet: true,
        },
      },
      status: 200,
    });
    await expect(loadOrderVisit("req-1", seller)).resolves.toMatchObject({
      street: "נחלת בנימין 88",
      cityName: "תל אביב",
      floor: "4",
    });
    expect(mockedProxy).toHaveBeenCalledWith("http://requests.test", "/service-requests/req-1", { user: seller });
  });

  it("returns null when the order has no request", async () => {
    await expect(loadOrderVisit(null, seller)).resolves.toBeNull();
    expect(mockedProxy).not.toHaveBeenCalled();
  });
});
