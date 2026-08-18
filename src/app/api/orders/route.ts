import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "SELLER"
      ? { sellerId: session.user.id }
      : { buyerId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      gig: { select: { id: true, title: true, image: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gigId, tier } = await request.json();

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: { tiers: true },
  });

  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  if (gig.sellerId === session.user.id) {
    return NextResponse.json({ error: "Cannot order your own gig" }, { status: 400 });
  }

  const pricingTier = gig.tiers.find((t) => t.tier === tier);
  if (!pricingTier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      gigId,
      buyerId: session.user.id,
      sellerId: gig.sellerId,
      tier,
      price: pricingTier.price,
    },
    include: { gig: true },
  });

  return NextResponse.json(order, { status: 201 });
}
