/** Build a query that finds orders where this user is the buyer or the seller. */
export function orderListWhere(userId: string) {
  return { OR: [{ sellerId: userId }, { buyerId: userId }] };
}
