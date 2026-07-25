import { z } from "zod";

export const shoppingItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  quantity: z.number().positive().max(9999),
  unit: z.string().min(1).max(20),
  checked: z.boolean().default(false),
  amount: z.number().positive().optional(),
  accountId: z.string().optional(),
  transactionId: z.string().optional(),
});

export const createShoppingListSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().optional(),
  items: z.array(shoppingItemSchema).default([]),
  completed: z.boolean().default(false),
  archived: z.boolean().default(false),
});

export const updateShoppingListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  date: z.string().optional(),
  items: z.array(shoppingItemSchema).optional(),
  completed: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type UpdateShoppingListInput = z.infer<typeof updateShoppingListSchema>;
