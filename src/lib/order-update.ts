import { z } from "zod";

/** Body for PATCH /api/orders/:id. Matches the Prisma statuses the order page sends. */
export const updateOrderSchema = z.object({
  status: z.enum(["IN_PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED", "REVISION"]),
}).strict();
