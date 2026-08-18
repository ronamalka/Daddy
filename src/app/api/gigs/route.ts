import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");

  const gigs = await prisma.gig.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      tiers: { some: { price: { gte: minPrice, lte: maxPrice } } },
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      category: true,
      tiers: { orderBy: { price: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const gigsWithRating = gigs.map((gig) => {
    const avgRating =
      gig.reviews.length > 0
        ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
        : 0;
    return { ...gig, avgRating, reviewCount: gig.reviews.length };
  });

  return NextResponse.json(gigsWithRating);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, image, categoryId, tiers } = await request.json();

  if (!title || !description || !categoryId || !tiers?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const gig = await prisma.gig.create({
    data: {
      title,
      description,
      image,
      categoryId,
      sellerId: session.user.id,
      tiers: {
        create: tiers.map((t: { tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }) => ({
          tier: t.tier,
          title: t.title,
          description: t.description,
          price: t.price,
          deliveryDays: t.deliveryDays,
          revisions: t.revisions,
        })),
      },
    },
    include: { tiers: true, category: true },
  });

  return NextResponse.json(gig, { status: 201 });
}
