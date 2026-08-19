import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      createdAt: true,
      userServices: { select: { serviceSlug: true }, take: 5 },
      serviceAreas: {
        select: { districtName: true, cityName: true },
        take: 3,
      },
      servicePrices: {
        select: { serviceSlug: true, price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      _count: {
        select: { ordersAsSeller: true },
      },
      gigs: {
        select: {
          reviews: { select: { rating: true } },
        },
      },
    },
    take: 20,
  });

  const featured = sellers
    .map((s) => {
      const allReviews = s.gigs.flatMap((g) => g.reviews);
      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;
      return {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        bio: s.bio,
        city: s.city,
        services: s.userServices.map((us) => us.serviceSlug),
        serviceAreas: s.serviceAreas,
        completedOrders: s._count.ordersAsSeller,
        reviewCount: allReviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
        startingPrice: s.servicePrices[0]?.price ?? null,
      };
    })
    .sort((a, b) => b.reviewCount + b.completedOrders - (a.reviewCount + a.completedOrders))
    .slice(0, 6);

  return NextResponse.json(featured);
}
