import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";
import { syncLocalGigCategories } from "../services/shared/gig-categories";

const directUrl = process.env.SEED_DATABASE_URL || process.env.DATABASE_URL || "postgres://daddy:daddypass123@localhost:51214/daddy?sslmode=disable";
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

/** Loads demo categories, users, gigs, and related rows into the BFF database. */
async function main() {
  await syncLocalGigCategories(prisma);

  // Clean up leftover Fiverr-era digital categories from previous seed
  const oldSlugs = ["graphics-design", "programming-tech", "digital-marketing", "video-animation", "writing-translation", "music-audio", "business"];
  for (const slug of oldSlugs) {
    const old = await prisma.category.findUnique({ where: { slug } });
    if (old) {
      await prisma.gig.deleteMany({ where: { categoryId: old.id } });
      await prisma.category.delete({ where: { slug } });
    }
  }

  const passwordHash = await hash("password123", 12);

  // ── Users ──────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@daddy.com" },
    update: {},
    create: { name: "אבא מנהל", email: "admin@daddy.com", passwordHash, role: "ADMIN" },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@daddy.com" },
    update: { bio: "אבא של 3, מתקן הכל מגיל 15. אם זה שבור – אני מסדר.", city: "תל אביב", districtCode: 5, cityCode: 5000, phone: "050-1111111", avatar: "https://ui-avatars.com/api/?name=Yossi&background=0F766E&color=fff&size=128" },
    create: { name: "יוסי הגולדן", email: "seller@daddy.com", passwordHash, role: "SELLER", bio: "אבא של 3, מתקן הכל מגיל 15. אם זה שבור – אני מסדר.", city: "תל אביב", districtCode: 5, cityCode: 5000, phone: "050-1111111", avatar: "https://ui-avatars.com/api/?name=Yossi&background=0F766E&color=fff&size=128" },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: "seller2@daddy.com" },
    update: { bio: "טכנאי רכב לשעבר, היום אבא במשרה מלאה שעוזר לכולם.", city: "חיפה", districtCode: 3, cityCode: 4000, phone: "050-2222222", avatar: "https://ui-avatars.com/api/?name=Avi&background=0F766E&color=fff&size=128" },
    create: { name: "אבי המתקן", email: "seller2@daddy.com", passwordHash, role: "SELLER", bio: "טכנאי רכב לשעבר, היום אבא במשרה מלאה שעוזר לכולם.", city: "חיפה", districtCode: 3, cityCode: 4000, phone: "050-2222222", avatar: "https://ui-avatars.com/api/?name=Avi&background=0F766E&color=fff&size=128" },
  });

  const seller3 = await prisma.user.upsert({
    where: { email: "seller3@daddy.com" },
    update: { bio: "מהנדס תוכנה ביום, אבאל׳ה בערב. מתמחה בטכנולוגיה, רשתות וסמארט הום.", city: "ראשון לציון", districtCode: 4, cityCode: 8300, phone: "050-3333333", avatar: "https://ui-avatars.com/api/?name=Dan&background=0F766E&color=fff&size=128" },
    create: { name: "דן הטכנולוג", email: "seller3@daddy.com", passwordHash, role: "SELLER", bio: "מהנדס תוכנה ביום, אבאל׳ה בערב. מתמחה בטכנולוגיה, רשתות וסמארט הום.", city: "ראשון לציון", districtCode: 4, cityCode: 8300, phone: "050-3333333", avatar: "https://ui-avatars.com/api/?name=Dan&background=0F766E&color=fff&size=128" },
  });

  const seller4 = await prisma.user.upsert({
    where: { email: "seller4@daddy.com" },
    update: { bio: "אבא של 4, יד ימין לכל שכן. הרכבות, תיקונים, הובלות – הכל בחיוך.", city: "באר שבע", districtCode: 6, cityCode: 9000, phone: "050-4444444", avatar: "https://ui-avatars.com/api/?name=Moshe&background=0F766E&color=fff&size=128" },
    create: { name: "משה הכל-יכול", email: "seller4@daddy.com", passwordHash, role: "SELLER", bio: "אבא של 4, יד ימין לכל שכן. הרכבות, תיקונים, הובלות – הכל בחיוך.", city: "באר שבע", districtCode: 6, cityCode: 9000, phone: "050-4444444", avatar: "https://ui-avatars.com/api/?name=Moshe&background=0F766E&color=fff&size=128" },
  });

  const seller5 = await prisma.user.upsert({
    where: { email: "seller5@daddy.com" },
    update: { bio: "גנן חובב שהפך למקצוען. מטפל בגינות, מרפסות וחצרות ברחבי השרון.", city: "נתניה", districtCode: 4, cityCode: 7400, phone: "050-5555555", avatar: "https://ui-avatars.com/api/?name=Eran&background=0F766E&color=fff&size=128" },
    create: { name: "ערן הגנן", email: "seller5@daddy.com", passwordHash, role: "SELLER", bio: "גנן חובב שהפך למקצוען. מטפל בגינות, מרפסות וחצרות ברחבי השרון.", city: "נתניה", districtCode: 4, cityCode: 7400, phone: "050-5555555", avatar: "https://ui-avatars.com/api/?name=Eran&background=0F766E&color=fff&size=128" },
  });

  const seller6 = await prisma.user.upsert({
    where: { email: "seller6@daddy.com" },
    update: { bio: "20 שנה בתחום הביטוח והתקשורת. חוסך לאנשים אלפי שקלים בשנה.", city: "ירושלים", districtCode: 1, cityCode: 3000, phone: "050-6666666", avatar: "https://ui-avatars.com/api/?name=Roy&background=0F766E&color=fff&size=128" },
    create: { name: "רועי החוסך", email: "seller6@daddy.com", passwordHash, role: "SELLER", bio: "20 שנה בתחום הביטוח והתקשורת. חוסך לאנשים אלפי שקלים בשנה.", city: "ירושלים", districtCode: 1, cityCode: 3000, phone: "050-6666666", avatar: "https://ui-avatars.com/api/?name=Roy&background=0F766E&color=fff&size=128" },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@daddy.com" },
    update: { city: "תל אביב", districtCode: 5, cityCode: 5000 },
    create: { name: "דנה לקוחה", email: "buyer@daddy.com", passwordHash, role: "BUYER", city: "תל אביב", districtCode: 5, cityCode: 5000 },
  });

  const buyer2 = await prisma.user.upsert({
    where: { email: "buyer2@daddy.com" },
    update: { city: "חיפה", districtCode: 3, cityCode: 4000 },
    create: { name: "מיכל הקונה", email: "buyer2@daddy.com", passwordHash, role: "BUYER", city: "חיפה", districtCode: 3, cityCode: 4000 },
  });

  const buyer3 = await prisma.user.upsert({
    where: { email: "buyer3@daddy.com" },
    update: { city: "ירושלים", districtCode: 1, cityCode: 3000 },
    create: { name: "שי הלקוח", email: "buyer3@daddy.com", passwordHash, role: "BUYER", city: "ירושלים", districtCode: 1, cityCode: 3000 },
  });

  // ── Service Areas ──────────────────────────────────────

  const areaData = [
    { userId: seller.id, districtCode: 5, districtName: "תל אביב", cityCode: 5000, cityName: "תל אביב - יפו" },
    { userId: seller.id, districtCode: 4, districtName: "המרכז", cityCode: null, cityName: null },
    { userId: seller2.id, districtCode: 3, districtName: "חיפה", cityCode: 4000, cityName: "חיפה" },
    { userId: seller2.id, districtCode: 2, districtName: "הצפון", cityCode: null, cityName: null },
    { userId: seller3.id, districtCode: 4, districtName: "המרכז", cityCode: 8300, cityName: "ראשון לציון" },
    { userId: seller3.id, districtCode: 5, districtName: "תל אביב", cityCode: null, cityName: null },
    { userId: seller4.id, districtCode: 6, districtName: "הדרום", cityCode: 9000, cityName: "באר שבע" },
    { userId: seller4.id, districtCode: 6, districtName: "הדרום", cityCode: null, cityName: null },
    { userId: seller5.id, districtCode: 4, districtName: "המרכז", cityCode: 7400, cityName: "נתניה" },
    { userId: seller5.id, districtCode: 4, districtName: "המרכז", cityCode: 7900, cityName: "הרצליה" },
    { userId: seller6.id, districtCode: 1, districtName: "ירושלים", cityCode: 3000, cityName: "ירושלים" },
    { userId: seller6.id, districtCode: 4, districtName: "המרכז", cityCode: null, cityName: null },
  ];

  for (const area of areaData) {
    await prisma.serviceArea.upsert({
      where: { userId_districtCode_cityCode: { userId: area.userId, districtCode: area.districtCode, cityCode: area.cityCode ?? 0 } },
      update: {},
      create: area,
    });
  }

  // ── User Services ──────────────────────────────────────

  const userServiceData = [
    // יוסי — הרכבות, תיקונים, גינה
    { userId: seller.id, services: ["furniture-assembly", "tv-mounting", "shelf-hanging", "picture-hanging", "faucet-repair", "door-repair", "lawn-mowing", "garden-maintenance", "bill-negotiation"] },
    // אבי — רכב, הובלות, טכנולוגיה
    { userId: seller2.id, services: ["car-test", "car-purchase-escort", "moving-help", "heavy-lifting", "wifi-setup", "smart-tv-setup", "bureaucracy-help"] },
    // דן — טכנולוגיה, מחשבים
    { userId: seller3.id, services: ["wifi-setup", "smart-tv-setup", "computer-setup", "tech-elderly-help", "smart-home-setup", "printer-setup"] },
    // משה — הרכבות, תיקונים, הובלות
    { userId: seller4.id, services: ["furniture-assembly", "tv-mounting", "shelf-hanging", "moving-help", "heavy-lifting", "pergola-assembly", "faucet-repair", "paint-touch-up"] },
    // ערן — גינה
    { userId: seller5.id, services: ["lawn-mowing", "garden-maintenance", "tree-pruning", "planter-setup", "irrigation-setup", "yard-cleanup"] },
    // רועי — בירוקרטיה, חיסכון
    { userId: seller6.id, services: ["bill-negotiation", "insurance-negotiation", "bureaucracy-help", "form-filling", "apartment-inspection"] },
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

  // ── Service Prices ─────────────────────────────────────

  const priceData = [
    { userId: seller.id, serviceSlug: "furniture-assembly", price: 200, description: "רהיט בינוני, כולל כלים" },
    { userId: seller.id, serviceSlug: "tv-mounting", price: 250, description: "כולל קידוח והסתרת כבלים" },
    { userId: seller.id, serviceSlug: "shelf-hanging", price: 100, description: "מדף בודד, כל סוג קיר" },
    { userId: seller.id, serviceSlug: "bill-negotiation", price: 80, description: "חברה אחת, תשלום רק אם חסכתי" },
    { userId: seller2.id, serviceSlug: "car-test", price: 200, description: "כולל נסיעה למכון" },
    { userId: seller2.id, serviceSlug: "moving-help", price: 150, description: "לשעה, מינימום 2 שעות" },
    { userId: seller2.id, serviceSlug: "wifi-setup", price: 120, description: "הגדרת נתב + חיבור מכשירים" },
    { userId: seller3.id, serviceSlug: "wifi-setup", price: 100, description: "כולל אופטימיזציית רשת" },
    { userId: seller3.id, serviceSlug: "smart-home-setup", price: 400, description: "הגדרה מלאה של מערכת בית חכם" },
    { userId: seller3.id, serviceSlug: "computer-setup", price: 150, description: "התקנה + העברת קבצים" },
    { userId: seller3.id, serviceSlug: "tech-elderly-help", price: 80, description: "שעה של הדרכה בסבלנות" },
    { userId: seller4.id, serviceSlug: "furniture-assembly", price: 180, description: "כל רהיט עד 2 שעות" },
    { userId: seller4.id, serviceSlug: "moving-help", price: 130, description: "לשעה, כולל רצועות וכלים" },
    { userId: seller4.id, serviceSlug: "tv-mounting", price: 200, description: "כולל בטון ובלוקים" },
    { userId: seller5.id, serviceSlug: "lawn-mowing", price: 120, description: "עד 80 מ״ר" },
    { userId: seller5.id, serviceSlug: "garden-maintenance", price: 250, description: "טיפול חודשי" },
    { userId: seller5.id, serviceSlug: "tree-pruning", price: 180, description: "עץ בודד" },
    { userId: seller6.id, serviceSlug: "bill-negotiation", price: 50, description: "חברה אחת, תשלום רק אם חסכתי" },
    { userId: seller6.id, serviceSlug: "insurance-negotiation", price: 100, description: "סקירת פוליסה + משא ומתן" },
    { userId: seller6.id, serviceSlug: "bureaucracy-help", price: 150, description: "ליווי מול גוף ממשלתי" },
  ];

  for (const p of priceData) {
    await prisma.servicePrice.upsert({
      where: { userId_serviceSlug: { userId: p.userId, serviceSlug: p.serviceSlug } },
      update: { price: p.price, description: p.description },
      create: p,
    });
  }

  // ── Gigs ───────────────────────────────────────────────

  const assemblyCat = await prisma.category.findUnique({ where: { slug: "assembly-and-installation" } });
  const homeCat = await prisma.category.findUnique({ where: { slug: "home-maintenance" } });
  const carCat = await prisma.category.findUnique({ where: { slug: "car-and-errands" } });
  const negoCat = await prisma.category.findUnique({ where: { slug: "admin-and-bureaucracy" } });
  const gardenCat = await prisma.category.findUnique({ where: { slug: "garden-and-outdoor" } });
  const techCat = await prisma.category.findUnique({ where: { slug: "tech-support" } });
  const moveCat = await prisma.category.findUnique({ where: { slug: "moving-and-organization" } });

  await prisma.gig.deleteMany({ where: { id: { in: ["seed-gig-1", "seed-gig-2"] } } });

  if (assemblyCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-ikea" },
      update: {},
      create: {
        id: "seed-gig-ikea", title: "הרכבת רהיטי איקאה – מהקופסה לסלון",
        description: "מרכיב כל רהיט מאיקאה – ארונות, מיטות, שידות, מטבחים. מגיע עם כלים, מרכיב במקום, מפנה את הקרטונים.",
        categoryId: assemblyCat.id, sellerId: seller.id,
        tiers: { create: [
          { tier: "BASIC", title: "רהיט קטן", description: "שידה, כוננית או שולחן קטן", price: 150, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "רהיט בינוני", description: "ארון בגדים, מיטה זוגית", price: 300, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "פרויקט מלא", description: "מטבח שלם או חדר ילדים", price: 800, deliveryDays: 2, revisions: 1 },
        ]},
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-handyman" },
      update: {},
      create: {
        id: "seed-gig-handyman", title: "תליית מדפים, תמונות, וילונות וזרועות טלוויזיה",
        description: "תולה הכל ישר ובטוח – מדפים, מראות, תמונות, וילונות, זרועות לטלוויזיה. קידוח מקצועי בכל סוג קיר.",
        categoryId: assemblyCat.id, sellerId: seller.id,
        tiers: { create: [
          { tier: "BASIC", title: "פריט בודד", description: "תליית תמונה, מדף או מראה", price: 100, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "עד 5 פריטים", description: "תליית מספר פריטים באותו ביקור", price: 250, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "פרויקט מלא", description: "וילונות + מדפים + תמונות – חדר שלם", price: 500, deliveryDays: 1, revisions: 1 },
        ]},
      },
    });

    // Seller 4's gig
    await prisma.gig.upsert({
      where: { id: "seed-gig-moshe-assembly" },
      update: {},
      create: {
        id: "seed-gig-moshe-assembly", title: "הרכבת רהיטים ומדפים – באר שבע והסביבה",
        description: "מרכיב כל דבר: ארונות, מיטות, מדפים, פרגולות. מגיע עם כלים ומניסיון של 15 שנה.",
        categoryId: assemblyCat.id, sellerId: seller4.id,
        tiers: { create: [
          { tier: "BASIC", title: "רהיט קטן", description: "שידה, כוננית, שולחן", price: 130, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "2-3 רהיטים", description: "ארון + מיטה + שידות", price: 350, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "חדר שלם", description: "הרכבה מלאה של חדר", price: 700, deliveryDays: 2, revisions: 1 },
        ]},
      },
    });
  }

  if (carCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-test" },
      update: {},
      create: {
        id: "seed-gig-test", title: "לוקח לך את האוטו לטסט + טיפול",
        description: "אני לוקח את הרכב למבחן רישוי שנתי, ממתין, מסדר מה שצריך ומחזיר אותו מוכן.",
        categoryId: carCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "טסט בלבד", description: "לקיחת הרכב לטסט והחזרה", price: 200, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "טסט + טיפול", description: "טסט + טיפול שוטף", price: 350, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "חבילה מלאה", description: "טסט + טיפול + שטיפה", price: 500, deliveryDays: 2, revisions: 1 },
        ]},
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-car-buy" },
      update: {},
      create: {
        id: "seed-gig-car-buy", title: "ליווי ברכישת רכב יד שנייה – שלא יעבדו עליך",
        description: "מסנן מודעות, בודק היסטוריית רכב, מלווה לנסיעת מבחן. 15 שנות ניסיון.",
        categoryId: carCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "סינון מודעות", description: "סינון עד 20 מודעות", price: 150, deliveryDays: 2, revisions: 2 },
          { tier: "STANDARD", title: "ליווי לבדיקה", description: "סינון + ליווי פיזי", price: 350, deliveryDays: 3, revisions: 1 },
          { tier: "PREMIUM", title: "ליווי מלא", description: "מהסינון ועד החתימה", price: 700, deliveryDays: 7, revisions: 1 },
        ]},
      },
    });
  }

  if (negoCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-haggle" },
      update: {},
      create: {
        id: "seed-gig-haggle", title: "התמקחות מול חברות תקשורת וביטוח – חוסך לך כסף",
        description: "מתקשר במקומך לחברות סלולר, אינטרנט, כבלים וביטוח. מוריד מחירים ומבטל חיובים מיותרים.",
        categoryId: negoCat.id, sellerId: seller.id,
        tiers: { create: [
          { tier: "BASIC", title: "חברה אחת", description: "שיחת התמקחות מול חברה אחת", price: 80, deliveryDays: 2, revisions: 1 },
          { tier: "STANDARD", title: "3 חברות", description: "התמקחות מול עד 3 חברות", price: 200, deliveryDays: 3, revisions: 1 },
          { tier: "PREMIUM", title: "סריקה מלאה", description: "סקירת כל ההוצאות + התמקחות", price: 400, deliveryDays: 5, revisions: 2 },
        ]},
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-bureau" },
      update: {},
      create: {
        id: "seed-gig-bureau", title: "סידורים בירוקרטיים – עירייה, ביטוח לאומי, דואר",
        description: "עוזר עם טפסים, תורים, פניות לעירייה, ביטוח לאומי או כל משרד ממשלתי.",
        categoryId: negoCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "טופס בודד", description: "מילוי והגשת טופס אחד", price: 100, deliveryDays: 2, revisions: 1 },
          { tier: "STANDARD", title: "תהליך מלא", description: "ליווי תהליך בירוקרטי מלא", price: 250, deliveryDays: 5, revisions: 2 },
          { tier: "PREMIUM", title: "מנהל אישי", description: "מנהל לך את כל הבירוקרטיה", price: 500, deliveryDays: 10, revisions: 3 },
        ]},
      },
    });

    // Seller 6's gig
    await prisma.gig.upsert({
      where: { id: "seed-gig-roei-save" },
      update: {},
      create: {
        id: "seed-gig-roei-save", title: "חוסך לך כסף – סקירת הוצאות וירידת מחירים",
        description: "סוקר את כל ההוצאות החודשיות שלך ויורד על מחירים מול חברות תקשורת, ביטוח וספקי שירות.",
        categoryId: negoCat.id, sellerId: seller6.id,
        tiers: { create: [
          { tier: "BASIC", title: "חברה אחת", description: "התמקחות מול חברה אחת", price: 50, deliveryDays: 2, revisions: 1 },
          { tier: "STANDARD", title: "סקירה + 3 חברות", description: "סקירת הוצאות + ירידת מחירים", price: 150, deliveryDays: 4, revisions: 1 },
          { tier: "PREMIUM", title: "סקירה מלאה", description: "כל ההוצאות + המלצות חיסכון שנתי", price: 350, deliveryDays: 7, revisions: 2 },
        ]},
      },
    });
  }

  if (gardenCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-garden" },
      update: {},
      create: {
        id: "seed-gig-garden", title: "גינון קל – גיזום, כיסוח ושתילה",
        description: "מטפל בגינה כמו שצריך. גיזום, כיסוח דשא, שתילה, הגדרת טיימר השקיה.",
        categoryId: gardenCat.id, sellerId: seller.id,
        tiers: { create: [
          { tier: "BASIC", title: "טיפול בסיסי", description: "כיסוח דשא + ניקוי עלים – עד 50 מ״ר", price: 150, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "גינה בינונית", description: "כיסוח + גיזום + שתילה – עד 100 מ״ר", price: 350, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "שיפוץ גינה", description: "עיצוב מחדש כולל שתילה והשקיה", price: 800, deliveryDays: 3, revisions: 2 },
        ]},
      },
    });

    // Seller 5's gig
    await prisma.gig.upsert({
      where: { id: "seed-gig-eran-garden" },
      update: {},
      create: {
        id: "seed-gig-eran-garden", title: "טיפול מקצועי בגינה – השרון והמרכז",
        description: "גיזום עצים, כיסוח, שתילת עונה, התקנת השקיה וניקוי חצרות. ניסיון של 8 שנים.",
        categoryId: gardenCat.id, sellerId: seller5.id,
        tiers: { create: [
          { tier: "BASIC", title: "כיסוח + ניקוי", description: "דשא + עלים – עד 60 מ״ר", price: 120, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "טיפול חודשי", description: "כיסוח + גיזום + שתילה", price: 280, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "שיפוץ גינה מלא", description: "תכנון + ביצוע + השקיה", price: 900, deliveryDays: 5, revisions: 2 },
        ]},
      },
    });
  }

  if (techCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-tech" },
      update: {},
      create: {
        id: "seed-gig-tech", title: "הגדרת WiFi, טלוויזיה חכמה ועזרה טכנולוגית לבית",
        description: "מגדיר רשת WiFi, מחבר טלוויזיה חכמה, מתקין אפליקציות, עוזר להורים עם הסמארטפון.",
        categoryId: techCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "בעיה בודדת", description: "פתרון בעיה טכנית אחת", price: 100, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "הגדרת בית", description: "WiFi + טלוויזיה + 3 מכשירים", price: 250, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "בית חכם", description: "הגדרה מלאה – רשת, טלוויזיות, רמקולים", price: 600, deliveryDays: 2, revisions: 2 },
        ]},
      },
    });

    // Seller 3's gig
    await prisma.gig.upsert({
      where: { id: "seed-gig-dan-tech" },
      update: {},
      create: {
        id: "seed-gig-dan-tech", title: "בית חכם מא׳ עד ת׳ – התקנה, הגדרה ואופטימיזציה",
        description: "מהנדס תוכנה מתקין ומגדיר מערכות בית חכם: תאורה, שקעים, מצלמות, רמקולים. Google Home / Alexa / Apple Home.",
        categoryId: techCat.id, sellerId: seller3.id,
        tiers: { create: [
          { tier: "BASIC", title: "ייעוץ + תכנון", description: "שעת ייעוץ + המלצות מוצרים", price: 120, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "התקנה בסיסית", description: "התקנת עד 10 מכשירים חכמים", price: 350, deliveryDays: 2, revisions: 1 },
          { tier: "PREMIUM", title: "בית חכם מלא", description: "תכנון + התקנה + אוטומציות + הדרכה", price: 800, deliveryDays: 4, revisions: 2 },
        ]},
      },
    });
  }

  if (homeCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-diy" },
      update: {},
      create: {
        id: "seed-gig-diy", title: "שיעור DIY פרטי – לקדוח, לתקן, לבדוק נזילות",
        description: "שעה של הדרכה אישית בבית. לומדים לקדוח, לתלות, להשתמש בכלי עבודה בסיסיים.",
        categoryId: homeCat.id, sellerId: seller.id,
        tiers: { create: [
          { tier: "BASIC", title: "שיעור שעה", description: "הדרכה של שעה בנושא אחד", price: 150, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "שיעור + תרגול", description: "שעתיים – הסבר + תרגול", price: 280, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "קורס מרוכז", description: "3 מפגשים – תחזוקת בית בסיסית", price: 650, deliveryDays: 14, revisions: 1 },
        ]},
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-apartment" },
      update: {},
      create: {
        id: "seed-gig-apartment", title: "בדיקת דירה לפני מעבר – לא חותמים לפני שאני בודק",
        description: "מגיע לדירה שכורה או חדשה ובודק הכל: שקעים, לחץ מים, רטיבות, צירים, חלונות.",
        categoryId: homeCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "בדיקה בסיסית", description: "בדיקת מים, חשמל וצירים", price: 200, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "בדיקה מקיפה", description: "בדיקה מלאה + דו״ח עם תמונות", price: 350, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "בדיקה + ליווי", description: "בדיקה + ליווי למו״מ מול בעל הדירה", price: 600, deliveryDays: 2, revisions: 1 },
        ]},
      },
    });
  }

  if (moveCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-move" },
      update: {},
      create: {
        id: "seed-gig-move", title: "עזרה בהובלה – גב חזק וידיים טובות",
        description: "עוזר בהובלות קטנות ובינוניות. העמסה, פריקה, סידור רהיטים בבית החדש.",
        categoryId: moveCat.id, sellerId: seller2.id,
        tiers: { create: [
          { tier: "BASIC", title: "פריט בודד", description: "העברת פריט כבד אחד", price: 200, deliveryDays: 1, revisions: 1 },
          { tier: "STANDARD", title: "חצי הובלה", description: "עזרה 3-4 שעות", price: 450, deliveryDays: 1, revisions: 1 },
          { tier: "PREMIUM", title: "הובלה מלאה", description: "יום שלם + פירוק והרכבה", price: 900, deliveryDays: 1, revisions: 1 },
        ]},
      },
    });
  }

  await syncLocalGigCategories(prisma);

  // ── Orders + Reviews (with 4-dimension ratings) ────────

  const gigIkea = await prisma.gig.findUnique({ where: { id: "seed-gig-ikea" } });
  const gigHandyman = await prisma.gig.findUnique({ where: { id: "seed-gig-handyman" } });
  const gigTech = await prisma.gig.findUnique({ where: { id: "seed-gig-tech" } });
  const gigHaggle = await prisma.gig.findUnique({ where: { id: "seed-gig-haggle" } });
  const gigGarden = await prisma.gig.findUnique({ where: { id: "seed-gig-garden" } });
  const gigDanTech = await prisma.gig.findUnique({ where: { id: "seed-gig-dan-tech" } });
  const gigRoei = await prisma.gig.findUnique({ where: { id: "seed-gig-roei-save" } });
  const gigMoshe = await prisma.gig.findUnique({ where: { id: "seed-gig-moshe-assembly" } });
  const gigEran = await prisma.gig.findUnique({ where: { id: "seed-gig-eran-garden" } });

  const reviewSeed = [
    // Reviews for יוסי (seller)
    { id: "rev-1", orderId: "ord-1", gigId: gigIkea?.id, sellerId: seller.id, buyerId: buyer.id, comment: "הרכיב ארון PAX תוך שעה וחצי. מקצוען אמיתי, הגיע בזמן ועם כלים. מומלץ בחום!", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-2", orderId: "ord-2", gigId: gigIkea?.id, sellerId: seller.id, buyerId: buyer2.id, comment: "הרכיב מיטת ילדים + שידה. סבלני, נקי, ופינה את כל הקרטונים. אבא אמיתי.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },
    { id: "rev-3", orderId: "ord-3", gigId: gigHandyman?.id, sellerId: seller.id, buyerId: buyer3.id, comment: "תלה 4 מדפים ותמונות. עבודה נקייה, מדויקת. קצת יקר אבל שווה כל שקל.", ratingAttitude: 9, ratingTimeliness: 9, ratingPrice: 7, ratingQuality: 10 },
    { id: "rev-4", orderId: "ord-4", gigId: gigHaggle?.id, sellerId: seller.id, buyerId: buyer.id, comment: "הוריד לי את חשבון הסלולר ב-50 שקל בחודש! תוך שיחה אחת. גאוני.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-5", orderId: "ord-5", gigId: gigGarden?.id, sellerId: seller.id, buyerId: buyer2.id, comment: "הגינה נראית מדהים. גיזום מקצועי ודשא ירוק. ממליצה!", ratingAttitude: 9, ratingTimeliness: 8, ratingPrice: 8, ratingQuality: 9 },

    // Reviews for אבי (seller2)
    { id: "rev-6", orderId: "ord-6", gigId: gigTech?.id, sellerId: seller2.id, buyerId: buyer.id, comment: "הגדיר לי WiFi mesh בכל הבית. סוף סוף יש אינטרנט בכל חדר. סופר מקצועי.", ratingAttitude: 9, ratingTimeliness: 10, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-7", orderId: "ord-7", gigId: gigTech?.id, sellerId: seller2.id, buyerId: buyer3.id, comment: "הגדיר סטרימר + WiFi להורים שלי. בסבלנות אינסופית. תודה רבה.", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 9, ratingQuality: 9 },

    // Reviews for דן (seller3)
    { id: "rev-8", orderId: "ord-8", gigId: gigDanTech?.id, sellerId: seller3.id, buyerId: buyer.id, comment: "התקין לי מערכת בית חכם מלאה. הכל עובד מהטלפון. חוויה!", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 7, ratingQuality: 10 },
    { id: "rev-9", orderId: "ord-9", gigId: gigDanTech?.id, sellerId: seller3.id, buyerId: buyer2.id, comment: "ייעוץ מעולה, המליץ בדיוק על מה שצריך בלי לדחוף מוצרים מיותרים.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },
    { id: "rev-10", orderId: "ord-10", gigId: gigDanTech?.id, sellerId: seller3.id, buyerId: buyer3.id, comment: "הגדיר לי 15 מכשירים חכמים ביום אחד. מקצועי ברמה אחרת.", ratingAttitude: 9, ratingTimeliness: 8, ratingPrice: 7, ratingQuality: 10 },

    // Reviews for משה (seller4)
    { id: "rev-11", orderId: "ord-11", gigId: gigMoshe?.id, sellerId: seller4.id, buyerId: buyer.id, comment: "הרכיב 3 ארונות ביום אחד. עבודה קשה, גישה מעולה. ממליץ!", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-12", orderId: "ord-12", gigId: gigMoshe?.id, sellerId: seller4.id, buyerId: buyer3.id, comment: "הגיע בזמן, עבד מהר, והכל ישר ומסודר. מחיר הוגן מאוד.", ratingAttitude: 9, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 9 },

    // Reviews for ערן (seller5)
    { id: "rev-13", orderId: "ord-13", gigId: gigEran?.id, sellerId: seller5.id, buyerId: buyer2.id, comment: "הגינה עברה מהפך! גיזום, שתילה, והכל נראה כמו גן עדן. ערן מקצוען.", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-14", orderId: "ord-14", gigId: gigEran?.id, sellerId: seller5.id, buyerId: buyer.id, comment: "טיפול חודשי קבוע. הגינה תמיד נראית מושלמת. שווה כל שקל.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },

    // Reviews for רועי (seller6)
    { id: "rev-15", orderId: "ord-15", gigId: gigRoei?.id, sellerId: seller6.id, buyerId: buyer.id, comment: "חסך לי 300 ש״ח בחודש על תקשורת וביטוח. תוך שבוע. גאון.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 10 },
    { id: "rev-16", orderId: "ord-16", gigId: gigRoei?.id, sellerId: seller6.id, buyerId: buyer2.id, comment: "ירד על המחירים של 4 חברות. חסך לנו הרבה כסף. מומלץ!", ratingAttitude: 9, ratingTimeliness: 9, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-17", orderId: "ord-17", gigId: gigRoei?.id, sellerId: seller6.id, buyerId: buyer3.id, comment: "סקירה מלאה ומקצועית. הסביר הכל בסבלנות ובאמת חסך לי.", ratingAttitude: 10, ratingTimeliness: 8, ratingPrice: 10, ratingQuality: 10 },
  ];

  for (const rev of reviewSeed) {
    if (!rev.gigId) continue;
    const overall = Math.round((rev.ratingAttitude + rev.ratingTimeliness + rev.ratingPrice + rev.ratingQuality) / 4);

    const existingOrder = await prisma.order.findUnique({ where: { id: rev.orderId } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          id: rev.orderId,
          gigId: rev.gigId,
          buyerId: rev.buyerId,
          sellerId: rev.sellerId,
          tier: "BASIC",
          price: 150,
          status: "COMPLETED",
        },
      });
    }

    const existingReview = await prisma.review.findUnique({ where: { id: rev.id } });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          id: rev.id,
          orderId: rev.orderId,
          gigId: rev.gigId,
          userId: rev.buyerId,
          rating: overall,
          comment: rev.comment,
          ratingAttitude: rev.ratingAttitude,
          ratingTimeliness: rev.ratingTimeliness,
          ratingPrice: rev.ratingPrice,
          ratingQuality: rev.ratingQuality,
        },
      });
    }
  }

  // ── Service Requests ───────────────────────────────────

  const requests = [
    { id: "sreq-1", title: "צריך עזרה בהרכבת ארון גדול", description: "קניתי ארון PAX 3 דלתות מאיקאה ואין לי כלים או ידע להרכיב. גר בתל אביב, צריך מישהו שיגיע השבוע.", serviceSlug: "furniture-assembly", buyerId: buyer.id, districtCode: 5, districtName: "תל אביב" },
    { id: "sreq-2", title: "WiFi חלש בחדרים – צריך פתרון", description: "הראוטר בסלון ובחדרי השינה כמעט אין אינטרנט. צריך מישהו שיגדיר mesh או מאריך טווח.", serviceSlug: "wifi-setup", buyerId: buyer2.id, districtCode: 3, districtName: "חיפה" },
    { id: "sreq-3", title: "גיזום עצים ושיחים – חצר גדולה", description: "חצר של 200 מ״ר עם 3 עצי זית ושיחים שצריך לגזום. צריך מישהו עם ניסיון וכלים.", serviceSlug: "tree-pruning", buyerId: buyer3.id, districtCode: 1, districtName: "ירושלים" },
  ];

  for (const req of requests) {
    const existing = await prisma.serviceRequest.findUnique({ where: { id: req.id } });
    if (!existing) {
      await prisma.serviceRequest.create({ data: req });
    }
  }

  console.log("Seed complete:", {
    users: [admin.email, seller.email, seller2.email, seller3.email, seller4.email, seller5.email, seller6.email, buyer.email, buyer2.email, buyer3.email],
    reviews: reviewSeed.length,
    serviceRequests: requests.length,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
