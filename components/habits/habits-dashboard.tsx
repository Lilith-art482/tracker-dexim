"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  SkipForward,
  Flame,
  Target,
  TrendingUp,
  Heart,
  BookOpen,
  Brain,
  Dumbbell,
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
import { CATEGORY_LABELS } from "@/lib/habits-types";
import { mockHabits, mockHabitLogs } from "@/lib/habits-mock";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_ICONS: Record<HabitCategory, typeof Heart> = {
  health: Dumbbell,
  work: Briefcase,
  education: BookOpen,
  finance: DollarSign,
  relationships: Users,
  "self-development": Brain,
  other: MoreHorizontal,
};

const QUOTES = [
  "Посев привычки — рост характера. Пожинаешь привычку — пожинаешь судьбу.",
  "Мы — это то, что мы делаем постоянно. Совершенство — не действие, а привычка.",
  "Привычка — это канат: мы плетём его каждый день, и в конце концов его не разорвать.",
  "Сначала мы формируем привычки, а потом привычки формируют нас.",
  "Маленькие ежедневные улучшения приводят к впечатляющим результатам.",
  "Вы уже на {days} дней лучше, чем в прошлом месяце!",
];

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

function computeWeeklyData(): WeeklyChartData[] {
  const today = new Date();
  const data: WeeklyChartData[] = [];
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = mockHabitLogs.filter((l) => l.date === dateStr);
    const total = mockHabits.filter((h) => h.status === "active").length;
    const completed = dayLogs.filter((l) => l.status === "done").length;

    data.push({
      day: days[6 - i],
      date: dateStr,
      completed,
      total,
    });
  }

  return data;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  icon: typeof Heart;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
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
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  trend.positive ? "text-emerald-600" : "text-red-500",
                )}
              >
                <TrendingIcon up={trend.positive} />
                {trend.value}% {trend.positive ? "лучше" : "хуже"}
              </p>
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

function TrendingIcon({ up }: { up: boolean }) {
  return (
    <svg
      className={cn("h-3 w-3", up ? "text-emerald-600" : "text-red-500")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {up ? (
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      ) : (
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      )}
      <polyline points="17 6 23 6 23 12" />
    </svg>
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
          {CATEGORY_LABELS[habit.category]}
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

export function HabitsDashboard() {
  const [habits] = useState<Habit[]>(
    mockHabits.filter((h) => h.status === "active"),
  );
  const [logs, setLogs] = useState<HabitLog[]>(mockHabitLogs);
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const today = getToday();

  const todayHabits = useMemo(
    () =>
      habits
        .filter(isPlannedToday)
        .map((h) => ({
          habit: h,
          log: logs.find((l) => l.habitId === h.id && l.date === today),
        })),
    [habits, logs, today],
  );

  const doneToday = todayHabits.filter(
    (th) => th.log?.status === "done",
  ).length;
  const totalPlanned = todayHabits.length;
  const percentage = totalPlanned > 0 ? Math.round((doneToday / totalPlanned) * 100) : 0;

  const bestStreak = useMemo(
    () => Math.max(...habits.map((h) => computeStreak(h.id, logs)), 0),
    [habits, logs],
  );

  const weeklyData = useMemo(() => computeWeeklyData(), []);

  const lastWeekDone = weeklyData.slice(0, -1).reduce((s, d) => s + d.completed, 0);
  const prevWeekDone = 18; // mock comparison
  const trendValue =
    prevWeekDone > 0
      ? Math.round(((lastWeekDone - prevWeekDone) / prevWeekDone) * 100)
      : 0;

  const handleToggle = (habitId: string, status: HabitLogStatus) => {
    setLogs((prev) => {
      const existing = prev.findIndex(
        (l) => l.habitId === habitId && l.date === today,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status };
        return updated;
      }
      return [
        ...prev,
        {
          id: `log-${habitId}-${today}`,
          habitId,
          date: today,
          status,
          completedAt: status === "done" ? new Date().toISOString() : undefined,
        },
      ];
    });
  };

  const quoteText = QUOTES[quoteIndex].replace("{days}", String(bestStreak));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Всего привычек"
          value={habits.length}
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
          trend={
            trendValue !== 0
              ? { value: Math.abs(trendValue), positive: trendValue > 0 }
              : undefined
          }
        />
      </div>

      {/* Today's Progress Circle + Weekly Chart */}
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

      {/* Today's Habits */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
          <CardTitle className="text-sm font-medium">На сегодня</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 space-y-2">
          {todayHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              На сегодня нет запланированных привычек
            </p>
          ) : (
            todayHabits.map((th) => (
              <HabitRow
                key={th.habit.id}
                habit={th.habit}
                log={th.log}
                onToggle={handleToggle}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Motivational Block */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Flame className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-foreground/90 italic">
              {quoteText}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
