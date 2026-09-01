import { NextResponse } from "next/server";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

/** Returns recent reviews with buyer and seller names filled in. */
export async function GET() {
  const { data: reviews } = await proxyRequest(GIGS_SERVICE, "/recent-reviews");

  if (!Array.isArray(reviews)) {
    return NextResponse.json([]);
  }

  const enriched = await Promise.all(
    reviews.map(async (r: {
      userId: string;
      sellerId?: string;
      gig: { title: string; sellerId: string } | null;
      [key: string]: unknown;
    }) => {
      const sellerId = r.sellerId || r.gig?.sellerId;
      const [userRes, sellerRes] = await Promise.all([
        proxyRequest(USERS_SERVICE, `/sellers/${r.userId}`),
        sellerId
          ? proxyRequest(USERS_SERVICE, `/sellers/${sellerId}`)
          : Promise.resolve({ data: null, status: 404 }),
      ]);

      return {
        ...r,
        user: { name: userRes.data?.name || "Unknown", city: userRes.data?.city || null },
        gig: {
          title: r.gig?.title || "עבודת שטח",
          user: { name: sellerRes.data?.name || "Unknown" },
        },
      };
    })
  );

  return NextResponse.json(enriched);
}
