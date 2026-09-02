import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE, REQUESTS_SERVICE } from "@/lib/gateway";
import { mapRequestTeasers } from "@/lib/request-teaser";
import type { FeaturedDaddy, LiveReview, RequestTeaser } from "@/components/home/types";

/** Fetches up to six featured sellers with ratings and completed-order counts. */
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

/** Fetches recent reviews with buyer and seller names filled in. */
export async function fetchRecentReviews(): Promise<LiveReview[]> {
  try {
    const { data: reviews } = await proxyRequest(GIGS_SERVICE, "/recent-reviews");

    if (!Array.isArray(reviews)) return [];

    const enriched = await Promise.all(
      reviews.map(async (r: Record<string, unknown>) => {
        const userId = typeof r.userId === "string" ? r.userId : "";
        const rawGig = r.gig as { title?: string; sellerId?: string } | null;
        const sellerId = (typeof r.sellerId === "string" ? r.sellerId : null) || rawGig?.sellerId;
        const [userRes, sellerRes] = await Promise.all([
          proxyRequest(USERS_SERVICE, `/sellers/${userId}`),
          sellerId
            ? proxyRequest(USERS_SERVICE, `/sellers/${sellerId}`)
            : Promise.resolve({ data: null, status: 404 }),
        ]);

        return {
          id: typeof r.id === "string" ? r.id : String(Math.random()),
          rating: typeof r.rating === "number" ? r.rating : 0,
          comment: typeof r.comment === "string" ? r.comment : "",
          ratingAttitude: typeof r.ratingAttitude === "number" ? r.ratingAttitude : null,
          ratingTimeliness: typeof r.ratingTimeliness === "number" ? r.ratingTimeliness : null,
          ratingPrice: typeof r.ratingPrice === "number" ? r.ratingPrice : null,
          ratingQuality: typeof r.ratingQuality === "number" ? r.ratingQuality : null,
          createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
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

/** Fetches recent open request teasers (city + service + age only). */
export async function fetchRequestTeasers(): Promise<RequestTeaser[]> {
  try {
    const { data } = await proxyRequest(REQUESTS_SERVICE, "/service-requests/teaser");
    return mapRequestTeasers(data);
  } catch {
    return [];
  }
}
