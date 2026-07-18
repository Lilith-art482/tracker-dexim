import { z } from "zod";

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "heading1",
    "heading2",
    "heading3",
    "paragraph",
    "bulletList",
    "numberedList",
    "todo",
    "quote",
    "code",
    "divider",
  ]),
  content: z.string().max(50000),
  checked: z.boolean().optional(),
  language: z.string().optional(),
});

export const canvasConnectionSchema = z.object({
  fromBlockId: z.string(),
  toBlockId: z.string(),
  type: z.enum(["arrow", "dashed"]),
});

export const canvasStateSchema = z.object({
  positions: z.record(z.string(), z.object({ x: z.number(), y: z.number() })),
  connections: z.array(canvasConnectionSchema),
}) as z.ZodType<import("@/lib/models").CanvasState>;

export const createNoteSchema = z.object({
  title: z.string().max(300).default(""),
  blocks: z.array(blockSchema).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  recurringInterval: z
    .enum(["daily", "weekly", "monthly"])
    .nullable()
    .optional(),
  linkedNoteIds: z.array(z.string()).optional(),
  canvasState: canvasStateSchema.nullable().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().max(300).optional(),
  blocks: z.array(blockSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  recurringInterval: z
    .enum(["daily", "weekly", "monthly"])
    .nullable()
    .optional(),
  linkedNoteIds: z.array(z.string()).optional(),
  canvasState: canvasStateSchema.nullable().optional(),
});

export type BlockType = z.infer<typeof blockSchema>["type"];
export type Block = z.infer<typeof blockSchema>;
export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
