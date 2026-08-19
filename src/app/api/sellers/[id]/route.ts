import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";

interface GigReview {
  rating: number;
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [sellerRes, gigsRes, ordersRes] = await Promise.all([
    proxyRequest(USERS_SERVICE, `/sellers/${id}`),
    proxyRequest(GIGS_SERVICE, `/gigs/by-seller/${id}`),
    proxyRequest(ORDERS_SERVICE, `/orders/count-by-seller/${id}`),
  ]);

  if (sellerRes.status === 404) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const seller = sellerRes.data;
  const gigs: GigWithReviews[] = Array.isArray(gigsRes.data) ? gigsRes.data : [];
  const allReviews: GigReview[] = gigs.flatMap((g) => g.reviews || []);

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
