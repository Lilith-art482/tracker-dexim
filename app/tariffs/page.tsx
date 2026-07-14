"use client";

import Link from "next/link";
import { ArrowLeft, Check, X, Sparkles, Rocket, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "basic",
    name: "Базовый",
    subtitle: "Для личного использования",
    icon: Sparkles,
    price: "0",
    period: "мес",
    gradient:
      "from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950",
    border: "border-border/60",
    btnClass: "bg-muted/80 text-foreground hover:bg-muted",
    features: [
      { label: "Доски (личное)", ok: true, detail: "до 3 шт." },
      { label: "Задачи", ok: true, detail: "до 4 шт/день" },
      { label: "Счета", ok: true, detail: "до 2 шт." },
      { label: "Транзакции", ok: true, detail: "до 50 / мес" },
      { label: "Привычки", ok: true, detail: "2 шт." },
      { label: "AI-помощник", ok: true, detail: "до 5 запросов/день" },
      { label: "Командные доски", ok: false },
      { label: "Планирование бюджета", ok: false },
      { label: "Финансовая подушка", ok: false },
      { label: "Обязательства", ok: false },
      { label: "Проекты и цели", ok: false },
      { label: "Достижения", ok: false },
      { label: "Экспорт данных", ok: false },
      { label: "Интеграции", ok: false },
      { label: "Своя цветовая схема", ok: false },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    subtitle: "Для продуктивных людей",
    icon: Rocket,
    price: "349",
    period: "мес",
    gradient: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-200 dark:border-violet-800",
    popular: true,
    btnClass:
      "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25",
    features: [
      { label: "Доски (личное)", ok: true, detail: "до 20 шт." },
      { label: "Доски (команда)", ok: true, detail: "до 20 шт." },
      { label: "Задачи", ok: true, detail: "без лимита" },
      { label: "Счета", ok: true, detail: "до 15 шт." },
      { label: "Транзакции", ok: true, detail: "до 500 / мес" },
      { label: "Планирование бюджета", ok: true },
      { label: "Финансовая подушка", ok: true },
      { label: "Обязательства", ok: true },
      { label: "Проекты и цели", ok: true },
      { label: "Привычки", ok: true, detail: "15 шт." },
      { label: "Достижения", ok: true },
      { label: "AI-помощник", ok: true, detail: "до 30 запросов/день" },
      { label: "Командные доски", ok: true, detail: "до 5 участников" },
      { label: "Экспорт данных", ok: true },
      { label: "Подробный дашборд по финансам", ok: false },
      { label: "Расписание привычек", ok: false },
      { label: "Интеграции", ok: false, detail: "Telegram" },
      { label: "Своя цветовая схема", ok: false },
      { label: "Музыкальные треки", ok: false },
      { label: "Кастомные настройки разделов", ok: false },
    ],
  },
  {
    id: "apex",
    name: "APEX",
    subtitle: "Максимум возможностей",
    icon: Crown,
    price: "549",
    period: "мес",
    gradient: "from-amber-500/10 to-yellow-500/5",
    border: "border-amber-200 dark:border-amber-800",
    btnClass:
      "bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-500/25",
    features: [
      { label: "Доски (личное)", ok: true, detail: "без лимита" },
      { label: "Доски (команда)", ok: true, detail: "без лимита" },
      { label: "Задачи", ok: true, detail: "без лимита" },
      { label: "Счета", ok: true, detail: "без лимита" },
      { label: "Транзакции", ok: true, detail: "без лимита" },
      { label: "Планирование бюджета", ok: true },
      { label: "Финансовая подушка", ok: true },
      { label: "Обязательства", ok: true },
      { label: "Подробный дашборд по финансам", ok: true },
      { label: "Проекты и цели", ok: true },
      { label: "Привычки", ok: true, detail: "без лимита" },
      { label: "Достижения", ok: true },
      { label: "Расписание привычек", ok: true },
      { label: "AI-помощник", ok: true, detail: "без лимита" },
      { label: "Командные доски", ok: true, detail: "до 100 участников" },
      { label: "Экспорт данных", ok: true, detail: "CSV, PDF" },
      { label: "Интеграции", ok: true, detail: "Telegram" },
      { label: "Своя цветовая схема", ok: true },
      { label: "Музыкальные треки", ok: true },
      { label: "Кастомные настройки разделов", ok: true },
    ],
  },
];

export default function TariffsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>На главную</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Выберите тариф
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Все тарифы включают базовый функционал. С ростом потребностей —
            расширяйте возможности.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg",
                  "bg-gradient-to-b",
                  tier.gradient,
                  tier.border,
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-[10px] font-semibold text-white tracking-wider shadow-lg">
                    ПОПУЛЯРНЫЙ
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      tier.id === "basic" && "bg-muted-foreground/10",
                      tier.id === "pro" && "bg-violet-500/10",
                      tier.id === "apex" && "bg-amber-500/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        tier.id === "basic" && "text-muted-foreground",
                        tier.id === "pro" && "text-violet-600",
                        tier.id === "apex" && "text-amber-600",
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{tier.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {tier.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    ₽ / {tier.period}
                  </span>
                </div>

                <button
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-6",
                    tier.btnClass,
                  )}
                >
                  {tier.price === "0" ? "Начать бесплатно" : "Выбрать"}
                </button>

                <div className="space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5">
                      {f.ok ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          f.ok
                            ? "text-foreground/90"
                            : "text-muted-foreground/40",
                        )}
                      >
                        {f.label}
                        {f.detail && f.ok && (
                          <span className="text-muted-foreground/60 ml-1">
                            · {f.detail}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12 text-xs text-muted-foreground/50">
          <p>
            Все цены указаны с учётом НДС. Можно отменить подписку в любой
            момент.
          </p>
        </div>
      </div>
    </div>
  );
}
