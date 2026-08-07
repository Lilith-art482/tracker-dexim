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

const cardBrands = ["visa", "mastercard", "mir", "amex", "maestro"] as const;

export const savedCardSchema = z.object({
  id: z.string(),
  brand: z.enum(cardBrands),
  last4: z.string().length(4),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(24).max(40),
  isDefault: z.boolean().default(false),
});

export const updateSettingsSchema = z.object({
  paymentMethod: z.enum(["card", "crypto"]).nullable(),
  defaultCardId: z.string().nullable(),
  autoPay: z.boolean(),
  savedCards: z.array(savedCardSchema).optional(),
});

export const updateConsentSchema = z.object({
  dataConsent: z.boolean(),
});

const registrationResponseSchema = z
  .object({
    id: z.string(),
    rawId: z.string(),
    type: z.string(),
    response: z
      .object({
        clientDataJSON: z.string(),
        attestationObject: z.string(),
      })
      .passthrough(),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    transports: z.array(z.string()).optional(),
  })
  .passthrough();

const authenticationResponseSchema = z
  .object({
    id: z.string(),
    rawId: z.string(),
    type: z.string(),
    response: z
      .object({
        clientDataJSON: z.string(),
        authenticatorData: z.string(),
        signature: z.string(),
        userHandle: z.string().optional(),
      })
      .passthrough(),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const biometricRegisterOptionsSchema = z.object({
  uid: z.string().min(1, "uid обязателен"),
});

export const biometricRegisterSchema = z.object({
  uid: z.string().min(1, "uid обязателен"),
  challengeId: z.string().min(1, "challengeId обязателен"),
  deviceName: z.string().max(80).default("Устройство"),
  registrationResponse: registrationResponseSchema,
});

export const biometricAuthenticateSchema = z.object({
  challengeId: z.string().min(1, "challengeId обязателен"),
  authenticationResponse: authenticationResponseSchema,
});

export const biometricRemoveSchema = z.object({
  uid: z.string().min(1, "uid обязателен"),
  credentialId: z.string().min(1, "credentialId обязателен"),
});

export const TARIFF_FEATURES: Record<
  string,
  { name: string; price: string; features: string[] }
> = {
  basic: {
    name: "Базовый",
    price: "0 ₽/мес",
    features: [
      "Доски (личное) · до 3 шт.",
      "Задачи · до 4 шт/день",
      "Счета · до 2 шт.",
      "Транзакции · до 50 / мес",
      "Привычки · 2 шт.",
      "AI-помощник · до 5 запросов/день",
    ],
  },
  pro: {
    name: "PRO",
    price: "349 ₽/мес",
    features: [
      "Доски (личное) · до 20 шт.",
      "Доски (команда) · до 20 шт.",
      "Задачи · без лимита",
      "Счета · до 15 шт.",
      "Транзакции · до 500 / мес",
      "Планирование бюджета",
      "Финансовая подушка",
      "Обязательства",
      "Проекты и цели",
      "Привычки · 15 шт.",
      "Достижения",
      "AI-помощник · до 30 запросов/день",
      "Командные доски · до 5 участников",
      "Экспорт данных",
    ],
  },
  apex: {
    name: "APEX",
    price: "549 ₽/мес",
    features: [
      "Доски · без лимита",
      "Задачи · без лимита",
      "Счета · без лимита",
      "Транзакции · без лимита",
      "Планирование бюджета",
      "Финансовая подушка",
      "Обязательства",
      "Подробный дашборд по финансам",
      "Проекты и цели",
      "Привычки · без лимита",
      "Достижения",
      "Расписание привычек",
      "AI-помощник · без лимита",
      "Командные доски · до 100 участников",
      "Экспорт данных · CSV, PDF",
      "Интеграции · Telegram",
      "Своя цветовая схема",
      "Музыкальные треки",
      "Кастомные настройки разделов",
    ],
  },
};
