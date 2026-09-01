import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import {
  totalAfterMaterialsAck,
  validateAckMaterials,
  validateProposeMaterials,
} from "../lib/materials";

/** Propose a one-time materials update, or acknowledge it, before work starts. */
export const materialsRoutes = Router();

/** Seller proposes a new materials estimate. Buyer must ack before work can start. */
materialsRoutes.post("/:id/materials", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const action = req.body?.action === "ack" ? "ack" : "propose";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ error: "ההזמנה לא נמצאה" });
    return;
  }

  const actor = req.user!;

  if (action === "ack") {
    const check = validateAckMaterials({
      actorId: actor.id,
      actorRole: actor.role,
      order,
    });
    if (!check.ok) {
      res.status(check.status).json({ error: check.error });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        materialsEstimate: order.pendingMaterialsEstimate,
        pendingMaterialsEstimate: null,
        materialsAcknowledgedAt: new Date(),
        price: totalAfterMaterialsAck(order),
      },
    });
    res.json(updated);
    return;
  }

  const check = validateProposeMaterials({
    actorId: actor.id,
    actorRole: actor.role,
    order,
    materialsEstimate: req.body?.materialsEstimate,
  });
  if (!check.ok) {
    res.status(check.status).json({ error: check.error });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      pendingMaterialsEstimate: check.data.materialsEstimate,
      materialsUpdatedAt: new Date(),
    },
  });
  res.json(updated);
});
