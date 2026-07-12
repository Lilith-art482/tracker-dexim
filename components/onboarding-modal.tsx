"use client";

import { useState } from "react";
import {
  X,
  ArrowLeft,
  Calendar,
  DollarSign,
  ListChecks,
  Sparkles,
  LayoutDashboard,
  Table,
  Users,
  BarChart3,
  PiggyBank,
  Target,
  TrendingUp,
  ShieldCheck,
  Trophy,
  Bell,
  MessageCircle,
  Mail,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Sparkles,
    title: "Добро пожаловать в In Motion",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          In Motion — это единое пространство, где встречаются планировщик
          задач, управление финансами и трекинг привычек. Всё в одном месте,
          чтобы ты мог сосредоточиться на главном.
        </p>

        <div className="grid gap-2.5">
          {[
            {
              icon: Calendar,
              label: "Планнер",
              desc: "Задачи, доски, команда",
            },
            { icon: DollarSign, label: "Финансы", desc: "Бюджет, счета, цели" },
            {
              icon: ListChecks,
              label: "Привычки",
              desc: "Ритуалы, серии, статистика",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: Calendar,
    title: "Планнер",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Управляй задачами в удобном формате — один ты или с командой.
        </p>

        <div className="grid gap-3">
          <FeatureRow
            icon={Users}
            title="Личный и командный режимы"
            desc="Переключайся между своими делами и работой в общих досках"
          />
          <FeatureRow
            icon={LayoutDashboard}
            title="Канбан-доски"
            desc="Колонки, карточки, теги, даты — всё для прозрачного процесса"
          />
          <FeatureRow
            icon={Table}
            title="Список и таблица"
            desc="Два представления — выбирай то, в котором удобнее работать"
          />
          <FeatureRow
            icon={BarChart3}
            title="Прогресс и аналитика"
            desc="Видно, сколько сделано и что ещё в работе"
          />
        </div>
      </>
    ),
  },
  {
    icon: DollarSign,
    title: "Финансы",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Держи финансы под контролем: от ежедневных трат до крупных целей.
        </p>

        <div className="grid gap-3">
          <FeatureRow
            icon={TrendingUp}
            title="Доходы и расходы"
            desc="Учитывай каждую операцию по категориям и счетам"
          />
          <FeatureRow
            icon={Target}
            title="Бюджеты и лимиты"
            desc="Задавай лимиты на категории и следи за перерасходом"
          />
          <FeatureRow
            icon={PiggyBank}
            title="Финансовые цели"
            desc="Копи на желания: отпуск, техника, подушка безопасности"
          />
          <FeatureRow
            icon={ShieldCheck}
            title="Проекты и резервы"
            desc="Отдельные бюджеты на проекты и фонд на случайные траты"
          />
        </div>
      </>
    ),
  },
  {
    icon: ListChecks,
    title: "Привычки",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Маленькие шаги каждый день — большие изменения в будущем.
        </p>

        <div className="grid gap-3">
          <FeatureRow
            icon={Trophy}
            title="Трекинг серий"
            desc="Отмечай выполнение и смотри на свою连胜 (streak)"
          />
          <FeatureRow
            icon={BarChart3}
            title="Статистика и графики"
            desc="Наглядные отчёты по каждой привычке за неделю, месяц, год"
          />
          <FeatureRow
            icon={Bell}
            title="Напоминания"
            desc="Не пропускай — напоминания в нужное время"
          />
          <FeatureRow
            icon={Trophy}
            title="Достижения"
            desc="Система ачивок и наград за регулярность"
          />
        </div>
      </>
    ),
  },
];

function FeatureRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("inmotion_onboarding_hidden") !== "true";
    }
    return true;
  });

  function handleClose() {
    setOpen(false);
  }

  function handleDone() {
    handleClose();
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 isolate z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <div
          className={cn(
            "backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden",
            "dark:bg-[#121814]/90 dark:border dark:border-[#4E6E62]/30",
            "bg-white/95 border border-border/60",
          )}
        >
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {current.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">{current.content}</div>
          </div>

          <div
            className={cn(
              "border-t px-6 py-4",
              "dark:border-[#4E6E62]/20 dark:bg-[#0f1411]/40",
              "border-border/60 bg-muted/20",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-primary"
                        : i < step
                          ? "w-1.5 bg-primary/40"
                          : "w-1.5 bg-primary/15"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Назад
                  </button>
                )}
                {isLast ? (
                  <button
                    onClick={handleDone}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4E6E62] to-[#3D554A] px-5 py-2 text-xs font-semibold text-white hover:from-[#5A7A6D] hover:to-[#4E6E62] transition-all shadow-lg shadow-primary/25"
                  >
                    Готово
                  </button>
                ) : (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4E6E62] to-[#3D554A] px-5 py-2 text-xs font-semibold text-white hover:from-[#5A7A6D] hover:to-[#4E6E62] transition-all shadow-lg shadow-primary/25"
                  >
                    Далее
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "border-t px-6 py-3.5",
              "dark:border-[#4E6E62]/15 dark:bg-[#0a0f0d]/50",
              "border-border/60 bg-muted/30",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <MessageCircle className="h-3 w-3" />
                <span>Вопросы и предложения:</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="mailto:In-motion@info.io"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  <span className="hidden sm:inline">In-motion@info.io</span>
                </a>
                <a
                  href="tg://resolve?domain=artyom_medoed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span className="hidden sm:inline">@artyom_medoed</span>
                </a>
                <a
                  href="tg://resolve?domain=inmotion_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span className="hidden sm:inline">@inmotion_bot</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
