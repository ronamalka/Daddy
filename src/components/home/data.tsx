"use client";

import {
  MagnifyingGlass, Users, Wrench, MapPin, Lightning, ChartBar, Coins,
  PencilLine, Chat, Trophy, PaperPlaneTilt, Sparkle, Star, CheckCircle,
} from "@phosphor-icons/react";

import { DISTRICTS } from "@/lib/districts";

export const DISTRICT_LIST = Object.entries(DISTRICTS).map(([code, name]) => ({ code: Number(code), name }));

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "assembly-and-installation": <Wrench className="h-6 w-6" />,
  "home-maintenance": <Wrench className="h-6 w-6" />,
  "moving-and-delivery": <PaperPlaneTilt className="h-6 w-6" />,
  "tech-and-digital": <Lightning className="h-6 w-6" />,
  "errands-and-help": <Users className="h-6 w-6" />,
  "financial-help": <Coins className="h-6 w-6" />,
  "automotive": <Wrench className="h-6 w-6" />,
  "events": <Sparkle className="h-6 w-6" />,
};

export const STATS = [
  { number: 1200, suffix: "+", label: "אבאל׳ות רשומים", icon: <Users className="h-5 w-5" /> },
  { number: 8500, suffix: "+", label: "עבודות שהושלמו", icon: <CheckCircle className="h-5 w-5" /> },
  { number: 4.8, suffix: "", label: "דירוג ממוצע", icon: <Star className="h-5 w-5" /> },
  { number: 38, suffix: "", label: "שירותים שונים", icon: <Wrench className="h-5 w-5" /> },
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
  { title: "אבאל׳ות אמיתיים", desc: "לא חברות ענק. אנשים אמיתיים עם ידיים טובות, ניסיון, ורצון לעזור.", icon: <Users className="h-6 w-6" /> },
  { title: "דירוג אמין", desc: "4 קריטריונים: איכות, יחס, זמנים, מחיר. תדע בדיוק מה אתה מקבל.", icon: <ChartBar className="h-6 w-6" /> },
  { title: "מחירים הוגנים", desc: "ללא עמלות נסתרות. המחיר שאתה רואה — זה המחיר שאתה משלם.", icon: <Coins className="h-6 w-6" /> },
  { title: "כל השירותים", desc: "מהרכבת ארון ועד הוזלת חשבונות. 38 שירותים ב-8 קטגוריות.", icon: <Wrench className="h-6 w-6" /> },
  { title: "לפי אזור", desc: "מצא אבאל׳ה בשכונה שלך. 7 מחוזות, עשרות ערים.", icon: <MapPin className="h-6 w-6" /> },
  { title: "מהיר ופשוט", desc: "חפש, בחר, שלח הודעה. בתוך דקות יש לך אבאל׳ה.", icon: <Lightning className="h-6 w-6" /> },
];

export const FALLBACK_TESTIMONIALS = [
  { name: "נועם ג׳", text: "הזמנתי הרכבת ארון מאיקאה. האבאל׳ה הגיע עם ארגז כלים, בדיחות יבשות, ושוקולד. הארון עומד עד היום, הבדיחות פחות.", service: "הרכבת רהיטים", daddyName: "משה כ׳", rating: 5 },
  { name: "שירה מ׳", text: "אבא שלי לא מבין בטכנולוגיה אז הזמנתי לו אבאל׳ה שילמד אותו וואטסאפ. עכשיו הוא שולח לי מימס בלי הפסקה.", service: "עזרה טכנית", daddyName: "דוד ל׳", rating: 5 },
  { name: "עידו ק׳", text: "חיפשתי מישהו שיוריד לי את חשבון הסלולר. האבאל׳ה חסך לי 80 שקל בחודש. קוראים לזה ROI של אבא.", service: "הוזלת חשבונות", daddyName: "יוסי ב׳", rating: 5 },
];
