import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 } },
    select: {
      id: true,
      rating: true,
      comment: true,
      ratingAttitude: true,
      ratingTimeliness: true,
      ratingPrice: true,
      ratingQuality: true,
      createdAt: true,
      user: { select: { name: true, city: true } },
      gig: {
        select: {
          title: true,
          seller: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const mapped = reviews.map((r) => ({
    ...r,
    gig: {
      title: r.gig.title,
      user: { name: r.gig.seller.name },
    },
  }));

  return NextResponse.json(mapped);
}
