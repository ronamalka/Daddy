import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

export const serviceRequestsRoutes = Router();

serviceRequestsRoutes.get("/", async (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;
  const status = (req.query.status as string) || "OPEN";

  const requests = await prisma.serviceRequest.findMany({
    where: {
      status: status as "OPEN" | "IN_PROGRESS" | "CLOSED",
      ...(district ? { districtCode: Number(district) } : {}),
    },
    include: {
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(requests);
});

serviceRequestsRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, description, serviceSlug, districtCode, districtName, cityCode, cityName } = req.body;

  if (!title?.trim() || !description?.trim()) {
    res.status(400).json({ error: "Title and description are required" });
    return;
  }

  const created = await prisma.serviceRequest.create({
    data: {
      title,
      description,
      serviceSlug: serviceSlug || null,
      buyerId: req.user!.id,
      districtCode: districtCode ? Number(districtCode) : null,
      districtName: districtName || null,
      cityCode: cityCode ? Number(cityCode) : null,
      cityName: cityName || null,
    },
    include: {
      _count: { select: { responses: true } },
    },
  });

  res.json(created);
});

serviceRequestsRoutes.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!serviceRequest) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json({ request: serviceRequest });
});

serviceRequestsRoutes.post("/:id/respond", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { message, proposedPrice } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!serviceRequest) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (serviceRequest.buyerId === req.user!.id) {
    res.status(400).json({ error: "Cannot respond to your own request" });
    return;
  }

  const existing = await prisma.requestResponse.findUnique({
    where: { requestId_sellerId: { requestId: id, sellerId: req.user!.id } },
  });

  if (existing) {
    res.status(400).json({ error: "You already responded" });
    return;
  }

  const response = await prisma.requestResponse.create({
    data: {
      requestId: id,
      sellerId: req.user!.id,
      message,
      proposedPrice: proposedPrice ? Number(proposedPrice) : null,
    },
  });

  res.json(response);
});
