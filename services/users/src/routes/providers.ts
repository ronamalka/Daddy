import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { searchableSellerWhere } from "../seller-ready";
import type { Prisma } from "../generated/prisma/client";

/** Routes for searching sellers who take jobs. */
export const providersRoutes = Router();

/** List sellers, optionally filtered by service, district, or city. */
providersRoutes.get("/", async (req: Request, res: Response) => {
  const service = req.query.service as string | undefined;
  const district = req.query.district as string | undefined;
  const cityCode = req.query.cityCode as string | undefined;

  const sellers = await prisma.user.findMany({
    where: searchableSellerWhere({ service, district, cityCode }) as Prisma.UserWhereInput,
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
      servicePrices: {
        select: { serviceSlug: true, price: true },
        orderBy: { price: "asc" },
        take: 1,
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
    startingPrice: s.servicePrices[0]?.price ?? null,
  }));

  res.json(results);
});
