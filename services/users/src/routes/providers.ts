import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { searchableSellerWhere } from "../seller-ready";
import {
  matchTierFor,
  parseProviderSearchQuery,
  providerDistanceKm,
  providerTags,
  sortProviderRows,
  startingPriceFor,
} from "../provider-search";
import type { Prisma } from "../generated/prisma/client";

/** Routes for searching sellers who take jobs. */
export const providersRoutes = Router();

/** List sellers, optionally filtered by service, city, price, and sort. */
providersRoutes.get("/", async (req: Request, res: Response) => {
  const query = {
    service: req.query.service as string | undefined,
    district: req.query.district as string | undefined,
    cityCode: req.query.cityCode as string | undefined,
    minPrice: req.query.minPrice as string | undefined,
    maxPrice: req.query.maxPrice as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    pricing: req.query.pricing as string | undefined,
  };
  const parsed = parseProviderSearchQuery(query);
  const skip = Math.max(parseInt(String(req.query.skip || "0"), 10) || 0, 0);
  const take = Math.min(Math.max(parseInt(String(req.query.take || "50"), 10) || 50, 1), 200);

  const sellers = await prisma.user.findMany({
    where: searchableSellerWhere(query) as Prisma.UserWhereInput,
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      cityCode: true,
      districtCode: true,
      createdAt: true,
      userServices: { select: { serviceSlug: true } },
      serviceAreas: {
        select: { districtName: true, cityName: true, districtCode: true, cityCode: true },
      },
      servicePrices: {
        select: { serviceSlug: true, price: true },
        orderBy: { price: "asc" },
      },
    },
  });

  const origin = { cityCode: parsed.originCityCode, districtCode: parsed.originDistrictCode };
  const mapped = sellers.map((s) => {
    const startingPrice = startingPriceFor(s.servicePrices, parsed.service);
    const matchTier = matchTierFor(s.serviceAreas, origin);
    const distanceKm = providerDistanceKm({
      originCityCode: parsed.originCityCode,
      originDistrictCode: parsed.originDistrictCode,
      sellerCityCode: s.cityCode,
      sellerDistrictCode: s.districtCode,
      matchTier,
    });
    return {
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      bio: s.bio,
      city: s.city,
      createdAt: s.createdAt,
      services: s.userServices.map((us) => us.serviceSlug),
      serviceAreas: s.serviceAreas,
      startingPrice,
      matchTier,
      distanceKm,
      ...providerTags(startingPrice),
    };
  });

  const sorted = sortProviderRows(mapped, parsed.sortBy);
  res.json(sorted.slice(skip, skip + take));
});
