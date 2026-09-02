/**
 * Internal endpoint for other services to trigger WhatsApp template notifications.
 * Protected by `requireInternal` — only inter-service calls can reach this.
 */

import { Router, Request, Response } from "express";
import { requireInternal } from "../../../shared/middleware";
import { sendWhatsAppNotification, toE164, type WhatsAppTemplate } from "../../../shared/whatsapp";
import { prisma } from "../index";

export const whatsappRoutes = Router();

/**
 * POST /notifications/whatsapp/send
 *
 * Body: {
 *   userId: string,
 *   template: WhatsAppTemplate,
 *   params: Record<string, string>,
 *   link?: string
 * }
 *
 * Looks up the user's phone and `notifyWhatsapp` preference.
 * Skips silently when the user opted out or has no phone.
 * Logs every attempt to NotificationLog for audit / debugging.
 */
whatsappRoutes.post("/send", requireInternal, async (req: Request, res: Response) => {
  const { userId, template, params, link } = req.body as {
    userId?: string;
    template?: WhatsAppTemplate;
    params?: Record<string, string>;
    link?: string;
  };

  if (!userId || !template) {
    res.status(400).json({ error: "userId and template are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, notifyWhatsapp: true },
  });

  if (!user) {
    await logAttempt(userId, template, "skipped", "User not found");
    res.json({ sent: false, reason: "user_not_found" });
    return;
  }

  if (!user.notifyWhatsapp) {
    await logAttempt(userId, template, "skipped", "User opted out");
    res.json({ sent: false, reason: "opted_out" });
    return;
  }

  if (!user.phone) {
    await logAttempt(userId, template, "skipped", "No phone number");
    res.json({ sent: false, reason: "no_phone" });
    return;
  }

  const to = toE164(user.phone);
  if (!to) {
    await logAttempt(userId, template, "failed", `Invalid phone: ${user.phone}`);
    res.json({ sent: false, reason: "invalid_phone" });
    return;
  }

  const result = await sendWhatsAppNotification({
    to,
    template,
    params: params || {},
    link,
  });

  await logAttempt(userId, template, result.success ? "sent" : "failed", result.error);

  res.json({ sent: result.success });
});

/** Write a row to NotificationLog. Best-effort; swallows errors. */
async function logAttempt(
  userId: string,
  template: string,
  status: string,
  error?: string,
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: { userId, channel: "whatsapp", template, status, error: error ?? null },
    });
  } catch (err) {
    console.error("[whatsapp-route] Failed to write NotificationLog:", err);
  }
}
