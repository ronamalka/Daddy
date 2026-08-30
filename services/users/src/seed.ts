import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { hash } from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_users" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const SEED_IDS = {
  admin: "seed-user-admin",
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

async function main() {
  const passwordHash = await hash("password123", 12);

  const users = [
    { id: SEED_IDS.admin, name: "אבא מנהל", email: "admin@daddy.com", passwordHash, role: "ADMIN" as const },
    { id: SEED_IDS.seller, name: "יוסי הגולדן", email: "seller@daddy.com", passwordHash, role: "SELLER" as const, bio: "אבא של 3, מתקן הכל מגיל 15. אם זה שבור – אני מסדר.", city: "תל אביב", districtCode: 5, cityCode: 5000 },
    { id: SEED_IDS.seller2, name: "אבי המתקן", email: "seller2@daddy.com", passwordHash, role: "SELLER" as const, bio: "טכנאי רכב לשעבר, היום אבא במשרה מלאה שעוזר לכולם.", city: "חיפה", districtCode: 3, cityCode: 4000 },
    { id: SEED_IDS.seller3, name: "דן הטכנולוג", email: "seller3@daddy.com", passwordHash, role: "SELLER" as const, bio: "מהנדס תוכנה ביום, אבאל׳ה בערב. מתמחה בטכנולוגיה, רשתות וסמארט הום.", city: "ראשון לציון", districtCode: 4, cityCode: 8300 },
    { id: SEED_IDS.seller4, name: "משה הכל-יכול", email: "seller4@daddy.com", passwordHash, role: "SELLER" as const, bio: "אבא של 4, יד ימין לכל שכן. הרכבות, תיקונים, הובלות – הכל בחיוך.", city: "באר שבע", districtCode: 6, cityCode: 9000 },
    { id: SEED_IDS.seller5, name: "ערן הגנן", email: "seller5@daddy.com", passwordHash, role: "SELLER" as const, bio: "גנן חובב שהפך למקצוען. מטפל בגינות, מרפסות וחצרות ברחבי השרון.", city: "נתניה", districtCode: 4, cityCode: 7400 },
    { id: SEED_IDS.seller6, name: "רועי החוסך", email: "seller6@daddy.com", passwordHash, role: "SELLER" as const, bio: "20 שנה בתחום הביטוח והתקשורת. חוסך לאנשים אלפי שקלים בשנה.", city: "ירושלים", districtCode: 1, cityCode: 3000 },
    { id: SEED_IDS.buyer, name: "דנה לקוחה", email: "buyer@daddy.com", passwordHash, role: "BUYER" as const, city: "תל אביב", districtCode: 5, cityCode: 5000 },
    { id: SEED_IDS.buyer2, name: "מיכל הקונה", email: "buyer2@daddy.com", passwordHash, role: "BUYER" as const, city: "חיפה", districtCode: 3, cityCode: 4000 },
    { id: SEED_IDS.buyer3, name: "שי הלקוח", email: "buyer3@daddy.com", passwordHash, role: "BUYER" as const, city: "ירושלים", districtCode: 1, cityCode: 3000 },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  const S = SEED_IDS;

  const areaData = [
    { userId: S.seller, districtCode: 5, districtName: "תל אביב", cityCode: 5000, cityName: "תל אביב - יפו" },
    { userId: S.seller, districtCode: 4, districtName: "המרכז", cityCode: null, cityName: null },
    { userId: S.seller2, districtCode: 3, districtName: "חיפה", cityCode: 4000, cityName: "חיפה" },
    { userId: S.seller2, districtCode: 2, districtName: "הצפון", cityCode: null, cityName: null },
    { userId: S.seller3, districtCode: 4, districtName: "המרכז", cityCode: 8300, cityName: "ראשון לציון" },
    { userId: S.seller3, districtCode: 5, districtName: "תל אביב", cityCode: null, cityName: null },
    { userId: S.seller4, districtCode: 6, districtName: "הדרום", cityCode: 9000, cityName: "באר שבע" },
    { userId: S.seller4, districtCode: 6, districtName: "הדרום", cityCode: null, cityName: null },
    { userId: S.seller5, districtCode: 4, districtName: "המרכז", cityCode: 7400, cityName: "נתניה" },
    { userId: S.seller5, districtCode: 4, districtName: "המרכז", cityCode: 7900, cityName: "הרצליה" },
    { userId: S.seller6, districtCode: 1, districtName: "ירושלים", cityCode: 3000, cityName: "ירושלים" },
    { userId: S.seller6, districtCode: 4, districtName: "המרכז", cityCode: null, cityName: null },
  ];

  for (const area of areaData) {
    await prisma.serviceArea.upsert({
      where: { userId_districtCode_cityCode: { userId: area.userId, districtCode: area.districtCode, cityCode: area.cityCode ?? 0 } },
      update: {},
      create: area,
    });
  }

  const userServiceData = [
    { userId: S.seller, services: ["furniture-assembly", "tv-mounting", "shelf-hanging", "picture-hanging", "faucet-repair", "door-repair", "lawn-mowing", "garden-maintenance", "bill-negotiation"] },
    { userId: S.seller2, services: ["car-test", "car-purchase-escort", "moving-help", "heavy-lifting", "wifi-setup", "smart-tv-setup", "bureaucracy-help"] },
    { userId: S.seller3, services: ["wifi-setup", "smart-tv-setup", "computer-setup", "tech-elderly-help", "smart-home-setup", "printer-setup"] },
    { userId: S.seller4, services: ["furniture-assembly", "tv-mounting", "shelf-hanging", "moving-help", "heavy-lifting", "pergola-assembly", "faucet-repair", "paint-touch-up"] },
    { userId: S.seller5, services: ["lawn-mowing", "garden-maintenance", "tree-pruning", "planter-setup", "irrigation-setup", "yard-cleanup"] },
    { userId: S.seller6, services: ["bill-negotiation", "insurance-negotiation", "bureaucracy-help", "form-filling", "apartment-inspection"] },
  ];

  for (const { userId, services } of userServiceData) {
    for (const serviceSlug of services) {
      await prisma.userService.upsert({
        where: { userId_serviceSlug: { userId, serviceSlug } },
        update: {},
        create: { userId, serviceSlug },
      });
    }
  }

  const priceData = [
    { userId: S.seller, serviceSlug: "furniture-assembly", price: 200, description: "רהיט בינוני, כולל כלים" },
    { userId: S.seller, serviceSlug: "tv-mounting", price: 250, description: "כולל קידוח והסתרת כבלים" },
    { userId: S.seller, serviceSlug: "shelf-hanging", price: 100, description: "מדף בודד, כל סוג קיר" },
    { userId: S.seller, serviceSlug: "bill-negotiation", price: 80, description: "חברה אחת, תשלום רק אם חסכתי" },
    { userId: S.seller2, serviceSlug: "car-test", price: 200, description: "כולל נסיעה למכון" },
    { userId: S.seller2, serviceSlug: "moving-help", price: 150, description: "לשעה, מינימום 2 שעות" },
    { userId: S.seller2, serviceSlug: "wifi-setup", price: 120, description: "הגדרת נתב + חיבור מכשירים" },
    { userId: S.seller3, serviceSlug: "wifi-setup", price: 100, description: "כולל אופטימיזציית רשת" },
    { userId: S.seller3, serviceSlug: "smart-home-setup", price: 400, description: "הגדרה מלאה של מערכת בית חכם" },
    { userId: S.seller3, serviceSlug: "computer-setup", price: 150, description: "התקנה + העברת קבצים" },
    { userId: S.seller3, serviceSlug: "tech-elderly-help", price: 80, description: "שעה של הדרכה בסבלנות" },
    { userId: S.seller4, serviceSlug: "furniture-assembly", price: 180, description: "כל רהיט עד 2 שעות" },
    { userId: S.seller4, serviceSlug: "moving-help", price: 130, description: "לשעה, כולל רצועות וכלים" },
    { userId: S.seller4, serviceSlug: "tv-mounting", price: 200, description: "כולל בטון ובלוקים" },
    { userId: S.seller5, serviceSlug: "lawn-mowing", price: 120, description: "עד 80 מ״ר" },
    { userId: S.seller5, serviceSlug: "garden-maintenance", price: 250, description: "טיפול חודשי" },
    { userId: S.seller5, serviceSlug: "tree-pruning", price: 180, description: "עץ בודד" },
    { userId: S.seller6, serviceSlug: "bill-negotiation", price: 50, description: "חברה אחת, תשלום רק אם חסכתי" },
    { userId: S.seller6, serviceSlug: "insurance-negotiation", price: 100, description: "סקירת פוליסה + משא ומתן" },
    { userId: S.seller6, serviceSlug: "bureaucracy-help", price: 150, description: "ליווי מול גוף ממשלתי" },
  ];

  for (const p of priceData) {
    await prisma.servicePrice.upsert({
      where: { userId_serviceSlug: { userId: p.userId, serviceSlug: p.serviceSlug } },
      update: { price: p.price, description: p.description },
      create: p,
    });
  }

  const DEFAULT_WEEKLY_HOURS = [
    { dayOfWeek: 0, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 1, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 2, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 3, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 4, startMin: 16 * 60, endMin: 20 * 60 },
    { dayOfWeek: 5, startMin: 8 * 60, endMin: 13 * 60 },
  ];

  const sellerIds = [S.seller, S.seller2, S.seller3, S.seller4, S.seller5, S.seller6];
  for (const userId of sellerIds) {
    for (const hours of DEFAULT_WEEKLY_HOURS) {
      await prisma.weeklyHours.upsert({
        where: { userId_dayOfWeek: { userId, dayOfWeek: hours.dayOfWeek } },
        update: { startMin: hours.startMin, endMin: hours.endMin },
        create: { userId, ...hours },
      });
    }
  }

  console.log("Users seed complete.");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
