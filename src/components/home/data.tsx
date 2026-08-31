"use client";

import {
  MagnifyingGlass, Users, Wrench, MapPin, Lightning, ChartBar, Coins,
  PencilLine, Chat, Trophy, Star, CheckCircle,
} from "@phosphor-icons/react";

import { DISTRICTS } from "@/lib/districts";

export const DISTRICT_LIST = Object.entries(DISTRICTS).map(([code, name]) => ({ code: Number(code), name }));

export const POPULAR_SEARCHES = [
  { label: "ברז שלא מפסיק לבכות", query: "תיקונים קטנים" },
  { label: "ארון שמסרב להתרכב", query: "הרכבת רהיטים" },
  { label: "הוזלת חשבונות", query: "הוזלת חשבונות" },
  { label: "טלוויזיה שצריכה לעלות על הקיר", query: "תליית טלוויזיה" },
] as const;

export const STATS = [
  { number: 1200, suffix: "+", label: "אבאל׳ות שיודעים לסדר", icon: <Users className="h-5 w-5" /> },
  { number: 8500, suffix: "+", label: "ארונות שעומדים עד היום", icon: <CheckCircle className="h-5 w-5" /> },
  { number: 9.6, suffix: "/10", label: "ציון (אבא היה גאה)", icon: <Star className="h-5 w-5" /> },
  { number: 38, suffix: "", label: "שירותים (כן, גם מדפים)", icon: <Wrench className="h-5 w-5" /> },
];

export const BUYER_STEPS = [
  { title: "ספר מה צריך", desc: "חפש שירות או פרסם בקשה. בלי טפסים, בלי בירוקרטיה.", icon: <MagnifyingGlass className="h-6 w-6" /> },
  { title: "בחר אבאל׳ה", desc: "דפדף, קרא ביקורות, השווה מחירים — ותבחר את המתאים.", icon: <Users className="h-6 w-6" /> },
  { title: "תאם וסגור", desc: "שלח הודעה, תאם זמן, ותתחיל לנוח.", icon: <Chat className="h-6 w-6" /> },
  { title: "דרג ושתף", desc: "העבודה הסתיימה? תן ביקורת ועזור לאחרים לבחור נכון.", icon: <Star className="h-6 w-6" /> },
];

export const DADDY_STEPS = [
  { title: "צור פרופיל", desc: "הרשם, ספר מה אתה יודע לעשות, ואיפה אתה עובד.", icon: <PencilLine className="h-6 w-6" /> },
  { title: "קבל פניות", desc: "לקוחות מחפשים — הגב לבקשות או תן להם למצוא אותך.", icon: <Chat className="h-6 w-6" /> },
  { title: "עשה את העבודה", desc: "תגיע, תסדר, ותשאיר רושם. כמו אבא אמיתי.", icon: <Wrench className="h-6 w-6" /> },
  { title: "בנה מוניטין", desc: "ביקורות טובות = יותר עבודה. פשוט ככה.", icon: <Trophy className="h-6 w-6" /> },
];

export const WHY_CHOOSE = [
  { title: "אבאל׳ות אמיתיים", desc: "לא חברות ענק עם מוקדנים שקוראים מדף. אנשים אמיתיים שיגיעו, יסדרו, ואולי גם יספרו בדיחה.", icon: <Users className="h-6 w-6" /> },
  { title: "ביקורות אמיתיות", desc: "לא חבר של חבר שאמר שהוא בסדר. 4 קריטריונים, דירוגים אמיתיים, בלי פוליטיקה.", icon: <ChartBar className="h-6 w-6" /> },
  { title: "בלי הפתעות בחשבון", desc: "המחיר שסיכמתם — זה המחיר שתשלמו. בלי ׳אה, שכחתי להגיד...׳", icon: <Coins className="h-6 w-6" /> },
  { title: "38 סוגי שירות", desc: "מברז שמטפטף ועד ארון שמסרב להתרכב. אם זה נשבר, יש לנו אבאל׳ה לזה.", icon: <Wrench className="h-6 w-6" /> },
  { title: "אבאל׳ה בשכונה", desc: "7 מחוזות, עשרות ערים. כן, גם באר שבע. בטח שגם באר שבע.", icon: <MapPin className="h-6 w-6" /> },
  { title: "בדקות, לא בימים", desc: "חפש, בחר, שלח הודעה. עד שתסיים את הקפה — יש לך אבאל׳ה.", icon: <Lightning className="h-6 w-6" /> },
];

export const FALLBACK_TESTIMONIALS = [
  { name: "נועם ג׳", text: "הזמנתי הרכבת ארון מאיקאה. האבאל׳ה הגיע עם ארגז כלים, בדיחות יבשות, ושוקולד. הארון עומד עד היום, הבדיחות פחות.", service: "הרכבת רהיטים", daddyName: "משה כ׳", rating: 9 },
  { name: "שירה מ׳", text: "אבא שלי לא מבין בטכנולוגיה אז הזמנתי לו אבאל׳ה שילמד אותו וואטסאפ. עכשיו הוא שולח לי מימס בלי הפסקה. מה עשיתי.", service: "עזרה טכנית", daddyName: "דוד ל׳", rating: 10 },
  { name: "עידו ק׳", text: "חיפשתי מישהו שיוריד לי את חשבון הסלולר. האבאל׳ה חסך לי 80 שקל בחודש. קוראים לזה ROI של אבא.", service: "הוזלת חשבונות", daddyName: "יוסי ב׳", rating: 10 },
  { name: "מיכל א׳", text: "הטלוויזיה הייתה על הרצפה שלושה חודשים כי ׳אני אתלה אותה בשבת׳. הזמנתי אבאל׳ה, תוך שעה היא על הקיר. בעלי עדיין לא שם לב.", service: "תליית טלוויזיה", daddyName: "אבי ר׳", rating: 9 },
  { name: "יונתן ד׳", text: "הברז בשירותים טפטף חצי שנה. אמרתי ׳זה מוסיף אווירה׳. האבאל׳ה תיקן את זה ב-20 דקות ושבר לי את האשליה.", service: "אינסטלציה", daddyName: "חיים ש׳", rating: 10 },
];
