import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const service = searchParams.get("service");
  const district = searchParams.get("district");
  const cityCode = searchParams.get("cityCode");

  const where: Record<string, unknown> = {
    role: "SELLER",
  };

  if (service) {
    where.userServices = { some: { serviceSlug: service } };
  }

  if (cityCode) {
    where.serviceAreas = { some: { cityCode: Number(cityCode) } };
  } else if (district) {
    where.serviceAreas = { some: { districtCode: Number(district) } };
  }

  const sellers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      createdAt: true,
      userServices: { select: { serviceSlug: true } },
      serviceAreas: {
        select: { districtName: true, cityName: true, districtCode: true },
        take: 5,
      },
      _count: {
        select: {
          ordersAsSeller: true,
          reviews: true,
        },
      },
    },
    take: 50,
  });

  const results = sellers.map((s) => ({
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    bio: s.bio,
    city: s.city,
    createdAt: s.createdAt,
    services: s.userServices.map((us) => us.serviceSlug),
    serviceAreas: s.serviceAreas,
    completedOrders: s._count.ordersAsSeller,
    reviewCount: s._count.reviews,
  }));

  return NextResponse.json(results);
}
