import { Router, Request, Response } from "express";
import { prisma } from "../index";

/** Routes for a short list of featured sellers. */
export const featuredRoutes = Router();

/** Return up to six sellers who currently take jobs. */
featuredRoutes.get("/", async (_req: Request, res: Response) => {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER", acceptingJobs: true },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      createdAt: true,
      userServices: { select: { serviceSlug: true }, take: 5 },
      serviceAreas: {
        select: { districtName: true, cityName: true },
        take: 3,
      },
      servicePrices: {
        select: { serviceSlug: true, price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    take: 20,
  });

  const featured = sellers
    .map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      bio: s.bio,
      city: s.city,
      services: s.userServices.map((us) => us.serviceSlug),
      serviceAreas: s.serviceAreas,
      startingPrice: s.servicePrices[0]?.price ?? null,
    }))
    .slice(0, 6);

  res.json(featured);
});
