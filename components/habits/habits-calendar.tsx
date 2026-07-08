"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Circle,
  SkipForward,
  Flame,
} from "lucide-react";
import type {
  Habit,
  HabitLog,
  HabitLogStatus,
  DailyHabit,
} from "@/lib/habits-types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isPlannedOnDate(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay();

  switch (habit.frequency.type) {
    case "daily":
      return true;
    case "weekly":
      return habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
    case "scheduled": {
      const created = new Date(habit.createdAt);
      const diffDays = Math.floor(
        (date.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays % (habit.frequency.intervalDays ?? 1) === 0;
    }
    case "time":
      return true;
    default:
      return true;
  }
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  habits: DailyHabit[];
  done: number;
  total: number;
}

function buildCalendarGrid(
  year: number,
  month: number,
  activeHabits: Habit[],
  logs: HabitLog[],
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const startPad = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

  const todayStr = getToday();
  const days: CalendarDay[] = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1;
    const date = new Date(year, month, dayNum);
    const dateStr = date.toISOString().split("T")[0];
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;

    let dayHabits: DailyHabit[] = [];
    let done = 0;
    let total = 0;

    if (isCurrentMonth) {
      dayHabits = activeHabits.map((h) => {
        const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
        const planned = isPlannedOnDate(h, date);
        if (planned) total++;
        if (log?.status === "done") done++;
        return { habit: h, log, isPlanned: planned };
      });
    }

    days.push({
      date,
      dateStr,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      habits: dayHabits,
      done,
      total,
    });
  }

  return days;
}

function StatusDot({ status }: { status?: HabitLogStatus }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full transition-colors",
        status === "done"
          ? "bg-emerald-500"
          : status === "skipped"
            ? "bg-amber-400"
            : "bg-red-400",
      )}
    />
  );
}

function DayPopover({
  day,
  onToggleLog,
  onClose,
}: {
  day: CalendarDay;
  onToggleLog: (habitId: string, status: HabitLogStatus, date: string) => void;
  onClose: () => void;
}) {
  const plannedHabits = day.habits.filter((h) => h.isPlanned);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
        <Card className="shadow-xl border-border/60">
          <CardHeader className="p-3 pb-1.5">
            <CardTitle className="text-sm font-medium">
              {day.date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })}
              {day.isToday && (
                <span className="ml-2 text-xs text-primary font-normal">
                  · сегодня
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1.5 space-y-1 max-h-64 overflow-y-auto">
            {plannedHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Нет запланированных привычек
              </p>
            ) : (
              plannedHabits.map(({ habit, log }) => (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md transition-colors text-sm",
                    log?.status === "done"
                      ? "bg-emerald-500/5"
                      : log?.status === "skipped"
                        ? "bg-amber-500/5"
                        : "hover:bg-muted/30",
                  )}
                >
                  <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {log?.status === "done" ? (
                      <button
                        onClick={() => onToggleLog(habit.id, "missed", day.dateStr)}
                        className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title="Отменить"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onToggleLog(habit.id, "done", day.dateStr)}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded transition-colors",
                            log?.status === "skipped"
                              ? "text-amber-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                              : "text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-500/10",
                          )}
                          title="Выполнить"
                        >
                          <Circle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleLog(habit.id, "skipped", day.dateStr)}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded transition-colors",
                            log?.status === "skipped"
                              ? "bg-amber-500/10 text-amber-600"
                              : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10",
                          )}
                          title="Пропустить"
                        >
                          <SkipForward className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface HabitsCalendarProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggleLog: (habitId: string, status: HabitLogStatus, date: string) => void;
}

export function HabitsCalendar({
  habits,
  logs,
  onToggleLog,
}: HabitsCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const activeHabits = useMemo(
    () => habits.filter((h) => h.status === "active"),
    [habits],
  );

  const days = useMemo(
    () => buildCalendarGrid(viewDate.year, viewDate.month, activeHabits, logs),
    [viewDate, activeHabits, logs],
  );

  const goToMonth = useCallback((delta: number) => {
    setViewDate((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m < 0) { m += 12; y--; }
      if (m > 11) { m -= 12; y++; }
      return { year: y, month: m };
    });
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(null);
  }, []);

  const handleToggleLog = useCallback(
    (habitId: string, status: HabitLogStatus, date: string) => {
      onToggleLog(habitId, status, date);
    },
    [onToggleLog],
  );

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthTotal = useMemo(
    () => days.filter((d) => d.isCurrentMonth).reduce((s, d) => s + d.done, 0),
    [days],
  );

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <span>
            {monthTotal} {monthTotal === 1 ? "выполнение" : monthTotal < 5 ? "выполнения" : "выполнений"} за месяц
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Выполнено</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span>Пропущено</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          <span>Не выполнено</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToMonth(-12)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Прошлый год"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => goToMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Прошлый месяц"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center tabular-nums">
            {MONTH_NAMES[viewDate.month]} {viewDate.year}
          </h2>
          <button
            onClick={() => goToMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Следующий месяц"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => goToMonth(12)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Следующий год"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
        >
          Сегодня
        </button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {DAY_NAMES.map((name) => (
              <div
                key={name}
                className="py-2 text-center text-xs font-medium text-muted-foreground/60"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="divide-y divide-border/40">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day) => {
                  const plannedHabits = day.habits.filter((h) => h.isPlanned);
                  return (
                    <div
                      key={day.dateStr}
                      className="relative min-h-[72px] sm:min-h-[88px] p-1.5 border-r border-border/20 last:border-r-0 transition-colors"
                    >
                      <button
                        onClick={() => {
                          if (day.isCurrentMonth) {
                            setSelectedDay(
                              selectedDay?.dateStr === day.dateStr ? null : day,
                            );
                          }
                        }}
                        className={cn(
                          "relative flex flex-col w-full h-full rounded-lg p-1 transition-all text-left group",
                          !day.isCurrentMonth && "opacity-25 pointer-events-none",
                          day.isCurrentMonth && "hover:bg-muted/40 cursor-pointer",
                          day.isToday && "bg-primary/5 ring-1 ring-primary/20",
                          selectedDay?.dateStr === day.dateStr && "ring-2 ring-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-medium mb-0.5",
                            day.isToday
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {day.date.getDate()}
                        </span>

                        {day.isCurrentMonth && plannedHabits.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-auto">
                            {plannedHabits.slice(0, 5).map(({ habit, log }) => (
                              <StatusDot key={habit.id} status={log?.status} />
                            ))}
                            {plannedHabits.length > 5 && (
                              <span className="text-[9px] text-muted-foreground/60 leading-none">
                                +{plannedHabits.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {day.isCurrentMonth && day.done > 0 && day.total > 0 && (
                          <span
                            className={cn(
                              "absolute top-1.5 right-1.5 text-[9px] font-medium leading-none",
                              day.done === day.total
                                ? "text-emerald-500"
                                : "text-muted-foreground/40",
                            )}
                          >
                            {day.done}/{day.total}
                          </span>
                        )}
                      </button>

                      {selectedDay?.dateStr === day.dateStr && (
                        <DayPopover
                          day={day}
                          onToggleLog={handleToggleLog}
                          onClose={() => setSelectedDay(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
