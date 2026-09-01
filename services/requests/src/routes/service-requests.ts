import { Router, Request, Response } from "express";
import { requireAuth, requireSeller } from "../../../shared/middleware";
import {
  REQUEST_TEASER_SELECT,
  REQUEST_TEASER_TAKE,
  mapRequestTeasers,
  requestTeaserWhere,
} from "../../../shared/request-teaser";
import { prisma } from "../index";

/** Routes for local service requests, seller quotes, and accepting a quote. */
export const serviceRequestsRoutes = Router();

/** List service requests the current user is allowed to see. */
serviceRequestsRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const district = req.query.district as string | undefined;
  const status = (req.query.status as string) || "OPEN";
  const user = req.user!;

  const baseWhere: Record<string, unknown> = {
    status: status as "OPEN" | "IN_PROGRESS" | "CLOSED",
    ...(district ? { districtCode: Number(district) } : {}),
  };

  if (user.role === "BUYER") {
    baseWhere.buyerId = user.id;
  } else if (user.role === "SELLER") {
    // Sellers see all open requests (marketplace visibility for providers)
  }
  // ADMIN sees all — no additional filter

  const requests = await prisma.serviceRequest.findMany({
    where: baseWhere,
    include: {
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(requests);
});

/** Create a new local service request with a visit window. */
serviceRequestsRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, description, serviceSlug, districtCode, districtName, cityCode, cityName, slotStart, slotEnd } = req.body;

  if (!title?.trim() || !description?.trim()) {
    res.status(400).json({ error: "Title and description are required" });
    return;
  }

  if (!slotStart || !slotEnd) {
    res.status(400).json({ error: "A 2-hour visit window is required" });
    return;
  }

  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    res.status(400).json({ error: "Invalid visit window" });
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
      unlisted: req.body.unlisted === true,
      slotStart: start,
      slotEnd: end,
    },
    include: {
      _count: { select: { responses: true } },
    },
  });

  res.json(created);
});

/** Public teaser of recent OPEN listed requests. No auth. Must be registered before `/:id`. */
serviceRequestsRoutes.get("/teaser", async (_req: Request, res: Response) => {
  const rows = await prisma.serviceRequest.findMany({
    where: requestTeaserWhere(),
    select: REQUEST_TEASER_SELECT,
    orderBy: { createdAt: "desc" },
    take: REQUEST_TEASER_TAKE,
  });
  res.json(mapRequestTeasers(rows));
});

/** Get one request and its quotes. Buyers can only see their own. */
serviceRequestsRoutes.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

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

  if (user.role === "BUYER" && serviceRequest.buyerId !== user.id) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json({ request: serviceRequest });
});

/** Parses an optional positive money amount from a quote payload. */
function optionalMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/** Let a seller send a quote on an open request. */
serviceRequestsRoutes.post("/:id/respond", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { message, proposedPrice, laborPrice, materialsEstimate, buyerSuppliesMaterials } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!serviceRequest) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (serviceRequest.status !== "OPEN") {
    res.status(409).json({ error: "Request is no longer open" });
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

  const labor = optionalMoney(laborPrice) ?? optionalMoney(proposedPrice);
  const materials = optionalMoney(materialsEstimate);
  const buyerSupplies = buyerSuppliesMaterials !== false;

  const response = await prisma.requestResponse.create({
    data: {
      requestId: id,
      sellerId: req.user!.id,
      message,
      proposedPrice: labor,
      laborPrice: labor,
      materialsEstimate: materials,
      buyerSuppliesMaterials: buyerSupplies,
    },
  });

  res.json(response);
});

/** Let the buyer accept a quote and link it to an order. */
serviceRequestsRoutes.post("/:id/accept", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { responseId, orderId } = req.body as { responseId?: string; orderId?: string };

  if (!responseId || !orderId) {
    res.status(400).json({ error: "responseId and orderId are required" });
    return;
  }

  try {
    /** Mark the quote as selected and move the request to in progress. */
    const updated = await prisma.$transaction(async (tx) => {
      const serviceRequest = await tx.serviceRequest.findUnique({
        where: { id },
        include: { responses: true },
      });

      if (!serviceRequest) {
        throw new Error("NOT_FOUND");
      }

      const isOwner = serviceRequest.buyerId === req.user!.id;
      if (!isOwner && req.user!.role !== "ADMIN") {
        throw new Error("FORBIDDEN");
      }

      if (serviceRequest.status !== "OPEN") {
        throw new Error("NOT_OPEN");
      }

      const quote = serviceRequest.responses.find((row) => row.id === responseId);
      if (!quote) {
        throw new Error("QUOTE_NOT_FOUND");
      }

      await tx.requestResponse.updateMany({
        where: { requestId: id },
        data: { selected: false },
      });
      await tx.requestResponse.update({
        where: { id: responseId },
        data: { selected: true },
      });

      return tx.serviceRequest.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          selectedResponseId: responseId,
          orderId,
        },
        include: {
          responses: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    res.json({ request: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (err instanceof Error && err.message === "NOT_OPEN") {
      res.status(409).json({ error: "Request is no longer open" });
      return;
    }
    if (err instanceof Error && err.message === "QUOTE_NOT_FOUND") {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    throw err;
  }
});
