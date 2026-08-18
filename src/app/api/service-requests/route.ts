import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const district = searchParams.get("district");
  const status = searchParams.get("status") || "OPEN";

  const requests = await prisma.serviceRequest.findMany({
    where: {
      status: status as "OPEN" | "IN_PROGRESS" | "CLOSED",
      ...(district ? { districtCode: Number(district) } : {}),
    },
    include: {
      buyer: { select: { id: true, name: true, avatar: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(requests);
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

  const { title, description, serviceSlug, districtCode, districtName, cityCode, cityName } = await request.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const created = await prisma.serviceRequest.create({
    data: {
      title,
      description,
      serviceSlug: serviceSlug || null,
      buyerId: userId,
      districtCode: districtCode ? Number(districtCode) : null,
      districtName: districtName || null,
      cityCode: cityCode ? Number(cityCode) : null,
      cityName: cityName || null,
    },
    include: {
      buyer: { select: { id: true, name: true, avatar: true } },
      _count: { select: { responses: true } },
    },
  });

  return NextResponse.json(created);
}
