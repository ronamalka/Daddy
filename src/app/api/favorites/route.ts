import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      gig: {
        include: {
          seller: { select: { name: true, avatar: true } },
          category: true,
          tiers: { orderBy: { price: "asc" }, take: 1 },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const gigs = favorites.map((f) => {
    const g = f.gig;
    const avgRating = g.reviews.length > 0
      ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
      : 0;
    return { ...g, avgRating, reviewCount: g.reviews.length };
  });

  return NextResponse.json(gigs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gigId } = await request.json();
  if (!gigId) {
    return NextResponse.json({ error: "gigId required" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_gigId: { userId: session.user.id, gigId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, gigId },
  });

  return NextResponse.json({ favorited: true });
}
