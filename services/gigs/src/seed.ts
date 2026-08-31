import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { syncLocalGigCategories } from "../../shared/gig-categories";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_gigs" });
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

/** Loads demo categories, gigs, and reviews into daddy_gigs. */
async function main() {
  await syncLocalGigCategories(prisma);

  const assemblyCat = (await prisma.category.findUnique({ where: { slug: "assembly-and-installation" } }))!;
  const homeCat = (await prisma.category.findUnique({ where: { slug: "home-maintenance" } }))!;
  const carCat = (await prisma.category.findUnique({ where: { slug: "car-and-errands" } }))!;
  const negoCat = (await prisma.category.findUnique({ where: { slug: "admin-and-bureaucracy" } }))!;
  const gardenCat = (await prisma.category.findUnique({ where: { slug: "garden-and-outdoor" } }))!;
  const techCat = (await prisma.category.findUnique({ where: { slug: "tech-support" } }))!;
  const moveCat = (await prisma.category.findUnique({ where: { slug: "moving-and-organization" } }))!;

  // Gigs with tiers
  const gigs = [
    {
      id: "seed-gig-ikea", title: "הרכבת רהיטי איקאה – מהקופסה לסלון",
      description: "מרכיב כל רהיט מאיקאה – ארונות, מיטות, שידות, מטבחים. מגיע עם כלים, מרכיב במקום, מפנה את הקרטונים.",
      categoryId: assemblyCat.id, sellerId: S.seller,
      tiers: [
        { tier: "BASIC" as const, title: "רהיט קטן", description: "שידה, כוננית או שולחן קטן", price: 150, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "רהיט בינוני", description: "ארון בגדים, מיטה זוגית", price: 300, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "פרויקט מלא", description: "מטבח שלם או חדר ילדים", price: 800, deliveryDays: 2, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-handyman", title: "תליית מדפים, תמונות, וילונות וזרועות טלוויזיה",
      description: "תולה הכל ישר ובטוח – מדפים, מראות, תמונות, וילונות, זרועות לטלוויזיה. קידוח מקצועי בכל סוג קיר.",
      categoryId: assemblyCat.id, sellerId: S.seller,
      tiers: [
        { tier: "BASIC" as const, title: "פריט בודד", description: "תליית תמונה, מדף או מראה", price: 100, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "עד 5 פריטים", description: "תליית מספר פריטים באותו ביקור", price: 250, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "פרויקט מלא", description: "וילונות + מדפים + תמונות – חדר שלם", price: 500, deliveryDays: 1, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-moshe-assembly", title: "הרכבת רהיטים ומדפים – באר שבע והסביבה",
      description: "מרכיב כל דבר: ארונות, מיטות, מדפים, פרגולות. מגיע עם כלים ומניסיון של 15 שנה.",
      categoryId: assemblyCat.id, sellerId: S.seller4,
      tiers: [
        { tier: "BASIC" as const, title: "רהיט קטן", description: "שידה, כוננית, שולחן", price: 130, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "2-3 רהיטים", description: "ארון + מיטה + שידות", price: 350, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "חדר שלם", description: "הרכבה מלאה של חדר", price: 700, deliveryDays: 2, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-test", title: "לוקח לך את האוטו לטסט + טיפול",
      description: "אני לוקח את הרכב למבחן רישוי שנתי, ממתין, מסדר מה שצריך ומחזיר אותו מוכן.",
      categoryId: carCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "טסט בלבד", description: "לקיחת הרכב לטסט והחזרה", price: 200, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "טסט + טיפול", description: "טסט + טיפול שוטף", price: 350, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "חבילה מלאה", description: "טסט + טיפול + שטיפה", price: 500, deliveryDays: 2, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-car-buy", title: "ליווי ברכישת רכב יד שנייה – שלא יעבדו עליך",
      description: "מסנן מודעות, בודק היסטוריית רכב, מלווה לנסיעת מבחן. 15 שנות ניסיון.",
      categoryId: carCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "סינון מודעות", description: "סינון עד 20 מודעות", price: 150, deliveryDays: 2, revisions: 2 },
        { tier: "STANDARD" as const, title: "ליווי לבדיקה", description: "סינון + ליווי פיזי", price: 350, deliveryDays: 3, revisions: 1 },
        { tier: "PREMIUM" as const, title: "ליווי מלא", description: "מהסינון ועד החתימה", price: 700, deliveryDays: 7, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-haggle", title: "התמקחות מול חברות תקשורת וביטוח – חוסך לך כסף",
      description: "מתקשר במקומך לחברות סלולר, אינטרנט, כבלים וביטוח. מוריד מחירים ומבטל חיובים מיותרים.",
      categoryId: negoCat.id, sellerId: S.seller,
      tiers: [
        { tier: "BASIC" as const, title: "חברה אחת", description: "שיחת התמקחות מול חברה אחת", price: 80, deliveryDays: 2, revisions: 1 },
        { tier: "STANDARD" as const, title: "3 חברות", description: "התמקחות מול עד 3 חברות", price: 200, deliveryDays: 3, revisions: 1 },
        { tier: "PREMIUM" as const, title: "סריקה מלאה", description: "סקירת כל ההוצאות + התמקחות", price: 400, deliveryDays: 5, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-bureau", title: "סידורים בירוקרטיים – עירייה, ביטוח לאומי, דואר",
      description: "עוזר עם טפסים, תורים, פניות לעירייה, ביטוח לאומי או כל משרד ממשלתי.",
      categoryId: negoCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "טופס בודד", description: "מילוי והגשת טופס אחד", price: 100, deliveryDays: 2, revisions: 1 },
        { tier: "STANDARD" as const, title: "תהליך מלא", description: "ליווי תהליך בירוקרטי מלא", price: 250, deliveryDays: 5, revisions: 2 },
        { tier: "PREMIUM" as const, title: "מנהל אישי", description: "מנהל לך את כל הבירוקרטיה", price: 500, deliveryDays: 10, revisions: 3 },
      ],
    },
    {
      id: "seed-gig-roei-save", title: "חוסך לך כסף – סקירת הוצאות וירידת מחירים",
      description: "סוקר את כל ההוצאות החודשיות שלך ויורד על מחירים מול חברות תקשורת, ביטוח וספקי שירות.",
      categoryId: negoCat.id, sellerId: S.seller6,
      tiers: [
        { tier: "BASIC" as const, title: "חברה אחת", description: "התמקחות מול חברה אחת", price: 50, deliveryDays: 2, revisions: 1 },
        { tier: "STANDARD" as const, title: "סקירה + 3 חברות", description: "סקירת הוצאות + ירידת מחירים", price: 150, deliveryDays: 4, revisions: 1 },
        { tier: "PREMIUM" as const, title: "סקירה מלאה", description: "כל ההוצאות + המלצות חיסכון שנתי", price: 350, deliveryDays: 7, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-garden", title: "גינון קל – גיזום, כיסוח ושתילה",
      description: "מטפל בגינה כמו שצריך. גיזום, כיסוח דשא, שתילה, הגדרת טיימר השקיה.",
      categoryId: gardenCat.id, sellerId: S.seller,
      tiers: [
        { tier: "BASIC" as const, title: "טיפול בסיסי", description: "כיסוח דשא + ניקוי עלים – עד 50 מ״ר", price: 150, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "גינה בינונית", description: "כיסוח + גיזום + שתילה – עד 100 מ״ר", price: 350, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "שיפוץ גינה", description: "עיצוב מחדש כולל שתילה והשקיה", price: 800, deliveryDays: 3, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-eran-garden", title: "טיפול מקצועי בגינה – השרון והמרכז",
      description: "גיזום עצים, כיסוח, שתילת עונה, התקנת השקיה וניקוי חצרות. ניסיון של 8 שנים.",
      categoryId: gardenCat.id, sellerId: S.seller5,
      tiers: [
        { tier: "BASIC" as const, title: "כיסוח + ניקוי", description: "דשא + עלים – עד 60 מ״ר", price: 120, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "טיפול חודשי", description: "כיסוח + גיזום + שתילה", price: 280, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "שיפוץ גינה מלא", description: "תכנון + ביצוע + השקיה", price: 900, deliveryDays: 5, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-tech", title: "הגדרת WiFi, טלוויזיה חכמה ועזרה טכנולוגית לבית",
      description: "מגדיר רשת WiFi, מחבר טלוויזיה חכמה, מתקין אפליקציות, עוזר להורים עם הסמארטפון.",
      categoryId: techCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "בעיה בודדת", description: "פתרון בעיה טכנית אחת", price: 100, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "הגדרת בית", description: "WiFi + טלוויזיה + 3 מכשירים", price: 250, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "בית חכם", description: "הגדרה מלאה – רשת, טלוויזיות, רמקולים", price: 600, deliveryDays: 2, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-dan-tech", title: "בית חכם מא׳ עד ת׳ – התקנה, הגדרה ואופטימיזציה",
      description: "מהנדס תוכנה מתקין ומגדיר מערכות בית חכם: תאורה, שקעים, מצלמות, רמקולים. Google Home / Alexa / Apple Home.",
      categoryId: techCat.id, sellerId: S.seller3,
      tiers: [
        { tier: "BASIC" as const, title: "ייעוץ + תכנון", description: "שעת ייעוץ + המלצות מוצרים", price: 120, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "התקנה בסיסית", description: "התקנת עד 10 מכשירים חכמים", price: 350, deliveryDays: 2, revisions: 1 },
        { tier: "PREMIUM" as const, title: "בית חכם מלא", description: "תכנון + התקנה + אוטומציות + הדרכה", price: 800, deliveryDays: 4, revisions: 2 },
      ],
    },
    {
      id: "seed-gig-diy", title: "שיעור DIY פרטי – לקדוח, לתקן, לבדוק נזילות",
      description: "שעה של הדרכה אישית בבית. לומדים לקדוח, לתלות, להשתמש בכלי עבודה בסיסיים.",
      categoryId: homeCat.id, sellerId: S.seller,
      tiers: [
        { tier: "BASIC" as const, title: "שיעור שעה", description: "הדרכה של שעה בנושא אחד", price: 150, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "שיעור + תרגול", description: "שעתיים – הסבר + תרגול", price: 280, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "קורס מרוכז", description: "3 מפגשים – תחזוקת בית בסיסית", price: 650, deliveryDays: 14, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-apartment", title: "בדיקת דירה לפני מעבר – לא חותמים לפני שאני בודק",
      description: "מגיע לדירה שכורה או חדשה ובודק הכל: שקעים, לחץ מים, רטיבות, צירים, חלונות.",
      categoryId: homeCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "בדיקה בסיסית", description: "בדיקת מים, חשמל וצירים", price: 200, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "בדיקה מקיפה", description: "בדיקה מלאה + דו״ח עם תמונות", price: 350, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "בדיקה + ליווי", description: "בדיקה + ליווי למו״מ מול בעל הדירה", price: 600, deliveryDays: 2, revisions: 1 },
      ],
    },
    {
      id: "seed-gig-move", title: "עזרה בהובלה – גב חזק וידיים טובות",
      description: "עוזר בהובלות קטנות ובינוניות. העמסה, פריקה, סידור רהיטים בבית החדש.",
      categoryId: moveCat.id, sellerId: S.seller2,
      tiers: [
        { tier: "BASIC" as const, title: "פריט בודד", description: "העברת פריט כבד אחד", price: 200, deliveryDays: 1, revisions: 1 },
        { tier: "STANDARD" as const, title: "חצי הובלה", description: "עזרה 3-4 שעות", price: 450, deliveryDays: 1, revisions: 1 },
        { tier: "PREMIUM" as const, title: "הובלה מלאה", description: "יום שלם + פירוק והרכבה", price: 900, deliveryDays: 1, revisions: 1 },
      ],
    },
  ];

  for (const gig of gigs) {
    const { tiers, ...gigData } = gig;
    const existing = await prisma.gig.findUnique({ where: { id: gig.id } });
    if (!existing) {
      await prisma.gig.create({
        data: { ...gigData, tiers: { create: tiers } },
      });
    } else if (existing.categoryId !== gigData.categoryId) {
      await prisma.gig.update({
        where: { id: gig.id },
        data: { categoryId: gigData.categoryId },
      });
    }
  }

  await syncLocalGigCategories(prisma);

  // Reviews (orderId references orders-service, userId references users-service)
  const reviewSeed = [
    { id: "rev-1", orderId: "ord-1", gigId: "seed-gig-ikea", userId: S.buyer, comment: "הרכיב ארון PAX תוך שעה וחצי. מקצוען אמיתי, הגיע בזמן ועם כלים. מומלץ בחום!", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-2", orderId: "ord-2", gigId: "seed-gig-ikea", userId: S.buyer2, comment: "הרכיב מיטת ילדים + שידה. סבלני, נקי, ופינה את כל הקרטונים. אבא אמיתי.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },
    { id: "rev-3", orderId: "ord-3", gigId: "seed-gig-handyman", userId: S.buyer3, comment: "תלה 4 מדפים ותמונות. עבודה נקייה, מדויקת. קצת יקר אבל שווה כל שקל.", ratingAttitude: 9, ratingTimeliness: 9, ratingPrice: 7, ratingQuality: 10 },
    { id: "rev-4", orderId: "ord-4", gigId: "seed-gig-haggle", userId: S.buyer, comment: "הוריד לי את חשבון הסלולר ב-50 שקל בחודש! תוך שיחה אחת. גאוני.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-5", orderId: "ord-5", gigId: "seed-gig-garden", userId: S.buyer2, comment: "הגינה נראית מדהים. גיזום מקצועי ודשא ירוק. ממליצה!", ratingAttitude: 9, ratingTimeliness: 8, ratingPrice: 8, ratingQuality: 9 },
    { id: "rev-6", orderId: "ord-6", gigId: "seed-gig-tech", userId: S.buyer, comment: "הגדיר לי WiFi mesh בכל הבית. סוף סוף יש אינטרנט בכל חדר. סופר מקצועי.", ratingAttitude: 9, ratingTimeliness: 10, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-7", orderId: "ord-7", gigId: "seed-gig-tech", userId: S.buyer3, comment: "הגדיר סטרימר + WiFi להורים שלי. בסבלנות אינסופית. תודה רבה.", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 9, ratingQuality: 9 },
    { id: "rev-8", orderId: "ord-8", gigId: "seed-gig-dan-tech", userId: S.buyer, comment: "התקין לי מערכת בית חכם מלאה. הכל עובד מהטלפון. חוויה!", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 7, ratingQuality: 10 },
    { id: "rev-9", orderId: "ord-9", gigId: "seed-gig-dan-tech", userId: S.buyer2, comment: "ייעוץ מעולה, המליץ בדיוק על מה שצריך בלי לדחוף מוצרים מיותרים.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },
    { id: "rev-10", orderId: "ord-10", gigId: "seed-gig-dan-tech", userId: S.buyer3, comment: "הגדיר לי 15 מכשירים חכמים ביום אחד. מקצועי ברמה אחרת.", ratingAttitude: 9, ratingTimeliness: 8, ratingPrice: 7, ratingQuality: 10 },
    { id: "rev-11", orderId: "ord-11", gigId: "seed-gig-moshe-assembly", userId: S.buyer, comment: "הרכיב 3 ארונות ביום אחד. עבודה קשה, גישה מעולה. ממליץ!", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-12", orderId: "ord-12", gigId: "seed-gig-moshe-assembly", userId: S.buyer3, comment: "הגיע בזמן, עבד מהר, והכל ישר ומסודר. מחיר הוגן מאוד.", ratingAttitude: 9, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-13", orderId: "ord-13", gigId: "seed-gig-eran-garden", userId: S.buyer2, comment: "הגינה עברה מהפך! גיזום, שתילה, והכל נראה כמו גן עדן. ערן מקצוען.", ratingAttitude: 10, ratingTimeliness: 9, ratingPrice: 8, ratingQuality: 10 },
    { id: "rev-14", orderId: "ord-14", gigId: "seed-gig-eran-garden", userId: S.buyer, comment: "טיפול חודשי קבוע. הגינה תמיד נראית מושלמת. שווה כל שקל.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 9, ratingQuality: 10 },
    { id: "rev-15", orderId: "ord-15", gigId: "seed-gig-roei-save", userId: S.buyer, comment: "חסך לי 300 ש״ח בחודש על תקשורת וביטוח. תוך שבוע. גאון.", ratingAttitude: 10, ratingTimeliness: 10, ratingPrice: 10, ratingQuality: 10 },
    { id: "rev-16", orderId: "ord-16", gigId: "seed-gig-roei-save", userId: S.buyer2, comment: "ירד על המחירים של 4 חברות. חסך לנו הרבה כסף. מומלץ!", ratingAttitude: 9, ratingTimeliness: 9, ratingPrice: 10, ratingQuality: 9 },
    { id: "rev-17", orderId: "ord-17", gigId: "seed-gig-roei-save", userId: S.buyer3, comment: "סקירה מלאה ומקצועית. הסביר הכל בסבלנות ובאמת חסך לי.", ratingAttitude: 10, ratingTimeliness: 8, ratingPrice: 10, ratingQuality: 10 },
  ];

  for (const rev of reviewSeed) {
    const overall = Math.round((rev.ratingAttitude + rev.ratingTimeliness + rev.ratingPrice + rev.ratingQuality) / 4);
    const existing = await prisma.review.findUnique({ where: { id: rev.id } });
    if (!existing) {
      await prisma.review.create({
        data: {
          id: rev.id,
          orderId: rev.orderId,
          gigId: rev.gigId,
          userId: rev.userId,
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

  const existingFlag = await prisma.reviewFlag.findUnique({
    where: { reviewId_userId: { reviewId: "rev-1", userId: S.buyer2 } },
  });
  if (!existingFlag) {
    await prisma.reviewFlag.create({
      data: {
        id: "flag-seed-1",
        reviewId: "rev-1",
        userId: S.buyer2,
        reason: "נראה כמו ביקורת מזויפת — ניסוח זהה לביקורות אחרות",
        status: "OPEN",
      },
    });
  }

  console.log("Gigs seed complete.");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
