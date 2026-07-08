"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  SkipForward,
  Flame,
  Target,
  TrendingUp,
  Dumbbell,
  BookOpen,
  Brain,
  DollarSign,
  Users,
  Briefcase,
  MoreHorizontal,
} from "lucide-react";
import type {
  Habit,
  HabitLog,
  HabitCategory,
  WeeklyChartData,
  HabitLogStatus,
} from "@/lib/habits-types";
import { getCategoryLabel } from "@/lib/habits-types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_ICONS: Record<HabitCategory, typeof Dumbbell> = {
  health: Dumbbell,
  work: Briefcase,
  education: BookOpen,
  finance: DollarSign,
  relationships: Users,
  "self-development": Brain,
  other: MoreHorizontal,
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isPlannedToday(habit: Habit): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();

  switch (habit.frequency.type) {
    case "daily":
      return true;
    case "weekly":
      return habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
    case "scheduled": {
      const created = new Date(habit.createdAt);
      const diffDays = Math.floor(
        (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays % (habit.frequency.intervalDays ?? 1) === 0;
    }
    case "time":
      return true;
    default:
      return true;
  }
}

function computeStreak(habitId: string, logs: HabitLog[]): number {
  let streak = 0;
  const sorted = logs
    .filter((l) => l.habitId === habitId)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const log of sorted) {
    if (log.status === "done") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: typeof Flame;
  subtitle?: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TodayProgressCircle({ percentage }: { percentage: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="h-16 w-16 sm:h-20 sm:w-20 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/30"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={
            percentage >= 80
              ? "text-emerald-500"
              : percentage >= 50
                ? "text-amber-500"
                : "text-red-500"
          }
        />
      </svg>
      <span className="text-xl sm:text-2xl font-bold">{percentage}%</span>
      <span className="text-xs text-muted-foreground">выполнено</span>
    </div>
  );
}

function WeeklyChart({ data }: { data: WeeklyChartData[] }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end justify-between gap-1 sm:gap-2 h-24 sm:h-32 pt-2">
      {data.map((day) => {
        const height = (day.completed / maxVal) * 100;
        return (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {day.completed}
            </span>
            <div className="w-full h-full flex items-end">
              <div
                className={cn(
                  "w-full rounded-t-sm transition-all",
                  day.completed === day.total && day.total > 0
                    ? "bg-emerald-500"
                    : day.completed > 0
                      ? "bg-amber-400"
                      : "bg-muted/40",
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {day.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HabitRow({
  habit,
  log,
  onToggle,
}: {
  habit: Habit;
  log?: HabitLog;
  onToggle: (habitId: string, status: HabitLogStatus) => void;
}) {
  const currentStatus = log?.status;
  const Icon = CATEGORY_ICONS[habit.category];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        currentStatus === "done"
          ? "bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/50"
          : currentStatus === "skipped"
            ? "bg-amber-500/5 border-amber-200 dark:border-amber-800/50"
            : "bg-card border-border/50 hover:border-border",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{habit.name}</p>
        <p className="text-xs text-muted-foreground">
          {getCategoryLabel(habit)}
          {habit.timeMinutes && ` · ${habit.timeMinutes} мин`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {currentStatus === "done" ? (
          <button
            onClick={() => onToggle(habit.id, "missed")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
            title="Отменить"
          >
            <CheckCircle2 className="h-5 w-5" />
          </button>
        ) : (
          <>
            <button
              onClick={() => onToggle(habit.id, "done")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                currentStatus === "skipped"
                  ? "text-amber-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                  : "text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-500/10",
              )}
              title="Выполнить"
            >
              <Circle className="h-5 w-5" />
            </button>
            <button
              onClick={() => onToggle(habit.id, "skipped")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                currentStatus === "skipped"
                  ? "bg-amber-500/10 text-amber-600"
                  : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10",
              )}
              title="Пропустить"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface HabitsDashboardProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggleLog: (habitId: string, status: HabitLogStatus) => void;
}

export function HabitsDashboard({
  habits,
  logs,
  onToggleLog,
}: HabitsDashboardProps) {
  const today = getToday();

  const activeHabits = useMemo(
    () => habits.filter((h) => h.status === "active"),
    [habits],
  );

  const todayHabits = useMemo(
    () =>
      activeHabits
        .filter(isPlannedToday)
        .map((h) => ({
          habit: h,
          log: logs.find((l) => l.habitId === h.id && l.date === today),
        })),
    [activeHabits, logs, today],
  );

  const doneToday = todayHabits.filter(
    (th) => th.log?.status === "done",
  ).length;
  const totalPlanned = todayHabits.length;
  const percentage =
    totalPlanned > 0 ? Math.round((doneToday / totalPlanned) * 100) : 0;

  const bestStreak = useMemo(
    () => Math.max(...habits.map((h) => computeStreak(h.id, logs)), 0),
    [habits, logs],
  );

  const weeklyData = useMemo((): WeeklyChartData[] => {
    const today = new Date();
    const data: WeeklyChartData[] = [];
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = logs.filter((l) => l.date === dateStr);
      const total = activeHabits.length;
      const completed = dayLogs.filter((l) => l.status === "done").length;

      data.push({
        day: days[6 - i],
        date: dateStr,
        completed,
        total,
      });
    }

    return data;
  }, [activeHabits, logs]);

  const lastWeekDone = weeklyData.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Всего привычек"
          value={activeHabits.length}
          icon={Target}
        />
        <StatCard
          title="Выполнено сегодня"
          value={`${doneToday}/${totalPlanned}`}
          icon={CheckCircle2}
          subtitle={
            totalPlanned > 0
              ? `${((doneToday / totalPlanned) * 100).toFixed(0)}%`
              : undefined
          }
        />
        <StatCard
          title="Текущая цепочка"
          value={`${bestStreak} ${bestStreak === 1 ? "день" : bestStreak < 5 ? "дня" : "дней"}`}
          icon={Flame}
        />
        <StatCard
          title="За неделю"
          value={`${lastWeekDone} шт`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-center">
            <TodayProgressCircle percentage={percentage} />
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
            <CardTitle className="text-sm font-medium">
              Прогресс за неделю
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <WeeklyChart data={weeklyData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
          <CardTitle className="text-sm font-medium">На сегодня</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 space-y-2">
          {todayHabits.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Target className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm">На сегодня нет запланированных привычек</p>
              <p className="text-xs text-muted-foreground/60">
                Добавьте привычки во вкладке «Мои привычки»
              </p>
            </div>
          ) : (
            todayHabits.map((th) => (
              <HabitRow
                key={th.habit.id}
                habit={th.habit}
                log={th.log}
                onToggle={onToggleLog}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
