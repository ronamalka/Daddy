import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, avatar: true, bio: true, createdAt: true } },
      category: true,
      tiers: { orderBy: { price: "asc" } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const avgRating =
    gig.reviews.length > 0
      ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
      : 0;

  return NextResponse.json({ ...gig, avgRating, reviewCount: gig.reviews.length });
}
