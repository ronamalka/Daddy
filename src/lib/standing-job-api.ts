import { z } from "zod";
import { STANDING_FREQUENCIES } from "@/lib/standing-job";

export const standingJobWriteSchema = z.object({
  sellerId: z.string().min(1).max(50),
  serviceSlug: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  frequency: z.enum(STANDING_FREQUENCIES),
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(22 * 60),
  sourceOrderId: z.string().min(1).max(50).optional(),
  firstSlotStart: z.string().min(10).max(40).optional(),
  firstSlotEnd: z.string().min(10).max(40).optional(),
}).strict();

export const standingJobPatchSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
}).strict();
