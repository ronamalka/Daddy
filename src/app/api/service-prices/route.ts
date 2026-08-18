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

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const prices = await prisma.servicePrice.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(prices);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { prices } = await request.json();

  if (!Array.isArray(prices)) {
    return NextResponse.json({ error: "Invalid prices format" }, { status: 400 });
  }

  await prisma.servicePrice.deleteMany({ where: { userId } });

  if (prices.length > 0) {
    await prisma.servicePrice.createMany({
      data: prices
        .filter((p: { serviceSlug: string; price: number }) => p.serviceSlug && p.price > 0)
        .map((p: { serviceSlug: string; price: number; description?: string }) => ({
          userId,
          serviceSlug: p.serviceSlug,
          price: Number(p.price),
          description: p.description || null,
        })),
    });
  }

  const saved = await prisma.servicePrice.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(saved);
}
