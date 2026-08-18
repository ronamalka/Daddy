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
    return NextResponse.json([], { status: 200 });
  }

  const areas = await prisma.serviceArea.findMany({
    where: { userId },
    orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
  });

  return NextResponse.json(areas);
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

  const { areas } = await request.json();

  if (!Array.isArray(areas)) {
    return NextResponse.json({ error: "Invalid areas" }, { status: 400 });
  }

  await prisma.serviceArea.deleteMany({ where: { userId } });

  if (areas.length > 0) {
    await prisma.serviceArea.createMany({
      data: areas.map((a: { districtCode: number; districtName: string; cityCode?: number; cityName?: string }) => ({
        userId,
        districtCode: a.districtCode,
        districtName: a.districtName,
        cityCode: a.cityCode ?? null,
        cityName: a.cityName ?? null,
      })),
    });
  }

  const saved = await prisma.serviceArea.findMany({
    where: { userId },
    orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
  });

  return NextResponse.json(saved);
}
