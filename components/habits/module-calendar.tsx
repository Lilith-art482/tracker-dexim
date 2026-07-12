"use client";

import { useState, useMemo, useCallback } from "react";
import type { Habit, HabitLog, HabitLogStatus } from "@/lib/habit-types";
import { WEEKDAYS } from "@/lib/habit-types";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SkipForwardIcon,
  ClockIcon,
  FileTextIcon,
  ListIcon,
  Grid3X3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ModuleCalendarProps {
  habits: Habit[];
  logs: HabitLog[];
  onUpdateLog: (logId: string, status: string) => void;
}

type DateRange = "today" | "week" | "month" | "year" | "all";
type ViewMode = "calendar" | "table";

const STATUS_LABELS: Record<HabitLogStatus, string> = {
  done: "Выполнено",
  missed: "Не выполнено",
  skipped: "Пропущено",
};

const STATUS_ICONS: Record<HabitLogStatus, React.ReactNode> = {
  done: <CheckCircle2Icon className="size-4 text-emerald-500" />,
  missed: <XCircleIcon className="size-4 text-red-500" />,
  skipped: <SkipForwardIcon className="size-4 text-gray-400" />,
};

function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function formatDateLabel(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDateRange(range: DateRange): { start: string; end: string } {
  const today = todayUTC();
  const d = new Date(today + "T00:00:00Z");

  switch (range) {
    case "today":
      return { start: today, end: today };
    case "week": {
      const dayOfWeek = d.getUTCDay();
      const start = new Date(d);
      start.setUTCDate(start.getUTCDate() - dayOfWeek);
      return {
        start: start.toISOString().split("T")[0],
        end: today,
      };
    }
    case "month":
      return {
        start: today.slice(0, 7) + "-01",
        end: today,
      };
    case "year":
      return {
        start: today.slice(0, 4) + "-01-01",
        end: today,
      };
    case "all":
      return { start: "2000-01-01", end: today };
  }
}

function getNextStatus(current: HabitLogStatus): HabitLogStatus {
  const cycle: HabitLogStatus[] = ["done", "missed", "skipped"];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

export function ModuleCalendar({
  habits,
  logs,
  onUpdateLog,
}: ModuleCalendarProps) {
  const today = todayUTC();
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const habitMap = useMemo(() => {
    const map = new Map<string, Habit>();
    for (const h of habits) map.set(h.id, h);
    return map;
  }, [habits]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog[]>();
    for (const log of logs) {
      const arr = map.get(log.date) || [];
      arr.push(log);
      map.set(log.date, arr);
    }
    return map;
  }, [logs]);

  const dayLogs = useMemo(() => {
    if (!selectedDay) return [];
    return logsByDate.get(selectedDay) || [];
  }, [selectedDay, logsByDate]);

  const range = useMemo(() => getDateRange(dateRange), [dateRange]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (l.date < range.start || l.date > range.end) return false;
      if (selectedHabitFilter !== "all" && l.habitId !== selectedHabitFilter)
        return false;
      return true;
    });
  }, [logs, range, selectedHabitFilter]);

  const stats = useMemo(() => {
    const done = filteredLogs.filter((l) => l.status === "done").length;
    const total = filteredLogs.length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    const daysWithLogs = new Set(filteredLogs.map((l) => l.date));
    const avgFrequency =
      daysWithLogs.size > 0 ? Math.round(total / daysWithLogs.size) : 0;

    let bestStreak = 0;
    for (const habit of habits) {
      const habitLogs = filteredLogs
        .filter((l) => l.habitId === habit.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      let current = 0;
      for (const l of habitLogs) {
        if (l.status === "done") {
          current++;
          bestStreak = Math.max(bestStreak, current);
        } else if (l.status !== "skipped") {
          current = 0;
        }
      }
    }

    return {
      done,
      total,
      percentage,
      daysWithLogs: daysWithLogs.size,
      avgFrequency,
      bestStreak,
    };
  }, [filteredLogs, habits]);

  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; logs: HabitLog[] }[] = [];
    const numDays = daysInMonth(currentYear, currentMonth);
    const firstDay = firstDayOfMonth(currentYear, currentMonth);

    for (let i = 0; i < firstDay; i++) {
      days.push({ date: "", day: 0, logs: [] });
    }

    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        logs: logsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, logsByDate]);

  const navigateMonth = useCallback(
    (delta: number) => {
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
    },
    [currentMonth, currentYear],
  );

  const getDayStatus = useCallback(
    (dayLogs: HabitLog[]): "done" | "missed" | "skipped" | "none" => {
      if (dayLogs.length === 0) return "none";
      const allDone = dayLogs.every((l) => l.status === "done");
      if (allDone) return "done";
      const anyMissed = dayLogs.some((l) => l.status === "missed");
      if (anyMissed) return "missed";
      return "skipped";
    },
    [],
  );

  const handleDayClick = useCallback((date: string) => {
    setSelectedDay(date);
    setDialogOpen(true);
  }, []);

  const handleStatusCycle = useCallback(
    (logId: string, currentStatus: HabitLogStatus) => {
      const next = getNextStatus(currentStatus);
      onUpdateLog(logId, next);
    },
    [onUpdateLog],
  );

  const rangeOptions: { value: DateRange; label: string }[] = [
    { value: "today", label: "Сегодня" },
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "year", label: "Год" },
    { value: "all", label: "Всё время" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {rangeOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={dateRange === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("calendar")}
          >
            <Grid3X3Icon className="size-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <ListIcon className="size-4" />
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Процент</p>
            <p className="mt-1 text-xl font-bold">{stats.percentage}%</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Лучший стрик</p>
            <p className="mt-1 text-xl font-bold text-amber-500">
              {stats.bestStreak}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Сред. частота</p>
            <p className="mt-1 text-xl font-bold">{stats.avgFrequency}/день</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "calendar" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="capitalize">
                  {formatMonthLabel(currentYear, currentMonth)}
                </span>
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1 font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day.date) {
                  return <div key={`empty-${idx}`} />;
                }
                const status = getDayStatus(day.logs);
                const isToday = day.date === today;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleDayClick(day.date)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-sm transition-colors",
                      isToday && "ring-2 ring-[#4E6E62] ring-offset-1",
                      status === "done" &&
                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
                      status === "missed" &&
                        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
                      status === "skipped" &&
                        "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                      status === "none" && "hover:bg-muted",
                      "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>История</CardTitle>
              <div className="flex items-center gap-2">
                <FilterIcon className="size-4 text-muted-foreground" />
                <Select
                  value={selectedHabitFilter}
                  onValueChange={(v) => v !== null && setSelectedHabitFilter(v)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все привычки</SelectItem>
                    {habits.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Дата</th>
                    <th className="pb-2 pr-4 font-medium">Привычка</th>
                    <th className="pb-2 pr-4 font-medium">Статус</th>
                    <th className="pb-2 pr-4 font-medium">Длит.</th>
                    <th className="pb-2 font-medium">Заметка</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Нет записей за выбранный период
                      </td>
                    </tr>
                  ) : (
                    filteredLogs
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((log) => {
                        const habit = habitMap.get(log.habitId);
                        return (
                          <tr
                            key={log.id}
                            className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() =>
                              handleStatusCycle(log.id, log.status)
                            }
                          >
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {formatDateLabel(log.date)}
                            </td>
                            <td className="py-2 pr-4">{habit?.name || "—"}</td>
                            <td className="py-2 pr-4">
                              <Badge
                                variant={
                                  log.status === "done"
                                    ? "default"
                                    : log.status === "missed"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="gap-1"
                              >
                                {STATUS_ICONS[log.status]}
                                {STATUS_LABELS[log.status]}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {log.durationMinutes ? (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="size-3 text-muted-foreground" />
                                  {log.durationMinutes} мин
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2 max-w-[200px] truncate">
                              {log.note ? (
                                <span className="flex items-center gap-1">
                                  <FileTextIcon className="size-3 shrink-0 text-muted-foreground" />
                                  {log.note}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? formatDateLabel(selectedDay) : ""}
            </DialogTitle>
            <DialogDescription>Привычки на этот день</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dayLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Нет записей за этот день
              </p>
            ) : (
              dayLogs.map((log) => {
                const habit = habitMap.get(log.habitId);
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {habit?.name || "—"}
                      </span>
                      {log.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ClockIcon className="size-3" />
                          {log.durationMinutes} мин
                        </span>
                      )}
                      {log.note && (
                        <span className="text-xs text-muted-foreground">
                          {log.note}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusCycle(log.id, log.status)}
                    >
                      {STATUS_ICONS[log.status]}
                      <span className="ml-1 text-xs">
                        {STATUS_LABELS[log.status]}
                      </span>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
