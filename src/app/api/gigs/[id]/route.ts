import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, avatar: true, bio: true, city: true, createdAt: true } },
      category: true,
      tiers: { orderBy: { price: "asc" } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      images: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      requirements: { orderBy: { order: "asc" } },
      _count: { select: { favorites: true } },
    },
  });

  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const avgRating =
    gig.reviews.length > 0
      ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
      : 0;

  const session = await auth();
  let isFavorited = false;
  if (session?.user) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_gigId: { userId: session.user.id, gigId: id } },
    });
    isFavorited = !!fav;
  }

  return NextResponse.json({
    ...gig,
    avgRating,
    reviewCount: gig.reviews.length,
    favoriteCount: gig._count.favorites,
    isFavorited,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gig = await prisma.gig.findUnique({ where: { id } });
  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }
  if (gig.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, image, categoryId, tiers, faqs, requirements } = await request.json();

  await prisma.$transaction(async (tx) => {
    await tx.gig.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(image !== undefined && { image }),
        ...(categoryId && { categoryId }),
      },
    });

    if (tiers?.length) {
      await tx.gigPricingTier.deleteMany({ where: { gigId: id } });
      await tx.gigPricingTier.createMany({
        data: tiers.map((t: { tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }) => ({
          gigId: id,
          tier: t.tier,
          title: t.title,
          description: t.description,
          price: t.price,
          deliveryDays: t.deliveryDays,
          revisions: t.revisions,
        })),
      });
    }

    if (faqs) {
      await tx.gigFaq.deleteMany({ where: { gigId: id } });
      if (faqs.length) {
        await tx.gigFaq.createMany({
          data: faqs.map((f: { question: string; answer: string }, i: number) => ({
            gigId: id,
            question: f.question,
            answer: f.answer,
            order: i,
          })),
        });
      }
    }

    if (requirements) {
      await tx.gigRequirement.deleteMany({ where: { gigId: id } });
      if (requirements.length) {
        await tx.gigRequirement.createMany({
          data: requirements.map((r: { question: string; required: boolean }, i: number) => ({
            gigId: id,
            question: r.question,
            required: r.required ?? true,
            order: i,
          })),
        });
      }
    }
  });

  const full = await prisma.gig.findUnique({
    where: { id },
    include: { tiers: true, category: true, faqs: true, requirements: true },
  });

  return NextResponse.json(full);
}
