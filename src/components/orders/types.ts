export interface OrderListItem {
  id: string;
  buyerId: string;
  sellerId: string;
  tier: string | null;
  price: number;
  status: string;
  createdAt: string;
  slotStart: string | null;
  slotEnd: string | null;
  gig: { id: string; title: string; image: string | null };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  disputes?: { status: string }[];
}
