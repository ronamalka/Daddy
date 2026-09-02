/**
 * Payment gateway interface and stub implementation.
 *
 * The stub always succeeds — swap it for a real PayPlus / Tranzila
 * adapter by setting PAYMENT_GATEWAY=payplus in the environment.
 */

import { logger } from "../../../shared/logger";

export interface ChargeParams {
  amount: number;
  currency: string;
  method: string;
  orderId: string;
  buyerEmail: string;
}

export interface ChargeResult {
  gatewayId: string;
  status: "held" | "failed";
  raw: unknown;
}

export interface ReleaseResult {
  status: "released";
  raw: unknown;
}

export interface RefundResult {
  status: "refunded";
  raw: unknown;
}

export interface PaymentGateway {
  createCharge(params: ChargeParams): Promise<ChargeResult>;
  releaseToSeller(gatewayId: string): Promise<ReleaseResult>;
  refund(gatewayId: string, amount?: number): Promise<RefundResult>;
}

/** Stub gateway that simulates success for every operation. */
class StubGateway implements PaymentGateway {
  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    const gatewayId = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    logger.info({ orderId: params.orderId, amount: params.amount, currency: params.currency, method: params.method, gatewayId }, "StubGateway: createCharge");
    return {
      gatewayId,
      status: "held",
      raw: { stub: true, message: "Simulated charge hold" },
    };
  }

  async releaseToSeller(gatewayId: string): Promise<ReleaseResult> {
    logger.info({ gatewayId }, "StubGateway: releaseToSeller");
    return {
      status: "released",
      raw: { stub: true, message: "Simulated release to seller" },
    };
  }

  async refund(gatewayId: string, amount?: number): Promise<RefundResult> {
    logger.info({ gatewayId, amount: amount ?? "full" }, "StubGateway: refund");
    return {
      status: "refunded",
      raw: { stub: true, message: "Simulated refund", amount },
    };
  }
}

/** Returns the configured payment gateway (currently always the stub). */
export function getPaymentGateway(): PaymentGateway {
  // Future: check process.env.PAYMENT_GATEWAY and return the real adapter.
  return new StubGateway();
}
