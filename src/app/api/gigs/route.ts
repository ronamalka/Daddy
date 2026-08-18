import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
  const sortBy = searchParams.get("sortBy") || "newest";
  const district = searchParams.get("district");
  const cityCode = searchParams.get("cityCode");

  const orderBy: Record<string, unknown> =
    sortBy === "price_asc" ? { tiers: { _min: { price: "asc" } } }
    : sortBy === "price_desc" ? { tiers: { _min: { price: "desc" } } }
    : sortBy === "popular" ? { reviews: { _count: "desc" } }
    : { createdAt: "desc" };

  const locationFilter = (district || cityCode) ? {
    seller: {
      serviceAreas: {
        some: {
          ...(cityCode ? { cityCode: Number(cityCode) } : {}),
          ...(district && !cityCode ? { districtCode: Number(district) } : {}),
        },
      },
    },
  } : {};

  const gigs = await prisma.gig.findMany({
    where: {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      tiers: { some: { price: { gte: minPrice, lte: maxPrice } } },
      ...locationFilter,
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true, serviceAreas: { select: { districtName: true, cityName: true }, take: 3 } } },
      category: true,
      tiers: { orderBy: { price: "asc" as const }, take: 1 },
      reviews: { select: { rating: true } },
      _count: { select: { favorites: true } },
    },
    orderBy,
  });

  const gigsWithRating = gigs.map((gig) => {
    const avgRating =
      gig.reviews.length > 0
        ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
        : 0;
    return { ...gig, avgRating, reviewCount: gig.reviews.length, favoriteCount: gig._count.favorites };
  });

  if (sortBy === "rating") {
    gigsWithRating.sort((a, b) => b.avgRating - a.avgRating);
  }

  return NextResponse.json(gigsWithRating);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, image, categoryId, tiers, faqs, requirements } = await request.json();

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
      ...(faqs?.length && {
        faqs: {
          create: faqs.map((f: { question: string; answer: string }, i: number) => ({
            question: f.question,
            answer: f.answer,
            order: i,
          })),
        },
      }),
      ...(requirements?.length && {
        requirements: {
          create: requirements.map((r: { question: string; required: boolean }, i: number) => ({
            question: r.question,
            required: r.required ?? true,
            order: i,
          })),
        },
      }),
    },
    include: { tiers: true, category: true, faqs: true, requirements: true },
  });

  return NextResponse.json(gig, { status: 201 });
}
