/**
 * WhatsApp notification dispatch helpers.
 * Each function maps a business event to a WhatsApp Business API template call.
 * All functions are fire-and-forget safe (they never throw).
 */

import {
  sendWhatsAppNotification,
  toE164,
  type WhatsAppTemplate,
} from "../../../shared/whatsapp";

/** Send a template notification, converting the phone to E.164 first. */
async function send(
  phone: string,
  template: WhatsAppTemplate,
  params: Record<string, string>,
  link?: string,
): Promise<{ success: boolean; error?: string }> {
  const to = toE164(phone);
  if (!to) return { success: false, error: "Invalid phone number" };
  return sendWhatsAppNotification({ to, template, params, link });
}

/** Buyer: your order has been confirmed by the seller. */
export function notifyOrderConfirmed(phone: string, sellerName: string, date: string, orderId: string) {
  return send(phone, "order_confirmed", { "1": sellerName, "2": date }, `/orders/${orderId}`);
}

/** Buyer: seller started working on your order. */
export function notifyOrderInProgress(phone: string, service: string, orderId: string) {
  return send(phone, "order_in_progress", { "1": service }, `/orders/${orderId}`);
}

/** Buyer: seller is on the way. */
export function notifyOrderOnTheWay(phone: string, sellerName: string, orderId: string) {
  return send(phone, "order_on_the_way", { "1": sellerName }, `/orders/${orderId}`);
}

/** Buyer: order has been delivered, please confirm. */
export function notifyOrderCompleted(phone: string, sellerName: string, orderId: string) {
  return send(phone, "order_completed", { "1": sellerName }, `/orders/${orderId}`);
}

/** Seller: payment has been released. */
export function notifyPaymentReleased(phone: string, amount: string, orderId: string) {
  return send(phone, "payment_released", { "1": amount }, `/orders/${orderId}`);
}

/** User: you have a new chat message. */
export function notifyNewMessage(phone: string, senderName: string, orderId: string) {
  return send(phone, "new_message", { "1": senderName }, `/orders/${orderId}`);
}

/** Seller: new request matches your services / area. */
export function notifyNewRequestMatch(phone: string, service: string, area: string) {
  return send(phone, "new_request_match", { "1": service, "2": area }, "/requests");
}

/** Both parties: order has been cancelled. */
export function notifyOrderCancelled(phone: string, service: string, orderId: string) {
  return send(phone, "order_cancelled", { "1": service }, `/orders/${orderId}`);
}
