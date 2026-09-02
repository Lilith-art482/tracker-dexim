"use client";

import { useState } from "react";
import {
  Timer,
  Waves,
  CalendarClock,
  ListChecks,
  TreePine,
  Sprout,
  Play,
  Pause,
  RotateCcw,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSectionVisibility } from "@/lib/section-visibility-context";

const ALL_MODES = [
  {
    id: "pomodoro",
    label: "Pomodoro",
    icon: Timer,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    duration: 25,
    comingSoon: false,
    description:
      "25 минут работы → 5 минут перерыва. После 4 циклов — длинный перерыв 15–30 минут.",
    benefit:
      "Когда трудно начать или держать внимание. Структурированные интервалы снимают тревогу и помогают войти в поток.",
  },
  {
    id: "ultradian",
    label: "Ultradian",
    icon: Waves,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    duration: 90,
    comingSoon: false,
    description:
      "90 минут глубокой работы → 20 минут восстановления. Базируется на естественных циклах мозга.",
    benefit:
      "Для долгих периодов deep work. Позволяет достичь максимальной глубины концентрации без выгорания.",
  },
  {
    id: "timeboxing",
    label: "Timeboxing",
    icon: CalendarClock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    duration: 0,
    comingSoon: false,
    description:
      "Заранее выделяешь конкретный временной блок на задачу. Когда время вышло — задача закрывается.",
    benefit:
      "Планирование дня и борьба с перфекционизмом. Заранее выделяешь конкретный временной блок на задачу.",
  },
  {
    id: "1-3-5",
    label: "1–3–5",
    icon: ListChecks,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    duration: 0,
    comingSoon: false,
    description:
      "За день: 1 большая задача + 3 средних + 5 маленьких. Фиксированный объём задач на день.",
    benefit:
      "Когда проблема скорее в перегруженном списке дел. Чёткая структура предотвращает прокрастинацию.",
  },
  {
    id: "farm",
    label: "Ферма",
    icon: Sprout,
    color: "text-lime-500",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    duration: 25,
    comingSoon: true,
    description:
      "Выращивай виртуальную ферму: пока ты работаешь — растёт урожай. Пауза — и поля сохнут.",
    benefit:
      "Геймификация фокуса. Визуальный мотиватор, который делает концентрацию наглядной и весёлой.",
  },
  {
    id: "forest",
    label: "Лес",
    icon: TreePine,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    duration: 25,
    comingSoon: true,
    description:
      "Сажай деревья во время работы. Каждый завершённый таймер — новое дерево в твоём лесу.",
    benefit:
      "Мотивация через накопление. Чем дольше фокус — тем красивее и гуще твой виртуальный лес.",
  },
] as const;

type ModeId = (typeof ALL_MODES)[number]["id"];

function PomodoroTimer({ duration }: { duration: number }) {
  const [seconds, setSeconds] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const total = duration * 60;
  const pct = total > 0 ? seconds / total : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border/30"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={2 * Math.PI * 54 * (1 - pct)}
            className="text-primary transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-mono font-bold text-foreground">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setRunning(!running)}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Пауза" : "Старт"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => { setRunning(false); setSeconds(total); }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Сброс
        </Button>
      </div>
    </div>
  );
}

export default function FocusingPage() {
  const [active, setActive] = useState<ModeId>("pomodoro");
  const { isSubVisible } = useSectionVisibility();
  const MODES = ALL_MODES.filter((m) => isSubVisible("focusing", m.id));
  const mode = MODES.find((m) => m.id === active) || MODES[0];

  return (
    <div className="min-h-screen">
      <div className="sticky top-14 z-40 bg-background border-b border-border/40">
        <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 sm:px-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => !m.comingSoon && setActive(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                active === m.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                m.comingSoon && "opacity-50 cursor-not-allowed",
              )}
            >
              <m.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{m.label}</span>
              {m.comingSoon && (
                <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full ml-1 hidden sm:inline">
                  Скоро
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-[900px] mx-auto">
        <div className={cn(
          "rounded-2xl border bg-card p-6 sm:p-8",
          mode.border,
        )}>
          <div className="flex items-start gap-4 mb-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", mode.bg)}>
              <mode.icon className={cn("h-6 w-6", mode.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">{mode.label}</h1>
                {mode.comingSoon && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    В разработке
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 border border-border/30 p-5 mb-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className={cn("font-semibold", mode.color)}>Польза: </span>
              {mode.benefit}
            </p>
          </div>

          {!mode.comingSoon && mode.duration > 0 && (
            <div className="rounded-xl bg-muted/20 border border-border/20 p-6">
              <PomodoroTimer duration={mode.duration} />
            </div>
          )}

          {!mode.comingSoon && mode.duration === 0 && (
            <div className="rounded-xl bg-muted/20 border border-border/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Таймер будет доступен после настройки задач на день.
              </p>
              <Button className="mt-4 gap-2" size="sm">
                <Play className="h-3.5 w-3.5" />
                Настроить задачи
              </Button>
            </div>
          )}

          {mode.comingSoon && (
            <div className="rounded-xl bg-muted/20 border border-border/20 p-8 text-center">
              <mode.icon className={cn("h-10 w-10 mx-auto mb-3 opacity-30", mode.color)} />
              <p className="text-sm text-muted-foreground">
                Режим в разработке. Следите за обновлениями.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
