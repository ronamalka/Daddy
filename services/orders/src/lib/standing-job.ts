/** Future pending visits are the only ones dropped when a standing job pauses or cancels. */
export function isFuturePendingOrder(
  order: { status: string; slotStart?: Date | string | null },
  now = new Date()
): boolean {
  if (order.status !== "PENDING" || !order.slotStart) return false;
  return new Date(order.slotStart).getTime() > now.getTime();
}
