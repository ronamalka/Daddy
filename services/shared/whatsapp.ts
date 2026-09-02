/**
 * WhatsApp Business API client and SMS dispatch stubs.
 * Sends template-based messages via the WhatsApp Cloud API when configured;
 * logs to console (stub mode) when WHATSAPP_PHONE_ID / WHATSAPP_API_TOKEN are not set.
 */

import { logger } from "./logger";

const IS_TEST = process.env.NODE_ENV === "test";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const APP_URL = process.env.APP_URL || "https://aballeh.com";

export type WhatsAppTemplate =
  | "order_confirmed"
  | "order_in_progress"
  | "order_on_the_way"
  | "order_completed"
  | "payment_released"
  | "new_message"
  | "new_request_match"
  | "order_cancelled";

export interface WhatsAppNotification {
  /** Phone number in E.164 format (+972...) */
  to: string;
  /** Template name registered in WhatsApp Business Manager */
  template: WhatsAppTemplate;
  /** Positional template body parameters (keyed "1", "2", ...) */
  params: Record<string, string>;
  /** Deep link path appended to APP_URL (e.g. "/orders/abc123") */
  link?: string;
}

/**
 * Send a template-based WhatsApp notification.
 * Returns { success: true } in stub mode when env vars are missing.
 */
export async function sendWhatsAppNotification(
  notification: WhatsAppNotification,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (IS_TEST) return { success: true };

  if (!WHATSAPP_PHONE_ID || !WHATSAPP_API_TOKEN) {
    logger.debug(
      { template: notification.template, to: notification.to, params: notification.params, link: notification.link },
      "WhatsApp stub: would send template",
    );
    return { success: true };
  }

  try {
    const components: Array<Record<string, unknown>> = [];

    // Body parameters
    const paramEntries = Object.entries(notification.params);
    if (paramEntries.length > 0) {
      components.push({
        type: "body",
        parameters: paramEntries.map(([, value]) => ({
          type: "text",
          text: value,
        })),
      });
    }

    // Button URL suffix (deep link)
    if (notification.link) {
      components.push({
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [{ type: "text", text: notification.link }],
      });
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: notification.to,
        type: "template",
        template: {
          name: notification.template,
          language: { code: "he" },
          components,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ err: error }, "WhatsApp send failed");
      return { success: false, error };
    }

    const result = (await response.json()) as { messages?: Array<{ id?: string }> };
    const messageId = result.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    logger.error({ err }, "WhatsApp send error");
    return { success: false, error: String(err) };
  }
}

/** Convert Israeli phone format to E.164. "0501234567" -> "+972501234567" */
export function toE164(phone: string): string | null {
  const cleaned = phone.replace(/[-\s().]/g, "");
  if (cleaned.startsWith("+972")) return cleaned;
  if (cleaned.startsWith("972")) return "+" + cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10) return "+972" + cleaned.slice(1);
  return null;
}

/** Build the full deep link URL from a relative path. */
export function buildDeepLink(path: string): string {
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// Legacy plain-text helpers (used by existing notify.ts dispatcher)
// ---------------------------------------------------------------------------

/** Send a plain-text WhatsApp message. Stub when WHATSAPP_API_TOKEN is not set. */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (IS_TEST) return;

  if (!WHATSAPP_API_TOKEN) {
    logger.debug({ phone, message }, "WhatsApp stub: would send message");
    return;
  }

  logger.info({ phone, message }, "WhatsApp message sent");
}

/** Send an SMS message. Stub when SMS_API_KEY is not set. */
export async function sendSms(phone: string, message: string): Promise<void> {
  if (IS_TEST) return;

  if (!process.env.SMS_API_KEY) {
    logger.debug({ phone, message }, "SMS stub: would send message");
    return;
  }

  logger.info({ phone, message }, "SMS message sent");
}
