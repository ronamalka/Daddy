import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      createdAt: true,
      role: true,
      gigs: {
        include: {
          category: true,
          tiers: { orderBy: { price: "asc" }, take: 1 },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              ratingAttitude: true,
              ratingTimeliness: true,
              ratingPrice: true,
              ratingQuality: true,
              sellerResponse: true,
              sellerResponseAt: true,
              createdAt: true,
              user: { select: { id: true, name: true, city: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      serviceAreas: {
        select: { districtCode: true, districtName: true, cityCode: true, cityName: true },
        orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
      },
      userServices: {
        select: { serviceSlug: true },
      },
      servicePrices: {
        select: { serviceSlug: true, price: true, description: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const allReviews = seller.gigs.flatMap((g) => g.reviews);

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  const reviewsWithDimensions = allReviews.filter(
    (r) => r.ratingAttitude != null && r.ratingTimeliness != null && r.ratingPrice != null && r.ratingQuality != null
  );

  const ratingBreakdown = reviewsWithDimensions.length > 0
    ? {
        attitude: reviewsWithDimensions.reduce((s, r) => s + (r.ratingAttitude ?? 0), 0) / reviewsWithDimensions.length,
        timeliness: reviewsWithDimensions.reduce((s, r) => s + (r.ratingTimeliness ?? 0), 0) / reviewsWithDimensions.length,
        price: reviewsWithDimensions.reduce((s, r) => s + (r.ratingPrice ?? 0), 0) / reviewsWithDimensions.length,
        quality: reviewsWithDimensions.reduce((s, r) => s + (r.ratingQuality ?? 0), 0) / reviewsWithDimensions.length,
        overall: reviewsWithDimensions.reduce((s, r) => s + r.rating, 0) / reviewsWithDimensions.length,
        count: reviewsWithDimensions.length,
      }
    : null;

  const completedOrders = await prisma.order.count({
    where: { sellerId: id, status: "COMPLETED" },
  });

  const gigs = seller.gigs.map((g) => {
    const gigAvg = g.reviews.length > 0
      ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
      : 0;
    return { ...g, avgRating: gigAvg, reviewCount: g.reviews.length };
  });

  return NextResponse.json({
    ...seller,
    gigs,
    allReviews,
    avgRating: Math.round(avgRating * 100) / 100,
    totalReviews: allReviews.length,
    completedOrders,
    ratingBreakdown,
  });
}
