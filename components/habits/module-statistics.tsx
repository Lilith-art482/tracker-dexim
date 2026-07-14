"use client";

import { useState, useMemo } from "react";
import type { Habit, HabitLog } from "@/lib/habit-types";
import { CATEGORY_LABELS } from "@/lib/habit-types";
import {
  calculateBestDay,
  calculateWorstDay,
  getCategoryCompletion,
} from "@/lib/habit-utils";
import { cn } from "@/lib/utils";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  TargetIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ModuleStatisticsProps {
  habits: Habit[];
  logs: HabitLog[];
}

function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

function getMonthDays(year: number, month: number): string[] {
  const numDays = new Date(year, month + 1, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= numDays; d++) {
    days.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  return days;
}

function previousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

const CATEGORY_BG_COLORS: Record<string, string> = {
  health: "#10b981",
  work: "#3b82f6",
  education: "#a855f7",
  finance: "#f59e0b",
  relationships: "#f43f5e",
  "self-development": "#06b6d4",
  other: "#6b7280",
};

export function ModuleStatistics({ habits, logs }: ModuleStatisticsProps) {
  const today = todayUTC();
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const monthLogs = useMemo(
    () =>
      logs.filter((l) =>
        l.date.startsWith(
          `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
        ),
      ),
    [logs, currentYear, currentMonth],
  );

  const prev = useMemo(
    () => previousMonth(currentYear, currentMonth),
    [currentYear, currentMonth],
  );
  const prevMonthLogs = useMemo(
    () =>
      logs.filter((l) =>
        l.date.startsWith(
          `${prev.year}-${String(prev.month + 1).padStart(2, "0")}`,
        ),
      ),
    [logs, prev],
  );

  const stats = useMemo(() => {
    const done = monthLogs.filter((l) => l.status === "done").length;
    const missed = monthLogs.filter((l) => l.status === "missed").length;
    const skipped = monthLogs.filter((l) => l.status === "skipped").length;
    const total = monthLogs.length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    const prevDone = prevMonthLogs.filter((l) => l.status === "done").length;
    const prevMissed = prevMonthLogs.filter(
      (l) => l.status === "missed",
    ).length;
    const prevTotal = prevMonthLogs.length;

    const doneChange =
      prevDone > 0
        ? Math.round(((done - prevDone) / prevDone) * 100)
        : done > 0
          ? 100
          : 0;
    const missedChange =
      prevMissed > 0
        ? Math.round(((missed - prevMissed) / prevMissed) * 100)
        : missed > 0
          ? 100
          : 0;
    const missedReduction = missedChange < 0 ? Math.abs(missedChange) : 0;

    const bestDay = calculateBestDay(monthLogs);
    const worstDay = calculateWorstDay(monthLogs);

    const dailyData = monthDays.map((date) => {
      const dayLogs = monthLogs.filter((l) => l.date === date);
      const dayDone = dayLogs.filter((l) => l.status === "done").length;
      const dayTotal = dayLogs.length;
      return { date, done: dayDone, total: dayTotal };
    });

    const categoryCompletion = getCategoryCompletion(monthLogs, habits);

    const totalCategory = Object.values(categoryCompletion).reduce(
      (s, c) => s + c.total,
      0,
    );
    const categoryDonut = Object.entries(categoryCompletion).map(
      ([cat, data]) => ({
        category: cat as Habit["category"],
        value: totalCategory > 0 ? (data.done / totalCategory) * 100 : 0,
        label: CATEGORY_LABELS[cat as Habit["category"]] || cat,
        color: CATEGORY_BG_COLORS[cat] || "#6b7280",
        done: data.done,
        total: data.total,
      }),
    );

    const pacePerDay = total > 0 ? done / monthLogs.length : 0;
    const forecastDays =
      pacePerDay > 0 ? Math.round(habits.length / pacePerDay) : 0;

    return {
      done,
      missed,
      skipped,
      total,
      percentage,
      doneChange,
      missedReduction,
      bestDay,
      worstDay,
      dailyData,
      categoryDonut,
      categoryCompletion,
      forecastDays,
    };
  }, [monthLogs, prevMonthLogs, monthDays, habits]);

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    "ru-RU",
    {
      month: "long",
      year: "numeric",
    },
  );

  const maxDailyDone = Math.max(...stats.dailyData.map((d) => d.done), 1);

  const donutSegments = useMemo(() => {
    const total = stats.categoryDonut.reduce((s, d) => s + d.value, 0) || 360;
    const r = 40;
    const cx = 50;
    const cy = 50;

    const segments: Array<{ startAngle: number; angle: number }> = [];
    let accAngle = 0;
    for (const d of stats.categoryDonut) {
      const angle = (d.value / total) * 360;
      segments.push({ startAngle: accAngle, angle });
      accAngle += angle;
    }

    return segments.map(({ startAngle, angle }, i) => {
      const endAngle = startAngle + angle;
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return {
        ...stats.categoryDonut[i],
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      };
    });
  }, [stats.categoryDonut]);

  const handleExportJSON = () => {
    const data = {
      habits,
      logs,
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
      stats,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-stats-${currentYear}-${String(currentMonth + 1).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспорт JSON завершён");
  };

  const handleExportCSV = () => {
    const header = "Дата;Привычка;Статус;Длительность;Заметка";
    const rows = monthLogs.map((l) => {
      const habit = habits.find((h) => h.id === l.habitId);
      return `${l.date};${habit?.name || "—"};${l.status};${l.durationMinutes || ""};${l.note || ""}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-stats-${currentYear}-${String(currentMonth + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспорт CSV завершён");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h3 className="text-base font-medium capitalize">{monthLabel}</h3>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <DownloadIcon className="mr-1 size-3" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <DownloadIcon className="mr-1 size-3" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Выполнено</p>
            <p className="mt-1 text-xl font-bold text-emerald-500">
              {stats.done}
            </p>
            {stats.doneChange !== 0 && (
              <p
                className={cn(
                  "mt-0.5 flex items-center justify-center gap-0.5 text-xs",
                  stats.doneChange > 0 ? "text-emerald-500" : "text-red-500",
                )}
              >
                {stats.doneChange > 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {Math.abs(stats.doneChange)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Пропущено</p>
            <p className="mt-1 text-xl font-bold text-red-500">
              {stats.missed}
            </p>
            {stats.missedReduction > 0 && (
              <p className="mt-0.5 flex items-center justify-center gap-0.5 text-xs text-emerald-500">
                <TrendingDownIcon className="size-3" />
                {stats.missedReduction}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">% выполнения</p>
            <p className="mt-1 text-xl font-bold">{stats.percentage}%</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Пропущено (всего)</p>
            <p className="mt-1 text-xl font-bold">{stats.skipped}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Выполнение по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-end gap-[2px] sm:gap-[3px]"
            style={{ height: 80 }}
          >
            {stats.dailyData.map((d) => {
              const height =
                d.total > 0 ? Math.max((d.done / maxDailyDone) * 100, 4) : 4;
              const isToday = d.date === today;
              return (
                <div
                  key={d.date}
                  className="relative flex flex-1 items-end justify-center"
                  title={`${d.date}: ${d.done}/${d.total}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      d.done === 0 && d.total === 0
                        ? "bg-muted"
                        : d.done === d.total
                          ? "bg-emerald-500"
                          : d.done > 0
                            ? "bg-amber-400"
                            : "bg-red-400",
                      isToday && "ring-1 ring-[#4E6E62]",
                    )}
                    style={{ height: `${height}%`, minHeight: 2 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Лучший день:{" "}
              {stats.bestDay.date
                ? `${stats.bestDay.date} (${stats.bestDay.count})`
                : "—"}
            </span>
            <span>
              Худший день:{" "}
              {stats.worstDay.date
                ? `${stats.worstDay.date} (${stats.worstDay.count})`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 100 100" className="size-40 shrink-0">
                {donutSegments.map((seg) => (
                  <path key={seg.category} d={seg.path} fill={seg.color} />
                ))}
                <circle cx="50" cy="50" r="25" fill="var(--color-card)" />
              </svg>
              <div className="flex flex-wrap gap-2">
                {stats.categoryDonut.map((d) => (
                  <div
                    key={d.category}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span>{d.label}</span>
                    <span className="text-muted-foreground">
                      ({d.done}/{d.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выполнение по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryDonut.map((d) => {
                const pct =
                  d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                return (
                  <div key={d.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{d.label}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогноз</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <TargetIcon className="size-5 text-[#4E6E62]" />
              <div>
                <p className="text-sm text-muted-foreground">Текущий темп</p>
                <p className="text-lg font-medium">
                  {stats.done > 0
                    ? `~${Math.round(stats.done / Math.max(monthLogs.length, 1))} выполнений в день`
                    : "Нет данных"}
                </p>
              </div>
            </div>
            {stats.forecastDays > 0 && (
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-5 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Прогноз до цели
                  </p>
                  <p className="text-lg font-medium">
                    ~{stats.forecastDays} дней
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  По сравнению с прошлым месяцем
                </p>
                <p className="text-lg font-medium">
                  {stats.doneChange > 0
                    ? `${stats.doneChange}% больше`
                    : stats.doneChange < 0
                      ? `${Math.abs(stats.doneChange)}% меньше`
                      : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
