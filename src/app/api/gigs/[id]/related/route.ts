import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gig = await prisma.gig.findUnique({ where: { id }, select: { categoryId: true, sellerId: true } });
  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const related = await prisma.gig.findMany({
    where: {
      id: { not: id },
      OR: [{ categoryId: gig.categoryId }, { sellerId: gig.sellerId }],
    },
    include: {
      seller: { select: { name: true, avatar: true } },
      category: true,
      tiers: { orderBy: { price: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const result = related.map((g) => {
    const avgRating = g.reviews.length > 0
      ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
      : 0;
    return { ...g, avgRating, reviewCount: g.reviews.length };
  });

  return NextResponse.json(result);
}
