import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_chat" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DANA = "seed-user-buyer1";
const YOSSI = "seed-user-seller1";
const MICHAL = "seed-user-buyer2";

async function main() {
  await prisma.$connect();

  const existing = await prisma.message.count();
  if (existing > 0) {
    console.log(`Chat seed skipped (${existing} messages already present).`);
    return;
  }

  const t = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000);

  await prisma.message.createMany({
    data: [
      { senderId: DANA, receiverId: YOSSI, content: "היי יוסי, ראיתי את הפרופיל שלך. יש לך מקום השבוע?", createdAt: t(180) },
      { senderId: YOSSI, receiverId: DANA, content: "היי דנה, בטח. מה צריך לסדר?", createdAt: t(170) },
      { senderId: DANA, receiverId: YOSSI, content: "אפשר מחר בבוקר?", orderId: "ord-1", createdAt: t(90) },
      { senderId: YOSSI, receiverId: DANA, content: "בטח, תשע בבוקר אצלך.", orderId: "ord-1", createdAt: t(80) },
      { senderId: DANA, receiverId: YOSSI, content: "וגם לגבי ההתמקחות מול חברת הביטוח — מתי נתחיל?", orderId: "ord-4", createdAt: t(40) },
      { senderId: MICHAL, receiverId: YOSSI, content: "שלום, אפשר הצעת מחיר להרכבת ארון?", createdAt: t(25) },
    ],
  });

  console.log("Chat seed complete (dana↔yossi one thread + michal DM).");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
