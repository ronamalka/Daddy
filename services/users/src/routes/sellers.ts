import { Router, Request, Response } from "express";
import { prisma } from "../index";

/** Routes for public seller profiles. */
export const sellerRoutes = Router();

/** Return one seller's public profile, areas, services, and prices. */
sellerRoutes.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      createdAt: true,
      role: true,
      acceptingJobs: true,
      phoneVerified: true,
      identityStatus: true,
      licenseStatus: true,
      licenseType: true,
      osekType: true,
      osekNumber: true,
      legalName: true,
      businessAddress: true,
      weeklyHours: {
        select: { dayOfWeek: true, startMin: true, endMin: true },
        orderBy: { dayOfWeek: "asc" },
      },
      serviceAreas: {
        select: { districtCode: true, districtName: true, cityCode: true, cityName: true },
        orderBy: [{ districtName: "asc" }, { cityName: "asc" }],
      },
      userServices: {
        select: { serviceSlug: true },
      },
      servicePrices: {
        select: {
          serviceSlug: true,
          price: true,
          description: true,
          materialsEstimate: true,
          buyerSuppliesMaterials: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!seller) {
    res.status(404).json({ error: "Seller not found" });
    return;
  }

  res.json(seller);
});
