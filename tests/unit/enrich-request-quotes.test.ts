import { describe, it, expect, vi } from "vitest";
import { enrichRequestWithQuoteSellers, parseServiceAreas } from "@/lib/enrich-request-quotes";

const TEL_AVIV = 5000;
const TEL_AVIV_DISTRICT = 5;

describe("parseServiceAreas", () => {
  it("drops malformed rows", () => {
    expect(
      parseServiceAreas([
        { districtCode: 5, districtName: "תל אביב", cityCode: TEL_AVIV, cityName: "תל אביב - יפו" },
        { districtCode: "x" },
        null,
      ])
    ).toEqual([
      { districtCode: 5, districtName: "תל אביב", cityCode: TEL_AVIV, cityName: "תל אביב - יפו" },
    ]);
  });
});

describe("enrichRequestWithQuoteSellers", () => {
  it("attaches buyer name, ratings, and city overlap on each quote", async () => {
    const proxy = vi.fn(async (_url: string, path: string) => {
      if (path === "/sellers/buyer-1") {
        return { data: { id: "buyer-1", name: "דנה" }, status: 200 };
      }
      if (path === "/sellers/seller-1") {
        return {
          data: {
            id: "seller-1",
            name: "יוסי הגולדן",
            avatar: "/yossi.png",
            serviceAreas: [
              { districtCode: TEL_AVIV_DISTRICT, districtName: "תל אביב", cityCode: TEL_AVIV, cityName: "תל אביב - יפו" },
            ],
          },
          status: 200,
        };
      }
      if (path === "/reviews/by-seller/seller-1") {
        return { data: { avgRating: 9.4, reviewCount: 5, reviews: [] }, status: 200 };
      }
      return { data: null, status: 404 };
    });

    const enriched = await enrichRequestWithQuoteSellers(
      {
        buyerId: "buyer-1",
        cityCode: TEL_AVIV,
        districtCode: TEL_AVIV_DISTRICT,
        responses: [
          {
            id: "q1",
            sellerId: "seller-1",
            message: "אגיע עם מקדחה",
            laborPrice: 250,
          },
        ],
      },
      proxy as never
    );

    expect(enriched.buyer).toEqual({ id: "buyer-1", name: "דנה", avatar: null });
    expect(enriched.responses[0].seller).toMatchObject({
      id: "seller-1",
      name: "יוסי הגולדן",
      avgRating: 9.4,
      reviewCount: 5,
      areaOverlap: "city",
    });
  });
});
