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
          reviews: { select: { rating: true } },
        },
      },
      serviceAreas: {
        select: { districtCode: true, districtName: true, cityCode: true, cityName: true },
        orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
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
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: allReviews.length,
    completedOrders,
  });
}
