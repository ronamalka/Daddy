import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const directUrl = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "תיקונים ותחזוקת הבית", slug: "home-maintenance" },
    { name: "רכב ותחבורה", slug: "car-transport" },
    { name: "מיקוח ובירוקרטיה", slug: "negotiation-bureaucracy" },
    { name: "גינון, חצר וארגון", slug: "garden-yard" },
    { name: "ייעוץ, הדרכה וסיוע אישי", slug: "consulting-training" },
    { name: "הובלות ושינוע", slug: "moving-lifting" },
    { name: "טכנולוגיה ומחשבים", slug: "tech-support" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  // Clean up old categories from previous seed
  const oldSlugs = ["graphics-design", "programming-tech", "digital-marketing", "video-animation", "writing-translation", "music-audio", "business"];
  for (const slug of oldSlugs) {
    const old = await prisma.category.findUnique({ where: { slug } });
    if (old) {
      await prisma.gig.deleteMany({ where: { categoryId: old.id } });
      await prisma.category.delete({ where: { slug } });
    }
  }

  const passwordHash = await hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@daddy.com" },
    update: {},
    create: { name: "אבא מנהל", email: "admin@daddy.com", passwordHash, role: "ADMIN" },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@daddy.com" },
    update: {},
    create: { name: "יוסי הגולדן", email: "seller@daddy.com", passwordHash, role: "SELLER", bio: "אבא של 3, מתקן הכל מגיל 15. אם זה שבור – אני מסדר." },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: "seller2@daddy.com" },
    update: {},
    create: { name: "אבי המתקן", email: "seller2@daddy.com", passwordHash, role: "SELLER", bio: "טכנאי רכב לשעבר, היום אבא במשרה מלאה שעוזר לכולם." },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@daddy.com" },
    update: {},
    create: { name: "דנה לקוחה", email: "buyer@daddy.com", passwordHash, role: "BUYER" },
  });

  const homeCat = await prisma.category.findUnique({ where: { slug: "home-maintenance" } });
  const carCat = await prisma.category.findUnique({ where: { slug: "car-transport" } });
  const negoCat = await prisma.category.findUnique({ where: { slug: "negotiation-bureaucracy" } });
  const gardenCat = await prisma.category.findUnique({ where: { slug: "garden-yard" } });
  const techCat = await prisma.category.findUnique({ where: { slug: "tech-support" } });
  const moveCat = await prisma.category.findUnique({ where: { slug: "moving-lifting" } });
  const consultCat = await prisma.category.findUnique({ where: { slug: "consulting-training" } });

  // Clean up old seed gigs
  await prisma.gig.deleteMany({ where: { id: { in: ["seed-gig-1", "seed-gig-2"] } } });

  if (homeCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-ikea" },
      update: {},
      create: {
        id: "seed-gig-ikea",
        title: "הרכבת רהיטי איקאה – מהקופסה לסלון",
        description: "מרכיב כל רהיט מאיקאה – ארונות, מיטות, שידות, מטבחים. מגיע עם כלים, מרכיב במקום, מפנה את הקרטונים. אין דבר כזה 'נשאר בורג'.",
        categoryId: homeCat.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "רהיט קטן", description: "שידה, כוננית או שולחן קטן", price: 150, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "רהיט בינוני", description: "ארון בגדים, מיטה זוגית או שולחן עבודה", price: 300, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "פרויקט מלא", description: "מטבח שלם או חדר ילדים מלא (עד 5 פריטים)", price: 800, deliveryDays: 2, revisions: 1 },
          ],
        },
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-handyman" },
      update: {},
      create: {
        id: "seed-gig-handyman",
        title: "תליית מדפים, תמונות, וילונות וזרועות טלוויזיה",
        description: "תולה הכל ישר ובטוח – מדפים, מראות, תמונות, וילונות, זרועות לטלוויזיה. קידוח מקצועי בכל סוג קיר (בטון, גבס, בלוקים). מגיע עם כל הכלים.",
        categoryId: homeCat.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "פריט בודד", description: "תליית תמונה, מדף או מראה אחת", price: 100, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "עד 5 פריטים", description: "תליית מספר פריטים באותו ביקור", price: 250, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "פרויקט מלא", description: "וילונות + מדפים + תמונות – חדר שלם", price: 500, deliveryDays: 1, revisions: 1 },
          ],
        },
      },
    });
  }

  if (carCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-test" },
      update: {},
      create: {
        id: "seed-gig-test",
        title: "לוקח לך את האוטו לטסט + טיפול",
        description: "אין לך זמן? אני לוקח את הרכב למבחן רישוי שנתי (טסט), ממתין, מסדר מה שצריך ומחזיר אותו מוכן. גם טיפולים תקופתיים, שטיפות ובדיקות.",
        categoryId: carCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "טסט בלבד", description: "לקיחת הרכב לטסט והחזרה", price: 200, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "טסט + טיפול", description: "טסט + טיפול שוטף במוסך", price: 350, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "חבילה מלאה", description: "טסט + טיפול + שטיפה יסודית פנים וחוץ", price: 500, deliveryDays: 2, revisions: 1 },
          ],
        },
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-car-buy" },
      update: {},
      create: {
        id: "seed-gig-car-buy",
        title: "ליווי ברכישת רכב יד שנייה – שלא יעבדו עליך",
        description: "מסנן מודעות, בודק היסטוריית רכב, מלווה לנסיעת מבחן ונותן חוות דעת ניטרלית. 15 שנות ניסיון ברכב – אני יודע מתי ״לברוח״.",
        categoryId: carCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "סינון מודעות", description: "סינון עד 20 מודעות + המלצת 3 הטובות", price: 150, deliveryDays: 2, revisions: 2 },
            { tier: "STANDARD", title: "ליווי לבדיקה", description: "סינון + ליווי פיזי לבדיקת רכב אחד", price: 350, deliveryDays: 3, revisions: 1 },
            { tier: "PREMIUM", title: "ליווי מלא", description: "מלא – מהסינון ועד החתימה על ההעברה", price: 700, deliveryDays: 7, revisions: 1 },
          ],
        },
      },
    });
  }

  if (negoCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-haggle" },
      update: {},
      create: {
        id: "seed-gig-haggle",
        title: "התמקחות מול חברות תקשורת וביטוח – חוסך לך כסף",
        description: "מתקשר במקומך לחברות סלולר, אינטרנט, כבלים וביטוח. מוריד מחירים, מבטל חיובים מיותרים, ומנהל משא ומתן כמו אבא אמיתי. התמחות: ״אני רוצה לדבר עם מנהל״.",
        categoryId: negoCat.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "חברה אחת", description: "שיחת התמקחות מול חברה אחת", price: 80, deliveryDays: 2, revisions: 1 },
            { tier: "STANDARD", title: "3 חברות", description: "התמקחות מול עד 3 חברות שונות", price: 200, deliveryDays: 3, revisions: 1 },
            { tier: "PREMIUM", title: "סריקה מלאה", description: "סקירת כל ההוצאות החודשיות + התמקחות מול כולם", price: 400, deliveryDays: 5, revisions: 2 },
          ],
        },
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-bureau" },
      update: {},
      create: {
        id: "seed-gig-bureau",
        title: "סידורים בירוקרטיים – עירייה, ביטוח לאומי, דואר",
        description: "עוזר עם טפסים, תורים, פניות לעירייה, ביטוח לאומי או כל משרד ממשלתי. יודע לנווט בין המערכות, למלא נכון ולחסוך לך ימים של תסכול.",
        categoryId: negoCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "טופס בודד", description: "מילוי והגשת טופס אחד", price: 100, deliveryDays: 2, revisions: 1 },
            { tier: "STANDARD", title: "תהליך מלא", description: "ליווי תהליך בירוקרטי מלא (עד 3 גורמים)", price: 250, deliveryDays: 5, revisions: 2 },
            { tier: "PREMIUM", title: "מנהל אישי", description: "מנהל לך את כל הבירוקרטיה – עד שזה סגור", price: 500, deliveryDays: 10, revisions: 3 },
          ],
        },
      },
    });
  }

  if (gardenCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-garden" },
      update: {},
      create: {
        id: "seed-gig-garden",
        title: "גינון קל – גיזום, כיסוח ושתילה",
        description: "מטפל בגינה כמו שצריך. גיזום שיחים, כיסוח דשא, שתילת עציצים, והגדרת טיימר השקיה. מביא כלים, משאיר את הגינה מוכנה לקבלת שבת.",
        categoryId: gardenCat.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "טיפול בסיסי", description: "כיסוח דשא + ניקוי עלים – עד 50 מ״ר", price: 150, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "גינה בינונית", description: "כיסוח + גיזום + שתילה – עד 100 מ״ר", price: 350, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "שיפוץ גינה", description: "עיצוב מחדש של הגינה כולל שתילה והשקיה", price: 800, deliveryDays: 3, revisions: 2 },
          ],
        },
      },
    });
  }

  if (techCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-tech" },
      update: {},
      create: {
        id: "seed-gig-tech",
        title: "הגדרת WiFi, טלוויזיה חכמה ועזרה טכנולוגית לבית",
        description: "מגדיר רשת WiFi, מחבר טלוויזיה חכמה, מתקין אפליקציות, עוזר להורים עם הסמארטפון ומחבר מדפסות. ״אבא, אתה יכול לבוא רגע?״ – בגרסה מקצועית.",
        categoryId: techCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "בעיה בודדת", description: "פתרון בעיה טכנית אחת (WiFi, מדפסת, וכד׳)", price: 100, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "הגדרת בית", description: "הגדרת WiFi + טלוויזיה + עד 3 מכשירים", price: 250, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "בית חכם", description: "הגדרה מלאה – רשת, טלוויזיות, רמקולים חכמים ואבטחה", price: 600, deliveryDays: 2, revisions: 2 },
          ],
        },
      },
    });
  }

  if (consultCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-diy" },
      update: {},
      create: {
        id: "seed-gig-diy",
        title: "שיעור DIY פרטי – לקדוח, לתקן, לבדוק נזילות",
        description: "שעה של הדרכה אישית בבית. לומדים לקדוח, לתלות, לבדוק נזילות, להשתמש בכלי עבודה בסיסיים. בסוף השיעור – אתה האבאל׳ה של עצמך.",
        categoryId: consultCat.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "שיעור שעה", description: "הדרכה של שעה בנושא אחד", price: 150, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "שיעור + תרגול", description: "שעתיים – הסבר + תרגול מעשי בבית", price: 280, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "קורס מרוכז", description: "3 מפגשים – תחזוקת בית בסיסית מא׳ עד ת׳", price: 650, deliveryDays: 14, revisions: 1 },
          ],
        },
      },
    });

    await prisma.gig.upsert({
      where: { id: "seed-gig-apartment" },
      update: {},
      create: {
        id: "seed-gig-apartment",
        title: "בדיקת דירה לפני מעבר – לא חותמים לפני שאני בודק",
        description: "מגיע לדירה שכורה או חדשה ובודק הכל: שקעים, לחץ מים, רטיבות, צירים, חלונות. נותן דו״ח עם תמונות – כדי שתדעו על מה חותמים.",
        categoryId: consultCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "בדיקה בסיסית", description: "בדיקת מים, חשמל וצירים – 30 דקות", price: 200, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "בדיקה מקיפה", description: "בדיקה מלאה + דו״ח עם תמונות", price: 350, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "בדיקה + ליווי", description: "בדיקה + ליווי למו״מ מול בעל הדירה", price: 600, deliveryDays: 2, revisions: 1 },
          ],
        },
      },
    });
  }

  if (moveCat) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-move" },
      update: {},
      create: {
        id: "seed-gig-move",
        title: "עזרה בהובלה – גב חזק וידיים טובות",
        description: "עוזר בהובלות קטנות ובינוניות. העמסה, פריקה, סידור רהיטים בבית החדש. מגיע עם רצועות קשירה, שמיכות הגנה וגישה של אבא שלא נותן לשום ארון ליפול.",
        categoryId: moveCat.id,
        sellerId: seller2.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "פריט בודד", description: "העברת פריט כבד אחד (מכונת כביסה, ספה וכד׳)", price: 200, deliveryDays: 1, revisions: 1 },
            { tier: "STANDARD", title: "חצי הובלה", description: "עזרה בהובלה חלקית – 3-4 שעות עבודה", price: 450, deliveryDays: 1, revisions: 1 },
            { tier: "PREMIUM", title: "הובלה מלאה", description: "יום שלם של הובלה + פירוק והרכבה", price: 900, deliveryDays: 1, revisions: 1 },
          ],
        },
      },
    });
  }

  console.log("Seed complete:", { admin: admin.email, seller: seller.email, seller2: seller2.email, buyer: buyer.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
