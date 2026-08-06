"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Trophy,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Plus,
  Flame,
} from "lucide-react";
import type { HabitLog } from "@/lib/habit-types";
import { CATEGORY_LABELS, MOTIVATIONAL_QUOTES } from "@/lib/habit-types";
import { CATEGORY_ICONS, CATEGORY_ACCENTS } from "@/lib/habit-category-ui";
import { getFrequencyLabel } from "@/lib/habit-category-ui";
import { calculateStreak } from "@/lib/habit-utils";
import { useHabits } from "@/components/habits/habits-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HabitDialog } from "@/components/habits/module-habit-dialog";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function getTodayLabel(): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className={cn("h-4 w-4", color)} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface TodayProgressCardProps {
  done: number;
  planned: number;
}

function TodayProgressCard({ done, planned }: TodayProgressCardProps) {
  const pct = planned > 0 ? Math.round((done / planned) * 100) : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Выполнено сегодня
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold text-emerald-500">
          {done}
          <span className="text-sm font-medium text-muted-foreground">
            {" "}
            / {planned}
          </span>
        </p>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {planned > 0 && (
          <p className="text-xs text-muted-foreground">{pct}% дня закрыто</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function DonutChart({
  percentage,
  size = 64,
  strokeWidth = 6,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-primary transition-all duration-700"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-current text-xs font-bold"
      >
        {percentage}%
      </text>
    </svg>
  );
}

interface BarChartProps {
  data: { day: string; done: number; total: number }[];
  height?: number;
}

function BarChart({ data, height = 120 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.total / max) * 100;
        const donePct = d.total > 0 ? (d.done / d.total) * 100 : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="relative w-full rounded-t-sm"
              style={{ height: `${Math.max(pct, 4)}%`, minHeight: 16 }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-primary/20"
                style={{ height: "100%" }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-primary transition-all duration-500"
                style={{ height: `${donePct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ModuleDashboardProps {
  onNavigate?: () => void;
}

export function ModuleDashboard({ onNavigate }: ModuleDashboardProps) {
  const { todayHabits, stats, logs, loading, toggleHabit, refresh } =
    useHabits();
  const [quote] = useState(
    () =>
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ],
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const greeting = useMemo(() => getGreeting(), []);
  const todayLabel = useMemo(() => getTodayLabel(), []);

  const sortedToday = useMemo(() => {
    return [...todayHabits].sort((a, b) => {
      const aDone = a.log?.status === "done" || a.log?.status === "skipped";
      const bDone = b.log?.status === "done" || b.log?.status === "skipped";
      return Number(aDone) - Number(bDone);
    });
  }, [todayHabits]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleStatus = async (habitId: string, currentLog?: HabitLog) => {
    if (currentLog?.status === "done") {
      await toggleHabit(habitId, "missed");
    } else {
      await toggleHabit(habitId, "done");
    }
  };

  const handleSkip = async (habitId: string) => {
    await toggleHabit(habitId, "skipped");
  };

  const handleSaved = () => {
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold capitalize">{greeting}!</h3>
          <p className="text-xs text-muted-foreground/80 mt-0.5 capitalize">
            {todayLabel}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Добавить привычку
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ListChecks}
          label="Активных привычек"
          value={stats.total}
          color="text-primary"
        />
        <TodayProgressCard
          done={stats.doneToday}
          planned={stats.plannedToday}
        />
        <StatCard
          icon={Trophy}
          label="Лучший стрик"
          value={`${stats.bestStreak} дн.`}
          color="text-amber-500"
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Выполнение
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-1">
            <DonutChart percentage={stats.completionPercent} />
            <p className="text-[10px] text-muted-foreground">
              среднее за 30 дней
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              На сегодня
              {sortedToday.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
                  {sortedToday.filter((t) => t.log?.status === "done").length}/
                  {sortedToday.length}
                </span>
              )}
            </CardTitle>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigate}
                className="gap-1 text-xs"
              >
                Все привычки
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                На сегодня привычек нет
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="gap-1.5 mt-1"
              >
                <Plus className="h-4 w-4" />
                Создать привычку
              </Button>
            </div>
          ) : (
            sortedToday.map(({ habit, log }) => {
              const isDone = log?.status === "done";
              const isSkipped = log?.status === "skipped";
              const accent = CATEGORY_ACCENTS[habit.category];
              const CategoryIcon = CATEGORY_ICONS[habit.category];
              const streak = calculateStreak(habit.id, logs);

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300",
                    isDone
                      ? "border-emerald-500/15 bg-emerald-500/5"
                      : isSkipped
                        ? "border-yellow-500/15 bg-yellow-500/5"
                        : "border-foreground/5 bg-card hover:border-foreground/15",
                  )}
                >
                  <button
                    onClick={() => handleToggleStatus(habit.id, log)}
                    className={cn(
                      "shrink-0 transition-all",
                      isDone
                        ? "text-emerald-500"
                        : "text-muted-foreground/50 hover:text-emerald-500 hover:scale-110",
                    )}
                    title={isDone ? "Отметить как невыполненную" : "Выполнить"}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                      accent.soft,
                    )}
                  >
                    <CategoryIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isDone && "line-through text-muted-foreground",
                      )}
                    >
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{CATEGORY_LABELS[habit.category]}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="truncate">
                        {getFrequencyLabel(habit)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isDone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(habit.id, log)}
                        className="h-7 px-2 text-xs"
                      >
                        Выполнить
                      </Button>
                    )}
                    {!isSkipped && !isDone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkip(habit.id)}
                        className="h-7 px-2 text-xs text-muted-foreground"
                      >
                        Пропустить
                      </Button>
                    )}
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Flame className="h-3 w-3" />
                        {streak}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-primary" />
            Прогресс за неделю
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={stats.weeklyProgress} />
        </CardContent>
      </Card>

      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm text-foreground/80 italic leading-relaxed">
            «{quote}»
          </p>
        </div>
      </div>

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
