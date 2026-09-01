/**
 * Escrow business logic: release held payments and refund on dispute resolution.
 */

import type { PrismaClient, Payment } from "../generated/prisma/client";
import { getPaymentGateway } from "./payment-gateway";

const gateway = getPaymentGateway();

/** Release a HELD payment to the seller. Returns the updated payment or null. */
export async function releasePayment(prisma: PrismaClient, orderId: string): Promise<Payment | null> {
  const payment = await prisma.payment.findFirst({
    where: { orderId, status: "HELD" },
  });
  if (!payment || !payment.gatewayId) return null;

  const result = await gateway.releaseToSeller(payment.gatewayId);
  if (result.status !== "released") return null;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
      gatewayResponse: result.raw as object,
    },
  });
}

/** Refund a HELD payment to the buyer. Full refund if no amount specified. */
export async function refundPayment(
  prisma: PrismaClient,
  orderId: string,
  amount?: number
): Promise<Payment | null> {
  const payment = await prisma.payment.findFirst({
    where: { orderId, status: "HELD" },
  });
  if (!payment || !payment.gatewayId) return null;

  const result = await gateway.refund(payment.gatewayId, amount);
  if (result.status !== "refunded") return null;

  const isPartial = amount !== undefined && amount < payment.amount;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: isPartial ? "PARTIALLY_REFUNDED" : "REFUNDED",
      refundedAt: new Date(),
      refundAmount: amount ?? payment.amount,
      gatewayResponse: result.raw as object,
    },
  });
}
