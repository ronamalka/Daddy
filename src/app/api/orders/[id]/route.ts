import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { OrderStatus } from "@/generated/prisma/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      gig: { include: { tiers: true } },
      buyer: { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      review: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await request.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed: Record<string, { by: string; from: OrderStatus[] }> = {
    IN_PROGRESS: { by: "seller", from: ["PENDING"] },
    DELIVERED: { by: "seller", from: ["IN_PROGRESS"] },
    COMPLETED: { by: "buyer", from: ["DELIVERED"] },
    CANCELLED: { by: "buyer", from: ["PENDING"] },
  };

  const rule = allowed[status];
  if (!rule) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const isAllowed =
    (rule.by === "seller" && order.sellerId === session.user.id) ||
    (rule.by === "buyer" && order.buyerId === session.user.id) ||
    session.user.role === "ADMIN";

  if (!isAllowed || !rule.from.includes(order.status)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
