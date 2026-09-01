import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import { Prisma } from "../generated/prisma/client";
import { laborAmount, quoteTotal } from "../lib/quote-price";
import { parseRequiredSlot } from "../lib/slots";
import { isFuturePendingOrder } from "../lib/standing-job";

/** Routes for standing (recurring) jobs. */
export const standingJobRoutes = Router();

const FREQUENCIES = new Set(["WEEKLY", "BIWEEKLY", "MONTHLY"]);

type OccurrenceInput = {
  slotStart?: unknown;
  slotEnd?: unknown;
  price?: unknown;
  laborPrice?: unknown;
  materialsEstimate?: unknown;
  buyerSuppliesMaterials?: unknown;
};

/** Create one local-job occurrence if the visit window is free. */
async function createOccurrence(
  tx: Prisma.TransactionClient,
  opts: {
    standingJobId: string;
    buyerId: string;
    sellerId: string;
    title: string;
    slotStart: Date;
    slotEnd: Date;
    labor: number;
    materials: number | null;
    buyerSupplies: boolean;
    total: number;
  }
) {
  const conflict = await tx.order.findFirst({
    where: {
      sellerId: opts.sellerId,
      status: { not: "CANCELLED" },
      slotStart: { lt: opts.slotEnd },
      slotEnd: { gt: opts.slotStart },
    },
    select: { id: true },
  });
  if (conflict) return null;

  return tx.order.create({
    data: {
      jobType: "LOCAL_REQUEST",
      title: opts.title,
      buyerId: opts.buyerId,
      sellerId: opts.sellerId,
      price: opts.total,
      laborPrice: opts.labor,
      materialsEstimate: opts.materials,
      buyerSuppliesMaterials: opts.buyerSupplies,
      dueDate: opts.slotEnd,
      slotStart: opts.slotStart,
      slotEnd: opts.slotEnd,
      standingJobId: opts.standingJobId,
    },
  });
}

function parseOccurrencePrices(row: OccurrenceInput) {
  const labor = laborAmount({ laborPrice: row.laborPrice as number, price: row.price as number });
  if (labor == null) return null;
  const buyerSupplies = row.buyerSuppliesMaterials !== false;
  const materials =
    row.materialsEstimate != null && Number(row.materialsEstimate) > 0 ? Number(row.materialsEstimate) : null;
  const total =
    quoteTotal({
      laborPrice: labor,
      materialsEstimate: materials,
      buyerSuppliesMaterials: buyerSupplies,
    }) ?? labor;
  return { labor, materials, buyerSupplies, total };
}

function canAccess(job: { buyerId: string; sellerId: string }, req: Request) {
  return job.buyerId === req.user!.id || job.sellerId === req.user!.id || req.user!.role === "ADMIN";
}

/** List standing jobs for the signed-in buyer or daddy. */
standingJobRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const jobs = await prisma.standingJob.findMany({
    where: { OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }] },
    include: {
      orders: {
        select: { id: true, status: true, slotStart: true, slotEnd: true, price: true },
        orderBy: { slotStart: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

/** Create a standing job and its first batch of real visit orders. */
standingJobRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const {
    sellerId,
    serviceSlug,
    title,
    frequency,
    weekday,
    startMin,
    sourceOrderId,
    occurrences,
  } = req.body as {
    sellerId?: string;
    serviceSlug?: string;
    title?: string;
    frequency?: string;
    weekday?: number;
    startMin?: number;
    sourceOrderId?: string;
    occurrences?: OccurrenceInput[];
  };

  if (!sellerId || !String(serviceSlug || "").trim() || !String(title || "").trim()) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!FREQUENCIES.has(String(frequency))) {
    res.status(400).json({ error: "Invalid frequency" });
    return;
  }
  if (!Number.isInteger(weekday) || weekday! < 0 || weekday! > 6) {
    res.status(400).json({ error: "Invalid weekday" });
    return;
  }
  if (!Number.isInteger(startMin) || startMin! < 0 || startMin! > 22 * 60) {
    res.status(400).json({ error: "Invalid start time" });
    return;
  }
  if (sellerId === req.user!.id) {
    res.status(400).json({ error: "Cannot order your own gig" });
    return;
  }
  if (!Array.isArray(occurrences) || occurrences.length === 0) {
    res.status(400).json({ error: "At least one visit is required" });
    return;
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const job = await tx.standingJob.create({
        data: {
          buyerId: req.user!.id,
          sellerId,
          serviceSlug: String(serviceSlug).trim(),
          title: String(title).trim(),
          frequency: frequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
          weekday: weekday!,
          startMin: startMin!,
          sourceOrderId: sourceOrderId || null,
        },
      });

      const orders = [];
      for (const row of occurrences) {
        const slot = parseRequiredSlot(row.slotStart, row.slotEnd);
        const prices = parseOccurrencePrices(row);
        if (!slot || !prices) continue;
        if (slot.start.getTime() <= Date.now()) continue;
        const order = await createOccurrence(tx, {
          standingJobId: job.id,
          buyerId: req.user!.id,
          sellerId,
          title: String(title).trim(),
          slotStart: slot.start,
          slotEnd: slot.end,
          ...prices,
        });
        if (order) orders.push(order);
      }

      if (orders.length === 0) {
        throw new Error("NO_SLOTS");
      }

      return { ...job, orders };
    });

    res.status(201).json(created);
  } catch (err) {
    if (err instanceof Error && err.message === "NO_SLOTS") {
      res.status(409).json({ error: "No free visit windows for this schedule" });
      return;
    }
    throw err;
  }
});

/** Return one standing job and its visit orders. */
standingJobRoutes.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const job = await prisma.standingJob.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { slotStart: "asc" } },
    },
  });
  if (!job) {
    res.status(404).json({ error: "Standing job not found" });
    return;
  }
  if (!canAccess(job, req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(job);
});

/** Pause, resume, or cancel future visits. Past orders stay. */
standingJobRoutes.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const action = req.body?.action;
  const job = await prisma.standingJob.findUnique({
    where: { id },
    include: { orders: { select: { id: true, status: true, slotStart: true } } },
  });
  if (!job) {
    res.status(404).json({ error: "Standing job not found" });
    return;
  }
  if (!canAccess(job, req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const now = new Date();
  const futureIds = job.orders.filter((row) => isFuturePendingOrder(row, now)).map((row) => row.id);

  if (action === "pause") {
    if (job.status !== "ACTIVE") {
      res.status(400).json({ error: "Only an active standing job can be paused" });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (futureIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: futureIds } },
          data: { status: "CANCELLED", cancelledAt: now, cancelledById: req.user!.id },
        });
      }
      return tx.standingJob.update({
        where: { id },
        data: { status: "PAUSED", pausedAt: now },
        include: { orders: { orderBy: { slotStart: "asc" } } },
      });
    });
    res.json(updated);
    return;
  }

  if (action === "cancel") {
    if (job.status === "CANCELLED") {
      res.status(400).json({ error: "Standing job is already cancelled" });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (futureIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: futureIds } },
          data: { status: "CANCELLED", cancelledAt: now, cancelledById: req.user!.id },
        });
      }
      return tx.standingJob.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now, cancelledById: req.user!.id, pausedAt: job.pausedAt },
        include: { orders: { orderBy: { slotStart: "asc" } } },
      });
    });
    res.json(updated);
    return;
  }

  if (action === "resume") {
    if (job.status !== "PAUSED") {
      res.status(400).json({ error: "Only a paused standing job can be resumed" });
      return;
    }
    const updated = await prisma.standingJob.update({
      where: { id },
      data: { status: "ACTIVE", pausedAt: null },
      include: { orders: { orderBy: { slotStart: "asc" } } },
    });
    res.json(updated);
    return;
  }

  res.status(400).json({ error: "Invalid action" });
});

/** Append more visit orders onto an active standing job (horizon fill). */
standingJobRoutes.post("/:id/occurrences", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const occurrences = req.body?.occurrences as OccurrenceInput[] | undefined;
  const job = await prisma.standingJob.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ error: "Standing job not found" });
    return;
  }
  if (!canAccess(job, req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (job.status !== "ACTIVE") {
    res.status(400).json({ error: "Standing job is not active" });
    return;
  }
  if (!Array.isArray(occurrences) || occurrences.length === 0) {
    res.status(400).json({ error: "At least one visit is required" });
    return;
  }

  const created = await prisma.$transaction(async (tx) => {
    const orders = [];
    for (const row of occurrences) {
      const slot = parseRequiredSlot(row.slotStart, row.slotEnd);
      const prices = parseOccurrencePrices(row);
      if (!slot || !prices) continue;
      if (slot.start.getTime() <= Date.now()) continue;
      const order = await createOccurrence(tx, {
        standingJobId: job.id,
        buyerId: job.buyerId,
        sellerId: job.sellerId,
        title: job.title,
        slotStart: slot.start,
        slotEnd: slot.end,
        ...prices,
      });
      if (order) orders.push(order);
    }
    return orders;
  });

  const fresh = await prisma.standingJob.findUnique({
    where: { id },
    include: { orders: { orderBy: { slotStart: "asc" } } },
  });
  res.status(201).json({ ...fresh, createdCount: created.length });
});
