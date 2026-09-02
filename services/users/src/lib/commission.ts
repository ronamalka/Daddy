/**
 * Commission tier logic for the sliding-scale volume discount.
 *
 * Tiers are based on completed orders in a 90-day rolling window.
 */

export const COMMISSION_TIERS = {
  STANDARD: { min: 0, max: 5, rate: 0.15, label: "רגיל" },
  SILVER: { min: 6, max: 15, rate: 0.12, label: "כסף" },
  GOLD: { min: 16, max: 30, rate: 0.10, label: "זהב" },
  PLATINUM: { min: 31, max: Infinity, rate: 0.08, label: "פלטינה" },
} as const;

export type CommissionTierName = keyof typeof COMMISSION_TIERS;

const TIER_ORDER: CommissionTierName[] = ["STANDARD", "SILVER", "GOLD", "PLATINUM"];

/** Determine which tier a seller falls into based on their completed order count. */
export function calculateTier(completedOrders: number): { tier: CommissionTierName; rate: number } {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const name = TIER_ORDER[i];
    const tier = COMMISSION_TIERS[name];
    if (completedOrders >= tier.min) {
      return { tier: name, rate: tier.rate };
    }
  }
  return { tier: "STANDARD", rate: COMMISSION_TIERS.STANDARD.rate };
}

/** Return info about the next tier, or null if the seller is already at PLATINUM. */
export function nextTierInfo(
  currentTier: CommissionTierName,
  completedOrders: number,
): { nextTier: CommissionTierName; ordersNeeded: number } | null {
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  if (currentIdx === -1 || currentIdx >= TIER_ORDER.length - 1) {
    return null;
  }

  const next = TIER_ORDER[currentIdx + 1];
  const nextMin = COMMISSION_TIERS[next].min;
  const ordersNeeded = Math.max(0, nextMin - completedOrders);

  return { nextTier: next, ordersNeeded };
}
