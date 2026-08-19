import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_requests" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const S = {
  buyer: "seed-user-buyer1",
  buyer2: "seed-user-buyer2",
  buyer3: "seed-user-buyer3",
};

async function main() {
  const requests = [
    {
      id: "sreq-1",
      title: "צריך עזרה בהרכבת ארון גדול",
      description: "קניתי ארון PAX 3 דלתות מאיקאה ואין לי כלים או ידע להרכיב. גר בתל אביב, צריך מישהו שיגיע השבוע.",
      serviceSlug: "furniture-assembly",
      buyerId: S.buyer,
      districtCode: 5,
      districtName: "תל אביב",
    },
    {
      id: "sreq-2",
      title: "WiFi חלש בחדרים – צריך פתרון",
      description: "הראוטר בסלון ובחדרי השינה כמעט אין אינטרנט. צריך מישהו שיגדיר mesh או מאריך טווח.",
      serviceSlug: "wifi-setup",
      buyerId: S.buyer2,
      districtCode: 3,
      districtName: "חיפה",
    },
    {
      id: "sreq-3",
      title: "גיזום עצים ושיחים – חצר גדולה",
      description: "חצר של 200 מ״ר עם 3 עצי זית ושיחים שצריך לגזום. צריך מישהו עם ניסיון וכלים.",
      serviceSlug: "tree-pruning",
      buyerId: S.buyer3,
      districtCode: 1,
      districtName: "ירושלים",
    },
  ];

  for (const req of requests) {
    const existing = await prisma.serviceRequest.findUnique({ where: { id: req.id } });
    if (!existing) {
      await prisma.serviceRequest.create({ data: req });
    }
  }

  console.log("Requests seed complete.");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
