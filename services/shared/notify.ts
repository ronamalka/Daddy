/**
 * Multi-channel notification dispatcher.
 * Creates an in-app notification row AND dispatches to WhatsApp / SMS / email
 * based on the user's stored preferences.
 */

import { sendWhatsApp, sendSms } from "./whatsapp";

export interface NotifyPayload {
  userId: string;
  phone?: string | null;
  email?: string | null;
  type: string;
  title: string;
  message: string;
  href?: string;
  entityId?: string;
}

export interface ChannelPrefs {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

const IS_TEST = process.env.NODE_ENV === "test";

/**
 * Dispatch a notification to the external channels the user opted in to.
 * In-app persistence is handled separately by the caller (the users service
 * creates a Notification row before calling this).
 */
export async function dispatchExternalChannels(
  payload: NotifyPayload,
  channels: ChannelPrefs,
): Promise<void> {
  if (IS_TEST) return;

  const tasks: Promise<void>[] = [];

  if (channels.whatsapp && payload.phone) {
    tasks.push(sendWhatsApp(payload.phone, payload.message));
  }

  if (channels.sms && payload.phone) {
    tasks.push(sendSms(payload.phone, payload.message));
  }

  if (channels.email && payload.email) {
    // Email service integration (issue #89). For now, log.
    console.log(`[email-stub] Would send to ${payload.email}: ${payload.title} - ${payload.message}`);
  }

  await Promise.allSettled(tasks);
}
