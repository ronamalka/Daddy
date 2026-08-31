import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_orders" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const S = {
  seller: "seed-user-seller1",
  seller2: "seed-user-seller2",
  seller3: "seed-user-seller3",
  seller4: "seed-user-seller4",
  seller5: "seed-user-seller5",
  seller6: "seed-user-seller6",
  buyer: "seed-user-buyer1",
  buyer2: "seed-user-buyer2",
  buyer3: "seed-user-buyer3",
};

/** Loads demo bookings in several statuses into daddy_orders. */
async function main() {
  const orders = [
    { id: "ord-1", gigId: "seed-gig-ikea", buyerId: S.buyer, sellerId: S.seller, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-2", gigId: "seed-gig-ikea", buyerId: S.buyer2, sellerId: S.seller, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-3", gigId: "seed-gig-handyman", buyerId: S.buyer3, sellerId: S.seller, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-4", gigId: "seed-gig-haggle", buyerId: S.buyer, sellerId: S.seller, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-5", gigId: "seed-gig-garden", buyerId: S.buyer2, sellerId: S.seller, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-6", gigId: "seed-gig-tech", buyerId: S.buyer, sellerId: S.seller2, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-7", gigId: "seed-gig-tech", buyerId: S.buyer3, sellerId: S.seller2, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-8", gigId: "seed-gig-dan-tech", buyerId: S.buyer, sellerId: S.seller3, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-9", gigId: "seed-gig-dan-tech", buyerId: S.buyer2, sellerId: S.seller3, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-10", gigId: "seed-gig-dan-tech", buyerId: S.buyer3, sellerId: S.seller3, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-11", gigId: "seed-gig-moshe-assembly", buyerId: S.buyer, sellerId: S.seller4, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-12", gigId: "seed-gig-moshe-assembly", buyerId: S.buyer3, sellerId: S.seller4, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-13", gigId: "seed-gig-eran-garden", buyerId: S.buyer2, sellerId: S.seller5, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-14", gigId: "seed-gig-eran-garden", buyerId: S.buyer, sellerId: S.seller5, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-15", gigId: "seed-gig-roei-save", buyerId: S.buyer, sellerId: S.seller6, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-16", gigId: "seed-gig-roei-save", buyerId: S.buyer2, sellerId: S.seller6, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    { id: "ord-17", gigId: "seed-gig-roei-save", buyerId: S.buyer3, sellerId: S.seller6, tier: "BASIC" as const, price: 150, status: "COMPLETED" as const },
    {
      id: "ord-18",
      gigId: "seed-gig-ikea",
      buyerId: S.buyer,
      sellerId: S.seller,
      tier: "BASIC" as const,
      price: 180,
      status: "IN_PROGRESS" as const,
      slotStart: new Date("2026-09-01T13:00:00.000Z"),
      slotEnd: new Date("2026-09-01T15:00:00.000Z"),
      dueDate: new Date("2026-09-01T15:00:00.000Z"),
    },
    {
      id: "ord-19",
      gigId: "seed-gig-handyman",
      buyerId: S.buyer2,
      sellerId: S.seller,
      tier: "BASIC" as const,
      price: 200,
      status: "PENDING" as const,
      slotStart: new Date("2026-09-02T13:00:00.000Z"),
      slotEnd: new Date("2026-09-02T15:00:00.000Z"),
      dueDate: new Date("2026-09-02T15:00:00.000Z"),
    },
    {
      id: "ord-20",
      gigId: "seed-gig-garden",
      buyerId: S.buyer3,
      sellerId: S.seller,
      tier: "BASIC" as const,
      price: 220,
      status: "IN_PROGRESS" as const,
      slotStart: new Date("2026-09-04T15:00:00.000Z"),
      slotEnd: new Date("2026-09-04T17:00:00.000Z"),
      dueDate: new Date("2026-09-04T17:00:00.000Z"),
    },
    {
      id: "ord-21",
      gigId: "seed-gig-tech",
      buyerId: S.seller,
      sellerId: S.seller2,
      tier: "BASIC" as const,
      price: 160,
      status: "PENDING" as const,
      slotStart: new Date("2026-09-03T13:00:00.000Z"),
      slotEnd: new Date("2026-09-03T15:00:00.000Z"),
      dueDate: new Date("2026-09-03T15:00:00.000Z"),
    },
    {
      id: "ord-22",
      gigId: "seed-gig-handyman",
      buyerId: S.buyer,
      sellerId: S.seller,
      tier: "BASIC" as const,
      price: 170,
      status: "DELIVERED" as const,
      slotStart: new Date("2026-09-05T13:00:00.000Z"),
      slotEnd: new Date("2026-09-05T15:00:00.000Z"),
      dueDate: new Date("2026-09-05T15:00:00.000Z"),
    },
    {
      id: "ord-23",
      jobType: "LOCAL_REQUEST" as const,
      gigId: null,
      title: "הרכבת שידה בסלון",
      buyerId: S.buyer,
      sellerId: S.seller,
      tier: null,
      price: 220,
      status: "DELIVERED" as const,
      slotStart: new Date("2026-09-06T13:00:00.000Z"),
      slotEnd: new Date("2026-09-06T15:00:00.000Z"),
      dueDate: new Date("2026-09-06T15:00:00.000Z"),
    },
  ];

  for (const order of orders) {
    const existing = await prisma.order.findUnique({ where: { id: order.id } });
    if (!existing) {
      await prisma.order.create({ data: order });
    }
  }

  const existingDispute = await prisma.dispute.findUnique({ where: { id: "dsp-seed-1" } });
  if (!existingDispute) {
    await prisma.dispute.create({
      data: {
        id: "dsp-seed-1",
        orderId: "ord-18",
        openerId: S.buyer,
        reason: "QUALITY",
        description: "הארון יצא עקום והדלת לא נסגרת. ביקשתי תיקון ולא חזר.",
        photos: [],
        status: "OPEN",
      },
    });
  }

  console.log("Orders seed complete.");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
