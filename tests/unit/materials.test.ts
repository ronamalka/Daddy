import { describe, it, expect } from "vitest";
import {
  canShowMaterialsUpdateForm,
  canStartWork,
  hasPendingMaterialsAck,
  totalAfterMaterialsAck,
  validateAckMaterials,
  validateProposeMaterials,
} from "@/lib/materials";

const order = {
  status: "PENDING",
  buyerId: "buyer-1",
  sellerId: "seller-1",
  laborPrice: 200,
  materialsEstimate: 50,
  buyerSuppliesMaterials: false,
  pendingMaterialsEstimate: null as number | null,
  materialsUpdatedAt: null as string | null,
  price: 250,
};

describe("materials update", () => {
  it("lets the seller propose one materials update before work starts", () => {
    const result = validateProposeMaterials({
      actorId: "seller-1",
      actorRole: "SELLER",
      order,
      materialsEstimate: 90,
    });
    expect(result).toEqual({ ok: true, data: { materialsEstimate: 90 } });
    expect(canShowMaterialsUpdateForm(order)).toBe(true);
  });

  it("rejects a second update and starting work while ack is pending", () => {
    const pending = { ...order, pendingMaterialsEstimate: 90, materialsUpdatedAt: "2026-09-01" };
    const result = validateProposeMaterials({
      actorId: "seller-1",
      actorRole: "SELLER",
      order: pending,
      materialsEstimate: 120,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(hasPendingMaterialsAck(pending)).toBe(true);
    expect(canStartWork(pending)).toBe(false);
    expect(canShowMaterialsUpdateForm(pending)).toBe(false);
  });

  it("lets the buyer ack and recomputes labor plus materials", () => {
    const pending = { ...order, pendingMaterialsEstimate: 90, materialsUpdatedAt: "2026-09-01" };
    expect(
      validateAckMaterials({
        actorId: "buyer-1",
        actorRole: "BUYER",
        order: pending,
      })
    ).toEqual({ ok: true, data: undefined });
    expect(totalAfterMaterialsAck(pending)).toBe(290);
  });

  it("blocks materials updates when the buyer brings the parts", () => {
    const result = validateProposeMaterials({
      actorId: "seller-1",
      actorRole: "SELLER",
      order: { ...order, buyerSuppliesMaterials: true },
      materialsEstimate: 40,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a buyer trying to propose materials", () => {
    const result = validateProposeMaterials({
      actorId: "buyer-1",
      actorRole: "BUYER",
      order,
      materialsEstimate: 40,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });
});
