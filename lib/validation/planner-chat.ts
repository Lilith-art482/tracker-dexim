import { z } from "zod";

export const plannerMessageSchema = z.object({
  id: z.string().min(1).max(80),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(20_000),
  createdAt: z.number(),
  attachment: z
    .object({
      name: z.string().min(1).max(200),
      text: z.string().min(1).max(20_000),
    })
    .optional(),
});

export const plannerChatSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(200).default(""),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(plannerMessageSchema).max(120),
  ownerId: z.string().min(1).optional(),
});

export const upsertPlannerChatSchema = z.object({
  chat: plannerChatSchema,
});

export const deletePlannerChatSchema = z.object({
  id: z.string().min(1).max(80),
});

export type PlannerChatInput = z.infer<typeof plannerChatSchema>;
