import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [ordersBuyer, ordersSeller, reviewsReceived, reviewsGiven, gigsCount, favoritesCount] =
    await Promise.all([
      prisma.order.count({ where: { buyerId: userId } }),
      prisma.order.count({ where: { sellerId: userId } }),
      prisma.review.findMany({
        where: { gig: { sellerId: userId } },
        select: { rating: true },
      }),
      prisma.review.count({ where: { userId } }),
      prisma.gig.count({ where: { sellerId: userId } }),
      prisma.favorite.count({ where: { userId } }),
    ]);

  const avgRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
      : 0;

  return NextResponse.json({
    totalOrders: ordersBuyer + ordersSeller,
    ordersBuyer,
    ordersSeller,
    reviewsReceived: reviewsReceived.length,
    reviewsGiven,
    avgRating: Math.round(avgRating * 10) / 10,
    gigsCount,
    favoritesCount,
  });
}
