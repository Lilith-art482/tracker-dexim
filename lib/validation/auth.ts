import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  nickname: z
    .string()
    .min(2, "Никнейм должен быть не менее 2 символов")
    .max(30, "Никнейм слишком длинный"),
  accessCode: z.string().refine((code) => code === "demo-tracker-2026", {
    message: "Неверный код доступа",
  }),
});

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, "Никнейм должен быть не менее 2 символов")
    .max(30, "Никнейм слишком длинный"),
});
