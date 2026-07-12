"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Trophy,
  Percent,
  CalendarDays,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { Habit, HabitLog } from "@/lib/habit-types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  MOTIVATIONAL_QUOTES,
} from "@/lib/habit-types";
import { useHabits } from "@/components/habits/habits-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function DonutChart({
  percentage,
  size = 64,
  strokeWidth = 6,
  color = "#4E6E62",
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
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
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
  const { todayHabits, stats, loading, toggleHabit } = useHabits();
  const [quote] = useState(
    () =>
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ],
  );

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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ListChecks}
          label="Активных привычек"
          value={stats.total}
          color="text-primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Выполнено сегодня"
          value={`${stats.doneToday} / ${stats.plannedToday}`}
          color="text-emerald-500"
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
          <CardContent className="flex items-center justify-center">
            <DonutChart percentage={stats.completionPercent} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              На сегодня
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
          {todayHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              На сегодня привычек нет
            </p>
          ) : (
            todayHabits.map(({ habit, log }) => {
              const isDone = log?.status === "done";
              const isSkipped = log?.status === "skipped";
              const colorClass = isDone
                ? "text-emerald-500"
                : isSkipped
                  ? "text-yellow-500"
                  : "";
              const bgClass = isDone
                ? "bg-emerald-500/5"
                : isSkipped
                  ? "bg-yellow-500/5"
                  : "";
              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-colors",
                    bgClass,
                  )}
                >
                  <button
                    onClick={() => handleToggleStatus(habit.id, log)}
                    className={cn(
                      "shrink-0 transition-colors",
                      isDone
                        ? "text-emerald-500"
                        : "text-muted-foreground/50 hover:text-emerald-500",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isDone && "line-through text-muted-foreground",
                      )}
                    >
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {CATEGORY_LABELS[habit.category]}
                      </Badge>
                      {habit.durationMinutes && (
                        <span className="text-xs text-muted-foreground">
                          {habit.durationMinutes} мин
                        </span>
                      )}
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

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {quote}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
