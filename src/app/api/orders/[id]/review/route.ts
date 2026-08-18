import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Only the buyer can review" }, { status: 403 });
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Order must be completed" }, { status: 400 });
  }

  if (order.review) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const { rating, comment, communicationRating, qualityRating, timelinessRating } = await request.json();
  if (!rating || rating < 1 || rating > 5 || !comment) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      orderId,
      gigId: order.gigId,
      userId: session.user.id,
      ...(communicationRating && { communicationRating }),
      ...(qualityRating && { qualityRating }),
      ...(timelinessRating && { timelinessRating }),
    },
  });

  return NextResponse.json(review, { status: 201 });
}
