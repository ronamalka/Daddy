import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function resolveUserId(session: { user: { id?: string; email?: string | null } }) {
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user) return user.id;
  if (session.user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (byEmail) return byEmail.id;
  }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyerId !== userId) {
    return NextResponse.json({ error: "Only the buyer can review" }, { status: 403 });
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Order must be completed" }, { status: 400 });
  }

  if (order.review) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const { comment, ratingAttitude, ratingTimeliness, ratingPrice, ratingQuality } = await request.json();

  if (!comment?.trim()) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  const attitude = Number(ratingAttitude);
  const timeliness = Number(ratingTimeliness);
  const price = Number(ratingPrice);
  const quality = Number(ratingQuality);

  if ([attitude, timeliness, price, quality].some((v) => !v || v < 1 || v > 10)) {
    return NextResponse.json({ error: "All ratings must be between 1 and 10" }, { status: 400 });
  }

  const overall = Math.round((attitude + timeliness + price + quality) / 4);

  const review = await prisma.review.create({
    data: {
      rating: overall,
      comment,
      ratingAttitude: attitude,
      ratingTimeliness: timeliness,
      ratingPrice: price,
      ratingQuality: quality,
      orderId,
      gigId: order.gigId,
      userId,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
