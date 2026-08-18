import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, gigs, orders] = await Promise.all([
    prisma.user.count(),
    prisma.gig.count(),
    prisma.order.count(),
  ]);

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    select: { price: true },
  });

  const revenue = completedOrders.reduce((sum, o) => sum + o.price, 0);

  return NextResponse.json({ users, gigs, orders, revenue });
}
