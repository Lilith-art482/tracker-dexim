import { z } from "zod/v4";

export const createHabitSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(200),
  category: z.enum([
    "health",
    "work",
    "education",
    "finance",
    "relationships",
    "self-development",
    "other",
  ]),
  customCategory: z.string().max(50, "Слишком длинное название").optional(),
  frequencyType: z.enum(["daily", "weekly", "interval", "time"]),
  frequencyDays: z.array(z.number().min(0).max(6)).optional(),
  frequencyInterval: z.number().min(1).optional(),
  frequencyTime: z.string().optional(),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  durationMinutes: z.number().min(0).max(1440).optional(),
  goal: z.string().optional(),
  goalType: z.enum(["streak", "count"]).optional(),
  goalValue: z.number().min(1).optional(),
  goalPeriod: z.enum(["month", "all"]).optional(),
  note: z.string().max(5000).optional(),
  checklistMode: z.enum(["all", "half"]).optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const createLogSchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["done", "missed", "skipped"]),
  durationMinutes: z.number().min(0).max(1440).optional(),
  note: z.string().max(2000).optional(),
});

export const createReminderSchema = z.object({
  habitId: z.string(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  enabled: z.boolean().default(true),
});

export const exportDataSchema = z.object({
  habits: z.array(z.any()),
  logs: z.array(z.any()),
  achievements: z.array(z.any()),
  version: z.string(),
});
