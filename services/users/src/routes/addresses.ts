import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../db";

const MAX_SAVED_ADDRESSES = 5;

/** Routes for a buyer's saved home addresses. */
export const addressesRoutes = Router();

/** List the current user's saved addresses. */
addressesRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const addresses = await prisma.savedAddress.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json(addresses);
});

/** Create a saved address (max 5 per user). */
addressesRoutes.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const count = await prisma.savedAddress.count({ where: { userId } });
  if (count >= MAX_SAVED_ADDRESSES) {
    res.status(400).json({ error: `ניתן לשמור עד ${MAX_SAVED_ADDRESSES} כתובות` });
    return;
  }

  const { label, cityCode, cityName, districtCode, districtName, street, floor, accessNotes } = req.body;

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    res.status(400).json({ error: "יש להזין שם לכתובת" });
    return;
  }

  const address = await prisma.savedAddress.create({
    data: {
      userId,
      label: label.trim(),
      cityCode: cityCode ?? null,
      cityName: cityName ?? null,
      districtCode: districtCode ?? null,
      districtName: districtName ?? null,
      street: street ?? null,
      floor: floor ?? null,
      accessNotes: accessNotes ?? null,
    },
  });

  res.status(201).json(address);
});

/** Update a saved address. */
addressesRoutes.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = String(req.params.id);

  const existing = await prisma.savedAddress.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "כתובת לא נמצאה" });
    return;
  }

  const { label, cityCode, cityName, districtCode, districtName, street, floor, accessNotes } = req.body;

  if (label !== undefined && (typeof label !== "string" || label.trim().length === 0)) {
    res.status(400).json({ error: "יש להזין שם לכתובת" });
    return;
  }

  const address = await prisma.savedAddress.update({
    where: { id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(cityCode !== undefined && { cityCode: cityCode ?? null }),
      ...(cityName !== undefined && { cityName: cityName ?? null }),
      ...(districtCode !== undefined && { districtCode: districtCode ?? null }),
      ...(districtName !== undefined && { districtName: districtName ?? null }),
      ...(street !== undefined && { street: street ?? null }),
      ...(floor !== undefined && { floor: floor ?? null }),
      ...(accessNotes !== undefined && { accessNotes: accessNotes ?? null }),
    },
  });

  res.json(address);
});

/** Delete a saved address. */
addressesRoutes.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = String(req.params.id);

  const existing = await prisma.savedAddress.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "כתובת לא נמצאה" });
    return;
  }

  await prisma.savedAddress.delete({ where: { id } });
  res.json({ success: true });
});
