import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";

/** Returns up to six featured sellers with ratings and completed-order counts. */
export async function GET() {
  const { data: sellers } = await proxyRequest(USERS_SERVICE, "/featured-daddies");

  if (!Array.isArray(sellers) || sellers.length === 0) {
    return NextResponse.json([]);
  }

  const enriched = await Promise.all(
    sellers.map(async (s: { id: string; name: string; avatar: string | null; bio: string | null; city: string | null; services: string[]; serviceAreas: unknown[]; startingPrice: number | null }) => {
      const [{ data: reviewData }, { data: ordersData }] = await Promise.all([
        proxyRequest(GIGS_SERVICE, `/gigs/reviews/by-seller/${s.id}`).catch(() => ({ data: null, status: 502 })),
        proxyRequest(ORDERS_SERVICE, `/orders/count-by-seller/${s.id}`).catch(() => ({ data: null, status: 502 })),
      ]);

      return {
        ...s,
        reviewCount: reviewData?.reviewCount || 0,
        avgRating: reviewData?.avgRating || 0,
        completedOrders: ordersData?.completedOrders || 0,
      };
    })
  );

  const sorted = enriched
    .sort((a, b) => (b.reviewCount + b.completedOrders) - (a.reviewCount + a.completedOrders))
    .slice(0, 6);

  return NextResponse.json(sorted);
}
