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

export const createNoteSchema = z.object({
  title: z.string().max(300).default(""),
  blocks: z.array(blockSchema).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  blocks: z.array(blockSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type BlockType = z.infer<typeof blockSchema>["type"];
export type Block = z.infer<typeof blockSchema>;
export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
