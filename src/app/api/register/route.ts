import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, email, password, role, cityCode, cityName, districtCode, serviceAreas } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role === "SELLER" ? "SELLER" : "BUYER",
      city: cityName || null,
      cityCode: cityCode ? Number(cityCode) : null,
      districtCode: districtCode ? Number(districtCode) : null,
      ...(Array.isArray(serviceAreas) && serviceAreas.length > 0 && {
        serviceAreas: {
          create: serviceAreas.map((a: { districtCode: number; districtName: string; cityCode?: number; cityName?: string }) => ({
            districtCode: a.districtCode,
            districtName: a.districtName,
            cityCode: a.cityCode ?? null,
            cityName: a.cityName ?? null,
          })),
        },
      }),
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
