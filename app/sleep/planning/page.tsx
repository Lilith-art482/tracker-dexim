"use client";

import { useState, useMemo } from "react";
import {
  Moon,
  Sun,
  Clock,
  Timer,
  Zap,
  ChevronDown,
  ChevronUp,
  Coffee,
  ShieldCheck,
  Leaf,
  Thermometer,
  Smartphone,
  BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SleepChatInline from "@/components/sleep/sleep-chat";

const CYCLE_MINUTES = 90;
const DEFAULT_FALL_ASLEEP = 20;

type Mode = "sleep" | "wake";

interface CycleResult {
  time: string;
  cycles: number;
  duration: string;
  quality: "optimal" | "good" | "okay" | "short";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60000);
}

function getQualityLabel(cycles: number): CycleResult["quality"] {
  if (cycles >= 5 && cycles <= 6) return "optimal";
  if (cycles >= 4 && cycles <= 7) return "good";
  if (cycles === 3) return "okay";
  return "short";
}

function getQualityColor(quality: CycleResult["quality"]): string {
  switch (quality) {
    case "optimal":
      return "text-primary bg-primary/5 border-primary/30 dark:text-primary dark:bg-primary/10 dark:border-primary/20";
    case "good":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20";
    case "okay":
      return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    case "short":
      return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
  }
}

function getQualityText(quality: CycleResult["quality"]): string {
  switch (quality) {
    case "optimal":
      return "Идеально";
    case "good":
      return "Хорошо";
    case "okay":
      return "Нормально";
    case "short":
      return "Маловато";
  }
}

function getRecommendation(cycles: number): string {
  if (cycles >= 5 && cycles <= 6)
    return "Оптимальное количество циклов для здорового сна. Вы проснетесь отдохнувшим!";
  if (cycles === 7)
    return "Много сна — хорошо, но может возникнуть сонливость днём. Нормально для восстановления.";
  if (cycles === 4)
    return "Достаточно для работоспособности, но старайтесь спать больше при возможности.";
  if (cycles === 3)
    return "Маловато — возможно усталость. Попробуйте лечь пораньше завтра.";
  if (cycles <= 2)
    return "Критически мало сна! Постарайтесь выспаться сегодня.";
  return "Отличный выбор! 5-6 циклов — золотой стандарт сна.";
}

function generateCycles(
  baseDate: Date,
  fallAsleep: number,
  mode: Mode
): CycleResult[] {
  const results: CycleResult[] = [];
  for (let c = 1; c <= 7; c++) {
    const totalMinutes = fallAsleep + c * CYCLE_MINUTES;
    const time =
      mode === "sleep"
        ? subtractMinutes(baseDate, totalMinutes)
        : addMinutes(baseDate, totalMinutes);
    const hours = Math.floor((c * CYCLE_MINUTES) / 60);
    const mins = (c * CYCLE_MINUTES) % 60;
    results.push({
      time: formatTime(time),
      cycles: c,
      duration: `${hours}ч${mins > 0 ? ` ${mins}мин` : ""}`,
      quality: getQualityLabel(c),
    });
  }
  return results;
}

function SleepClock({ time, quality }: { time: string; quality: string }) {
  const [h, m] = time.split(":").map(Number);
  const hourAngle = ((h % 12) / 12) * 360 + (m / 60) * 30;
  const minuteAngle = (m / 60) * 360;

  const colorClass =
    quality === "optimal"
      ? "text-primary"
      : quality === "good"
        ? "text-blue-500"
        : quality === "okay"
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 32 + 26 * Math.sin(angle);
          const y1 = 32 - 26 * Math.cos(angle);
          const x2 = 32 + (i % 3 === 0 ? 22 : 24) * Math.sin(angle);
          const y2 = 32 - (i % 3 === 0 ? 22 : 24) * Math.cos(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? 2 : 1}
              className="text-muted-foreground/40"
            />
          );
        })}
        <line
          x1="32"
          y1="32"
          x2={32 + 13 * Math.sin((hourAngle * Math.PI) / 180)}
          y2={32 - 13 * Math.cos((hourAngle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={colorClass}
        />
        <line
          x1="32"
          y1="32"
          x2={32 + 18 * Math.sin((minuteAngle * Math.PI) / 180)}
          y2={32 - 18 * Math.cos((minuteAngle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-muted-foreground"
        />
        <circle
          cx="32"
          cy="32"
          r="2"
          fill="currentColor"
          className="text-foreground"
        />
      </svg>
    </div>
  );
}

const TIPS = [
  {
    icon: ShieldCheck,
    title: "Режим сна",
    text: "Ложитесь и вставайте в одно и то же время — даже в выходные. Организм привыкает и засыпает быстрее.",
    color: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-500",
  },
  {
    icon: Smartphone,
    title: "Экраны",
    text: "За час до сна выключите экраны или включите ночной режим. Синий свет подавляет мелатонин.",
    color: "from-violet-500/10 to-violet-500/5",
    iconColor: "text-violet-500",
  },
  {
    icon: Thermometer,
    title: "Температура",
    text: "Комнатная температура 18-20°C — идеальна для засыпания. Тёплая ванна за 2 часа до сна помогает.",
    color: "from-rose-500/10 to-rose-500/5",
    iconColor: "text-rose-500",
  },
  {
    icon: Coffee,
    title: "Кофеин",
    text: "Кофеин выводится за 6-8 часов. Последний кофе — до 14:00. Чай, кола и шоколад тоже считаются.",
    color: "from-amber-500/10 to-amber-500/5",
    iconColor: "text-amber-500",
  },
  {
    icon: Leaf,
    title: "Расслабление",
    text: "Дыхательная техника 4-7-8: вдох 4 сек, задержка 7 сек, выдох 8 сек. Повторите 3-4 раза.",
    color: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-primary",
  },
  {
    icon: BedDouble,
    title: "Кровать",
    text: "Кровать — только для сна и интима. Не работайте и не смотрите видео в постели — мозг должен ассоциировать её со сном.",
    color: "from-indigo-500/10 to-indigo-500/5",
    iconColor: "text-indigo-500",
  },
];

export default function SleepPlanningPage() {
  const [mode, setMode] = useState<Mode>("sleep");
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("00");
  const [fallAsleep, setFallAsleep] = useState<string>(
    String(DEFAULT_FALL_ASLEEP)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);

  const now = useMemo(() => new Date(), []);

  const baseTime = useMemo(() => {
    const d = new Date(now);
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (!isNaN(h) && h >= 0 && h <= 23) d.setHours(h, isNaN(m) ? 0 : m, 0, 0);
    return d;
  }, [hours, minutes, now]);

  const fa = parseInt(fallAsleep, 10) || DEFAULT_FALL_ASLEEP;

  const cycles = useMemo(() => {
    if (!hours) return [];
    return generateCycles(baseTime, fa, mode);
  }, [baseTime, fa, mode]);

  const bestCycle = cycles.find((c) => c.quality === "optimal");
  const recommended = cycles.find(
    (c) => c.quality === "optimal" || c.quality === "good"
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 pb-8">
      <div className="flex-[2] min-w-0 space-y-5 sm:space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/10 p-4 sm:p-6">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-yellow-400/50 star"
                style={{
                  left: `${12 + i * 15}%`,
                  top: `${18 + (i % 3) * 22}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <h2 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2">
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Калькулятор сна
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Узнайте лучшее время для сна или подъёма по циклам сна
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setMode("sleep");
              setSelectedCycle(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all",
              mode === "sleep"
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Moon className="h-4 w-4" />
            Когда лечь?
          </button>
          <button
            onClick={() => {
              setMode("wake");
              setSelectedCycle(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all",
              mode === "wake"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="h-4 w-4" />
            Когда встать?
          </button>
        </div>

        <div className="bg-card rounded-2xl border p-4 sm:p-5 space-y-3">
          <label className="text-xs sm:text-sm font-medium text-muted-foreground">
            {mode === "sleep"
              ? "Во сколько хотите встать?"
              : "Во сколько легли / хотите лечь?"}
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 23))
                  setHours(v);
              }}
              placeholder="чч"
              className="w-16 h-14 sm:w-20 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-muted/50 rounded-xl border-2 border-transparent focus:border-primary/50 focus:bg-primary/5 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground animate-pulse">
              :
            </span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 59))
                  setMinutes(v);
              }}
              placeholder="мм"
              className="w-16 h-14 sm:w-20 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-muted/50 rounded-xl border-2 border-transparent focus:border-primary/50 focus:bg-primary/5 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-3 sm:p-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Время на засыпание
              <span className="text-[10px] sm:text-xs bg-muted px-2 py-0.5 rounded-full">
                {fa} мин
              </span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-2">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={fallAsleep}
                onChange={(e) => setFallAsleep(e.target.value)}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>5 мин</span>
                <span className="font-medium text-foreground">{fa} мин</span>
                <span>60 мин</span>
              </div>
            </div>
          )}
        </div>

        {cycles.length > 0 && recommended && (
          <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl border border-emerald-500/10 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium mb-0.5">
                  Рекомендация: {recommended.cycles}{" "}
                  {recommended.cycles > 1 ? "цикла" : "цикл"} — {recommended.time}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {getRecommendation(recommended.cycles)}
                </p>
              </div>
            </div>
          </div>
        )}

        {cycles.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            {mode === "sleep"
              ? "Лечь в... — встать в указанное время"
              : "Лечь сейчас — встать в..."}
            </h3>

            <div className="grid gap-2">
              {cycles.map((cycle) => {
                const isSelected = selectedCycle === cycle.cycles;
                const isRecommended = bestCycle?.cycles === cycle.cycles;
                return (
                  <button
                    key={cycle.cycles}
                    onClick={() =>
                      setSelectedCycle(isSelected ? null : cycle.cycles)
                    }
                    className={cn(
                      "relative flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all text-left",
                      isSelected
                        ? "bg-primary/5 border-emerald-500/30 shadow-sm"
                        : "bg-card hover:bg-muted/50 border-border",
                      isRecommended && !isSelected && "ring-1 ring-primary/20"
                    )}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 left-3 bg-primary text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ЛУЧШЕ
                      </div>
                    )}

                    <SleepClock time={cycle.time} quality={cycle.quality} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold tabular-nums">
                          {cycle.time}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                            getQualityColor(cycle.quality)
                          )}
                        >
                          {getQualityText(cycle.quality)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                        <span className="text-[11px] sm:text-xs text-muted-foreground">
                          {cycle.cycles}{" "}
                          {cycle.cycles > 1 ? "цикла" : "цикл"}
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground">
                          {cycle.duration}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!hours && (
          <div className="text-center py-10 sm:py-12 space-y-3">
            <div className="text-4xl sm:text-5xl mb-2 float-anim">🌙</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Укажите время, чтобы увидеть расчёт по циклам сна
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-500" />
            Советы для здорового сна
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {TIPS.map((tip) => (
              <div
                key={tip.title}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 bg-gradient-to-br",
                  tip.color
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 shrink-0",
                      tip.iconColor
                    )}
                  >
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-0.5">
                      {tip.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-[300px] lg:sticky lg:top-[10rem] lg:self-start lg:h-[calc(100vh-12rem)]">
        <SleepChatInline />
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .star {
          animation: twinkle 3s ease-in-out infinite;
        }
        .float-anim {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
