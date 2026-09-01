/**
 * WhatsApp and SMS dispatch stubs.
 * These log to console when the relevant env vars are missing;
 * swap in real provider calls (WhatsApp Business API, Twilio, etc.) later.
 */

const IS_TEST = process.env.NODE_ENV === "test";

/** Send a WhatsApp message. Stub when WHATSAPP_API_TOKEN is not set. */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (IS_TEST) return;

  if (!process.env.WHATSAPP_API_TOKEN) {
    console.log(`[whatsapp-stub] Would send to ${phone}: ${message}`);
    return;
  }

  // Real WhatsApp Business API call would go here:
  // POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
  // Authorization: Bearer {WHATSAPP_API_TOKEN}
  // Body: { messaging_product: "whatsapp", to: phone, type: "text", text: { body: message } }
  console.log(`[whatsapp] Sent to ${phone}: ${message}`);
}

/** Send an SMS message. Stub when SMS_API_KEY is not set. */
export async function sendSms(phone: string, message: string): Promise<void> {
  if (IS_TEST) return;

  if (!process.env.SMS_API_KEY) {
    console.log(`[sms-stub] Would send to ${phone}: ${message}`);
    return;
  }

  // Real SMS provider call (e.g. Twilio, Vonage) would go here
  console.log(`[sms] Sent to ${phone}: ${message}`);
}
