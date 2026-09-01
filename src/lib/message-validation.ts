import { z } from "zod";
import { isAllowedAttachmentUrl, isImageAttachment } from "@/lib/attachment-url";

const entityId = z.string().trim().min(1).max(64);

const attachmentSchema = z
  .string()
  .refine(isAllowedAttachmentUrl, { message: "Invalid attachment" });

const messageBodyFields = {
  content: z.string().max(5000).optional().default(""),
  attachment: attachmentSchema.optional(),
};

/** Caption plus optional upload path; at least one of the two is required. */
function requireCaptionOrFile(data: { content: string; attachment?: string }) {
  return data.content.length > 0 || Boolean(data.attachment);
}

export const directMessageSchema = z
  .object({
    ...messageBodyFields,
    receiverId: entityId,
  })
  .strict()
  .transform((data) => ({ ...data, content: data.content.trim() }))
  .refine(requireCaptionOrFile, { message: "content or attachment required" });

export const orderMessageSchema = z
  .object(messageBodyFields)
  .strict()
  .transform((data) => ({ ...data, content: data.content.trim() }))
  .refine(requireCaptionOrFile, { message: "content or attachment required" });

export const markReadSchema = z
  .object({
    orderId: entityId.optional(),
    senderId: entityId.optional(),
  })
  .strict()
  .refine((data) => Boolean(data.orderId || data.senderId), {
    message: "orderId or senderId required",
  });

/** Inbox/toast preview: caption, or a short label for a photo/PDF-only message. */
export function messagePreviewText(content: string, attachment?: string | null): string {
  const text = (content || "").trim();
  if (text) return text;
  if (attachment && isImageAttachment(attachment)) return "תמונה";
  if (attachment && isAllowedAttachmentUrl(attachment)) return "קובץ PDF";
  return "";
}

/** Adds a sender object (id, name, avatar) onto a message. */
export function attachSender<T extends Record<string, unknown>>(
  message: T,
  user: { id: string; name?: string | null; image?: string | null }
) {
  return {
    ...message,
    sender: {
      id: user.id,
      name: user.name || "משתמש",
      avatar: user.image ?? null,
    },
  };
}
