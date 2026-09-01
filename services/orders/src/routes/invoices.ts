import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";

const USERS_SERVICE = process.env.USERS_SERVICE_URL || "http://localhost:4001";
const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET || "dev-secret-change-in-production";

const VAT_RATE_MURSHE = 0.18;

/** Routes for invoice generation and retrieval. */
export const invoiceRoutes = Router();

interface UserProfile {
  id: string;
  name: string;
  osekType: string | null;
  osekNumber: string | null;
  legalName: string | null;
  businessAddress: string | null;
}

/** Fetch seller tax profile from users service via internal call. */
async function fetchSellerProfile(sellerId: string): Promise<UserProfile | null> {
  const crypto = await import("crypto");
  const serviceSignature = crypto
    .createHmac("sha256", INTER_SERVICE_SECRET)
    .update("service-call")
    .digest("hex");

  const res = await fetch(`${USERS_SERVICE}/sellers/${sellerId}`, {
    headers: {
      "Content-Type": "application/json",
      "x-service-signature": serviceSignature,
    },
  });

  if (!res.ok) return null;
  return res.json() as Promise<UserProfile>;
}

/** Generate invoice for a completed order. Only the seller can generate. */
invoiceRoutes.post("/:id/invoice", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  });

  if (!order) {
    res.status(404).json({ error: "הזמנה לא נמצאה" });
    return;
  }

  if (order.sellerId !== req.user!.id) {
    res.status(403).json({ error: "רק בעל המקצוע יכול להנפיק חשבונית" });
    return;
  }

  if (order.status !== "COMPLETED") {
    res.status(400).json({ error: "ניתן להנפיק חשבונית רק להזמנה שהושלמה" });
    return;
  }

  if (order.invoice) {
    res.status(409).json({ error: "חשבונית כבר הונפקה להזמנה זו", invoice: order.invoice });
    return;
  }

  const seller = await fetchSellerProfile(order.sellerId);
  if (!seller) {
    res.status(502).json({ error: "לא ניתן לאחזר את פרטי בעל המקצוע" });
    return;
  }

  if (!seller.osekType || !seller.legalName) {
    res.status(400).json({ error: "יש להשלים את הפרופיל העסקי לפני הנפקת חשבונית" });
    return;
  }

  // Fetch buyer name
  const buyer = await fetchSellerProfile(order.buyerId);
  const buyerName = buyer?.name || "לקוח";

  const laborAmount = order.laborPrice ?? order.price;
  const materialsAmount = order.materialsEstimate;
  const subtotal = laborAmount + (materialsAmount ?? 0);
  const vatRate = seller.osekType === "murshe" ? VAT_RATE_MURSHE : 0;
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const serviceDescription = order.title || "שירות מקצועי";

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      sellerLegalName: seller.legalName,
      sellerOsekNumber: seller.osekNumber || null,
      sellerOsekType: seller.osekType,
      sellerAddress: seller.businessAddress || null,
      buyerName,
      serviceDescription,
      laborAmount,
      materialsAmount,
      subtotal,
      vatRate,
      vatAmount,
      total,
    },
  });

  res.status(201).json(invoice);
});

/** Get invoice data for an order. Buyer, seller, or admin can view. */
invoiceRoutes.get("/:id/invoice", requireAuth, async (req: Request, res: Response) => {
  const orderId = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  });

  if (!order) {
    res.status(404).json({ error: "הזמנה לא נמצאה" });
    return;
  }

  if (
    order.buyerId !== req.user!.id &&
    order.sellerId !== req.user!.id &&
    req.user!.role !== "ADMIN"
  ) {
    res.status(403).json({ error: "אין הרשאה לצפות בחשבונית" });
    return;
  }

  if (!order.invoice) {
    res.status(404).json({ error: "לא נמצאה חשבונית להזמנה זו" });
    return;
  }

  res.json(order.invoice);
});
