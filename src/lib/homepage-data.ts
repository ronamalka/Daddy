import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE, REQUESTS_SERVICE } from "@/lib/gateway";
import { mapRequestTeasers } from "@/lib/request-teaser";
import type { FeaturedDaddy, LiveReview, RequestTeaser } from "@/components/home/types";

export async function fetchFeaturedDaddies(): Promise<FeaturedDaddy[]> {
  try {
    const { data: sellers } = await proxyRequest(USERS_SERVICE, "/featured-daddies");

    if (!Array.isArray(sellers) || sellers.length === 0) return [];

    const enriched = await Promise.all(
      sellers.map(async (s: { id: string; name: string; avatar: string | null; bio: string | null; city: string | null; services: string[]; serviceAreas: { districtName: string; cityName: string | null }[]; startingPrice: number | null }) => {
        const [{ data: reviewData }, { data: ordersData }] = await Promise.all([
          proxyRequest(GIGS_SERVICE, `/reviews/by-seller/${s.id}`).catch(() => ({ data: null, status: 502 })),
          proxyRequest(ORDERS_SERVICE, `/orders/count-by-seller/${s.id}`).catch(() => ({ data: null, status: 502 })),
        ]);

        return {
          ...s,
          reviewCount: reviewData?.reviewCount || 0,
          avgRating: reviewData?.avgRating || 0,
          completedOrders: ordersData?.completedOrders || 0,
        };
      }),
    );

    return enriched
      .sort((a, b) => (b.reviewCount + b.completedOrders) - (a.reviewCount + a.completedOrders))
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function fetchRecentReviews(): Promise<LiveReview[]> {
  try {
    const { data: reviews } = await proxyRequest(GIGS_SERVICE, "/recent-reviews");

    if (!Array.isArray(reviews)) return [];

    const enriched = await Promise.all(
      reviews.map(async (r: { id?: string; rating?: number; comment?: string; userId?: string; sellerId?: string; gig?: { title?: string; sellerId?: string }; ratingAttitude?: number; ratingTimeliness?: number; ratingPrice?: number; ratingQuality?: number; createdAt?: string }) => {
        const userId = r.userId ?? "";
        const rawGig = r.gig ?? null;
        const sellerId = r.sellerId ?? rawGig?.sellerId;
        const [userRes, sellerRes] = await Promise.all([
          proxyRequest(USERS_SERVICE, `/sellers/${userId}`),
          sellerId
            ? proxyRequest(USERS_SERVICE, `/sellers/${sellerId}`)
            : Promise.resolve({ data: null, status: 404 }),
        ]);

        return {
          id: r.id ?? String(Math.random()),
          rating: r.rating ?? 0,
          comment: r.comment ?? "",
          ratingAttitude: r.ratingAttitude ?? null,
          ratingTimeliness: r.ratingTimeliness ?? null,
          ratingPrice: r.ratingPrice ?? null,
          ratingQuality: r.ratingQuality ?? null,
          createdAt: r.createdAt ?? "",
          user: { name: userRes.data?.name || "Unknown", city: userRes.data?.city || null },
          gig: {
            title: rawGig?.title || "עבודת שטח",
            user: { name: sellerRes.data?.name || "Unknown" },
          },
        } satisfies LiveReview;
      }),
    );

    return enriched;
  } catch {
    return [];
  }
}

export async function fetchRequestTeasers(): Promise<RequestTeaser[]> {
  try {
    const { data } = await proxyRequest(REQUESTS_SERVICE, "/service-requests/teaser");
    return mapRequestTeasers(data);
  } catch {
    return [];
  }
}
