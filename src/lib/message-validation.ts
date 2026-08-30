import { z } from "zod";

const entityId = z.string().trim().min(1).max(64);

export const directMessageSchema = z.object({
  receiverId: entityId,
  content: z.string().trim().min(1).max(5000),
}).strict();

export const orderMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
}).strict();

export const markReadSchema = z
  .object({
    orderId: entityId.optional(),
    senderId: entityId.optional(),
  })
  .strict()
  .refine((data) => Boolean(data.orderId || data.senderId), {
    message: "orderId or senderId required",
  });

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
