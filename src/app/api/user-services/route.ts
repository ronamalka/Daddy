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
  if (!userId) return NextResponse.json([], { status: 200 });

  const services = await prisma.userService.findMany({
    where: { userId },
    select: { serviceSlug: true },
  });

  return NextResponse.json(services.map((s) => s.serviceSlug));
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

  const { services } = await request.json();

  if (!Array.isArray(services)) {
    return NextResponse.json({ error: "Invalid services" }, { status: 400 });
  }

  await prisma.userService.deleteMany({ where: { userId } });

  if (services.length > 0) {
    await prisma.userService.createMany({
      data: services.map((slug: string) => ({ userId, serviceSlug: slug })),
    });
  }

  const saved = await prisma.userService.findMany({
    where: { userId },
    select: { serviceSlug: true },
  });

  return NextResponse.json(saved.map((s) => s.serviceSlug));
}
