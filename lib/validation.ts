import { z } from "zod";

export const createTaskSchema = z.object({
  columnId: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional().default(""),
  startDate: z.string().optional().nullable().default(null),
  endDate: z.string().optional().nullable().default(null),
  assignee: z.string().max(200).optional().nullable().default(null),
  assignees: z.array(z.string()).optional().default([]),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  newColumnId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  assignee: z.string().max(200).optional().nullable(),
  assignees: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
  archived: z.boolean().optional(),
  archivedAt: z.string().nullable().optional(),
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат ГГГГ-ММ-ДД"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ"),
  title: z.string().min(1).max(200),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  color: z.string().max(30).optional(),
  comment: z.string().max(2000).optional(),
  ownerId: z.string().min(1).optional(),
  boardId: z.string().min(1).optional(),
  sourceNoteId: z.string().nullable().optional(),
});

export const updatePersonalTaskSchema = z.object({
  id: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Формат ГГГГ-ММ-ДД")
    .optional(),
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
  color: z.string().max(30).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  comment: z.string().max(2000).optional(),
  boardId: z.string().min(1).optional(),
  sourceNoteId: z.string().nullable().optional(),
});

export type CreatePersonalTaskInput = z.infer<typeof createPersonalTaskSchema>;
export type UpdatePersonalTaskInput = z.infer<typeof updatePersonalTaskSchema>;

export const createPersonalPlanEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат ГГГГ-ММ-ДД"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .nullable()
    .optional(),
  title: z.string().min(1).max(200),
  priority: z.enum(["none", "low", "medium", "high"]).default("none"),
  comment: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
  ownerId: z.string().min(1).optional(),
  boardId: z.string().min(1).optional(),
});

export const updatePersonalPlanEntrySchema = z.object({
  id: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Формат ГГГГ-ММ-ДД")
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Формат ЧЧ:ММ")
    .nullable()
    .optional(),
  title: z.string().min(1).max(200).optional(),
  priority: z.enum(["none", "low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  comment: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
  boardId: z.string().min(1).optional(),
});

export type CreatePersonalPlanEntryInput = z.infer<
  typeof createPersonalPlanEntrySchema
>;
export type UpdatePersonalPlanEntryInput = z.infer<
  typeof updatePersonalPlanEntrySchema
>;
