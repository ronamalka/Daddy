import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";

interface GigReview {
  rating: number;
  userId?: string;
  ratingAttitude?: number | null;
  ratingTimeliness?: number | null;
  ratingPrice?: number | null;
  ratingQuality?: number | null;
  [key: string]: unknown;
}

interface GigWithReviews {
  reviews?: GigReview[];
  [key: string]: unknown;
}

/** Returns a seller profile with gigs, reviews, ratings, and completed-order count. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sellerRes = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);

  if (sellerRes.status === 404 || !sellerRes.data || sellerRes.data.error) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const [gigsRes, ordersRes] = await Promise.all([
    proxyRequest(GIGS_SERVICE, `/gigs/by-seller/${id}`).catch(() => ({ data: null, status: 502 })),
    proxyRequest(ORDERS_SERVICE, `/orders/count-by-seller/${id}`).catch(() => ({ data: null, status: 502 })),
  ]);

  const seller = sellerRes.data;
  const gigs: GigWithReviews[] = Array.isArray(gigsRes.data) ? gigsRes.data : [];
  const rawReviews: GigReview[] = gigs.flatMap((g) => g.reviews || []);

  const reviewerIds = [...new Set(
    rawReviews.map((r) => r.userId).filter((id): id is string => typeof id === "string" && id.length > 0)
  )];
  const reviewerMap: Record<string, { id: string; name: string; city: string | null }> = {};
  await Promise.all(
    reviewerIds.map(async (userId) => {
      const { data: u } = await proxyRequest(USERS_SERVICE, `/sellers/${userId}`);
      if (u?.id && typeof u.name === "string") {
        reviewerMap[userId] = { id: u.id, name: u.name, city: u.city ?? null };
      }
    })
  );

  const allReviews = rawReviews.map((r) => ({
    ...r,
    user: reviewerMap[r.userId as string] || {
      id: r.userId || "unknown",
      name: "משתמש",
      city: null,
    },
  }));

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  const reviewsWithDimensions = allReviews.filter(
    (r) => r.ratingAttitude != null && r.ratingTimeliness != null && r.ratingPrice != null && r.ratingQuality != null
  );

  const ratingBreakdown = reviewsWithDimensions.length > 0
    ? {
        attitude: reviewsWithDimensions.reduce((s, r) => s + (r.ratingAttitude as number), 0) / reviewsWithDimensions.length,
        timeliness: reviewsWithDimensions.reduce((s, r) => s + (r.ratingTimeliness as number), 0) / reviewsWithDimensions.length,
        price: reviewsWithDimensions.reduce((s, r) => s + (r.ratingPrice as number), 0) / reviewsWithDimensions.length,
        quality: reviewsWithDimensions.reduce((s, r) => s + (r.ratingQuality as number), 0) / reviewsWithDimensions.length,
        overall: reviewsWithDimensions.reduce((s, r) => s + r.rating, 0) / reviewsWithDimensions.length,
        count: reviewsWithDimensions.length,
      }
    : null;

  return NextResponse.json({
    ...seller,
    gigs,
    allReviews,
    avgRating: Math.round(avgRating * 100) / 100,
    totalReviews: allReviews.length,
    completedOrders: ordersRes.data?.completedOrders || 0,
    ratingBreakdown,
  });
}
