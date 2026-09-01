/** Hebrew notification templates for job lifecycle events. */

export type NotificationType =
  | "NEW_QUOTE"
  | "QUOTE_ACCEPTED"
  | "ORDER_BOOKED"
  | "ORDER_IN_PROGRESS"
  | "REMINDER_24H"
  | "REMINDER_2H"
  | "ORDER_CANCELLED"
  | "CONFIRM_COMPLETION";

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  href: string;
}

interface OrderContext {
  orderId: string;
  service?: string;
  date?: string;
  time?: string;
  price?: number;
}

/** Build a notification from a template type and order context. */
export function buildNotification(type: NotificationType, ctx: OrderContext): NotificationTemplate {
  const href = `/orders/${ctx.orderId}`;

  switch (type) {
    case "NEW_QUOTE":
      return {
        type,
        title: "הצעת מחיר חדשה!",
        message: ctx.price
          ? `קיבלת הצעת מחיר חדשה בסך ₪${ctx.price}. לחץ לצפייה`
          : "קיבלת הצעת מחיר חדשה! לחץ לצפייה",
        href,
      };

    case "QUOTE_ACCEPTED":
      return {
        type,
        title: "ההצעה שלך אושרה!",
        message: ctx.date ? `ההצעה שלך אושרה! מועד: ${ctx.date}` : "ההצעה שלך אושרה!",
        href,
      };

    case "ORDER_BOOKED":
      return {
        type,
        title: "הזמנה חדשה!",
        message:
          ctx.service && ctx.date
            ? `הזמנה חדשה! ${ctx.service} ב${ctx.date}`
            : "הזמנה חדשה! לחץ לצפייה בפרטים",
        href,
      };

    case "ORDER_IN_PROGRESS":
      return {
        type,
        title: "העבודה התחילה",
        message: ctx.service
          ? `בעל המקצוע התחיל לעבוד על ${ctx.service}`
          : "בעל המקצוע התחיל לעבוד על ההזמנה שלך",
        href,
      };

    case "REMINDER_24H":
      return {
        type,
        title: "תזכורת: מחר",
        message:
          ctx.time && ctx.service
            ? `תזכורת: מחר בשעה ${ctx.time} - ${ctx.service}`
            : "תזכורת: יש לך הזמנה מחר",
        href,
      };

    case "REMINDER_2H":
      return {
        type,
        title: "תזכורת: בעוד שעתיים",
        message: ctx.service
          ? `תזכורת: בעוד שעתיים - ${ctx.service}`
          : "תזכורת: יש לך הזמנה בעוד שעתיים",
        href,
      };

    case "ORDER_CANCELLED":
      return {
        type,
        title: "הזמנה בוטלה",
        message: ctx.service ? `הזמנה בוטלה: ${ctx.service}` : "הזמנה בוטלה",
        href,
      };

    case "CONFIRM_COMPLETION":
      return {
        type,
        title: "האם העבודה הסתיימה?",
        message: "בעל המקצוע סיים את העבודה. אשר קבלה",
        href,
      };
  }
}
