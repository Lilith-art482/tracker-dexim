import { z } from "zod";

const noteBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "paragraph",
    "heading1",
    "heading2",
    "heading3",
    "bulletList",
    "numberedList",
    "todo",
    "quote",
    "code",
    "divider",
  ]),
  content: z.string().max(10_000).default(""),
  checked: z.boolean().optional(),
  language: z.string().max(50).optional(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1).max(500).default("Без заголовка"),
  blocks: z
    .array(noteBlockSchema)
    .default([{ id: crypto.randomUUID(), type: "paragraph", content: "" }]),
  tags: z.array(z.string().max(50)).default([]),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  recurringInterval: z.string().nullable().optional(),
});

export const updateNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  blocks: z.array(noteBlockSchema).optional(),
  tags: z.array(z.string().max(50)).optional(),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  recurringInterval: z.string().nullable().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
