import { Router, Request, Response } from "express";
import { hash } from "bcryptjs";
import { prisma } from "../index";

export const registerRoutes = Router();

registerRoutes.post("/", async (req: Request, res: Response) => {
  const { name, email, password, role, cityCode, cityName, districtCode, serviceAreas, services } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  if (name.length > 100 || email.length > 255) {
    res.status(400).json({ error: "Input too long" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
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
      ...(Array.isArray(services) && services.length > 0 && {
        userServices: {
          create: services.map((slug: string) => ({ serviceSlug: slug })),
        },
      }),
    },
  });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
