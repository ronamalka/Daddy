import { z } from "zod";

const gigTierSchema = z.object({
  tier: z.string().min(1).max(50),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().max(100000),
  deliveryDays: z.number().int().positive().max(365),
  revisions: z.number().int().min(0).max(100).optional(),
});

const gigFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
});

const gigRequirementSchema = z.object({
  question: z.string().min(1).max(500),
  required: z.boolean().optional(),
});

/** Body shape the create-gig form and the gigs service both use. */
export const createGigSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  categoryId: z.string().min(1).max(100),
  image: z.string().url().max(500).optional().nullable(),
  tiers: z.array(gigTierSchema).min(1).max(5),
  faqs: z.array(gigFaqSchema).max(20).optional(),
  requirements: z.array(gigRequirementSchema).max(20).optional(),
}).strict();

export type CreateGigBody = z.infer<typeof createGigSchema>;
