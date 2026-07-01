import { z } from "zod";

export const createTaskSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional().default(""),
  startDate: z.string().optional().nullable().default(null),
  endDate: z.string().optional().nullable().default(null),
  assignee: z.string().max(200).optional().nullable().default(null),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  assignee: z.string().max(200).optional().nullable(),
  completed: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  author: z.string().min(1).max(200),
  text: z.string().min(1).max(10_000),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createPersonalTaskSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ"),
  title: z.string().min(1).max(200),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  comment: z.string().max(2000).optional(),
  ownerId: z.string().min(1).optional(),
});

export const updatePersonalTaskSchema = z.object({
  id: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .optional(),
  title: z.string().min(1).max(200).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
  comment: z.string().max(2000).optional(),
});

export type CreatePersonalTaskInput = z.infer<typeof createPersonalTaskSchema>;
export type UpdatePersonalTaskInput = z.infer<typeof updatePersonalTaskSchema>;
