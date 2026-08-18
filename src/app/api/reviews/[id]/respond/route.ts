import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: { gig: { select: { sellerId: true } } },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.gig.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Only the seller can respond" }, { status: 403 });
  }

  if (review.sellerResponse) {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  const { response } = await request.json();
  if (!response?.trim()) {
    return NextResponse.json({ error: "Response text required" }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { sellerResponse: response, sellerResponseAt: new Date() },
  });

  return NextResponse.json(updated);
}
