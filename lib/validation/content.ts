import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const createContentTaskSchema = z.object({
  title: z.string().min(1).max(300),
  topic: z.string().min(1).max(200),
  platform: z.string().min(1).max(100),
  funnel: z.boolean().default(false),
  format: z.string().min(1).max(100),
  status: z.string().min(1).max(100),
  date: z
    .string()
    .regex(dateRegex, "Формат ГГГГ-ММ-ДД")
    .nullable()
    .optional()
    .default(null),
  time: z
    .string()
    .regex(timeRegex, "Формат ЧЧ:ММ")
    .nullable()
    .optional()
    .default(null),
  notes: z.string().max(10_000).optional().default(""),
  color: z.string().max(30).optional(),
  ownerId: z.string().min(1).optional(),
  boardId: z.string().min(1).optional(),
});

export const updateContentTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(300).optional(),
  topic: z.string().min(1).max(200).optional(),
  platform: z.string().min(1).max(100).optional(),
  funnel: z.boolean().optional(),
  format: z.string().min(1).max(100).optional(),
  status: z.string().min(1).max(100).optional(),
  color: z.string().max(30).optional(),
  date: z.string().regex(dateRegex, "Формат ГГГГ-ММ-ДД").nullable().optional(),
  time: z.string().regex(timeRegex, "Формат ЧЧ:ММ").nullable().optional(),
  notes: z.string().max(10_000).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  boardId: z.string().min(1).optional(),
});

export type CreateContentTaskInput = z.infer<typeof createContentTaskSchema>;
export type UpdateContentTaskInput = z.infer<typeof updateContentTaskSchema>;
