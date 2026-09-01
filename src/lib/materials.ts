export type MaterialsOrder = {
  status: string;
  buyerId: string;
  sellerId: string;
  laborPrice?: number | null;
  materialsEstimate?: number | null;
  buyerSuppliesMaterials?: boolean | null;
  pendingMaterialsEstimate?: number | null;
  materialsUpdatedAt?: string | Date | null;
  price: number;
};

export type MaterialsResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

const MAX_MATERIALS = 100_000;

/** True when the daddy still owes the buyer an ack on a materials change. */
export function hasPendingMaterialsAck(order: {
  pendingMaterialsEstimate?: number | null;
}): boolean {
  return order.pendingMaterialsEstimate != null && order.pendingMaterialsEstimate > 0;
}

/** True when the seller may still change the materials estimate once. */
export function canShowMaterialsUpdateForm(order: {
  status: string;
  buyerSuppliesMaterials?: boolean | null;
  materialsUpdatedAt?: string | Date | null;
  pendingMaterialsEstimate?: number | null;
}): boolean {
  return (
    order.status === "PENDING" &&
    order.buyerSuppliesMaterials === false &&
    order.materialsUpdatedAt == null &&
    order.pendingMaterialsEstimate == null
  );
}

/** Checks that this seller can propose a one-time materials update before work starts. */
export function validateProposeMaterials(input: {
  actorId: string;
  actorRole: string;
  order: MaterialsOrder | null;
  materialsEstimate: unknown;
}): MaterialsResult<{ materialsEstimate: number }> {
  if (!input.order) {
    return { ok: false, status: 404, error: "ההזמנה לא נמצאה" };
  }

  if (input.actorRole !== "ADMIN" && input.actorId !== input.order.sellerId) {
    return { ok: false, status: 403, error: "רק האבא יכול לעדכן את הערכת החומרים" };
  }

  if (input.order.status !== "PENDING") {
    return { ok: false, status: 409, error: "אפשר לעדכן חומרים רק לפני תחילת העבודה" };
  }

  if (input.order.buyerSuppliesMaterials) {
    return { ok: false, status: 400, error: "הלקוח מביא את החומרים — אין מה לעדכן בהזמנה" };
  }

  if (input.order.materialsUpdatedAt != null || input.order.pendingMaterialsEstimate != null) {
    return { ok: false, status: 409, error: "כבר עדכנת את הערכת החומרים פעם אחת" };
  }

  const amount = typeof input.materialsEstimate === "number"
    ? input.materialsEstimate
    : Number(input.materialsEstimate);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_MATERIALS) {
    return { ok: false, status: 400, error: "יש להזין הערכת חומרים חיובית" };
  }

  return { ok: true, data: { materialsEstimate: amount } };
}

/** Checks that this buyer can accept the pending materials estimate. */
export function validateAckMaterials(input: {
  actorId: string;
  actorRole: string;
  order: MaterialsOrder | null;
}): MaterialsResult {
  if (!input.order) {
    return { ok: false, status: 404, error: "ההזמנה לא נמצאה" };
  }

  if (input.actorRole !== "ADMIN" && input.actorId !== input.order.buyerId) {
    return { ok: false, status: 403, error: "רק הלקוח יכול לאשר את עדכון החומרים" };
  }

  if (input.order.status !== "PENDING") {
    return { ok: false, status: 409, error: "אפשר לאשר חומרים רק לפני תחילת העבודה" };
  }

  if (!hasPendingMaterialsAck(input.order)) {
    return { ok: false, status: 400, error: "אין עדכון חומרים שממתין לאישור" };
  }

  return { ok: true, data: undefined };
}

/** Order total after the buyer accepts the new materials estimate. */
export function totalAfterMaterialsAck(order: MaterialsOrder): number {
  const labor = order.laborPrice ?? order.price;
  const materials = order.pendingMaterialsEstimate ?? 0;
  return labor + materials;
}

/** True if the seller may start work. Pending materials ack blocks it. */
export function canStartWork(order: Pick<MaterialsOrder, "pendingMaterialsEstimate">): boolean {
  return !hasPendingMaterialsAck(order);
}
